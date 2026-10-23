"""Validate reference invoices, pedagogical examples, input handling, and cent rounding."""
import ast
import contextlib
import io
import json
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
projects = json.loads((ROOT / 'app/lib/capstones.json').read_text())['projects']
checks = 0

def run(project, values=None, replacements=None):
    code = project['code']
    for before, after in (replacements or {}).items():
        assert before in code, before
        code = code.replace(before, after)
    lines = iter(values if values is not None else project['scenarios'][0]['values'])
    out = io.StringIO()
    scope = {'__name__': '__main__'}
    with patch('builtins.input', lambda *args: next(lines)), contextlib.redirect_stdout(out):
        exec(compile(code, project['file'], 'exec'), scope)
    return out.getvalue().strip(), scope

def invoice(project, expected, values=None, replacements=None):
    global checks
    output, scope = run(project, values, replacements)
    for key, value in expected.items():
        assert scope[key] == value, (project['id'], key, scope[key], value)
    checks += 1
    return output, scope

for p in projects:
    assert p['code'] == (ROOT / 'public/capstones' / p['file']).read_text()
    # Keep student examples within the first six modules.
    tree = ast.parse(p['code'])
    assert not any(isinstance(n, (ast.List, ast.Dict, ast.Set, ast.ClassDef, ast.Import, ast.ImportFrom)) for n in ast.walk(tree))
    for s in p['scenarios']:
        assert run(p, s['values'])[0] == s['expected']
        checks += 1
    default = p['scenarios'][0]['values']
    for bad in ['-1','3.5','abc','','100','²','１２']:
        output, scope = run(p, [default[0], bad] + default[1:])
        assert 'Invalid' in output
        assert output.endswith(p['scenarios'][0]['expected'])
        checks += 1
    blank = default.copy(); blank[0] = ''
    assert 'Customer: Guest' in run(p, blank)[0]; checks += 1
    caps = default.copy(); caps[4] = ' YES '
    assert run(p, caps)[0] == p['scenarios'][0]['expected']; checks += 1
    invalid_choice = default[:4]+['maybe']+default[4:]
    assert run(p, invalid_choice)[0].endswith(p['scenarios'][0]['expected']); checks += 1
    _, scope = run(p)
    assert scope['line_total'](850, 3) == 2550
    # Independent exact arithmetic oracle for percentage rounding.
    from decimal import Decimal, ROUND_HALF_UP
    for cents in [0,1,5,50,99,101,2340,2610,7498,29700000]:
        for rate in [0,1,7,10,15,20,99,100]:
            expected = int((Decimal(cents)*Decimal(rate)/100).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
            assert scope['percent_of'](cents, rate) == expected
            checks += 1

cafe, cinema, bookstore = projects
invoice(cafe, dict(subtotal=2600,discount=260,net=2340,tax=164,tip=351,total=2855))
invoice(cafe, dict(total=3185,tax=183,tip=392), replacements={'BURGER_PRICE = 850':'BURGER_PRICE = 1000'})
invoice(cafe, dict(total=3172,discount=0), ['Alex','2','2','1','no','15'])
invoice(cafe, dict(total=439), replacements={'subtotal = subtotal + amount':'subtotal = amount'})
invoice(cafe, dict(total=2972,tip=468), ['Alex','2','2','1','yes','20'])
invoice(cafe, dict(total=0), ['Alex','0','0','0','yes','15'])
invoice(cinema, dict(total=3189,fee=450,ticket_count=3,tax=179))
invoice(cinema, dict(total=3874,fee=450), ['Alex','2','1','0','no'])
invoice(cinema, dict(total=3339,fee=600), replacements={'BOOKING_FEE = 150':'BOOKING_FEE = 200'})
invoice(cinema, dict(total=3682,ticket_count=4), ['Alex','0','0','4','yes'])
invoice(cinema, dict(total=2889), replacements={'fee = line_total(BOOKING_FEE, ticket_count)':'fee = BOOKING_FEE'})
invoice(cinema, dict(total=150), ['Alex','0','0','0','no'], {'fee = line_total(BOOKING_FEE, ticket_count)':'fee = BOOKING_FEE'})
invoice(cinema, dict(total=0), ['Alex','0','0','0','no'])
invoice(bookstore, dict(total=6085,net=5220,tax=365,shipping=500))
invoice(bookstore, dict(total=5585,shipping=0), ['Alex','2','3','1','yes','yes'])
invoice(bookstore, dict(total=5315,discount=500), ['Alex','1','2','1','yes','no'])
invoice(bookstore, dict(total=5636,discount=0), ['Alex','1','1','1','yes','no'])
invoice(bookstore, dict(total=8025,shipping=0), ['Alex','0','0','2','no','no'], {'TEXTBOOK_PRICE = 4000':'TEXTBOOK_PRICE = 3750'})
invoice(bookstore, dict(total=8523,shipping=500), ['Alex','0','0','2','no','no'], {'TEXTBOOK_PRICE = 4000':'TEXTBOOK_PRICE = 3749'})
invoice(bookstore, dict(total=6706,discount=0), ['Alex','2','3','1','no','no'])
invoice(bookstore, dict(total=6085,discount=580), ['Alex','2','3','1','no','no'], {'member == "yes" and subtotal':'member == "yes" or subtotal'})
invoice(bookstore, dict(total=0,shipping=0), ['Alex','0','0','0','yes','no'])
print(f'{checks} capstone checks passed: 3 projects, 13 reference scenarios, challenges, validation, boundaries, and exact cent rounding.')
