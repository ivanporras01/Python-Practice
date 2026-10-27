'use client';
import { useMemo, useState } from 'react';
import { Copy, Download, FolderOpen } from 'lucide-react';
import { parseBackup, projects } from './lib/capstone-work';
import DownloadLink from './download-link';
import { projectPackage } from './lib/project-package';

export default function ProjectFiles() {
  const [backup, setBackup] = useState<ReturnType<typeof parseBackup> | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const project = projects.find(p => p.id === backup?.projectId);
  const bundle = useMemo(() => backup ? projectPackage(backup.projectId, backup.work) : null, [backup]);
  async function openFile(file?: File) {
    if (!file) return;
    setBusy(true); setError(''); setMessage(''); setBackup(null);
    try {
      if (file.size > 250000) throw new Error('Choose a project backup smaller than 250 KB.');
      const loaded = parseBackup(await file.text());
      setBackup(loaded); setMessage('Backup opened. Your project files are ready to download.');
    } catch {
      setError('This file could not be opened. Choose a .json project backup downloaded from this portal, smaller than 250 KB.');
    } finally { setBusy(false); }
  }
  async function copyCode() {
    if (!backup) return;
    try { await navigator.clipboard.writeText(backup.work.code); setMessage('Code copied. Paste it into a .py file to keep it.'); }
    catch { setError('Select the code below and use Ctrl/Cmd + C to copy it.'); }
  }
  return <div className="project-file-recovery">
    <div className="page-heading"><div><p className="eyebrow">KEEP YOUR WORK</p><h1>Open your project backup</h1><p>Recover your Python file from a saved project backup. No sign-in required.</p></div></div>
    <section className="card cap-pad">
      <h2><FolderOpen size={22}/>Choose your saved backup</h2>
      <p>Use the .json file created by <strong>Download project backup</strong> in Capstone Projects.</p>
      <label className="cap-label">Project backup (.json)<input type="file" accept=".json,application/json" disabled={busy} onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; void openFile(file); }}/></label>
      <p className="cap-small">The file is read only in this browser. It is not uploaded, and its Python code is not run here.</p>
      {busy && <p role="status">Opening your backup…</p>}
      {error && <p role="alert" className="cap-notice">{error}</p>}
      {message && <p role="status" className="cap-notice">{message}</p>}
      {backup && project && <div className="project-file-preview">
        <h2>{project.title}</h2><p><strong>{project.file}</strong> · Your saved code</p>
        <div className="cap-actions">{bundle&&<DownloadLink name={project.id+"_project_files.zip"} content={bundle} mime="application/zip" className="button"><Download size={16}/>Download project files (.zip)</DownloadLink>}<button className="button secondary" onClick={() => void copyCode()}><Copy size={16}/>Copy code</button></div>
        <pre className="cap-snippet" aria-label="Python code from your backup"><code>{backup.work.code}</code></pre>
        <p className="cap-small">The ZIP includes your Python file, inputs, report, and a project backup. Extract it to a folder to keep using the files. Keep the original .json backup too: it includes your inputs, prediction, explanation, and last run. To keep practicing, sign in and choose Open project backup in Capstone Projects.</p>
      </div>}
      <a className="text-button" href="?view=capstones">Return to Capstone Projects →</a>
    </section>
  </div>;
}
