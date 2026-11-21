row_count = int(input())
seat_count = int(input())
row_labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

# The outer loop chooses the row letter. Index 0 selects A.
for row in range(row_count):
    # Start a new string for each row so seats from the previous row do not repeat.
    seats = ""
    # Start numbering at 1. range excludes its stop value, so add 1 to include the last seat.
    for seat in range(1, seat_count + 1):
        seats += f" {row_labels[row]}{seat}"
    # Print one completed row. strip() removes the leading space added by the first seat.
    print(seats.strip())
