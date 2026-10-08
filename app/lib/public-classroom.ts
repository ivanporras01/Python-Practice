import { localPracticeApi } from './local-practice';

const STUDENT_TOKEN = 'porras-classroom-student-v1';
const TEACHER_TOKEN = 'porras-classroom-teacher-v1';
let configuration: Promise<string> | undefined;

async function apiBase() {
  if (!configuration) configuration = (async () => {
    const response = await fetch(new URL('./classroom-config.json', location.href), { cache: 'no-store' });
    if (!response.ok) throw new Error('Classroom settings could not be loaded. Please retry.');
    const config = await response.json() as { apiBase?: string };
    if (!config.apiBase) return '';
    const url = new URL(config.apiBase);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') throw new Error('The classroom connection must use HTTPS.');
    return url.origin;
  })().catch(error => { configuration = undefined; throw error; });
  return configuration;
}

async function request(base: string, body?: unknown, path = '/api/classroom', key?: string) {
  const token = key ?? sessionStorage.getItem(TEACHER_TOKEN) ?? localStorage.getItem(STUDENT_TOKEN);
  const response = await fetch(base + path, {
    method: body ? 'POST' : 'GET', cache: 'no-store',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json() as Record<string, any>;
  if (!response.ok) throw new Error(data.error || 'Class progress could not be saved. Please retry.');
  return data;
}

export async function publicClassroomApi(body?: unknown, path = '/api/classroom') {
  const base = await apiBase();
  if (!base) return { ...await localPracticeApi(body, path), mode: 'local' };
  let data = await request(base, body, path);
  if (!body && !path.includes('?student=') && sessionStorage.getItem(TEACHER_TOKEN) && !data.isInstructor) {
    sessionStorage.removeItem(TEACHER_TOKEN);
    data = await request(base, body, path);
  }
  if (typeof data.token === 'string') localStorage.setItem(STUDENT_TOKEN, data.token);
  return data;
}

export async function teacherLogin(value: string) {
  const base = await apiBase();
  if (!base) throw new Error('Shared classroom tracking has not been connected yet.');
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(value.trim()), c => c.charCodeAt(0)), 'Ed25519', false, ['sign']);
  } catch { throw new Error('Enter the complete teacher access key. Use a current version of Chrome, Edge, Firefox, or Safari.'); }
  const { nonce } = await request(base, { action: 'teacher-challenge' }, '/api/classroom', '');
  if (typeof nonce !== 'string' || !/^[a-f0-9]{64}$/.test(nonce)) throw new Error('The teacher sign-in request is invalid.');
  const message = `Python Practice teacher sign-in\n${base}\n${nonce}`;
  const signature = await crypto.subtle.sign('Ed25519', key, new TextEncoder().encode(message));
  const data = await request(base, { action: 'teacher-login', nonce, signature: btoa(String.fromCharCode(...new Uint8Array(signature))) }, '/api/classroom', '');
  sessionStorage.setItem(TEACHER_TOKEN, data.token);
}

export async function leaveClassroom(teacher: boolean) {
  if (teacher) {
    try { const base = await apiBase(); if (base) await request(base, { action: 'teacher-logout' }); }
    catch { /* The local session still closes when the connection is unavailable. */ }
    finally { sessionStorage.removeItem(TEACHER_TOKEN); }
  } else localStorage.removeItem(STUDENT_TOKEN);
}

export function studentLink() {
  const url = new URL(location.href);
  url.search = ''; url.hash = '';
  return url.href;
}
