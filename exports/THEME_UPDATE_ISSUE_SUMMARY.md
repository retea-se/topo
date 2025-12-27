# Theme Update Issue - Sammanfattning

**Datum**: 2025-12-27 16:45 CET
**Problem**: När export preset är "None (Custom)" och användaren ändrar "Style" → "Theme" uppdateras varken kartan eller preview i realtid.

## Observerat beteende

### Console Logs
```
[updateMapStyle] Called, map: true currentTheme: true
[updateMapStyle] Starting style change
[updateMapStyle] Calling map.setStyle()
[updateMapStyle] Style object keys: version,sources,layers,metadata
[updateMapStyle] Current map style loaded: true
[updateMapStyle] style.load event did not fire within 2s, manually updating
[updateMapStyle] Performing style update
```

**Kritiskt**: `map.setStyle()` anropas, men `style.load` eventet triggas INTE. Timeout-fallbacken triggas efter 2 sekunder.

## Root Cause

MapLibre GL JS triggar inte `style.load` eventet när `map.setStyle()` anropas. Detta kan bero på:

1. **MapLibre optimering**: MapLibre kan optimera bort style-uppdateringar om den bedömer att style-objektet är för likt den nuvarande stylen
2. **Event timing**: `style.load` eventet kan triggas innan listenern registreras
3. **Style-objekt identitet**: Om style-objektet är identiskt med den nuvarande stylen, kan MapLibre hoppa över uppdateringen

## Implementerade Fixar

### Fix 1: Förbättrad felhantering
- Kontrollerar om `loadTheme()` lyckas
- Visar felmeddelande om theme inte kan laddas

### Fix 2: Timeout-fallback
- Om `style.load` eventet inte triggas inom 2 sekunder, manuellt trigga uppdateringen
- Detta säkerställer att kartan uppdateras även om MapLibre inte triggar eventet

### Fix 3: Förbättrad event-hantering
- Använder `map.on()` istället för `map.once()` för att säkerställa att eventet kan triggas
- Tar bort gamla listeners innan nya registreras

### Fix 4: Unik metadata
- Lägger till unik timestamp i style-objektet för att tvinga MapLibre att se det som ett nytt style-objekt

### Fix 5: triggerRepaint()
- Anropar `map.triggerRepaint()` i timeout-fallbacken för att tvinga kartan att uppdatera

## Problem kvarstår

Trots alla fixar kvarstår problemet. Detta tyder på att:
- MapLibre faktiskt inte uppdaterar kartan visuellt när `setStyle()` anropas
- Timeout-fallbacken triggas, men kartan uppdateras inte visuellt

## Möjliga lösningar

### Lösning 1: Uppdatera layer-färger direkt
Istället för att byta hela style, uppdatera layer-färger direkt med `map.setPaintProperty()`:
```javascript
// Uppdatera background
map.setPaintProperty('background', 'background-color', currentTheme.background);

// Uppdatera water
map.setPaintProperty('water-fill', 'fill-color', currentTheme.water.fill);
map.setPaintProperty('water-stroke', 'line-color', currentTheme.water.stroke);

// Uppdatera parks
map.setPaintProperty('parks-fill', 'fill-color', currentTheme.parks.fill);
map.setPaintProperty('parks-stroke', 'line-color', currentTheme.parks.stroke);

// etc...
```

### Lösning 2: Tvinga style-uppdatering
Tvinga MapLibre att uppdatera genom att:
1. Ta bort kartan temporärt
2. Skapa en ny karta
3. Ladda style på nytt

### Lösning 3: Använd data-driven styling
Använd data-driven styling för att dynamiskt uppdatera färger utan att byta hela style.

## Rekommendation

**Rekommenderad lösning**: Lösning 1 - Uppdatera layer-färger direkt med `map.setPaintProperty()`. Detta är:
- Snabbare (ingen full style-reload)
- Mer pålitligt (fungerar alltid)
- Bättre prestanda (ingen kart-reload)

## Nästa steg

1. Implementera lösning 1 (uppdatera layer-färger direkt)
2. Testa i Chrome
3. Verifiera att både kartan och preview uppdateras korrekt

