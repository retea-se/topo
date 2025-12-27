# Suggested Commands

## Docker Services
```powershell
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Rebuild specific service
docker compose up -d --build <service-name>

# Stop all services
docker compose down
```

## Testing
```powershell
# Run Playwright tests (Demo A)
npx playwright test

# Run specific test file
npx playwright test tests/qa_demo_a.spec.js

# Run with UI
npx playwright test --ui
```

## QA Scripts
```powershell
# Run preset export QA
node scripts/qa_preset_export.js

# Check mbtiles metadata
python scripts/check_mbtiles_metadata.py
```

## Data Preparation (prep-service)
```powershell
# Download and process DEM
python prep-service/scripts/download_copernicus_dem.py

# Generate hillshade
python prep-service/src/generate_hillshade.py

# Extract contours
python prep-service/src/extract_contours.py

# Clip OSM data
python prep-service/src/clip_osm.py
```

## Git Commands
```powershell
# Status
git status

# Log
git log --oneline -10

# Diff
git diff
```

## Windows-Specific (PowerShell)
```powershell
# List directory
Get-ChildItem -Name

# Find files
Get-ChildItem -Recurse -Filter "*.py"

# View file content
Get-Content <file>
```

## Access Points
- Demo A Web: http://localhost:3000
- Demo A Editor: http://localhost:3000/editor
- Demo B Web: http://localhost:3001
- Demo B API: http://localhost:5000
