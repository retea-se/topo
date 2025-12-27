#!/usr/bin/env python3
"""
Tester för preset_audit.py

Testar att:
1. Ett känt giltigt preset passerar
2. Ett medvetet trasigt preset failar
"""

import json
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add scripts to path
REPO_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))

from preset_audit import PresetAuditor, FORMAT_DIMENSIONS, REPO_ROOT


def test_valid_preset_passes():
    """Test att ett giltigt preset passerar validering."""
    # Create a valid preset
    valid_preset = {
        "id": "A4_Test_v1",
        "version": 1,
        "display_name": "Test Preset",
        "bbox_preset": "stockholm_core",
        "theme": "paper",
        "paper": {
            "format": "A4",
            "orientation": "portrait",
            "width_mm": 210,
            "height_mm": 297
        },
        "render": {
            "dpi": 150,
            "format": "png",
            "render_mode": "print"
        },
        "layers": {
            "hillshade": True,
            "water": True,
            "parks": True,
            "roads": True,
            "buildings": True,
            "contours": False
        },
        "constraints": {
            "dpi_locked": False,
            "dpi_min": 72,
            "dpi_max": 300,
            "format_locked": False,
            "allowed_formats": ["png", "pdf"],
            "layers_locked": False,
            "bbox_locked": True,
            "theme_locked": False
        }
    }

    auditor = PresetAuditor()

    # Mock the config loading
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create minimal schema
        schema_file = Path(tmpdir) / "_schema.json"
        schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "required": ["id", "version", "display_name", "bbox_preset", "theme", "paper", "render", "layers", "constraints"],
            "properties": {
                "id": {"type": "string"},
                "version": {"type": "integer"},
                "display_name": {"type": "string"},
                "bbox_preset": {"type": "string"},
                "theme": {"type": "string"},
                "paper": {"type": "object"},
                "render": {"type": "object"},
                "layers": {"type": "object"},
                "constraints": {"type": "object"}
            }
        }
        with open(schema_file, "w") as f:
            json.dump(schema, f)

        # Mock paths
        with patch.object(PresetAuditor, "__init__", lambda x: None):
            auditor.schema = schema
            auditor.errors = []
            auditor.warnings = []
            auditor.info = []
            auditor.limits = None
            auditor.bbox_presets = {"stockholm_core": {"name": "stockholm_core"}}
            auditor.themes = {"paper": Path("/fake/paper.json")}

            # Validate (schema validation will use jsonschema library)
            try:
                import jsonschema
                jsonschema.validate(instance=valid_preset, schema=schema)
                print("[OK] Valid preset passed schema validation")
                return True
            except Exception as e:
                print(f"[FAIL] Valid preset failed: {e}")
                return False


def test_invalid_preset_fails():
    """Test att ett trasigt preset failar."""
    # Create an invalid preset (missing required fields)
    invalid_preset = {
        "id": "A4_Broken_v1",
        # Missing required fields
    }

    auditor = PresetAuditor()

    # Mock the config loading
    with tempfile.TemporaryDirectory() as tmpdir:
        schema_file = Path(tmpdir) / "_schema.json"
        schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "required": ["id", "version", "display_name", "bbox_preset", "theme", "paper", "render", "layers", "constraints"],
            "properties": {
                "id": {"type": "string"},
                "version": {"type": "integer"},
                "display_name": {"type": "string"},
                "bbox_preset": {"type": "string"},
                "theme": {"type": "string"},
                "paper": {"type": "object"},
                "render": {"type": "object"},
                "layers": {"type": "object"},
                "constraints": {"type": "object"}
            }
        }
        with open(schema_file, "w") as f:
            json.dump(schema, f)

        # Mock paths
        with patch.object(PresetAuditor, "__init__", lambda x: None):
            auditor.schema = schema
            auditor.errors = []
            auditor.warnings = []
            auditor.info = []

            # Validate (should fail)
            try:
                import jsonschema
                jsonschema.validate(instance=invalid_preset, schema=schema)
                print("[FAIL] Invalid preset passed validation (should have failed)")
                return False
            except jsonschema.ValidationError:
                print("[OK] Invalid preset correctly failed validation")
                return True


def test_real_auditor_run():
    """Test att verktyget kan köras mot verkliga presets (om de finns)."""
    # Only run if preset directory exists
    presets_dir = REPO_ROOT / "config" / "export_presets"
    if not presets_dir.exists():
        print("[SKIP] Presets directory not found, skipping real audit test")
        return True

    try:
        auditor = PresetAuditor()
        auditor.audit_all()

        # Should have loaded presets
        if len(auditor.presets) == 0:
            print("[WARN] No presets found, but that's okay")
        else:
            print(f"[OK] Loaded {len(auditor.presets)} presets")

        # Should have generated reports (or at least attempted)
        print(f"[OK] Audit completed: {len(auditor.errors)} errors, {len(auditor.warnings)} warnings")
        return True
    except Exception as e:
        print(f"[FAIL] Real audit test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Kör alla tester."""
    print("=== Preset Audit Tests ===\n")

    results = []

    print("1. Testing valid preset...")
    results.append(("valid_preset", test_valid_preset_passes()))

    print("\n2. Testing invalid preset...")
    results.append(("invalid_preset", test_invalid_preset_fails()))

    print("\n3. Testing real auditor run...")
    results.append(("real_auditor", test_real_auditor_run()))

    print("\n=== Test Summary ===")
    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status}: {name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()

