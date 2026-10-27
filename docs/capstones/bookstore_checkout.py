# CAMPUS BOOKSTORE CHECKOUT | Introduction to Python | Professor Porras
# Classroom simulation: prices and thresholds are cents; rates are percentages.
# Input order: customer, notebook qty, pen qty, textbook qty, member yes/no, pickup yes/no.
# Example input: Alex / 2 / 3 / 1 / yes / no (one value per line).

NOTEBOOK_PRICE = 600
PEN_PRICE = 200
TEXTBOOK_PRICE = 4000
TAX_PERCENT = 7
MEMBER_DISCOUNT_PERCENT = 10
DISCOUNT_MINIMUM = 5000
SHIPPING_FEE = 500
FREE_SHIPPING_MINIMUM = 7500

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

def read_yes_no(label):
    answer = input().strip().lower()
    while answer != "yes" and answer != "no":
        print(f"{label}: next input must be yes or no.")
        answer = input().strip().lower()
    return answer

customer = input().strip()
if customer == "":
    customer = "Guest"
subtotal = 0
item_count = 0
receipt_lines = ""
for item in range(1, 4):
    if item == 1:
        name = "Notebook"
        price = NOTEBOOK_PRICE
    elif item == 2:
        name = "Pen"
        price = PEN_PRICE
    else:
        name = "Textbook"
        price = TEXTBOOK_PRICE
    quantity = read_whole(name + " quantity", 0, 99)
    amount = line_total(price, quantity)
    item_count = item_count + quantity
    subtotal = subtotal + amount
    receipt_lines = receipt_lines + f"{name}: {quantity} x {money(price)} = {money(amount)}\n"

member = read_yes_no("Membership")
pickup = read_yes_no("Pickup")
# Both conditions must be true. Test exactly at DISCOUNT_MINIMUM, too.
if member == "yes" and subtotal >= DISCOUNT_MINIMUM:
    discount = percent_of(subtotal, MEMBER_DISCOUNT_PERCENT)
else:
    discount = 0
net = subtotal - discount
tax = percent_of(net, TAX_PERCENT)
# Simulation rules: shipping is untaxed; empty orders have no shipping charge.
if item_count == 0 or pickup == "yes" or net >= FREE_SHIPPING_MINIMUM:
    shipping = 0
else:
    shipping = SHIPPING_FEE
total = net + tax + shipping

print("CAMPUS BOOKSTORE | INVOICE")
print(f"Customer: {customer}")
print(receipt_lines, end="")
print(f"Subtotal: {money(subtotal)}")
print(f"Discount: -{money(discount)}")
print(f"After discount: {money(net)}")
print(f"Tax: {money(tax)}")
print(f"Shipping: {money(shipping)}")
print(f"TOTAL: {money(total)}")
