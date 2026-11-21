# Write mode starts a fresh file. The with block closes it after the last write.
with open("expenses.txt", "w", encoding="utf-8") as expense_file:
    for entry in range(3):
        expense = float(input())
        # Put one amount on each line so the next loop can read the values separately.
        expense_file.write(f"{expense:.2f}\n")

total = 0.0
# Reopen in read mode after the first block has saved the file.
with open("expenses.txt", encoding="utf-8") as expense_file:
    for line in expense_file:
        # Each file line is text. Convert it back to a number before adding it.
        total += float(line)

print(f"Total expenses: ${total:.2f}")
