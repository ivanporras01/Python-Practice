import math

boxes = int(input())
capacity = int(input())
minutes_per_load = int(input())

loads = math.ceil(boxes / capacity)
print(f"Loads: {loads}")
print(f"Estimated minutes: {loads * minutes_per_load}")
