/** Friendly first steps for beginner debugging; never guess a student's solution. */
export function explainPythonError(error: string): string {
  const message = error.toLowerCase();
  if (message.includes('eoferror') || message.includes('eof when reading') || message.includes('input ran out')) {
    return 'Your program asked for more input. Add one value per input() call. If validation repeats a question, add an extra line for that answer.';
  }
  if (message.includes('indentationerror') || message.includes('taberror')) {
    return 'Check the indentation on the line shown. Statements inside if, for, while, and def need consistent spaces, usually four per level.';
  }
  if (message.includes('syntaxerror')) {
    return 'Check the indicated line and the one before it for a missing colon, closing parenthesis, quotation mark, or misspelled Python keyword.';
  }
  if (message.includes('nameerror') || message.includes('unboundlocalerror')) {
    return 'A name was used before Python knew its value. Check spelling, capitalization, and whether the variable was assigned before this line.';
  }
  if (message.includes('typeerror')) {
    return 'Two values may have incompatible types. Check whether input() returned a string that needs conversion with int() or float().';
  }
  if (message.includes('valueerror')) {
    return 'A value could not be converted or accepted. Check the program input and the conversions or validation rules near the error line.';
  }
  if (message.includes('zerodivisionerror')) {
    return 'A calculation divided by zero. Find the divisor and make sure your program handles zero before dividing.';
  }
  if (message.includes('indexerror') || message.includes('keyerror')) {
    return 'The requested position or key was not found. Check the available values and the index or key used on the error line.';
  }
  if (message.includes('modulenotfounderror') || message.includes('importerror')) {
    return 'This library may not be available in the browser runner. Try the built-in Python tools used in this course.';
  }
  if (message.includes('stopped after') || message.includes('timed out') || message.includes('time limit')) {
    return 'Your program took too long. Check while-loop conditions and make sure every input() call has a matching line of input.';
  }
  return 'Read the final line of the error and find the line number in your code. Compare it with the example, make one small change, and run again.';
}
