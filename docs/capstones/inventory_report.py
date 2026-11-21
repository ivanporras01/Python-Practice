def reorder_items(inventory, threshold):
    low_stock = []
    # Unpack each (name, quantity) pair so the comparison uses the stock count.
    for name, quantity in inventory:
        # Only quantities below the threshold qualify. An equal quantity stays off the list.
        if quantity < threshold:
            low_stock.append(name)
    # Return the names so the caller can count and display them.
    return low_stock


threshold = int(input())
inventory = []
# Read one quantity per item and keep each name with its matching count.
for name in ["Pencils", "Notebooks", "Folders"]:
    inventory.append((name, int(input())))

low_stock = reorder_items(inventory, threshold)
# Use the length of the filtered list as the count, then display its names.
print(f"Items to reorder: {len(low_stock)}")
for name in low_stock:
    print(name)
