# Import the standard-library module that provides the round-up operation.
import math

boxes = int(input())
capacity = int(input())
minutes_per_load = int(input())

# Even a partly filled load takes a trip. ceil() turns 2.5 loads into 3.
loads = math.ceil(boxes / capacity)
print(f"Loads: {loads}")
# Each load takes the same amount of time, so multiply by minutes per load.
print(f"Estimated minutes: {loads * minutes_per_load}")
