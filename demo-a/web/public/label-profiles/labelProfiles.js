/**
 * Label Profiles - Kontrollerade label- och POI-profiler
 *
 * Tre profiler:
 * - "off": Inga labels/gatunamn
 * - "minimal": Kuraterat urval av gatunamn (högre vägklasser, diskret typografi)
 * - "landmarks": POI/områdesnamn (park/torg/vatten) men inte alla gator
 */

/**
 * @typedef {'off' | 'minimal' | 'landmarks'} LabelProfile
 */

/**
 * Identifierar label-layers i en MapLibre style
 * @param {maplibregl.Map} map - MapLibre map instance
 * @returns {Object} Object med arrays av layer-ids per kategori
 */
function identifyLabelLayers(map) {
  if (!map || !map.isStyleLoaded()) {
    return {
      streetNames: [],
      placeNames: [],
      poiNames: [],
      waterNames: [],
      parkNames: []
    };
  }

  const style = map.getStyle();
  if (!style || !style.layers) {
    return {
      streetNames: [],
      placeNames: [],
      poiNames: [],
      waterNames: [],
      parkNames: []
    };
  }

  const result = {
    streetNames: [],
    placeNames: [],
    poiNames: [],
    waterNames: [],
    parkNames: []
  };

  style.layers.forEach(layer => {
    // Symbol layers är label-layers
    if (layer.type !== 'symbol') return;

    const sourceLayer = layer['source-layer'];
    const layerId = layer.id;

    // Matcha baserat på layer-id (mer robust än source-layer)
    // Vi använder de exakta layer-ids som skapas i themeToStyle.js
    if (layerId === 'transportation-name') {
      result.streetNames.push(layerId);
    } else if (layerId === 'place-name') {
      result.placeNames.push(layerId);
    } else if (layerId === 'poi-name') {
      result.poiNames.push(layerId);
    } else if (layerId === 'water-name') {
      result.waterNames.push(layerId);
    } else if (layerId === 'park-name') {
      result.parkNames.push(layerId);
    }
    // Fallback: matcha baserat på source-layer om layer-id inte matchar
    else if (sourceLayer === 'transportation_name') {
      result.streetNames.push(layerId);
    } else if (sourceLayer === 'place') {
      result.placeNames.push(layerId);
    } else if (sourceLayer === 'poi') {
      result.poiNames.push(layerId);
    } else if (sourceLayer === 'water_name') {
      result.waterNames.push(layerId);
    } else if (sourceLayer === 'park' && layer.layout && layer.layout['text-field']) {
      result.parkNames.push(layerId);
    }
  });

  return result;
}

/**
 * Applicerar en label-profil på kartan
 * @param {maplibregl.Map} map - MapLibre map instance
 * @param {LabelProfile} profile - Profil att applicera
 */
function applyLabelProfile(map, profile) {
  if (!map || !map.isStyleLoaded()) {
    console.warn('Map not loaded, cannot apply label profile');
    return;
  }

  const labelLayers = identifyLabelLayers(map);

  // Om inga label-layers hittades, försök skapa dem dynamiskt
  if (labelLayers.streetNames.length === 0 &&
      labelLayers.placeNames.length === 0 &&
      labelLayers.poiNames.length === 0 &&
      labelLayers.waterNames.length === 0 &&
      labelLayers.parkNames.length === 0) {
    console.warn('No label layers found. Labels may need to be added to style first.');
    console.warn('Available layers:', map.getStyle().layers.map(l => l.id));
    return;
  }

  // Profil: "off" - dölj alla labels
  if (profile === 'off') {
    const allLabelLayers = [
      ...labelLayers.streetNames,
      ...labelLayers.placeNames,
      ...labelLayers.poiNames,
      ...labelLayers.waterNames,
      ...labelLayers.parkNames
    ];

    allLabelLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });
    return;
  }

  // Profil: "minimal" - visa endast högre vägklasser med diskret typografi
  if (profile === 'minimal') {
    // Dölj place/poi/water/park labels
    [...labelLayers.placeNames, ...labelLayers.poiNames,
     ...labelLayers.waterNames, ...labelLayers.parkNames].forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });

    // Visa street names med diskret styling
    labelLayers.streetNames.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'visible');

        // Diskret typografi: liten text, låg kontrast, subtil halo
        const currentTextSize = map.getLayoutProperty(layerId, 'text-size');
        if (currentTextSize) {
          // Minska text-size om det är en expression eller number
          if (typeof currentTextSize === 'number') {
            map.setLayoutProperty(layerId, 'text-size', Math.max(8, currentTextSize * 0.7));
          }
        } else {
          map.setLayoutProperty(layerId, 'text-size', 10);
        }

        // Låg kontrast: text-color nära line-color men ljusare/mörkare
        const currentColor = map.getPaintProperty(layerId, 'text-color');
        if (!currentColor) {
          // Standard diskret färg (grå, låg kontrast)
          map.setPaintProperty(layerId, 'text-color', '#888888');
        } else if (typeof currentColor === 'string') {
          // Mörka färger: ljusare, ljusa färger: mörkare
          map.setPaintProperty(layerId, 'text-color', adjustColorForContrast(currentColor, 0.3));
        }

        // Subtil halo (om det finns)
        const currentHalo = map.getPaintProperty(layerId, 'text-halo-width');
        if (currentHalo !== undefined) {
          map.setPaintProperty(layerId, 'text-halo-width', Math.max(0.5, (currentHalo || 1) * 0.5));
          map.setPaintProperty(layerId, 'text-halo-color', '#ffffff');
          map.setPaintProperty(layerId, 'text-halo-blur', 1);
        } else {
          map.setPaintProperty(layerId, 'text-halo-width', 0.5);
          map.setPaintProperty(layerId, 'text-halo-color', '#ffffff');
          map.setPaintProperty(layerId, 'text-halo-blur', 1);
        }

        // Öka text-allow-overlap för att undvika kollisioner (visa färre labels)
        map.setLayoutProperty(layerId, 'text-allow-overlap', false);
        map.setLayoutProperty(layerId, 'text-optional', true);
      }
    });
    return;
  }

  // Profil: "landmarks" - visa POI/områdesnamn men inte gatunamn
  if (profile === 'landmarks') {
    // Dölj street names
    labelLayers.streetNames.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });

    // Visa place/poi/water/park labels
    [...labelLayers.placeNames, ...labelLayers.poiNames,
     ...labelLayers.waterNames, ...labelLayers.parkNames].forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'visible');
      }
    });
    return;
  }

  console.warn(`Unknown label profile: ${profile}`);
}

/**
 * Hjälpfunktion för att justera färg för låg kontrast
 * @param {string} color - Hex-färg (t.ex. "#707070")
 * @param {number} factor - Justeringsfaktor (0-1)
 * @returns {string} Justerad hex-färg
 */
function adjustColorForContrast(color, factor) {
  // Enkel implementation: konvertera till RGB, justera, konvertera tillbaka
  if (!color.startsWith('#')) return color;

  const hex = color.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Beräkna ljushet
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Om mörk: gör ljusare, om ljus: gör mörkare
  const adjust = brightness < 128 ? factor * 50 : -factor * 50;

  const newR = Math.max(0, Math.min(255, Math.round(r + adjust)));
  const newG = Math.max(0, Math.min(255, Math.round(g + adjust)));
  const newB = Math.max(0, Math.min(255, Math.round(b + adjust)));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Export för Node.js eller browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    applyLabelProfile,
    identifyLabelLayers,
    adjustColorForContrast
  };
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.LabelProfiles = {
    applyLabelProfile,
    identifyLabelLayers,
    adjustColorForContrast
  };
}

