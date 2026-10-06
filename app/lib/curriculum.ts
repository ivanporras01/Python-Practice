import data from './curriculum.json';
export const topics = data;
export type Topic = typeof topics[number];
export type Exercise = Topic['exercises'][number];
export const groups = [
 {title:'Python foundations',short:'Foundations',description:'Your first lines of code. Learn the language, one idea at a time.',label:'01'},
 {title:'Working with collections',short:'Collections',description:'Organize, access, and transform groups of values.',label:'02'},
 {title:'Decisions, loops & functions',short:'Control flow',description:'Make decisions, repeat actions, and build reusable programs.',label:'03'},
 {title:'Practical Python',short:'Practical Python',description:'Use modules, handle errors, and work with real information.',label:'04'},
 {title:'Classes & objects',short:'Objects',description:'Bring data and behavior together in your own types.',label:'05'},
 {title:'Working with files',short:'Files',description:'Read, write, and manage files with confidence.',label:'06'},
];
export const totalExercises = topics.reduce((n,t)=>n+t.exercises.length,0);
