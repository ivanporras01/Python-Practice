'use client';
import { useEffect, useRef, useState } from 'react';
import { currentStudentToken, studentCapstoneApi } from './public-classroom';
import { freshWork, projects, validateWork, type CapstoneRecord, type CapstoneWork } from './capstone-work';

type Pending = { id: string; work: CapstoneWork; revision: number };
type Entry = { work: CapstoneWork; revision: number; dirty: boolean; server?: CapstoneRecord; pending?: Pending };
export function useCapstoneWork(student: string, shared: boolean) {
  const key = 'python-capstones-v2:' + student.trim().toLowerCase();
  const entries = useRef<Record<string, Entry>>({});
  const token = useRef('');
  const cloudReady = useRef(false), alive = useRef(true), saving = useRef<Promise<boolean> | null>(null);
  const conflictRef = useRef<Record<string, CapstoneRecord>>({});
  const [conflicts, setConflicts] = useState<Record<string, CapstoneRecord>>({});
  const [version, render] = useState(0), [ready, setReady] = useState(false), [busy, setBusy] = useState(false);
  const [change, changed] = useState(0);
  const [message, setMessage] = useState('Loading your saved projects…'), [storageError, setStorageError] = useState('');
  function updateUI() { if (alive.current) render(n => n + 1); }
  function persist() {
    try { localStorage.setItem(key, JSON.stringify(entries.current)); if (alive.current) setStorageError(''); }
    catch { if (alive.current) setStorageError('This browser could not save a local copy. Download a backup before leaving.'); }
    updateUI();
  }
  function conflict(projectId: string, record: CapstoneRecord) {
    conflictRef.current = { ...conflictRef.current, [projectId]: record };
    if (alive.current) { setConflicts(conflictRef.current); setMessage('This project was changed in another tab or device. Choose which copy to keep.'); }
  }
  async function loadCloud() {
    if (!shared) return true;
    try {
      const data = await studentCapstoneApi(token.current, undefined, '/api/classroom?capstones=1');
      if (!Array.isArray(data.records)) throw new Error('Project saving is not available yet. Keep your downloaded backup.');
      if (!alive.current) return false;
      for (const record of data.records as CapstoneRecord[]) {
        if (!projects.some(p => p.id === record.projectId)) continue;
        const local = entries.current[record.projectId];
        if (!local?.dirty || JSON.stringify(local.work) === JSON.stringify(record.work)) {
          entries.current[record.projectId] = { work: record.work, revision: record.revision, dirty: false, server: record };
        } else if (local.revision !== record.revision && !record.recentSaveIds.includes(local.pending?.id || '')) conflict(record.projectId, record);
        else local.server = record;
      }
      cloudReady.current = true;
      persist();
      if (!Object.keys(conflictRef.current).length) setMessage('Classroom projects loaded. Changes save automatically.');
      return true;
    } catch (error) {
      if (alive.current) setMessage('Cloud save unavailable: ' + (error as Error).message + ' Your local copy is kept; use Retry save.');
      return false;
    }
  }
  async function flush(): Promise<boolean> {
    if (!shared) return true;
    if (saving.current) return saving.current;
    const task = async () => {
      if (alive.current) setBusy(true);
      try {
        if (!cloudReady.current && !await loadCloud()) return false;
        for (const project of projects) {
          let entry = entries.current[project.id];
          while (entry?.dirty) {
            if (conflictRef.current[project.id]) return false;
            const pending = entry.pending || { id: crypto.randomUUID(), work: validateWork(entry.work), revision: entry.revision };
            entry.pending = pending; persist();
            if (alive.current) setMessage('Saving your project to the classroom…');
            const response = await studentCapstoneApi(token.current, { action: 'capstone-save', projectId: project.id, ...pending });
            if ('conflict' in response) { if (response.conflict) conflict(project.id, response.conflict); else throw new Error('The saved record changed. Reload before saving.'); return false; }
            const record = response.record as CapstoneRecord;
            const current = entries.current[project.id];
            if (record.revision > pending.revision + 1 && JSON.stringify(record.work) !== JSON.stringify(pending.work)) { conflict(project.id, record); return false; }
            entries.current[project.id] = { work: current.work, revision: record.revision, server: record, dirty: JSON.stringify(current.work) !== JSON.stringify(pending.work) };
            persist(); entry = entries.current[project.id];
          }
        }
        if (alive.current) setMessage('Saved to the classroom. Professor Porras can see your progress.');
        return true;
      } catch (error) {
        if (alive.current) setMessage('Not saved to the classroom: ' + (error as Error).message + ' Your local copy is kept; use Retry save.');
        return false;
      } finally { if (alive.current) setBusy(false); }
    };
    saving.current = task();
    try { return await saving.current; } finally { saving.current = null; }
  }
  useEffect(() => {
    alive.current = true;
    if (shared) token.current = currentStudentToken();
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw);
        for (const p of projects) if (saved[p.id]) {
          const e = saved[p.id];
          entries.current[p.id] = { ...e, work: validateWork(e.work), revision: Number.isSafeInteger(e.revision) ? e.revision : 0, dirty: !!e.dirty };
        }
      } else {
        const old = JSON.parse(localStorage.getItem('python-capstones-v1:' + student.trim().toLowerCase()) || '{}');
        for (const p of projects) if (old[p.id]) entries.current[p.id] = { work: validateWork({ ...old[p.id], lastRun: null, runIds: [] }), revision: 0, dirty: true };
      }
    } catch { setStorageError('A local draft could not be read. The original browser data has been kept.'); }
    void (async () => {
      if (shared) await loadCloud();
      else setMessage('Saved in this browser. Download a backup to keep or move your work.');
      if (alive.current) { setReady(true); updateUI(); }
    })();
    const online = () => void flush();
    const warn = (event: BeforeUnloadEvent) => { if (shared && Object.values(entries.current).some(e => e.dirty)) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('online', online); window.addEventListener('beforeunload', warn);
    return () => { alive.current = false; window.removeEventListener('online', online); window.removeEventListener('beforeunload', warn); };
  }, [key, shared]); // The parent remounts this hook when student identity changes.
  useEffect(() => {
    if (!ready || !shared || !Object.values(entries.current).some(e => e.dirty)) return;
    const timer = setTimeout(() => void flush(), 1200);
    return () => clearTimeout(timer);
  }, [change, ready, shared]);
  function edit(projectId: string, patch: Partial<CapstoneWork>) {
    const prior = entries.current[projectId];
    entries.current[projectId] = { ...prior, work: { ...(prior?.work || freshWork(projectId)), ...patch }, revision: prior?.revision || 0, dirty: true };
    if (shared) setMessage('Saved locally. Waiting to sync with the classroom…');
    persist(); changed(n => n + 1);
  }
  async function submit(projectId: string) {
    if (!shared || !await flush() || conflictRef.current[projectId]) return;
    const entry = entries.current[projectId];
    if (!entry) return;
    setBusy(true);
    try {
      const response = await studentCapstoneApi(token.current, { action: 'capstone-submit', projectId, revision: entry.revision, id: crypto.randomUUID() });
      if (response.conflict) { conflict(projectId, response.conflict); return; }
      const record = response.record as CapstoneRecord;
      const current = entries.current[projectId];
      entries.current[projectId] = { work: current.work, revision: record.revision, server: record, dirty: JSON.stringify(current.work) !== JSON.stringify(record.work) };
      persist(); setMessage('Submitted to Professor Porras. You can keep experimenting and submit an updated version later.');
    } catch (error) { setMessage('Submission was not confirmed: ' + (error as Error).message + ' Retry when connected.'); }
    finally { setBusy(false); }
  }
  function resolve(projectId: string, useCloud: boolean) {
    const record = conflictRef.current[projectId];
    if (!record) return;
    const current = entries.current[projectId];
    entries.current[projectId] = { work: useCloud ? record.work : current.work, revision: record.revision, dirty: !useCloud, server: record };
    delete conflictRef.current[projectId]; setConflicts({ ...conflictRef.current }); persist(); changed(n => n + 1);
    setMessage(useCloud ? 'Loaded the classroom copy.' : 'Keeping this browser’s copy. Saving it to the classroom…');
  }
  return { entries: entries.current, ready, busy, message, storageError, conflicts, edit, flush, submit, resolve };
}
