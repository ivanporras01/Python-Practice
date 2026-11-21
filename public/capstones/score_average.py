total = 0.0
highest = None

for count in range(5):
    score = float(input())
    total += score
    if highest is None or score > highest:
        highest = score

print(f"Average: {total / 5:.2f}")
print(f"Highest: {highest:.2f}")
