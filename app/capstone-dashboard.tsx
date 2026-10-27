'use client';
import { useState } from 'react';
import { projects, summarizeCapstone, projectReport, type CapstoneRecord, type CapstoneSummary } from './lib/capstone-work';
import { downloadText } from './lib/download';
type Learner = { id: string; name: string; capstones?: Record<string, CapstoneSummary> };
function date(time?: number) { return time ? new Date(time).toLocaleString() : '—'; }
export function CapstoneDashboard({ roster, openStudent }: { roster: Learner[]; openStudent: (id: string) => void }) {
  const [query, setQuery] = useState(''), [project, setProject] = useState('all');
  const [status, setStatus] = useState('all'), [sort, setSort] = useState('recent');
  const statuses = ['Not started', 'In progress', 'Submitted', 'Changes after submission'];
  const projectRows = roster.flatMap(student => projects.filter(p => project === 'all' || p.id === project).map(p => ({ student, project: p, summary: student.capstones?.[p.id] })));
  const rows = projectRows.filter(row => row.student.name.toLowerCase().includes(query.trim().toLowerCase()) && (status === 'all' || (row.summary?.status || 'Not started') === status)).sort((a, b) => sort === 'recent' ? (b.summary?.updatedAt || 0) - (a.summary?.updatedAt || 0) || a.student.name.localeCompare(b.student.name) : a.student.name.localeCompare(b.student.name) || a.project.title.localeCompare(b.project.title));
  function exportCsv() {
    const cell = (v: unknown) => { let t = String(v ?? ''); if (/^[=+@\-\t\r]/.test(t)) t = "'" + t; return '"' + t.replaceAll('"', '""') + '"'; };
    const data = [['Student', 'Project', 'Status', 'Milestones (of 4)', 'Runs', 'Last saved', 'Last submitted'], ...rows.map(r => [r.student.name, r.project.title, r.summary?.status || 'Not started', r.summary?.milestones || 0, r.summary?.runs || 0, r.summary ? new Date(r.summary.updatedAt).toISOString() : '', r.summary?.submittedAt ? new Date(r.summary.submittedAt).toISOString() : ''])];
    downloadText('Python-Capstone-Progress.csv', '\uFEFF' + data.map(row => row.map(cell).join(',')).join('\r\n'), 'text/csv');
  }
  return <section className="card cap-monitor">
    <div className="section-heading"><div><h2>Capstone project progress</h2><p>Saved drafts and submitted projects · refreshes with your dashboard every 15 seconds</p></div><button className="button secondary compact" disabled={!rows.length} onClick={exportCsv}>Export filtered progress</button></div>
    <div className="cap-monitor-summary" aria-label="Project totals for the selected project">{statuses.map(label=><button key={label} className={status===label?'selected':''} aria-pressed={status===label} onClick={()=>setStatus(status===label?'all':label)}><strong>{projectRows.filter(r=>(r.summary?.status||'Not started')===label).length}</strong><span>{label}</span></button>)}</div>
    <div className="cap-monitor-filters">
      <label>Find a student<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Student name"/></label>
      <label>Project<select value={project} onChange={e=>setProject(e.target.value)}><option value="all">All three projects</option>{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
      <label>Project status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option>{statuses.map(label=><option key={label}>{label}</option>)}</select></label>
      <label>Sort projects<select value={sort} onChange={e=>setSort(e.target.value)}><option value="recent">Recently updated first</option><option value="name">Student name</option></select></label>
    </div>
    <p className="cap-small" role="status">Showing {rows.length} of {projectRows.length} student projects. Export includes the current filters.</p>
    <div className="cap-monitor-table"><table><thead><tr><th scope="col">Student / Project</th><th scope="col">Milestones</th><th scope="col">Runs</th><th scope="col">Status</th><th scope="col">Last saved</th><th scope="col">Review</th></tr></thead><tbody>{rows.map(r=><tr key={r.student.id+':'+r.project.id}><td><strong>{r.student.name}</strong><small>{r.project.title}</small></td><td>{r.summary?.milestones||0} / 4</td><td>{r.summary?.runs||0}</td><td><span className={'status-badge '+(r.summary?.status==='Submitted'?'success':'working')}>{r.summary?.status||'Not started'}</span></td><td>{date(r.summary?.updatedAt)}</td><td><button className="text-button" aria-label={'View '+r.student.name+' — '+r.project.title} onClick={()=>openStudent(r.student.id)}>View work</button></td></tr>)}</tbody></table>
      {!rows.length&&<p>{roster.length?'No projects match these filters. Change the student, project, or status filter.':'No students have joined yet. Share your student link to get started.'}</p>}
    </div>
    <p className="cap-small">Milestones: prediction, code changes, a successful run of the current code, and an explanation. These are practice indicators, not grades. Open a student to inspect the saved code and submission.</p>
  </section>;
}
export function CapstoneStudentWork({ name, records }: { name: string; records: CapstoneRecord[] }) {
  return <section className="cap-student-work"><h3>Capstone projects</h3>{!records.length?<p className="muted">No Capstone projects saved yet.</p>:records.map(r=>{
    const project=projects.find(p=>p.id===r.projectId);if(!project)return null;
    const summary=summarizeCapstone(r);
    const workView=(work:CapstoneRecord['work'],suffix:string)=><><div className="cap-actions"><button className="button secondary compact" onClick={()=>downloadText(`${r.projectId}_${suffix}.py`,work.code,'text/x-python')}>Download code</button><button className="button secondary compact" onClick={()=>downloadText(`${r.projectId}_${suffix}_report.md`,projectReport(r.projectId,work,name),'text/markdown')}>Download report</button></div><h4>Prediction</h4><p className="cap-preserve">{work.prediction||'Not written yet.'}</p><h4>Code</h4><pre className="cap-snippet">{work.code}</pre><h4>Program inputs</h4><pre className="cap-snippet">{work.inputs}</pre><h4>Last output</h4><pre className="cap-snippet">{work.lastRun?.output||'No output yet.'}{work.lastRun?.error?'\n'+work.lastRun.error:''}</pre>{work.lastRun&&(work.lastRun.code!==work.code||work.lastRun.inputs!==work.inputs)&&<p className="cap-stale">This output belongs to an earlier version. The downloaded report includes that run’s code and inputs.</p>}<h4>Explanation</h4><p className="cap-preserve">{work.reflection||'Not written yet.'}</p></>;
    return <details key={r.projectId} className="attempt-detail"><summary><span>{project.title}<small>{summary.milestones}/4 milestones · {r.runs} runs · {date(r.updatedAt)}</small></span><span className="status-badge working">{summary.status}</span></summary><h4>Current saved draft</h4>{workView(r.work,'draft')}{r.submitted&&<details className="cap-submission"><summary>Submitted version · {date(r.submitted.at)}</summary>{workView(r.submitted.work,'submitted')}</details>}</details>;
  })}</section>;
}
