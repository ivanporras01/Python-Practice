import type {Exercise} from './curriculum';

type Result={output:string;error:string;checkPassed:boolean;checkError?:string};

export function guidedFeedback(code:string,result:Result,exercise:Exercise){
 const error=result.error||result.checkError||'';
 const lines=code.split('\n');
 const first=lines.find(line=>line.trim()&&!line.trim().startsWith('#'))||'';
 if (/^\s*(If|Else|Elif|For|While|Print)\b/m.test(code)) return {title:'Python is case sensitive',tip:'Keywords such as if, else, for, and print must use lowercase letters. Find the capitalized keyword and try again.',step:'Change only that keyword, then run your code again.'};
 if (/IndentationError|expected an indented block|unexpected indent/i.test(error)) return {title:'Check indentation',tip:'A line inside if, for, while, or a function needs consistent indentation. Start with four spaces.',step:'Look at the line named in the error, adjust its indentation, and run again.'};
 if (/SyntaxError|invalid syntax|expected ':'/i.test(error)) return {title:'Check the structure',tip:/expected ':'/i.test(error)?'A line that starts a block needs a colon at its end.':'Check parentheses, quotation marks, and the colon at the end of a block header.',step:'Fix one symbol, then run again to see whether the error changes.'};
 if (/NameError|is not defined/i.test(error)) return {title:'Check the name',tip:'Python treats spelling and uppercase letters as different names. Compare the variable or function with where you defined it.',step:'Correct the name on the reported line, then run again.'};
 if (/TypeError|ValueError/i.test(error)) return {title:'Check the data type',tip:'Look at whether each value is text or a number. Convert input text before doing arithmetic when needed.',step:'Inspect the values involved in the reported line and try a small example.'};
 if (error) return {title:'Use the error as a clue',tip:'Read the final line of the Python error first. It names the problem; the line number tells you where to look.',step:'Change one thing at a time, then run again.'};
 if (!result.checkPassed) return {title:'A required step is missing',tip:`Revisit the task: ${exercise.prompt} Use the hint if you need a smaller first step.`,step:'Compare your code with each requirement, then try again.'};
 if (result.output.trim()!==exercise.expected.trim()) return {title:'Compare the output',tip:'Your program ran, but its output differs from the target. Check spelling, capitalization, spaces, and the order of printed lines.',step:'Compare the console and expected output one line at a time.'};
 return {title:'Nice work',tip:'You solved this exercise. Explain in your own words why the code works.',step:'Try the next exercise or revisit a topic you want to strengthen.'};
}
