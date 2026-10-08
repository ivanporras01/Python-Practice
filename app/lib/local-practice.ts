import { topics } from './curriculum';

export const LOCAL_PRACTICE = process.env.NEXT_PUBLIC_PRACTICE_MODE === 'local';
const STORAGE_KEY = 'porras-python-practice-v1';
type SavedProgress = { exercise_id: string; topic_id: string; passed: number; attempts: number; code: string; updated_at: number };
type LocalState = { version: 1; name: string; progress: SavedProgress[]; recentAttemptIds: string[] };

function readState(): LocalState {
  let raw: string | null;
  try { raw = localStorage.getItem(STORAGE_KEY); }
  catch { throw new Error('Browser storage is unavailable. Enable storage for this site to save your practice.'); }
  if (!raw) return { version: 1, name: 'Student', progress: [], recentAttemptIds: [] };
  try {
    const value = JSON.parse(raw) as LocalState;
    if (value.version !== 1 || typeof value.name !== 'string' || !Array.isArray(value.progress) || !Array.isArray(value.recentAttemptIds)) throw new Error();
    return value;
  } catch { throw new Error('Saved practice could not be read in this browser. Your saved data has not been replaced.'); }
}

function writeState(state: LocalState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { throw new Error('Your browser could not save this attempt. Keep the page open and free some browser storage, then retry.'); }
}

export async function localPracticeApi(body?: unknown, url = '/api/classroom') {
  const state = readState();
  if (url.includes('?student=')) throw new Error('Shared class monitoring is not connected in this practice version.');
  if (!body) return { user: { name: state.name, email: '' }, profile: { name: state.name }, isInstructor: false, progress: state.progress };
  const action = body as { action: string; name?: string; id?: string; topicId?: string; exerciseId?: string; code?: string; output?: string; error?: string; checkPassed?: boolean };
  if (action.action === 'presence') return { ok: true };
  if (action.action === 'join') {
    const name = (action.name || '').trim().slice(0, 80);
    if (name.length < 2) throw new Error('Enter a name with at least two characters.');
    state.name = name;
    writeState(state);
    return { ok: true };
  }
  if (action.action !== 'attempt') throw new Error('Unknown practice action.');
  const topic = topics.find(t => t.id === action.topicId);
  const exercise = topic?.exercises.find(e => e.id === action.exerciseId);
  if (!topic || !exercise || typeof action.id !== 'string' || typeof action.code !== 'string' || action.code.length > 20000) throw new Error('Choose a valid exercise and keep your code under 20,000 characters.');
  if (state.recentAttemptIds.includes(action.id)) return { ok: true };
  const passed = !action.error && action.checkPassed === true && (action.output || '').replace(/\r/g, '').trim() === exercise.expected.trim();
  const previous = state.progress.find(p => p.exercise_id === exercise.id);
  const row: SavedProgress = { exercise_id: exercise.id, topic_id: topic.id, passed: passed || previous?.passed ? 1 : 0, attempts: (previous?.attempts || 0) + 1, code: action.code, updated_at: Date.now() };
  state.progress = [...state.progress.filter(p => p.exercise_id !== exercise.id), row];
  state.recentAttemptIds = [...state.recentAttemptIds, action.id].slice(-256);
  writeState(state);
  return { ok: true, passed };
}

export function downloadPracticeReport() {
  const state = readState();
  const rows: unknown[][] = [['Student', 'Topic', 'Exercise', 'Completed', 'Attempts', 'Last practiced', 'Latest code']];
  for (const topic of topics) for (const exercise of topic.exercises) {
    const p = state.progress.find(row => row.exercise_id === exercise.id);
    if (p) rows.push([state.name, topic.title, exercise.title, p.passed ? 'Yes' : 'No', p.attempts, new Date(p.updated_at).toISOString(), p.code]);
  }
  const csv = rows.map(row => row.map(value => {
    let text = String(value ?? '');
    if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  }).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'Python-Practice-Progress.csv';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
