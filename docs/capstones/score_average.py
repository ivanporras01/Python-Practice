total = 0.0
# Use None until the first score arrives so the maximum starts with actual input.
highest = None

# Read exactly five scores. Keep a running sum so there is no need to store each score.
for count in range(5):
    score = float(input())
    total += score
    # The first score sets the maximum. Later scores replace it only if they are larger.
    if highest is None or score > highest:
        highest = score

# Divide the sum by five. The format :.2f displays two decimal places.
print(f"Average: {total / 5:.2f}")
print(f"Highest: {highest:.2f}")
