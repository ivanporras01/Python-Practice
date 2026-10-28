import assert from 'node:assert/strict';
import { explainPythonError } from '../app/lib/python-error-help.ts';

const cases = [
  ['EOFError: EOF when reading a line', /input\(\)/i],
  ['IndentationError: unexpected indent', /indentation/i],
  ['TabError: inconsistent use of tabs and spaces', /spaces/i],
  ['SyntaxError: invalid syntax', /colon/i],
  ["NameError: name 'total' is not defined", /spelling/i],
  ["TypeError: can only concatenate str", /types/i],
  ["ValueError: invalid literal for int()", /conversions/i],
  ['ZeroDivisionError: division by zero', /zero/i],
  ['IndexError: list index out of range', /index/i],
  ["ModuleNotFoundError: No module named 'pandas'", /browser/i],
  ['Stopped after 10 seconds', /while-loop/i],
  ['UnknownError', /final line/i],
];
for (const [error, expected] of cases) assert.match(explainPythonError(error), expected, error);
console.log('12 student-facing Python error guidance checks passed.');
