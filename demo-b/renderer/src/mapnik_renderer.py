"""Mapnik renderer implementation."""
import mapnik
import tempfile
import os
from pathlib import Path
from renderer_interface import RendererInterface
from theme_to_mapnik import theme_to_mapnik_xml

class MapnikRenderer(RendererInterface):
    """Mapnik-based renderer."""

    def __init__(self):
        # Register default fonts path
        mapnik.register_fonts('/usr/share/fonts/truetype/dejavu')

    def render(self, theme: dict, bbox_3857: tuple, output_size: tuple, dpi: int, format: str = 'png', preset: str = 'stockholm_core', layers: dict = None, coverage: dict = None) -> bytes:
        """Render map using Mapnik.

        Args:
            theme: Theme JSON dictionary
            bbox_3857: (min_x, min_y, max_x, max_y) in EPSG:3857
            output_size: (width_px, height_px)
            dpi: Output DPI
            format: 'png' or 'pdf'
            preset: Bbox preset name (used for hillshade file path)
            layers: Layer visibility dict (e.g. {'hillshade': True, 'water': False, ...})

        Returns:
            Rendered image bytes
        """
        # Default: all layers visible
        if layers is None:
            layers = {
                'hillshade': True,
                'water': True,
                'parks': True,
                'roads': True,
                'buildings': True,
                'contours': True
            }
        width, height = output_size
        min_x, min_y, max_x, max_y = bbox_3857

        # Create Mapnik map
        map_obj = mapnik.Map(width, height)
        map_obj.srs = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over'
        map_obj.background = mapnik.Color(theme.get('background', '#faf8f5'))

        # Generate Mapnik XML from theme
        xml_str = theme_to_mapnik_xml(theme, bbox_3857, output_size, dpi, preset, layers, coverage)

        # Write XML to temporary file for Mapnik to load
        with tempfile.NamedTemporaryFile(mode='w', suffix='.xml', delete=False) as f:
            f.write(xml_str)
            xml_file = f.name

        try:
            # Load style from XML
            mapnik.load_map(map_obj, xml_file)

            # Set bounding box
            bbox = mapnik.Box2d(min_x, min_y, max_x, max_y)
            map_obj.zoom_to_box(bbox)

            # Render to image
            if format == 'png':
                im = mapnik.Image(width, height)
                mapnik.render(map_obj, im)
                return im.tostring('png')
            elif format == 'pdf':
                # Mapnik PDF rendering
                return mapnik.render_to_string(map_obj, format='pdf')
            else:
                raise ValueError(f"Unsupported format: {format}")
        finally:
            # Clean up temporary XML file
            if os.path.exists(xml_file):
                os.unlink(xml_file)

