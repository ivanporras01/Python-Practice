row_count = int(input())
seat_count = int(input())
row_labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

for row in range(row_count):
    seats = ""
    for seat in range(1, seat_count + 1):
        seats += f" {row_labels[row]}{seat}"
    print(seats.strip())
