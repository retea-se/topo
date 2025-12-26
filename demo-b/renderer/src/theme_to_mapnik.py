"""Convert theme JSON to Mapnik XML style."""
import json
from typing import Dict, Any


def theme_to_mapnik_xml(theme: Dict[str, Any], bbox_3857: tuple, output_size: tuple, dpi: int) -> str:
    """Generate Mapnik XML from theme JSON.

    Args:
        theme: Theme JSON dictionary
        bbox_3857: (min_x, min_y, max_x, max_y) in EPSG:3857
        output_size: (width_px, height_px)
        dpi: Output DPI

    Returns:
        Mapnik XML string
    """
    width, height = output_size
    min_x, min_y, max_x, max_y = bbox_3857

    # Build layers XML
    layers_xml = []

    # Note: Background is handled by map background-color attribute, no layer needed

    # Hillshade layer (raster)
    hillshade_opacity = theme.get('hillshade', {}).get('opacity', 0.15)
    layers_xml.append(f"""    <Layer name="hillshade" srs="EPSG:3857" opacity="{hillshade_opacity}">
      <StyleName>hillshade</StyleName>
      <Datasource>
        <Parameter name="type">gdal</Parameter>
        <Parameter name="file">/data/terrain/hillshade/stockholm_core_hillshade.tif</Parameter>
      </Datasource>
    </Layer>""")

    # Water layer
    water_fill = theme.get('water', {}).get('fill', '#d4e4f0')
    water_stroke = theme.get('water', {}).get('stroke', '#a8c5d8')
    layers_xml.append(f"""    <Layer name="water" srs="EPSG:3857">
      <StyleName>water</StyleName>
      <Datasource>
        <Parameter name="type">postgis</Parameter>
        <Parameter name="host">demo-b-db</Parameter>
        <Parameter name="port">5432</Parameter>
        <Parameter name="dbname">gis</Parameter>
        <Parameter name="user">postgres</Parameter>
        <Parameter name="table">(SELECT way FROM planet_osm_polygon WHERE "natural"='water' OR waterway IS NOT NULL) AS water</Parameter>
      </Datasource>
    </Layer>""")

    # Parks layer
    parks_fill = theme.get('parks', {}).get('fill', '#e8f0e0')
    layers_xml.append(f"""    <Layer name="parks" srs="EPSG:3857">
      <StyleName>parks</StyleName>
      <Datasource>
        <Parameter name="type">postgis</Parameter>
        <Parameter name="host">demo-b-db</Parameter>
        <Parameter name="port">5432</Parameter>
        <Parameter name="dbname">gis</Parameter>
        <Parameter name="user">postgres</Parameter>
        <Parameter name="table">(SELECT way FROM planet_osm_polygon WHERE landuse IN ('park', 'recreation_ground', 'forest')) AS parks</Parameter>
      </Datasource>
    </Layer>""")

    # Roads layer (minor first, then major)
    roads_stroke = theme.get('roads', {}).get('stroke', '#8a8a8a')
    roads_stroke_width = theme.get('roads', {}).get('strokeWidth', {})
    if isinstance(roads_stroke_width, dict):
        minor_width = roads_stroke_width.get('minor', 0.8)
        major_width = roads_stroke_width.get('major', 1.5)
    else:
        minor_width = roads_stroke_width * 0.6
        major_width = roads_stroke_width

    layers_xml.append(f"""    <Layer name="roads-minor" srs="EPSG:3857">
      <StyleName>roads-minor</StyleName>
      <Datasource>
        <Parameter name="type">postgis</Parameter>
        <Parameter name="host">demo-b-db</Parameter>
        <Parameter name="port">5432</Parameter>
        <Parameter name="dbname">gis</Parameter>
        <Parameter name="user">postgres</Parameter>
        <Parameter name="table">(SELECT way FROM planet_osm_line WHERE highway IN ('residential', 'service', 'unclassified')) AS roads</Parameter>
      </Datasource>
    </Layer>""")

    layers_xml.append(f"""    <Layer name="roads-major" srs="EPSG:3857">
      <StyleName>roads-major</StyleName>
      <Datasource>
        <Parameter name="type">postgis</Parameter>
        <Parameter name="host">demo-b-db</Parameter>
        <Parameter name="port">5432</Parameter>
        <Parameter name="dbname">gis</Parameter>
        <Parameter name="user">postgres</Parameter>
        <Parameter name="table">(SELECT way FROM planet_osm_line WHERE highway IN ('primary', 'secondary', 'tertiary', 'trunk', 'motorway')) AS roads</Parameter>
      </Datasource>
    </Layer>""")

    # Buildings layer
    buildings_fill = theme.get('buildings', {}).get('fill', '#d0d0d0')
    buildings_stroke = theme.get('buildings', {}).get('stroke', '#909090')
    layers_xml.append(f"""    <Layer name="buildings" srs="EPSG:3857">
      <StyleName>buildings</StyleName>
      <Datasource>
        <Parameter name="type">postgis</Parameter>
        <Parameter name="host">demo-b-db</Parameter>
        <Parameter name="port">5432</Parameter>
        <Parameter name="dbname">gis</Parameter>
        <Parameter name="user">postgres</Parameter>
        <Parameter name="table">(SELECT way FROM planet_osm_polygon WHERE building IS NOT NULL) AS buildings</Parameter>
      </Datasource>
    </Layer>""")

    # Contours layer - NO LABELS (critical constraint)
    contours_stroke = theme.get('contours', {}).get('stroke', '#b0b0b0')
    contours_width = theme.get('contours', {}).get('strokeWidth', {})
    if isinstance(contours_width, dict):
        minor_width_contour = contours_width.get('minor', 0.4)
        major_width_contour = contours_width.get('major', 0.8)
    else:
        minor_width_contour = contours_width * 0.5
        major_width_contour = contours_width

    # Contours are stored in PostGIS or as GeoJSON files
    # For now, assume they're in PostGIS
    layers_xml.append(f"""    <Layer name="contours" srs="EPSG:3857">
      <StyleName>contours</StyleName>
      <Datasource>
        <Parameter name="type">postgis</Parameter>
        <Parameter name="host">demo-b-db</Parameter>
        <Parameter name="port">5432</Parameter>
        <Parameter name="dbname">gis</Parameter>
        <Parameter name="user">postgres</Parameter>
        <Parameter name="table">(SELECT way FROM planet_osm_line WHERE "natural"='contour') AS contours</Parameter>
      </Datasource>
    </Layer>""")

    # Build styles XML
    styles_xml = []

    # Background color is set in map background-color attribute, no style needed
    bg_color = theme.get('background', '#faf8f5')

    # Hillshade style (raster layer)
    styles_xml.append(f"""    <Style name="hillshade">
      <Rule>
        <RasterSymbolizer opacity="{hillshade_opacity}" />
      </Rule>
    </Style>""")

    # Water style
    water_stroke_width = theme.get('water', {}).get('strokeWidth', 0.5)
    styles_xml.append(f"""    <Style name="water">
      <Rule>
        <PolygonSymbolizer fill="{water_fill}" />
        <LineSymbolizer stroke="{water_stroke}" stroke-width="{water_stroke_width}" stroke-linejoin="round" />
      </Rule>
    </Style>""")

    # Parks style
    parks_stroke = theme.get('parks', {}).get('stroke', '#c8d8b8')
    parks_stroke_width = theme.get('parks', {}).get('strokeWidth', 0.3)
    styles_xml.append(f"""    <Style name="parks">
      <Rule>
        <PolygonSymbolizer fill="{parks_fill}" />
        <LineSymbolizer stroke="{parks_stroke}" stroke-width="{parks_stroke_width}" stroke-linejoin="round" />
      </Rule>
    </Style>""")

    # Roads styles
    styles_xml.append(f"""    <Style name="roads-minor">
      <Rule>
        <LineSymbolizer stroke="{roads_stroke}" stroke-width="{minor_width}" stroke-linejoin="round" stroke-linecap="round" />
      </Rule>
    </Style>""")

    styles_xml.append(f"""    <Style name="roads-major">
      <Rule>
        <LineSymbolizer stroke="{roads_stroke}" stroke-width="{major_width}" stroke-linejoin="round" stroke-linecap="round" />
      </Rule>
    </Style>""")

    # Buildings style
    buildings_stroke_width = theme.get('buildings', {}).get('strokeWidth', 0.5)
    styles_xml.append(f"""    <Style name="buildings">
      <Rule>
        <PolygonSymbolizer fill="{buildings_fill}" />
        <LineSymbolizer stroke="{buildings_stroke}" stroke-width="{buildings_stroke_width}" />
      </Rule>
    </Style>""")

    # Contours style - NO TextSymbolizer (critical: no labels)
    # Support opacity from theme
    contours_opacity = theme.get('contours', {}).get('opacity', {})
    if isinstance(contours_opacity, dict):
        major_opacity = contours_opacity.get('major', 0.8)
        minor_opacity = contours_opacity.get('minor', 0.5)
    else:
        major_opacity = 0.8
        minor_opacity = 0.5

    # Blend opacity with stroke color for visual hierarchy
    styles_xml.append(f"""    <Style name="contours">
      <Rule>
        <LineSymbolizer stroke="{contours_stroke}" stroke-width="{major_width_contour}" stroke-linejoin="round" stroke-linecap="round" stroke-opacity="{major_opacity}" />
      </Rule>
    </Style>""")

    # Build full XML - Note: Style and Layer elements are direct children of Map (no wrapper elements)
    xml = f"""<?xml version="1.0" encoding="utf-8"?>
<Map srs="+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over" background-color="{bg_color}" minimum-version="3.0.0">
  <Parameters>
    <Parameter name="bbox">!bbox!</Parameter>
  </Parameters>

{chr(10).join(styles_xml)}

{chr(10).join(layers_xml)}
</Map>"""

    return xml


def load_theme(theme_path: str) -> Dict[str, Any]:
    """Load theme from JSON file."""
    with open(theme_path, 'r') as f:
        return json.load(f)


