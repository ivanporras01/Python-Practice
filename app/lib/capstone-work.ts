import content from './capstones.json';

export type CapstoneRun = { id: string; output: string; error: string; code: string; inputs: string; baseline: boolean; at: number };
export type CapstoneWork = { code: string; inputs: string; prediction: string; reflection: string; lastRun: CapstoneRun | null; runIds: string[] };
export type CapstoneRecord = { projectId: string; work: CapstoneWork; revision: number; updatedAt: number; runs: number; recentRunIds: string[]; recentSaveIds: string[]; submitted: { work: CapstoneWork; at: number; revision: number } | null };
export type CapstoneSummary = { projectId: string; updatedAt: number; runs: number; milestones: number; status: string; submittedAt: number | null };
export const projects = content.projects;
export function freshWork(projectId: string): CapstoneWork {
  const p = projects.find(p => p.id === projectId)!;
  return { code: p.code, inputs: p.scenarios[0].inputs, prediction: '', reflection: '', lastRun: null, runIds: [] };
}
function str(v: unknown, max: number, label: string): string {
  if (typeof v !== 'string' || v.length > max) throw new Error(`${label} must be text under ${max.toLocaleString()} characters.`);
  return v;
}
export function validateWork(value: unknown): CapstoneWork {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Choose a valid project backup.');
  const v = value as Record<string, any>;
  let lastRun: CapstoneRun | null = null;
  if (v.lastRun != null) {
    const r = v.lastRun;
    if (!r || typeof r.id !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(r.id) || !Number.isFinite(r.at) || typeof r.baseline !== 'boolean') throw new Error('The saved run is invalid.');
    lastRun = { id: r.id, at: r.at, baseline: r.baseline, code: str(r.code, 20000, 'Run code'), inputs: str(r.inputs, 5000, 'Run inputs'), output: str(r.output, 20000, 'Output'), error: str(r.error, 4000, 'Error') };
  }
  const runIds = v.runIds ?? [];
  if (!Array.isArray(runIds) || runIds.length > 64 || runIds.some(id => typeof id !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(id))) throw new Error('The saved run history is invalid.');
  const work = { code: str(v.code, 20000, 'Python code'), inputs: str(v.inputs, 5000, 'Program inputs'), prediction: str(v.prediction, 4000, 'Prediction'), reflection: str(v.reflection, 8000, 'Explanation'), lastRun, runIds: [...new Set<string>(runIds)] };
  if (new TextEncoder().encode(JSON.stringify(work)).length > 60000) throw new Error('This project is too large to save. Download your code, then shorten the output or notes.');
  return work;
}
export function milestones(projectId: string, w: CapstoneWork) {
  return [
    { label: 'Prediction written', done: !!w.prediction.trim() },
    { label: 'Example code changed', done: w.code.trim() !== freshWork(projectId).code.trim() },
    { label: 'Current code ran without an error', done: !!w.lastRun && !w.lastRun.error && w.lastRun.code === w.code && w.lastRun.inputs === w.inputs },
    { label: 'Explanation written', done: !!w.reflection.trim() },
  ];
}
export function summarizeCapstone(r: CapstoneRecord): CapstoneSummary {
  return { projectId: r.projectId, updatedAt: r.updatedAt, runs: r.runs, milestones: milestones(r.projectId, r.work).filter(m => m.done).length, status: r.submitted ? (r.submitted.revision === r.revision ? 'Submitted' : 'Changes after submission') : 'In progress', submittedAt: r.submitted?.at ?? null };
}
export function projectReport(projectId: string, w: CapstoneWork, student: string) {
  const p = projects.find(p => p.id === projectId)!;
  const r = w.lastRun, stale = r && (r.code !== w.code || r.inputs !== w.inputs);
  const block = (value: string) => { const fence = '`'.repeat(Math.max(3, ...[...value.matchAll(/`+/g)].map(m => m[0].length + 1))); return `${fence}\n${value}\n${fence}`; };
  return `# ${p.title}\nIntroduction to Python • Professor Porras\nStudent: ${student}\nExported: ${new Date().toISOString()}\n\n## Prediction\n${w.prediction}\n\n## Current Python code\n${block(w.code)}\n\n## Program inputs\n${block(w.inputs)}\n\n## Last run${stale ? ' — earlier code or inputs' : ''}\n${r ? block(r.output + (r.error ? '\nERROR: ' + r.error : '')) : 'Not run yet.'}\n${stale && r ? `\n### Code and inputs used for that earlier run\n${block(r.code)}\n${block(r.inputs)}\n` : ''}\n## Explanation\n${w.reflection}\n`;
}
export function backupText(projectId: string, work: CapstoneWork) {
  return JSON.stringify({ format: 'python-practice-capstone', version: 1, projectId, exportedAt: new Date().toISOString(), work }, null, 2);
}
export function parseBackup(text: string) {
  const v = JSON.parse(text);
  if (v.format !== 'python-practice-capstone' || v.version !== 1 || !projects.some(p => p.id === v.projectId)) throw new Error('Choose a project backup downloaded from this portal.');
  return { projectId: v.projectId as string, work: validateWork(v.work) };
}
