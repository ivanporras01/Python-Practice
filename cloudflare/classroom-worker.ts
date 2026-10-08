import { DurableObject } from 'cloudflare:workers';
import { topics } from '../app/lib/curriculum';

type Env = {
  ASSETS: Fetcher;
  CLASSROOM: DurableObjectNamespace<Classroom>;
  TEACHER_PUBLIC_KEY: string;
  STUDENT_ORIGIN: string;
};
type Student = {
  id: string; name: string; first_name: string; last_name: string;
  joined_at: number; last_seen: number; current_topic: string;
  completed: number; started: number; attempts: number; needs_help: number;
  topicStats: Record<string, { started: number; completed: number }>;
};
type Progress = {
  exercise_id: string; topic_id: string; passed: number; attempts: number;
  code: string; updated_at: number; recentIds: string[];
};
type Attempt = {
  id: string; student_id: string; name: string; exercise_id: string;
  topic_id: string; code: string; output: string; error: string;
  passed: number; created_at: number;
};
class ApiError extends Error { constructor(message: string, public status = 400) { super(message); } }
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const digest = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(x => x.toString(16).padStart(2, '0')).join('');
const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x => x.toString(16).padStart(2, '0')).join('');

function namePart(value: unknown, label: string) {
  const text = typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/g, ' ') : '';
  if (text.length < 1 || text.length > 50 || !/^[\p{L}\p{M}][\p{L}\p{M} '\u2019.-]*$/u.test(text)) throw new ApiError(`Enter a valid ${label}.`);
  return text;
}

async function readBody(request: Request) {
  if (Number(request.headers.get('Content-Length') || 0) > 70000) throw new ApiError('This submission is too large.', 413);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new ApiError('Send a JSON request.', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError('The request is empty.');
  const decoder = new TextDecoder();
  let text = '', bytes = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > 70000) { await reader.cancel(); throw new ApiError('This submission is too large.', 413); }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  try {
    const body = JSON.parse(text);
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error();
    return body as Record<string, unknown>;
  } catch { throw new ApiError('Please send a valid request.'); }
}

export class Classroom extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    try {
      const body = request.method === 'POST' ? await readBody(request) : undefined;
      const bearer = request.headers.get('Authorization')?.replace(/^Bearer /, '') || '';
      const authHash = bearer ? await digest(bearer) : '';
      // Serialize related writes so concurrent retries cannot double-count practice.
      return await this.ctx.storage.transaction(async store => {
        const teacherExpiry = authHash ? await store.get<number>('teacher:' + authHash) : undefined;
        const isTeacher = !!teacherExpiry && teacherExpiry > Date.now();
        const id = authHash ? await store.get<string>('token:' + authHash) : undefined;
        const student = id ? await store.get<Student>('student:' + id) : undefined;
        if (request.method === 'GET') return this.read(request, store, student, isTeacher);
        if (!body) throw new ApiError('The request is empty.');
        if (body.action === 'teacher-challenge') {
          if (!this.env.TEACHER_PUBLIC_KEY) throw new ApiError('Teacher access is not configured.', 503);
          const challenges = await store.list<number>({ prefix: 'challenge:' });
          const expired = [...challenges].filter(([, expiry]) => expiry < Date.now()).map(([key]) => key);
          if (expired.length) await store.delete(expired);
          if (challenges.size - expired.length >= 50) throw new ApiError('Please wait a minute before trying again.', 429);
          const nonce = newToken();
          await store.put('challenge:' + nonce, Date.now() + 120000);
          return json({ nonce });
        }
        if (body.action === 'teacher-login') {
          if (typeof body.nonce !== 'string' || !/^[a-f0-9]{64}$/.test(body.nonce) || typeof body.signature !== 'string' || body.signature.length > 100) throw new ApiError('That teacher access key does not match.', 401);
          const expiry = await store.get<number>('challenge:' + body.nonce);
          let valid = false;
          if (expiry && expiry > Date.now()) {
            try {
              const key = await crypto.subtle.importKey('raw', Uint8Array.from(atob(this.env.TEACHER_PUBLIC_KEY), c => c.charCodeAt(0)), 'Ed25519', false, ['verify']);
              const message = `Python Practice teacher sign-in\n${new URL(request.url).origin}\n${body.nonce}`;
              valid = await crypto.subtle.verify('Ed25519', key, Uint8Array.from(atob(body.signature), c => c.charCodeAt(0)), new TextEncoder().encode(message));
            } catch { valid = false; }
          }
          // Consume the challenge even after a failed signature; throw would roll this deletion back.
          await store.delete('challenge:' + body.nonce);
          if (!valid) return json({ error: 'That teacher access key does not match, or the sign-in expired. Please try again.' }, 401);
          const token = newToken();
          await store.put('teacher:' + await digest(token), Date.now() + 8 * 60 * 60 * 1000);
          const sessions = await store.list<number>({ prefix: 'teacher:' });
          const old = [...sessions].filter(([, until]) => until < Date.now()).map(([key]) => key);
          if (old.length) await store.delete(old);
          return json({ ok: true, token });
        }
        if (body.action === 'teacher-logout') {
          if (authHash) await store.delete('teacher:' + authHash);
          return json({ ok: true });
        }
        if (body.action === 'join') {
          const first = namePart(body.firstName, 'first name'), last = namePart(body.lastName, 'last name');
          if (student && student.first_name === first && student.last_name === last) return json({ ok: true });
          const count = await store.get<number>('student-count') || 0;
          if (count >= 500) throw new ApiError('This classroom has reached its practice-session limit. Please contact Professor Porras.', 409);
          const token = newToken(), tokenHash = await digest(token), studentId = crypto.randomUUID(), now = Date.now();
          const profile: Student = { id: studentId, first_name: first, last_name: last, name: `${first} ${last}`, joined_at: now, last_seen: now, current_topic: '', completed: 0, started: 0, attempts: 0, needs_help: 0, topicStats: {} };
          await store.put({ ['student:' + studentId]: profile, ['token:' + tokenHash]: studentId, 'student-count': count + 1 });
          return json({ ok: true, token });
        }
        if (!student) throw new ApiError('Join with your first and last name before saving practice.', 401);
        const topic = topics.find(t => t.id === body.topicId);
        if (!topic) throw new ApiError('Choose a valid topic.');
        if (body.action === 'presence') {
          if (Date.now() - student.last_seen >= 15000 || student.current_topic !== topic.id) {
            student.last_seen = Date.now(); student.current_topic = topic.id;
            await store.put('student:' + student.id, student);
          }
          return json({ ok: true });
        }
        if (body.action !== 'attempt') throw new ApiError('Unknown classroom action.');
        const exercise = topic.exercises.find(e => e.id === body.exerciseId);
        if (!exercise || typeof body.id !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(body.id)) throw new ApiError('Choose a valid exercise.');
        if (typeof body.code !== 'string' || body.code.length > 20000 || typeof body.output !== 'string' || body.output.length > 20000 || typeof body.error !== 'string' || body.error.length > 4000) throw new ApiError('This submission is invalid or too large.');
        const key = `progress:${student.id}:${exercise.id}`;
        const prior = await store.get<Progress>(key);
        if (prior?.recentIds.includes(body.id)) return json({ ok: true, passed: !!prior.passed });
        const passed = !body.error && body.checkPassed === true && body.output.replace(/\r/g, '').trim() === exercise.expected.trim() ? 1 : 0;
        const now = Date.now();
        const progress: Progress = { exercise_id: exercise.id, topic_id: topic.id, passed: Math.max(prior?.passed || 0, passed), attempts: (prior?.attempts || 0) + 1, code: body.code, updated_at: now, recentIds: [...(prior?.recentIds || []), body.id].slice(-64) };
        const newlyComplete = progress.passed - (prior?.passed || 0);
        const beforeHelp = prior && !prior.passed && prior.attempts >= 3 ? 1 : 0;
        const afterHelp = !progress.passed && progress.attempts >= 3 ? 1 : 0;
        student.last_seen = now; student.current_topic = topic.id;
        student.attempts++; student.started += prior ? 0 : 1; student.completed += newlyComplete; student.needs_help += afterHelp - beforeHelp;
        const stats = student.topicStats[topic.id] || { started: 0, completed: 0 };
        stats.started += prior ? 0 : 1; stats.completed += newlyComplete; student.topicStats[topic.id] = stats;
        const attempt: Attempt = { id: body.id, student_id: student.id, name: student.name, exercise_id: exercise.id, topic_id: topic.id, code: body.code, output: body.output, error: body.error, passed, created_at: now };
        const attemptKey = `attempt:${student.id}:${String(now).padStart(14, '0')}:${body.id}`;
        const activity = await store.get<Partial<Attempt>[]>('activity') || [];
        const { code: _code, output: _output, error: _error, ...summary } = attempt;
        await store.put({ [key]: progress, ['student:' + student.id]: student, [attemptKey]: attempt, activity: [summary, ...activity].slice(0, 12) });
        const recent = await store.list<Attempt>({ prefix: `attempt:${student.id}:`, reverse: true });
        const oldKeys = [...recent.keys()].slice(30);
        if (oldKeys.length) await store.delete(oldKeys);
        return json({ ok: true, passed: !!passed });
      });
    } catch (error) {
      if (error instanceof ApiError) return json({ error: error.message }, error.status);
      console.error('Classroom request failed', error instanceof Error ? error.name : 'Unknown error');
      return json({ error: 'Class progress is temporarily unavailable. Your code is still in the editor; please retry.' }, 503);
    }
  }

  private async read(request: Request, store: DurableObjectTransaction, student: Student | undefined, isTeacher: boolean) {
    const selected = new URL(request.url).searchParams.get('student');
    if (selected) {
      if (!isTeacher) throw new ApiError('Only Professor Porras can view student records.', 403);
      const profile = await store.get<Student>('student:' + selected);
      if (!profile) throw new ApiError('Student not found.', 404);
      const progress = await store.list<Progress>({ prefix: `progress:${selected}:` });
      const attempts = await store.list<Attempt>({ prefix: `attempt:${selected}:`, reverse: true, limit: 30 });
      return json({ student: { ...profile, email: '' }, progress: [...progress.values()].map(({ recentIds: _ids, ...p }) => p), attempts: [...attempts.values()] });
    }
    if (isTeacher) {
      const students = [...(await store.list<Student>({ prefix: 'student:' })).values()];
      const byTopic: Record<string, { topic_id: string; started: number; completed: number }> = {};
      for (const s of students) for (const [id, stats] of Object.entries(s.topicStats)) {
        const row = byTopic[id] || { topic_id: id, started: 0, completed: 0 };
        row.started += stats.started; row.completed += stats.completed; byTopic[id] = row;
      }
      return json({ mode: 'shared', user: { name: 'Professor Porras', email: '' }, profile: { name: 'Professor Porras' }, isInstructor: true, progress: [], roster: students.sort((a, b) => b.last_seen - a.last_seen).map(({ topicStats: _stats, ...s }) => ({ ...s, email: '' })), byTopic: Object.values(byTopic), activity: await store.get('activity') || [] });
    }
    if (!student) return json({ mode: 'shared', user: null, profile: null, isInstructor: false, progress: [] });
    const progress = await store.list<Progress>({ prefix: `progress:${student.id}:` });
    return json({ mode: 'shared', user: { name: student.name, email: '' }, profile: { name: student.name, first_name: student.first_name, last_name: student.last_name }, isInstructor: false, progress: [...progress.values()].map(({ recentIds: _ids, ...p }) => p) });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/classroom-config.json') return json({ apiBase: url.origin });
    if (url.pathname !== '/api/classroom' && url.pathname !== '/api/health') return env.ASSETS.fetch(request);
    const origin = request.headers.get('Origin');
    if (origin && origin !== env.STUDENT_ORIGIN && origin !== url.origin) return json({ error: 'This origin is not allowed.' }, 403);
    const headers = new Headers({ 'Vary': 'Origin', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    if (origin) headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (!['GET', 'POST'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers });
    if (url.pathname === '/api/health') return new Response(JSON.stringify({ ok: true, name: 'Python Practice Classroom', teacherConfigured: !!env.TEACHER_PUBLIC_KEY }), { headers: { ...Object.fromEntries(headers), 'Content-Type': 'application/json' } });
    const upstream = await env.CLASSROOM.get(env.CLASSROOM.idFromName('professor-porras-cop1000')).fetch(request);
    const response = new Response(upstream.body, upstream);
    for (const [key, value] of headers) response.headers.set(key, value);
    return response;
  },
} satisfies ExportedHandler<Env>;
