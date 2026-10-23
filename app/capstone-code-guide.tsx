import React from 'react';

const moneyParts = [
  ['def money(cents):', 'Defines a function named money. cents is a parameter: a local name for the value supplied when the function is called. The colon starts its body.'],
  ['return', 'Sends the result back to the caller and ends this function call. It does not print anything by itself.'],
  ['f"..."', 'Creates a formatted string. Python evaluates expressions inside braces and inserts their results into the text.'],
  ['$', 'An ordinary character placed at the beginning of the returned string. It is not a Python currency operator.'],
  ['{cents / 100:.2f}', 'The braces contain the expression and its display format. Divide cents by 100 to convert to dollars.'],
  [':.2f', 'The colon introduces a format specification. .2 requests two digits after the decimal point; f requests fixed-point formatting. The display is rounded if needed.'],
];
function meaning(raw:string):string {
 const s=raw.trim();
 if(s.startsWith('#'))return s.slice(1).trim()+' This is a comment for the reader; Python does not execute it.';
 if(s==='def money(cents):')return 'Define a reusable display function. Its indented body runs only when money(...) is called.';
 if(s==='return f"${cents / 100:.2f}"')return 'Convert cents to dollars and return a string with a dollar sign and exactly two decimal places. money(850) returns "$8.50"; the stored price remains 850 cents.';
 if(s==='def percent_of(cents, percent):')return 'Define a helper with two parameters: an amount in cents and a whole-number percentage. Arguments are matched by position.';
 if(s==='return (cents * percent + 50) // 100')return 'Multiply first, add 50, then use floor division by 100. For nonnegative whole-number inputs, this rounds a percentage to the nearest cent, with half cents rounded up. Example: (2340 * 7 + 50) // 100 = 164 cents.';
 if(s==='def line_total(price, quantity):')return 'Define a function that receives a unit price in cents and a quantity.';
 if(s==='return price * quantity')return 'Return the product. A price of 850 cents and quantity of 2 produce 1700 cents. Returning lets the caller use the number in another calculation.';
 if(s==='def read_whole(label, minimum, maximum):')return 'Define input validation. label names the field in an error message; minimum and maximum set the inclusive permitted range.';
 if(s==='while True:')return 'Keep asking until a valid value reaches return. True never becomes false; return exits the function and therefore stops this loop.';
 if(s==='text = input().strip()')return 'Read the next Program input line as text. strip() removes whitespace from both ends. The result is still a string, even if it contains digits.';
 if(s==='if text.isascii() and text.isdigit():')return 'Continue only if both checks are true: all characters are ASCII and the nonempty string contains only digits. This rejects negative signs, decimal points, and letters before conversion.';
 if(s==='value = int(text)')return 'Convert validated digit text to an integer so it can be compared and used in arithmetic. int("2") produces the number 2.';
 if(s==='if minimum <= value <= maximum:')return 'Check that value is at least minimum AND at most maximum. The endpoints are included; a quantity of 0 or 99 is accepted.';
 if(s==='return value')return 'Return the valid integer immediately. Invalid input never reaches this line; the loop instead prints feedback and reads another line.';
 if(s.startsWith('print(f"Invalid'))return 'Explain the allowed range after invalid input. The next loop iteration consumes another Program input line, so include a replacement value in the input box.';
 if(s==='def read_yes_no(label):')return 'Define a reusable yes/no reader. The label argument identifies which answer needs correction.';
 if(s==='return answer')return 'Return the cleaned, validated answer to the caller. It is the string "yes" or "no".';
 if(s==='customer = input().strip()')return 'Read the customer name and remove outer whitespace. Names are text, so no numeric conversion is needed.';
 if(s==='if customer == "":')return 'Compare the name with the empty string. == tests equality; it does not assign a new value.';
 if(s==='customer = "Guest"')return 'Use Guest only when the preceding empty-name condition is true. Its indentation puts it inside that condition.';
 if(s==='subtotal = 0')return 'Initialize the money accumulator at zero cents before the loop. Each purchased category adds its amount to this running subtotal.';
 if(s==='ticket_count = 0'||s==='item_count = 0')return 'Initialize a separate quantity accumulator. It counts units, not cents, and starts before the category loop.';
 if(s==='receipt_lines = ""')return 'Start with an empty string. Each loop iteration appends one formatted receipt line.';
 if(s.startsWith('for '))return 'Run the indented body three times. range(1, 4) supplies 1, 2, and 3; its stop value 4 is excluded. Each iteration handles one category, not one individual unit.';
 if(s.startsWith('if item ==')||s.startsWith('if category =='))return 'If the loop counter equals 1, select the first category. Only one branch of this if/elif/else chain executes in each iteration.';
 if(s.startsWith('elif '))return 'Otherwise, test whether this is category 2. elif means else if; this branch is skipped if the first branch already matched.';
 if(s==='else:')return 'Run this alternative only when none of the preceding conditions in this if/elif chain matched. Follow the indentation to identify its matching if.';
 if(s.startsWith('name ='))return 'Store the selected category name as text. This name is used in validation messages and the receipt.';
 if(s.startsWith('price ='))return 'Copy this category’s configured unit price, in cents, into price for the current iteration.';
 if(s.startsWith('quantity ='))return 'Call read_whole with a descriptive label and limits 0 through 99. Execution pauses inside the helper until it returns a valid integer.';
 if(s==='amount = line_total(price, quantity)')return 'Pass the current price and quantity into line_total. Store its returned price × quantity in amount, measured in cents.';
 if(s==='subtotal = subtotal + amount')return 'Add this category’s amount to the old subtotal, then store the new total. Do not reset subtotal inside the loop.';
 if(s==='ticket_count = ticket_count + quantity'||s==='item_count = item_count + quantity')return 'Add this category’s quantity to the running unit count. Zero quantities add nothing.';
 if(s.startsWith('receipt_lines = receipt_lines +'))return 'Append a receipt line to the existing text. The f-string inserts names and quantities and calls money() for prices. \\n inserts a line break. The x is a printed character; multiplication already happened in line_total.';
 if(s.startsWith('while ')&&s.includes('!= "yes"'))return 'Repeat while the answer is neither yes nor no. Both != comparisons must be true because they are joined with and. Once either accepted answer is entered, the loop ends.';
 if(s.includes('= input().strip().lower()'))return 'Read a line, remove outer whitespace, then convert letters to lowercase. For example, " YES " becomes "yes". Methods run from left to right.';
 if(s.startsWith('print(')&&s.includes('next input must be yes or no'))return 'Print feedback for an invalid yes/no response before asking again. Printing a message does not itself read a new answer.';
 if(s.startsWith('member = read_yes_no')||s.startsWith('pickup = read_yes_no'))return 'Call the shared yes/no helper and store the validated text. The argument supplies the label used in correction messages.';
 if(s.startsWith('tip_percent ='))return 'Read a whole-number tip percentage from 0 to 100. Enter 15 for 15%, not 0.15.';
 if(s==='if student == "yes":')return 'Apply the student discount only when the validated student answer equals yes.';
 if(s==='if matinee == "yes":')return 'Apply the matinee discount only when the validated matinee answer equals yes.';
 if(s.startsWith('if member =='))return 'Both conditions must be true: the customer is a member AND the original subtotal is at least DISCOUNT_MINIMUM (5000 cents = $50). Equality qualifies.';
 if(s.startsWith('discount = percent_of'))return 'Calculate the qualifying percentage of the ORIGINAL subtotal, rounded to a whole cent, and store it in discount.';
 if(s==='discount = 0')return 'Use zero cents when the customer does not qualify. Defining discount in both branches ensures it exists for the next calculation.';
 if(s==='net = subtotal - discount')return 'Subtract the discount from the original subtotal. net is the discounted subtotal in cents and becomes the basis for tax.';
 if(s==='tax = percent_of(net, TAX_PERCENT)')return 'Calculate tax from net, using the configured whole-number tax rate. The percentage helper rounds the result to integer cents.';
 if(s==='tip = percent_of(net, tip_percent)')return 'Calculate the tip from the discounted subtotal, independently of tax. The tip is not calculated on the tax-inclusive total.';
 if(s==='fee = line_total(BOOKING_FEE, ticket_count)')return 'Multiply the per-ticket booking fee by the total number of tickets. Three tickets at 150 cents each add 450 cents. This classroom fee is not taxed.';
 if(s.startsWith('if item_count =='))return 'Charge no shipping if ANY condition is true: the order is empty, pickup is yes, or the discounted subtotal reaches the free-shipping minimum. or requires only one true condition.';
 if(s==='shipping = 0')return 'Set shipping to zero because at least one no-shipping condition was true.';
 if(s==='shipping = SHIPPING_FEE')return 'Charge the configured flat shipping fee when the order has items, is being shipped, and net is below the free-shipping threshold.';
 if(s.startsWith('total ='))return 'Add the displayed components in cents: '+s.slice(8)+'. Each percentage was rounded separately before this addition.';
 if(s==='print(receipt_lines, end="")')return 'Print the accumulated item lines. end="" avoids adding an extra newline because receipt_lines already ends with \\n.';
 if(s.startsWith('print('))return 'Display this invoice line. Text inside quotes is printed literally; expressions inside f-string braces are evaluated. Calls to money(...) format cents as dollars for display only.';
 if(/^[A-Z_]+ = \d+$/.test(s))return 'Set '+s.split(' = ')[0]+' to '+s.split(' = ')[1]+'. Uppercase names mark configurable constants by convention; Python still permits reassignment. Prices, fees, and thresholds are cents; names ending in PERCENT are whole-number rates.';
 throw new Error('Missing explanation: '+s);
}
const traces:Record<string,string[]>={
 cafe:['2 burgers: 2 × 850 = 1700 cents; 2 drinks: 500; 1 dessert: 400. Subtotal = 2600 ($26.00).','Student = yes: 10% discount = 260 cents. net = 2600 − 260 = 2340 ($23.40).','Tax: (2340 × 7 + 50) // 100 = 164 cents. Tip at 15%: 351 cents.','Total = 2340 + 164 + 351 = 2855 cents → $28.55.'],
 cinema:['2 adults: 2400 cents; 1 child: 800; 0 seniors: 0. Subtotal = 3200; ticket_count = 3.','Matinee = yes: 20% discount = 640 cents. net = 2560 ($25.60).','Tax = 179 cents. Booking fee = 150 × 3 = 450 cents; it is added after tax.','Total = 2560 + 179 + 450 = 3189 cents → $31.89.'],
 bookstore:['2 notebooks: 1200 cents; 3 pens: 600; 1 textbook: 4000. Subtotal = 5800; item_count = 6.','Member = yes AND 5800 ≥ 5000: discount = 580 cents. net = 5220 ($52.20).','Tax = 365 cents. Pickup = no, order is not empty, and 5220 < 7500: shipping = 500 cents.','Total = 5220 + 365 + 500 = 6085 cents → $60.85.'],
};
export default function CapstoneCodeGuide({id,code}:{id:string;code:string}) {
 return <section className="card cap-pad cap-code-guide"><p className="eyebrow">CODE EXPLAINED · ALL THREE PROJECTS</p><h3>Understand every instruction</h3><p>This guide follows the original example. Your lab edits do not change these reference explanations. Read a small section, predict its result, then test your idea in the Python lab.</p><details open><summary>How money(cents) works — part by part</summary><div className="cap-guide-scroll"><table><thead><tr><th scope="col">Part</th><th scope="col">Meaning</th></tr></thead><tbody>{moneyParts.map(([part,text])=><tr key={part}><td><code>{part}</code></td><td>{text}</td></tr>)}</tbody></table></div><pre className="cap-snippet"><code>{'money(1250) → "$12.50"\nmoney(5)    → "$0.05"\nprint(money(850))  # displays $8.50'}</code></pre><p><strong>Parameter vs. argument:</strong> cents is the parameter in the definition; 1250 is the argument in money(1250). The return value is text (str), not a number for further money calculations.</p></details><details><summary>Follow the default invoice, step by step</summary><p>Use the original code and the first sample scenario in the lab.</p><ol>{traces[id].map(t=><li key={t}>{t}</li>)}</ol></details><details><summary>Complete code — line by line</summary><p>Line numbers match the original program. Blank lines separate sections. Indentation groups instructions inside functions, loops, and decisions; dedenting leaves that block. Function definitions are registered first, and their bodies execute when called.</p><div className="cap-guide-scroll"><table><thead><tr><th scope="col">Line</th><th scope="col">Code</th><th scope="col">Meaning</th></tr></thead><tbody>{code.split('\n').map((line,i)=>line.trim()?<tr key={i}><td>{i+1}</td><td><pre><code>{line}</code></pre></td><td>{meaning(line)}</td></tr>:null)}</tbody></table></div></details><details><summary>Try a change — predict, then check</summary><p>Start with the original code and default inputs. Change TAX_PERCENT from 7 to 0. Which invoice lines should change?</p><details><summary>Show answer</summary><p>The tax becomes $0.00. Prices, quantities, discount, net, and the tip, booking fee, or shipping stay unchanged. The new total is {id==='cafe'?'$26.91':id==='cinema'?'$30.10':'$57.20'}. Restore the example before trying another experiment.</p></details></details></section>;
}
