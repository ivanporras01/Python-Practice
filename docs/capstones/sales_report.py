"""Classroom demo: weekly and quarterly sales using Python lists."""


def weekly_sales():
    """Store seven daily sales amounts and display the weekly total."""
    days = ["Monday", "Tuesday", "Wednesday", "Thursday",
            "Friday", "Saturday", "Sunday"]
    # Make one slot per day. The loop uses the day index to fill the matching slot.
    sales = [0.0] * len(days)

    print("Part 1: Weekly store sales")
    for day in range(len(days)):
        sales[day] = float(input())

    # Start the accumulator at zero and add each stored amount once.
    weekly_total = 0.0
    for amount in sales:
        weekly_total += amount

    print(f"Weekly total: ${weekly_total:,.2f}")


def quarterly_sales():
    """Store and display four quarters of sales for each department."""
    departments = ["X", "Y", "Z"]
    quarter_count = 4

    # Each row is its own list, so updating one row leaves the others intact.
    sales = [
        [0.0] * quarter_count,
        [0.0] * quarter_count,
        [0.0] * quarter_count,
    ]

    print("\nPart 2: XYZ Company quarterly sales")
    # The outer loop selects a department. The inner loop visits its four quarters.
    for row in range(len(departments)):
        for column in range(quarter_count):
            # Indexes start at zero. For example, sales[1][2] stores Department Y, Q3.
            sales[row][column] = float(input())

    # Once all inputs are stored, read the same cells to build the report.
    print("\nDepartment | Q1 | Q2 | Q3 | Q4")
    for row in range(len(departments)):
        report_line = f"Dept {departments[row]}"
        for column in range(quarter_count):
            report_line += f" | ${sales[row][column]:,.2f}"
        # Print only after the inner loop has added all four quarters.
        print(report_line)


if __name__ == "__main__":
    weekly_sales()
    quarterly_sales()
