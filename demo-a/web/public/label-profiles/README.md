# Label Profiles Demo

Detta är en fristående demo för att testa label-profiler (kontrollerade label- och POI-profiler).

## Vad är detta?

Label-profiler låter dig kontrollera vilka labels (gatunamn, platsnamn, POI) som visas på kartan. Tre profiler finns:

1. **Off** (default): Inga labels visas
2. **Minimal Streets**: Visar endast högre vägklasser (primary, secondary, tertiary) med diskret typografi
3. **Landmarks**: Visar POI/områdesnamn (park, vatten, platser) men inte gatunamn

## Hur jag kör demot

### Förutsättningar

- Docker Compose måste köra (för tileserver och web-server)
- Demo A web-server måste vara tillgänglig på port 3000

### Steg

1. **Starta systemet** (om det inte redan körs):
   ```bash
   docker compose up -d
   ```

2. **Öppna demo-HTML i browsern**:
   - Om web-servern körs: `http://localhost:3000/label-profiles/test-label-profiles.html`
   - Eller öppna filen direkt i browsern (men då behöver du tileserver tillgänglig)

3. **Testa profiler**:
   - Använd dropdown-menyn "Label Profile" för att växla mellan profiler
   - Observera skillnaden i labels på kartan

## Teknisk information

### Filer

- `labelProfiles.js`: Modul som innehåller logik för att applicera profiler
- `test-label-profiles.html`: Demo-HTML för visuell testning
- `README.md`: Denna fil

### Integration

Label-profiler integreras i:
- `demo-a/web/src/themeToStyle.js`: Lägger till label-layers i MapLibre style
- `demo-a/web/public/label-profiles/labelProfiles.js`: Modul för att applicera profiler

### Label-layers

Följande label-layers skapas i style:
- `transportation-name`: Gatunamn (från `transportation_name` source-layer)
- `place-name`: Platsnamn (från `place` source-layer)
- `poi-name`: POI-namn (från `poi` source-layer)
- `water-name`: Vattennamn (från `water_name` source-layer)
- `park-name`: Parknamn (från `park` source-layer med `name`-fält)

### Profil-beteende

- **Off**: Alla label-layers sätts till `visibility: 'none'`
- **Minimal**: Endast `transportation-name` visas med diskret styling (liten text, låg kontrast, subtil halo)
- **Landmarks**: `transportation-name` döljs, övriga label-layers visas

## Kända begränsningar

- Label-layers kräver att OSM-vektortiles innehåller rätt source-layers (`transportation_name`, `place`, `poi`, `water_name`, `park`)
- Om source-layers saknas i tiles kommer inga labels att visas
- Profilen appliceras efter att style är laddad; vid style-reload måste profilen appliceras igen

## Nästa steg

- Integrera label-profil-selector i Print Editor sidebar
- Lägg till profil i export-presets
- Utöka med fler profiler om behov finns

