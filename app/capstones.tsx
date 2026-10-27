'use client';
import React, {useEffect, useRef, useState} from 'react';
import {BookOpen, BookMarked, CheckCircle2, Code2, Coffee, Copy, Download, Film, Lightbulb, Play, RotateCcw, Square, Terminal} from 'lucide-react';
import content from './lib/capstones.json';
import './capstones.css';
import CapstoneCodeGuide from './capstone-code-guide';
import { downloadText as download } from './lib/download';
import { freshWork, milestones, backupText, parseBackup, projectReport, type CapstoneWork, type CapstoneRun } from './lib/capstone-work';
import { useCapstoneWork } from './lib/use-capstone-work';

type Output = CapstoneRun;
const icons = {cafe:Coffee, cinema:Film, bookstore:BookMarked};
function Snippet({code}:{code:string}) {return <pre className="cap-snippet"><code>{code}</code></pre>;}

export default function Capstones({student,shared=false,onRunningChange}:{student:string;shared?:boolean;onRunningChange:(running:boolean)=>void}) {
  const [selected,setSelected]=useState('cafe');
  const saved=useCapstoneWork(student,shared);
  const ready=saved.ready;
  const upload=useRef<HTMLInputElement|null>(null);
  const [downloadMessage,setDownloadMessage]=useState('');
  const [tab,setTab]=useState<'learn'|'lab'|'challenges'>('learn');
  const [step,setStep]=useState(0);
  const [scenario,setScenario]=useState(0);
  const [parameterValues,setParameterValues]=useState<Record<string,string>>({});
  const [inputValues,setInputValues]=useState<string[]>([]);
  const [notice,setNotice]=useState('');
  const [running,setRunning]=useState(false);
  const [stage,setStage]=useState('');
  const [previous,setPrevious]=useState<Output|null>(null);
  const worker=useRef<Worker|null>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const project=content.projects.find(p=>p.id===selected)||content.projects[0];
  const draft=saved.entries[project.id]?.work||freshWork(project.id);
  const result=draft.lastRun;
  const checks=milestones(project.id,draft);
  const Icon=icons[project.icon as keyof typeof icons];
  const stale=!!result&&(result.code!==draft.code||result.inputs!==draft.inputs);

  useEffect(()=>{const requested=new URLSearchParams(location.search).get('project');if(content.projects.some(p=>p.id===requested))setSelected(requested!);},[]);
  useEffect(()=>{setParameterValues(Object.fromEntries(project.params.map(p=>[p.key,String(p.value)])));setInputValues(project.scenarios[0].values);setScenario(0);setStep(0);setNotice('');setPrevious(null);},[project.id]);
  useEffect(()=>()=>{worker.current?.terminate();if(timer.current)clearTimeout(timer.current);onRunningChange(false);},[onRunningChange]);
  function edit(update:Partial<CapstoneWork>){saved.edit(project.id,update);}
  function setResult(value:Output|null){edit({lastRun:value,...(value?{runIds:[...new Set([...draft.runIds,value.id])].slice(-64)}:{})});}
  function downloadFile(name:string,text:string,mime='text/plain'){try{download(name,text,mime);setDownloadMessage('Download started. Check your browser’s Downloads folder.');}catch{setDownloadMessage('The browser could not start the download. Allow downloads for this site and try again.');}}
  async function copyCode(){try{await navigator.clipboard.writeText(draft.code);setDownloadMessage('Code copied. Paste it into a .py file to keep it.');}catch{setDownloadMessage('Select your code in the Python lab and use Ctrl/Cmd + C to copy it.');}}
  async function importWork(file:File|undefined){
    if(!file)return;
    try{
      if(file.size>250000)throw new Error('Choose a project backup smaller than 250 KB.');
      const backup=parseBackup(await file.text());
      if(!window.confirm('Replace this project’s current draft with the backup? Download your current backup first if you want to keep both.'))return;
      saved.edit(backup.projectId,backup.work);choose(backup.projectId);setDownloadMessage('Backup opened. Your code, inputs, notes, and last run are restored.');
    }catch(error){setDownloadMessage((error as Error).message);}
    finally{if(upload.current)upload.current.value='';}
  }
  function choose(id:string){if(running)return;setSelected(id);setTab('learn');const u=new URL(location.href);u.searchParams.delete('topic');u.searchParams.set('view','capstones');u.searchParams.set('project',id);history.replaceState({},'',u);}
  function finish(){worker.current?.terminate();worker.current=null;if(timer.current)clearTimeout(timer.current);timer.current=null;setRunning(false);onRunningChange(false);}
  function stop(){finish();setStage('Stopped. Check the loop condition or input values, then try again.');}
  function run(baseline=false){
    if(running||!ready)return;
    const input=baseline?project.scenarios[0].inputs:draft.inputs;
    const snapshot={id:crypto.randomUUID(),at:Date.now(),code:draft.code,inputs:input,baseline};
    if(baseline)edit({inputs:input});
    if(result&&!result.error)setPrevious(result);
    setRunning(true);onRunningChange(true);setStage('Loading Python. The first run may take a moment…');
    const fail=(message:string)=>{setResult({...snapshot,output:'',error:message});finish();};
    try {
      const w=new Worker(new URL('./python-worker.mjs',location.href),{type:'module'});worker.current=w;
      timer.current=setTimeout(()=>fail('Python could not finish loading. Check your connection to cdn.jsdelivr.net and try again.'),90000);
      w.onmessage=({data})=>{
        if(data.type==='running'){setStage('Running your Python…');if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>fail('Stopped after 10 seconds. Look for a loop that never ends. Every input() call also needs a line of Program input.'),10000);}
        if(data.type==='fatal')fail(data.error);
        if(data.type==='result'){setResult({...snapshot,output:(data.output||'').slice(0,20000),error:(data.error||'').slice(0,4000)});finish();setStage('Run complete.');}
      };
      w.onerror=()=>fail('The Python worker could not start. Check your connection and try again.');
      w.postMessage({code:snapshot.code,inputs:input,test:''});
    }catch(e){fail(String(e));}
  }
  function reset(){if(!window.confirm('Restore this project’s example code and default inputs? Your written prediction and reflection will stay.'))return;edit({code:project.code,inputs:project.scenarios[0].inputs});setParameterValues(Object.fromEntries(project.params.map(p=>[p.key,String(p.value)])));setInputValues(project.scenarios[0].values);setScenario(0);setResult(null);setPrevious(null);setNotice('Example code and inputs restored.');}
  function applySettings(){
    for(const p of project.params){const s=parameterValues[p.key]??'';if(!/^\d+$/.test(s)||Number(s)<p.min||Number(s)>p.max){setNotice(`${p.label}: enter a whole number from ${p.min} to ${p.max}.`);return;}}
    for(let i=0;i<project.fields.length;i++){const f=project.fields[i],v=inputValues[i]??'';if(f.kind==='number'&&(!/^\d+$/.test(v)||Number(v)>f.max)){setNotice(`${f.label}: enter a whole number from 0 to ${f.max}.`);return;}}
    let code=draft.code;
    for(const p of project.params){const pattern=new RegExp('^'+p.key+'\\s*=.*$','m');if(!pattern.test(code)){setNotice(`Could not find ${p.key} in your code. Edit it directly or restore the example first.`);return;}code=code.replace(pattern,`${p.key} = ${Number(parameterValues[p.key])}`);}
    edit({code,inputs:inputValues.join('\n')});setNotice('Values applied to the code and Program input. Predict the result, then Run my code.');
  }
  function exportWork(){downloadFile(project.id+'_practice_report.md',projectReport(project.id,draft,student),'text/markdown');}

  if(!ready)return <p role="status">Loading your saved Capstone projects…</p>;
  return <div className="capstones">
    <div className="cap-hero"><div><p className="eyebrow">MODULES 1–6 PRACTICE</p><h1>Capstone Projects</h1><p>Small systems. Real Python. See what your code can do.</p></div><span className="cap-hero-badge"><Code2/>3 projects · 18 challenges</span></div>
    <div className="cap-projects" aria-label="Choose a capstone project">{content.projects.map((p,i)=>{const I=icons[p.icon as keyof typeof icons];return <button key={p.id} onClick={()=>choose(p.id)} disabled={running} className={'cap-project '+(selected===p.id?'selected':'')} aria-pressed={selected===p.id}><div><I size={24}/><small>0{i+1} · {p.tag}</small></div><h2>{p.title}</h2><p>{p.description}</p><span>{selected===p.id?'Current project':'Explore project'} →</span></button>;})}</div>
    <section className="card cap-pad cap-file-bar" aria-label="Save and keep your work">
      <div><h2>Your project files</h2><p className="cap-small">{shared?'Your code, inputs, notes, and last run save automatically to the classroom. Return with the same first and last name on another device to continue. Professor Porras can review your work.':'Your code, inputs, notes, and last run save in this browser. Download a backup to continue on another device.'}</p></div>
      <p role="status" className="cap-saving">{saved.message}</p>
      {saved.storageError&&<p role="alert" className="cap-notice">{saved.storageError}</p>}
      <div className="cap-actions">
        {shared&&<button className="button compact" disabled={saved.busy||running} onClick={()=>{if(!saved.entries[project.id])edit({});void saved.flush();}}>{saved.busy?'Saving…':'Save / Retry save'}</button>}
        <button className="button secondary compact" onClick={()=>downloadFile(project.file,draft.code,'text/x-python')}><Download size={15}/>Download my code (.py)</button>
        <button className="button secondary compact" onClick={()=>void copyCode()}><Copy size={15}/>Copy code</button><button className="button secondary compact" onClick={exportWork}>Download practice report</button>
        <button className="button secondary compact" onClick={()=>downloadFile(project.id+'_project_backup.json',backupText(project.id,draft),'application/json')}>Download project backup</button>
        <button className="button secondary compact" disabled={running||saved.busy} onClick={()=>upload.current?.click()}>Open project backup</button>
        <input ref={upload} type="file" accept=".json,application/json" hidden onChange={e=>void importWork(e.target.files?.[0])}/>
      </div>
      <p className="cap-small">The .py file runs in Python. The report is a readable record of your work. Keep the .json backup to reopen the complete project here. Downloads belong to you and stay on your computer.</p>
      {downloadMessage&&<p role="status" className="cap-notice">{downloadMessage}</p>}
      {saved.conflicts[project.id]&&<div className="cap-notice" role="alert"><p>A different version exists in the classroom. Download a backup above before replacing either copy.</p><div className="cap-actions"><button className="button secondary compact" onClick={()=>saved.resolve(project.id,true)}>Load classroom copy</button><button className="button secondary compact" onClick={()=>saved.resolve(project.id,false)}>Keep this browser’s copy</button></div></div>}
      <div className="cap-milestones">{checks.map(c=><span key={c.label} className={c.done?'done':''}>{c.done?'✓':'○'} {c.label}</span>)}</div>
      <div className="cap-actions">{shared&&<button className="button compact" disabled={running||saved.busy||!!saved.conflicts[project.id]||checks.some(c=>!c.done)} onClick={()=>void saved.submit(project.id)}>Submit project to Professor Porras</button>}{saved.entries[project.id]?.server?.submitted&&<span className="cap-small">Last submitted: {new Date(saved.entries[project.id].server!.submitted!.at).toLocaleString()}</span>}</div>
      <p className="cap-small">Complete the four milestones to submit. Milestones describe your practice; Professor Porras reviews the code and explanation.</p>
    </section>
    <section className="cap-active"><div className="cap-active-title"><Icon/><div><h2>{project.title}</h2><p>{project.focus} · About 45–60 minutes</p></div></div>
      <nav className="cap-tabs" aria-label="Project sections">{([{id:'learn',label:'1. Understand & predict',icon:BookOpen},{id:'lab',label:'2. Run & experiment',icon:Terminal},{id:'challenges',label:'3. Explain & extend',icon:Lightbulb}] as const).map(t=><button key={t.id} className={tab===t.id?'selected':''} onClick={()=>setTab(t.id)} aria-current={tab===t.id?'page':undefined}><t.icon size={17}/>{t.label}</button>)}</nav>
      {tab==='learn'&&<>
        <div className="cap-overview"><article className="card cap-pad"><p className="eyebrow">THE MISSION</p><h3>Build an invoice you can explain.</h3><p>Use the working example, predict its output, and change one thing at a time. Then explain which rule caused the result.</p><ol className="cap-rules">{project.rules.map(r=><li key={r}>{r}</li>)}</ol><div className="cap-formula">{project.formula}</div><p className="cap-small">All prices, taxes, discounts, and fees are fictional classroom rules. Keep monetary parameters nonnegative; percentage parameters range from 0 to 100.</p></article><article className="card cap-pad"><p className="eyebrow">MODULE 1 · THE ALGORITHM</p><h3>Plan before you program</h3><Snippet code={project.pseudocode}/><div className="cap-flow"><span>Inputs<br/><b>Names & quantities</b></span><span>Process<br/><b>Decisions & math</b></span><span>Output<br/><b>Itemized invoice</b></span></div></article></div>
        <div className="cap-module-layout"><div className="cap-module-nav" aria-label="Module walkthrough">{content.modules.map((m,i)=><button key={m} onClick={()=>setStep(i)} className={step===i?'selected':''} aria-pressed={step===i}><b>{i+1}</b><span>{m}</span></button>)}</div><article className="card cap-pad"><p className="eyebrow">MODULE {step+1} IN THIS PROJECT</p><h3>{project.walk[step].title}</h3><p>{project.walk[step].explanation}</p><Snippet code={project.walk[step].snippet}/><p className="cap-small">This is a walkthrough excerpt. Run the complete program in the next section.</p><div className="cap-actions"><button className="button secondary compact" disabled={step===0} onClick={()=>setStep(s=>s-1)}>Previous</button>{step<5?<button className="button compact" onClick={()=>setStep(s=>s+1)}>Next module →</button>:<button className="button compact" onClick={()=>setTab('lab')}>Open the Python lab →</button>}</div></article></div>
        <CapstoneCodeGuide id={project.id} code={project.code}/><details className="card cap-pad"><summary>Why cents? A small arithmetic walkthrough</summary><p>Integer cents keep money exact: $23.40 is 2340 cents. To find 7%, multiply 2340 × 7 = 16380, divide by 100, and round to 164 cents ($1.64). For these nonnegative values, adding 50 before floor division implements nearest-cent rounding with halves up.</p><Snippet code={'def percent_of(cents, percent):\n    return (cents * percent + 50) // 100\n\npercent_of(2340, 7)  # returns 164 cents\n\n# Parameter: cents in the definition\n# Argument: 2340 in this call'}/><p className="cap-small">The helper returns an integer. money() converts cents to a two-decimal dollar string only for display.</p></details>
      </>}
      {tab==='lab'&&<>
        <div className="cap-lab-intro"><p><strong>Try this first:</strong> run the original example. Change a quantity or a constant, predict the new total, and run again.</p><div className="cap-actions"><button className="button secondary compact" disabled={running} onClick={reset}><RotateCcw size={15}/>Restore example</button><button className="button secondary compact" onClick={()=>downloadFile(project.file,draft.code,'text/x-python')}><Download size={15}/>Download Python</button></div></div>
        <details className="card cap-pad cap-settings"><summary>Change values with guided controls</summary><p className="cap-small">Controls start with the reference values. Apply copies these values into the constants at the top of your code and rebuilds Program input. Direct editor changes stay until you apply again.</p><div className="cap-control-grid">{project.params.map(p=><label key={p.key}>{p.label} <small>({p.unit})</small><input type="number" min={p.min} max={p.max} step="1" value={parameterValues[p.key]??''} onChange={e=>setParameterValues(v=>({...v,[p.key]:e.target.value}))} disabled={running}/></label>)}</div><h3>Order inputs</h3><div className="cap-control-grid">{project.fields.map((f,i)=><label key={f.label}>{f.label}{f.kind==='yesno'?<select value={inputValues[i]??f.value} disabled={running} onChange={e=>setInputValues(v=>v.map((x,n)=>n===i?e.target.value:x))}><option value="yes">yes</option><option value="no">no</option></select>:<input type={f.kind==='number'?'number':'text'} min="0" max={f.max} step="1" value={inputValues[i]??''} disabled={running} onChange={e=>setInputValues(v=>v.map((x,n)=>n===i?e.target.value:x))}/>}</label>)}</div><button className="button compact" onClick={applySettings} disabled={running}>Apply values to code & input</button>{notice&&<p className="cap-notice" role="status">{notice}</p>}</details>
        <div className="cap-lab-grid"><div className="cap-editor-column"><section className="cap-editor"><div className="cap-editor-head"><span><Code2 size={17}/>{project.file}</span><span>Python 3</span></div><textarea maxLength={20000} className="cap-code" aria-label="Capstone Python code" spellCheck={false} autoCapitalize="off" autoCorrect="off" value={draft.code} disabled={running} onChange={e=>edit({code:e.target.value})} onKeyDown={e=>{if(e.key==='Tab'){e.preventDefault();const el=e.currentTarget,a=el.selectionStart,b=el.selectionEnd;edit({code:(draft.code.slice(0,a)+'    '+draft.code.slice(b)).slice(0,20000)});requestAnimationFrame(()=>{el.selectionStart=el.selectionEnd=a+4;});}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();run();}}}/><div className="cap-editor-footer"><small>Tab = 4 spaces · Ctrl/⌘ + Enter = run</small>{running?<button className="button compact" onClick={stop}><Square size={14}/>Stop</button>:<button className="button compact" onClick={()=>run()} disabled={!ready}><Play size={15}/>Run my code</button>}</div></section>
          <section className="card cap-pad"><h3>Program input</h3><p className="cap-small">One line per input() call, in this order: {project.fields.map(f=>f.label).join(' → ')}. Invalid entries consume extra lines when the program asks again.</p><div className="cap-scenario"><label>Sample scenario<select value={scenario} disabled={running} onChange={e=>setScenario(Number(e.target.value))}>{project.scenarios.map((s,i)=><option key={s.title} value={i}>{s.title}</option>)}</select></label><button className="button secondary compact" disabled={running} onClick={()=>{edit({inputs:project.scenarios[scenario].inputs});setInputValues(project.scenarios[scenario].values);setNotice('Scenario inputs loaded. Your code is unchanged.');}}>Load scenario inputs</button></div><textarea maxLength={5000} className="cap-input" aria-label="Capstone program input" value={draft.inputs} disabled={running} onChange={e=>edit({inputs:e.target.value})}/><details><summary>Reference output for this scenario</summary><p className="cap-small">Expected only with the original code and this scenario’s inputs.</p><Snippet code={project.scenarios[scenario].expected}/></details></section>
        </div><div className="cap-result-column"><section className="card cap-pad"><label className="cap-label">Predict before running<textarea maxLength={4000} value={draft.prediction} onChange={e=>edit({prediction:e.target.value})} placeholder="I predict a total of… because…"/></label></section><section className="cap-receipt" aria-live="polite"><div className="cap-receipt-top"><Terminal size={18}/><strong>Python output</strong><span>{running?'Running':result?'Last run':'Ready'}</span></div>{running?<p>{stage}</p>:result?<><pre>{result.output||'(No output printed)'}</pre>{result.error&&<div className="cap-error"><strong>Something to investigate</strong><pre>{result.error}</pre><p>{result.error.includes('EOF')?'The input ran out. Add a line for each input() call, including validation retries.':'Read the last error line and check the named line in your code. Compare indentation, names, and types with the walkthrough.'}</p></div>}{stale&&<p className="cap-stale">Code or input changed after this result. Run again to update it.</p>}{result.baseline&&!result.error&&<p className="cap-check">{result.output.trim()===project.scenarios[0].expected.trim()?'✓ Default invoice matches the reference.':'The default invoice differs from the reference. If your changes were intentional, explain them; otherwise compare the totals.'}</p>}</>:<p>{stage||'Run the code to print a real invoice here.'}</p>}</section><button className="button secondary" disabled={running||!ready} onClick={()=>run(true)}><CheckCircle2 size={16}/>Check default case</button><p className="cap-small">Runs your current code with default inputs and compares its output. Custom experiments do not need to match the default.</p>{previous&&<details className="card cap-pad"><summary>Compare with previous successful run</summary><Snippet code={previous.output}/><p className="cap-small">Which values changed? Which stayed the same? Use your reflection to explain why.</p></details>}</div></div>
      </>}
      {tab==='challenges'&&<>
        <div className="cap-challenge-intro"><h3>Predict → run → change → explain</h3><p>Restore the original example before each challenge unless it says otherwise. Try the problem before opening its answer.</p><button className="button compact" onClick={()=>setTab('lab')}><Play size={16}/>Return to Python lab</button></div><div className="cap-challenges">{project.challenges.map(c=><article className="card cap-pad" key={c.title}><h3>{c.title}</h3><p>{c.task}</p><details><summary>Reveal answer & explanation</summary><pre className="cap-answer">{c.answer}</pre></details></article>)}</div>
        <section className="card cap-pad cap-reflection"><p className="eyebrow">SHOW YOUR THINKING</p><h3>What did you change, and why did it work?</h3><p>Record the original value, your change, predicted output, actual output, and the Python concept that explains the result. Include one boundary or invalid-input test.</p><label className="cap-label">My explanation<textarea maxLength={8000} value={draft.reflection} onChange={e=>edit({reflection:e.target.value})} placeholder="I changed… I expected… The output was… This happened because…"/></label><div className="cap-actions"><button className="button" onClick={exportWork}><Download size={16}/>Download practice report</button><button className="button secondary" onClick={()=>downloadFile(project.file,draft.code,'text/x-python')}>Download my code</button></div><p className="cap-small">A complete report includes your code, input, last output, prediction, and explanation. Use Submit project above when your four milestones are complete.</p></section>
        <details className="card cap-pad"><summary>Professor’s teaching guide & review checklist</summary><p>Suggested 50-minute lesson: 5 minutes to plan; 10 to trace the six concepts; 10 to run and modify; 15 for challenges; 10 to explain and share. Start with the café, transfer the same ideas to cinema, then test boundaries in the bookstore.</p><ul><li>Can the student distinguish an input, a variable, a constant, a parameter, and an argument?</li><li>Can they trace an accumulator and explain if/elif/else, and, or, and a validation loop?</li><li>Does their code handle zero quantities and reject invalid input?</li><li>Can they explain the calculation order and test exactly at a threshold?</li><li>Can they modify or reuse a function without breaking the original behavior?</li></ul><p className="cap-small">Working module alignment uses the saved course outline: foundations; variables/input; strings; decisions; repetition; functions. Confirm section-specific Canvas titles if they differ. These examples use no lists, dictionaries, classes, or file handling.</p><a className="text-button" href="https://docs.python.org/3/tutorial/controlflow.html" target="_blank" rel="noreferrer">Python reference: decisions, loops, and functions ↗</a></details>
      </>}
    </section>
  </div>;
}
