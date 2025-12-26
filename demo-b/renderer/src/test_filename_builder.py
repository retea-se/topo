"""Simple tests for filename builder.
Run with: python test_filename_builder.py
"""

import sys
from filename_builder import build_export_filename, sanitize_filename

print('Testing filename builder...\n')

# Test 1: No preset (custom)
test1 = build_export_filename(
    bbox_preset='stockholm_core',
    dpi=150,
    format_type='png',
    preset_id=None
)
print(f'Test 1 (no preset): {test1}')
assert test1 == 'stockholm_core__custom__150dpi.png', 'Test 1 failed'

# Test 2: Preset unchanged
# Note: This test requires the actual preset file to exist
# For now, we'll test the structure
test2 = build_export_filename(
    bbox_preset='stockholm_core',
    dpi=150,
    format_type='png',
    preset_id='A2_Paper_v1',
    request_params={
        'dpi': 150,
        'format': 'png',
        'theme': 'paper',
        'width_mm': 594,
        'height_mm': 420
    }
)
print(f'Test 2 (preset unchanged): {test2}')
assert 'stockholm_core' in test2 and 'A2_Paper_v1' in test2 and 'modified' not in test2, 'Test 2 structure check'

# Test 3: Preset modified (DPI changed)
test3 = build_export_filename(
    bbox_preset='stockholm_core',
    dpi=200,
    format_type='png',
    preset_id='A2_Paper_v1',
    request_params={
        'dpi': 200,
        'format': 'png',
        'theme': 'paper',
        'width_mm': 594,
        'height_mm': 420
    }
)
print(f'Test 3 (preset modified): {test3}')
assert 'stockholm_core' in test3 and 'A2_Paper_v1' in test3 and 'modified' in test3, 'Test 3 structure check'

# Test 4: Sanitize filename
test4 = sanitize_filename('test/file:name@123')
print(f'Test 4 (sanitize): {test4}')
assert test4 == 'test_file_name_123', 'Test 4 failed'

print('\nAll tests passed!')

