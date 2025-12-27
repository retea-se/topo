"""Determinism tests for risograph effect.

Run with: python test_risograph_determinism.py

These tests verify that:
1. Same input + same seed = identical output
2. Different seeds = different output
3. Effect is applied correctly (not identity)
"""

import sys
import numpy as np
from PIL import Image

# Add effects module to path
sys.path.insert(0, 'effects')

from effects.risograph import apply_risograph
from effects.utils import seed_from_string

print('Testing risograph effect determinism...\n')

# Create a test image (gradient pattern for visual variety)
def create_test_image(width=200, height=200):
    """Create a test image with gradient pattern."""
    img = Image.new('RGBA', (width, height), (255, 255, 255, 255))
    pixels = img.load()

    for y in range(height):
        for x in range(width):
            # Create a gradient pattern
            r = int(255 * x / width)
            g = int(255 * y / height)
            b = int(255 * (1 - x / width))
            pixels[x, y] = (r, g, b, 255)

    return img

# Test configuration
riso_config = {
    "enabled": True,
    "channels": [
        { "color": "#e84855", "offset": { "x": 2, "y": 1 } },
        { "color": "#2d9cdb", "offset": { "x": -1, "y": 2 } }
    ],
    "grain": {
        "opacity": 0.06
    },
    "blendMode": "multiply"
}


# Test 1: Same seed produces identical output
print('Test 1: Same seed produces identical output')
img1 = create_test_image()
img2 = create_test_image()

result1 = apply_risograph(img1, riso_config, seed="test_preset_123")
result2 = apply_risograph(img2, riso_config, seed="test_preset_123")

arr1 = np.array(result1)
arr2 = np.array(result2)

if np.array_equal(arr1, arr2):
    print('  PASS: Identical output for same seed')
else:
    diff_count = np.sum(arr1 != arr2)
    print(f'  FAIL: Output differs! {diff_count} pixels different')
    sys.exit(1)


# Test 2: Different seeds produce different output
print('Test 2: Different seeds produce different output')
img3 = create_test_image()
img4 = create_test_image()

result3 = apply_risograph(img3, riso_config, seed="seed_A")
result4 = apply_risograph(img4, riso_config, seed="seed_B")

arr3 = np.array(result3)
arr4 = np.array(result4)

if not np.array_equal(arr3, arr4):
    print('  PASS: Different output for different seeds')
else:
    print('  FAIL: Output is identical for different seeds (should differ due to grain)')
    sys.exit(1)


# Test 3: Effect actually modifies the image
print('Test 3: Effect modifies the image (not identity)')
img5 = create_test_image()
original = np.array(img5.copy())
result5 = apply_risograph(img5, riso_config, seed="test")
modified = np.array(result5)

if not np.array_equal(original, modified):
    diff_pixels = np.sum(original != modified) // 4  # Divide by 4 for RGBA
    print(f'  PASS: Image modified ({diff_pixels} pixels changed)')
else:
    print('  FAIL: Image not modified (effect not applied)')
    sys.exit(1)


# Test 4: Disabled effect returns unmodified image
print('Test 4: Disabled effect returns unmodified image')
disabled_config = {"enabled": False}
img6 = create_test_image()
original6 = np.array(img6.copy())
result6 = apply_risograph(img6, disabled_config, seed="test")
arr6 = np.array(result6)

if np.array_equal(original6, arr6):
    print('  PASS: Disabled effect returns unmodified image')
else:
    print('  FAIL: Disabled effect modified the image')
    sys.exit(1)


# Test 5: Multiple runs with same seed are deterministic
print('Test 5: Multiple runs with same seed are deterministic')
seed = "determinism_test_12345"
results = []
for i in range(5):
    img = create_test_image()
    result = apply_risograph(img, riso_config, seed=seed)
    results.append(np.array(result))

all_identical = all(np.array_equal(results[0], r) for r in results[1:])
if all_identical:
    print('  PASS: 5 runs with same seed produced identical output')
else:
    print('  FAIL: Multiple runs produced different output')
    sys.exit(1)


# Test 6: Seed string hashing is deterministic
print('Test 6: Seed string hashing is deterministic')
seed_str = "my_preset_id_v1"
hash1 = seed_from_string(seed_str)
hash2 = seed_from_string(seed_str)
hash3 = seed_from_string(seed_str)

if hash1 == hash2 == hash3:
    print(f'  PASS: Consistent hash for "{seed_str}" = {hash1}')
else:
    print(f'  FAIL: Inconsistent hashes: {hash1}, {hash2}, {hash3}')
    sys.exit(1)


print('\n' + '='*50)
print('All determinism tests passed!')
print('='*50)
