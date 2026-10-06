import { getChatGPTUser } from '../../chatgpt-auth';
import { database, classroomConfig } from '../../lib/database';
import { topics } from '../../lib/curriculum';
export const dynamic = 'force-dynamic';
function json(value:unknown, status=200) { return Response.json(value,{status,headers:{'Cache-Control':'no-store'}}); }
function text(value:unknown,limit=100) { return typeof value==='string'?value.trim().slice(0,limit):''; }
async function identity() {
 const user = await getChatGPTUser();
 const config=classroomConfig();
 return {user,config,isInstructor:!!user&&!!config.instructorEmail&&user.email.toLowerCase()===config.instructorEmail};
}
export async function GET(request:Request) {
 try {
  const {user,config,isInstructor}=await identity();
  if(!user) return json({user:null,profile:null,progress:[],isInstructor:false});
  const db=database();
  const profile=await db.prepare('SELECT id,name,role,joined_at,last_seen,current_topic FROM students WHERE id=?').bind(user.userId).first();
  const studentId = new URL(request.url).searchParams.get('student');
  if(studentId) {
   if(!isInstructor) return json({error:'Instructor access is required.'},403);
   const student=await db.prepare('SELECT id,name,email,last_seen,current_topic FROM students WHERE id=? AND role=\'student\'').bind(studentId).first();
   if(!student) return json({error:'Student not found.'},404);
   const progress=await db.prepare('SELECT * FROM progress WHERE student_id=? ORDER BY updated_at DESC').bind(studentId).all();
   const attempts=await db.prepare('SELECT * FROM attempts WHERE student_id=? ORDER BY created_at DESC LIMIT 30').bind(studentId).all();
   return json({student,progress:progress.results,attempts:attempts.results});
  }
  const own=await db.prepare('SELECT exercise_id,topic_id,passed,attempts,code,updated_at FROM progress WHERE student_id=?').bind(user.userId).all();
  const payload:Record<string,unknown>={user:{name:user.fullName||user.email,email:user.email},profile,progress:own.results,isInstructor};
  if(isInstructor) {
   const roster=await db.prepare(`SELECT s.id,s.name,s.email,s.joined_at,s.last_seen,s.current_topic,
    COUNT(p.exercise_id) AS started, COALESCE(SUM(p.passed),0) AS completed,
    COALESCE(SUM(p.attempts),0) AS attempts,
    COALESCE(SUM(CASE WHEN p.passed=0 AND p.attempts>=3 THEN 1 ELSE 0 END),0) AS needs_help
    FROM students s LEFT JOIN progress p ON s.id=p.student_id WHERE s.role='student'
    GROUP BY s.id ORDER BY s.last_seen DESC`).all();
   const activity=await db.prepare(`SELECT a.id,a.topic_id,a.exercise_id,a.passed,a.created_at,s.name FROM attempts a
    JOIN students s ON a.student_id=s.id WHERE s.role='student' ORDER BY a.created_at DESC LIMIT 12`).all();
   const byTopic=await db.prepare(`SELECT p.topic_id,COUNT(*) AS started,SUM(p.passed) AS completed FROM progress p
    JOIN students s ON s.id=p.student_id WHERE s.role='student' GROUP BY p.topic_id`).all();
   payload.roster=roster.results;payload.activity=activity.results;payload.byTopic=byTopic.results;payload.joinCode=config.joinCode;
  }
  return json(payload);
 } catch(error) {console.error('Classroom read failed',error);return json({error:'We could not load saved progress. Please try again.'},503);}
}
export async function POST(request:Request) {
 try {
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin) return json({error:'This request is not allowed.'},403);
  const {user,config,isInstructor}=await identity();
  if(!user) return json({error:'Sign in with ChatGPT to save your class progress.'},401);
  if(Number(request.headers.get('content-length')||0)>70000) return json({error:'This submission is too large.'},413);
  let body:any; try {body=await request.json();}catch{return json({error:'Please send a valid request.'},400);}
  const db=database(),now=Date.now();
  if(body.action==='join') {
   const name=text(body.name,80);
   if(name.length<2) return json({error:'Enter your first and last name.'},400);
   if(!isInstructor&&(!config.joinCode||text(body.code,50).toUpperCase()!==config.joinCode.toUpperCase())) return json({error:'That class code does not match. Check the code with Professor Porras.'},403);
   await db.prepare(`INSERT INTO students(id,name,email,role,joined_at,last_seen) VALUES(?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name,last_seen=excluded.last_seen`).bind(user.userId,name,user.email,isInstructor?'instructor':'student',now,now).run();
   return json({ok:true});
  }
  let profile=await db.prepare('SELECT id FROM students WHERE id=?').bind(user.userId).first();
  if(!profile&&isInstructor) {
   await db.prepare(`INSERT INTO students(id,name,email,role,joined_at,last_seen) VALUES(?,?,?,'instructor',?,?) ON CONFLICT(id) DO NOTHING`).bind(user.userId,'Professor Porras',user.email,now,now).run();
   profile={id:user.userId};
  }
  if(!profile) return json({error:'Join the class before saving your practice.'},403);
  const topic=topics.find(t=>t.id===body.topicId);
  if(body.action==='presence') {
   if(!topic) return json({error:'Choose a valid topic.'},400);
   await db.prepare('UPDATE students SET last_seen=?,current_topic=? WHERE id=?').bind(now,topic.id,user.userId).run();
   return json({ok:true});
  }
  if(body.action==='attempt') {
   const exercise=topic?.exercises.find(e=>e.id===body.exerciseId);
   if(!topic||!exercise) return json({error:'Choose a valid exercise.'},400);
   const id=text(body.id,80),code=typeof body.code==='string'?body.code:'',output=typeof body.output==='string'?body.output:'';
   if(!/^[a-zA-Z0-9-]{16,80}$/.test(id)||code.length>20000||output.length>20000) return json({error:'The submission is invalid or too large.'},400);
   const previous=await db.prepare('SELECT student_id FROM attempts WHERE id=?').bind(id).first<{student_id:string}>();
   if(previous) return previous.student_id===user.userId?json({ok:true}):json({error:'Invalid submission ID.'},409);
   const error=text(body.error,4000),passed=!error&&body.checkPassed===true&&output.replace(/\r/g,'').trim()===exercise.expected.trim()?1:0;
   await db.batch([
    db.prepare('INSERT INTO attempts(id,student_id,exercise_id,topic_id,code,output,error,passed,created_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(id,user.userId,exercise.id,topic.id,code,output,error||null,passed,now),
    db.prepare(`INSERT INTO progress(student_id,exercise_id,topic_id,passed,attempts,code,updated_at) VALUES(?,?,?,?,1,?,?)
      ON CONFLICT(student_id,exercise_id) DO UPDATE SET passed=MAX(progress.passed,excluded.passed),
      attempts=(SELECT COUNT(*) FROM attempts WHERE student_id=? AND exercise_id=?),code=excluded.code,updated_at=excluded.updated_at`).bind(user.userId,exercise.id,topic.id,passed,code,now,user.userId,exercise.id),
    db.prepare('UPDATE students SET last_seen=?,current_topic=? WHERE id=?').bind(now,topic.id,user.userId)
   ]);
   return json({ok:true,passed:!!passed});
  }
  return json({error:'Unknown classroom action.'},400);
 } catch(error) {console.error('Classroom write failed',error);return json({error:'Your work could not be saved. Keep this page open and try saving again.'},503);}
}
