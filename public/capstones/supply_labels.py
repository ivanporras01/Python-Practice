# Start with an empty list so we can store each finished label and print the batch later.
labels = []
# range stops before 4, so the labels are numbered 1, 2, and 3.
for number in range(1, 4):
    # strip() removes spaces at both ends. title() turns "pencils" into "Pencils".
    name = input().strip().title()
    # input() returns text. float() converts it to a number so we can format it as a price.
    price = float(input())
    # In the f-string, 02d displays 1 as 01 and .2f displays 1.5 as 1.50.
    labels.append(f"{number:02d} | {name} | ${price:.2f}")

# Loop through the finished labels in the order append() stored them.
for label in labels:
    print(label)
