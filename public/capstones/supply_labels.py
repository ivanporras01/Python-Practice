labels = []
for number in range(1, 4):
    name = input().strip().title()
    price = float(input())
    labels.append(f"{number:02d} | {name} | ${price:.2f}")

for label in labels:
    print(label)
