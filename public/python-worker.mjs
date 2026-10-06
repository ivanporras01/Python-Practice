// Python executes in a dedicated worker. Its lifetime is limited by the editor.
const BASE='https://cdn.jsdelivr.net/pyodide/v314.0.7/full/';
let runtime;
self.onmessage=async ({data})=>{
 let globals;
 try {
  self.postMessage({type:'loading'});
  if(!runtime){const {loadPyodide}=await import(BASE+'pyodide.mjs');runtime=await loadPyodide({indexURL:BASE});}
  self.postMessage({type:'running'});
  let stdout='',stderr='',lines=data.inputs.split('\n'),lineIndex=0;
  runtime.setStdout({batched:(line)=>{if(stdout.length<20000)stdout+=line+'\n';}});
  runtime.setStderr({batched:(line)=>{if(stderr.length<4000)stderr+=line+'\n';}});
  runtime.setStdin({stdin:()=>lineIndex<lines.length?lines[lineIndex++]:null});
  globals=runtime.toPy({__name__:'__main__',__student_code__:data.code});
  // Each run gets an isolated working directory so file exercises are reproducible.
  const dir='/tmp/run_'+Date.now();runtime.FS.mkdir(dir);runtime.FS.chdir(dir);
  try {await runtime.runPythonAsync(data.code,{globals});}
  catch(err){self.postMessage({type:'result',output:stdout.trimEnd(),error:String(err.message||err).slice(-4000),checkPassed:false});return;}
  let checkPassed=true,checkError='';
  if(data.test){try{await runtime.runPythonAsync(data.test,{globals});}catch(err){checkPassed=false;checkError=String(err.message||err).slice(-2500);}}
  self.postMessage({type:'result',output:stdout.trimEnd(),error:stderr.trim(),checkPassed,checkError});
 }catch(err){self.postMessage({type:'fatal',error:'Python could not load. Check your internet connection and allow cdn.jsdelivr.net, then try again. '+String(err.message||err).slice(0,150)});}
 finally{globals?.destroy();}
};
