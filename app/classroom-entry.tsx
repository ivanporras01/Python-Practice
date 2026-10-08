'use client';
import { useState, type FormEvent } from 'react';
import { GraduationCap, ShieldCheck, Loader2 } from 'lucide-react';
import { publicClassroomApi, teacherLogin } from './lib/public-classroom';

export function StudentEntry({ onJoined }: { onJoined: () => Promise<void> }) {
  const [first, setFirst] = useState(''), [last, setLast] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function join(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { await publicClassroomApi({ action: 'join', firstName: first, lastName: last }); await onJoined(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <section className="classroom-entry card">
    <div className="dialog-emblem"><GraduationCap size={30}/></div>
    <p className="eyebrow">PROFESSOR PORRAS’S PYTHON PRACTICE</p>
    <h1>Let’s get you started.</h1>
    <p>Enter your first and last name, then start practicing. No account or password needed.</p>
    <form onSubmit={join}>
      <label>First Name<input autoFocus required maxLength={50} autoComplete="given-name" value={first} onChange={e => setFirst(e.target.value)} /></label>
      <label>Last Name<input required maxLength={50} autoComplete="family-name" value={last} onChange={e => setLast(e.target.value)} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button" disabled={busy}>{busy && <Loader2 className="spin" size={17}/>}Start practicing</button>
    </form>
    <p className="form-note">Professor Porras can see your activity, submitted code, and progress. Return using this browser to continue your saved practice.</p>
  </section>;
}

export function TeacherEntry({ onReady }: { onReady: () => Promise<void> }) {
  const [key, setKey] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { await teacherLogin(key); setKey(''); await onReady(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <section className="classroom-entry card">
    <div className="dialog-emblem"><ShieldCheck size={30}/></div>
    <p className="eyebrow">PRIVATE CLASSROOM VIEW</p><h1>Instructor dashboard</h1>
    <p>Use your private teacher access key to see who is practicing and follow each student’s progress.</p>
    <form onSubmit={login}><label>Teacher access key<input type="password" required autoComplete="off" value={key} onChange={e => setKey(e.target.value)}/></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button" disabled={busy}>{busy && <Loader2 className="spin" size={17}/>}Open dashboard</button>
    </form><p className="form-note">Keep this key private. Students only need the student link and their names.</p>
  </section>;
}
