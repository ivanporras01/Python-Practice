def reorder_items(inventory, threshold):
    low_stock = []
    for name, quantity in inventory:
        if quantity < threshold:
            low_stock.append(name)
    return low_stock


threshold = int(input())
inventory = []
for name in ["Pencils", "Notebooks", "Folders"]:
    inventory.append((name, int(input())))

low_stock = reorder_items(inventory, threshold)
print(f"Items to reorder: {len(low_stock)}")
for name in low_stock:
    print(name)
