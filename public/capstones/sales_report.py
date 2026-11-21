"""Classroom demo: weekly and quarterly sales using Python lists."""


def weekly_sales():
    """Store seven daily sales amounts and display the weekly total."""
    days = ["Monday", "Tuesday", "Wednesday", "Thursday",
            "Friday", "Saturday", "Sunday"]
    sales = [0.0] * len(days)

    print("Part 1: Weekly store sales")
    for day in range(len(days)):
        sales[day] = float(input())

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
    for row in range(len(departments)):
        for column in range(quarter_count):
            sales[row][column] = float(input())

    print("\nDepartment | Q1 | Q2 | Q3 | Q4")
    for row in range(len(departments)):
        report_line = f"Dept {departments[row]}"
        for column in range(quarter_count):
            report_line += f" | ${sales[row][column]:,.2f}"
        print(report_line)


if __name__ == "__main__":
    weekly_sales()
    quarterly_sales()
