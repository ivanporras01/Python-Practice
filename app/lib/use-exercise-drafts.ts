'use client';
import { useEffect, useRef, useState } from 'react';
import { topics } from './curriculum';

export type ExerciseDraft = { code: string; inputs: string; updatedAt: number };
type Drafts = Record<string, ExerciseDraft>;
const exerciseIds = new Set(topics.flatMap(topic => topic.exercises.map(exercise => exercise.id)));

export function readExerciseDrafts(raw: string | null): Drafts {
  if (!raw) return {};
  const value = JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid saved drafts.');
  const drafts: Drafts = {};
  for (const [id, draft] of Object.entries(value) as [string, ExerciseDraft][]) {
    if (!exerciseIds.has(id)) continue;
    if (!draft || typeof draft.code !== 'string' || draft.code.length > 20000 || typeof draft.inputs !== 'string' || draft.inputs.length > 5000 || !Number.isFinite(draft.updatedAt)) throw new Error('Invalid saved draft.');
    drafts[id] = { code: draft.code, inputs: draft.inputs, updatedAt: draft.updatedAt };
  }
  return drafts;
}

export function useExerciseDrafts(owner: string | null) {
  const key = owner ? 'python-exercise-drafts-v1:' + owner : '';
  const current = useRef({ key: '', drafts: {} as Drafts });
  const [snapshot, setSnapshot] = useState(current.current);
  const [error, setError] = useState('');
  useEffect(() => {
    let drafts: Drafts = {};
    setError('');
    try { if (key) drafts = readExerciseDrafts(localStorage.getItem(key)); }
    catch { setError('Saved exercise drafts could not be read. Download your code before leaving this page.'); }
    current.current = { key, drafts };
    setSnapshot(current.current);
  }, [key]);
  function edit(id: string, code: string, inputs: string) {
    if (!exerciseIds.has(id) || current.current.key !== key) return;
    const drafts = { ...current.current.drafts, [id]: { code, inputs, updatedAt: Date.now() } };
    current.current = { key, drafts };
    setSnapshot(current.current);
    try { if (key) localStorage.setItem(key, JSON.stringify(drafts)); setError(''); }
    catch { setError('This browser could not save your draft. Download your code before leaving.'); }
  }
  return { drafts: snapshot.key === key ? snapshot.drafts : {}, ready: snapshot.key === key, edit, error };
}
