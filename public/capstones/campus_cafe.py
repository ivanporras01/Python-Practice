# CAMPUS CAFE CHECKOUT | Introduction to Python | Professor Porras
# Classroom simulation: prices are cents; percentage rates are whole numbers.
# Input order: customer, burger qty, drink qty, dessert qty, student yes/no, tip %.
# Example input: Alex / 2 / 2 / 1 / yes / 15 (one value per line).

BURGER_PRICE = 850
DRINK_PRICE = 250
DESSERT_PRICE = 400
TAX_PERCENT = 7
STUDENT_DISCOUNT_PERCENT = 10

# MODULE 6: parameters receive arguments; return sends a result to the caller.
def money(cents):
    return f"${cents / 100:.2f}"

def percent_of(cents, percent):
    # Whole-cent, half-up rounding for nonnegative amounts: // is floor division.
    return (cents * percent + 50) // 100

def line_total(price, quantity):
    return price * quantity

def read_whole(label, minimum, maximum):
    # MODULES 3-5: clean text, make a decision, and repeat invalid input.
    while True:
        text = input().strip()
        if text.isascii() and text.isdigit():
            value = int(text)
            if minimum <= value <= maximum:
                return value
        print(f"Invalid {label}. Next input must be {minimum} to {maximum}.")

# MODULES 1-3: follow the algorithm, store values, and format strings.
customer = input().strip()
if customer == "":
    customer = "Guest"
subtotal = 0
receipt_lines = ""

# MODULE 5: range(1, 4) produces 1, 2, 3. Accumulate all three line totals.
for item in range(1, 4):
    # MODULE 4: choose exactly one name and price for this loop iteration.
    if item == 1:
        name = "Burger"
        price = BURGER_PRICE
    elif item == 2:
        name = "Drink"
        price = DRINK_PRICE
    else:
        name = "Dessert"
        price = DESSERT_PRICE
    quantity = read_whole(name + " quantity", 0, 99)
    amount = line_total(price, quantity)
    subtotal = subtotal + amount
    receipt_lines = receipt_lines + f"{name}: {quantity} x {money(price)} = {money(amount)}\n"

student = input().strip().lower()
while student != "yes" and student != "no":
    print("Student status: next input must be yes or no.")
    student = input().strip().lower()
tip_percent = read_whole("tip percent", 0, 100)
if student == "yes":
    discount = percent_of(subtotal, STUDENT_DISCOUNT_PERCENT)
else:
    discount = 0
net = subtotal - discount
# Simulation rules: tax AND tip use the discounted subtotal, not each other.
tax = percent_of(net, TAX_PERCENT)
tip = percent_of(net, tip_percent)
total = net + tax + tip

print("CAMPUS CAFE | INVOICE")
print(f"Customer: {customer}")
print(receipt_lines, end="")
print(f"Subtotal: {money(subtotal)}")
print(f"Discount: -{money(discount)}")
print(f"After discount: {money(net)}")
print(f"Tax: {money(tax)}")
print(f"Tip: {money(tip)}")
print(f"TOTAL: {money(total)}")
