with open("expenses.txt", "w", encoding="utf-8") as expense_file:
    for entry in range(3):
        expense = float(input())
        expense_file.write(f"{expense:.2f}\n")

total = 0.0
with open("expenses.txt", encoding="utf-8") as expense_file:
    for line in expense_file:
        total += float(line)

print(f"Total expenses: ${total:.2f}")
