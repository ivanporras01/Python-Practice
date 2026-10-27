# MOVIE TICKET KIOSK | Introduction to Python | Professor Porras
# Classroom simulation: prices are cents; rates are whole percentages.
# Input order: customer, adult qty, child qty, senior qty, matinee yes/no.
# Example input: Alex / 2 / 1 / 0 / yes (one value per line).

ADULT_PRICE = 1200
CHILD_PRICE = 800
SENIOR_PRICE = 900
TAX_PERCENT = 7
MATINEE_DISCOUNT_PERCENT = 20
BOOKING_FEE = 150

def money(cents):
    return f"${cents / 100:.2f}"

def percent_of(cents, percent):
    # Nearest cent, with half cents rounded up for nonnegative amounts.
    return (cents * percent + 50) // 100

def line_total(price, quantity):
    return price * quantity

def read_whole(label, minimum, maximum):
    while True:
        text = input().strip()
        if text.isascii() and text.isdigit():
            value = int(text)
            if minimum <= value <= maximum:
                return value
        print(f"Invalid {label}. Next input must be {minimum} to {maximum}.")

customer = input().strip()
if customer == "":
    customer = "Guest"
subtotal = 0
ticket_count = 0
receipt_lines = ""

# MODULE 5: count tickets and accumulate their prices across three categories.
for category in range(1, 4):
    if category == 1:
        name = "Adult"
        price = ADULT_PRICE
    elif category == 2:
        name = "Child"
        price = CHILD_PRICE
    else:
        name = "Senior"
        price = SENIOR_PRICE
    quantity = read_whole(name + " quantity", 0, 99)
    amount = line_total(price, quantity)
    ticket_count = ticket_count + quantity
    subtotal = subtotal + amount
    receipt_lines = receipt_lines + f"{name}: {quantity} x {money(price)} = {money(amount)}\n"

matinee = input().strip().lower()
while matinee != "yes" and matinee != "no":
    print("Matinee status: next input must be yes or no.")
    matinee = input().strip().lower()
if matinee == "yes":
    discount = percent_of(subtotal, MATINEE_DISCOUNT_PERCENT)
else:
    discount = 0
net = subtotal - discount
# Simulation rules: tax applies to discounted tickets. Booking fees are untaxed.
tax = percent_of(net, TAX_PERCENT)
fee = line_total(BOOKING_FEE, ticket_count)
total = net + tax + fee

print("CAMPUS CINEMA | INVOICE")
print(f"Customer: {customer}")
print(receipt_lines, end="")
print(f"Tickets: {ticket_count}")
print(f"Subtotal: {money(subtotal)}")
print(f"Discount: -{money(discount)}")
print(f"After discount: {money(net)}")
print(f"Tax: {money(tax)}")
print(f"Booking fee: {money(fee)}")
print(f"TOTAL: {money(total)}")
