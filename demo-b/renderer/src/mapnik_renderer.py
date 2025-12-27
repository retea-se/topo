"""Mapnik renderer implementation."""
import mapnik
import tempfile
import os
import io
from pathlib import Path
from PIL import Image
from renderer_interface import RendererInterface
from theme_to_mapnik import theme_to_mapnik_xml
from effects import apply_effect_pipeline

class MapnikRenderer(RendererInterface):
    """Mapnik-based renderer."""

    def __init__(self):
        # Register default fonts path
        mapnik.register_fonts('/usr/share/fonts/truetype/dejavu')

    def render(self, theme: dict, bbox_3857: tuple, output_size: tuple, dpi: int, format: str = 'png', preset: str = 'stockholm_core', layers: dict = None, coverage: dict = None, preset_id: str = None) -> bytes:
        """Render map using Mapnik.

        Args:
            theme: Theme JSON dictionary
            bbox_3857: (min_x, min_y, max_x, max_y) in EPSG:3857
            output_size: (width_px, height_px)
            dpi: Output DPI
            format: 'png' or 'pdf'
            preset: Bbox preset name (used for hillshade file path)
            layers: Layer visibility dict (e.g. {'hillshade': True, 'water': False, ...})
            preset_id: Preset identifier for deterministic effect seeding

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

                # Apply post-render effects if configured
                effects_config = theme.get('effects')
                if effects_config:
                    # Convert Mapnik image to PIL for effect processing
                    png_bytes = im.tostring('png')
                    pil_image = Image.open(io.BytesIO(png_bytes))

                    # Apply effect pipeline with deterministic seed
                    seed = preset_id or preset or 'default'
                    pil_image = apply_effect_pipeline(pil_image, effects_config, seed)

                    # Convert back to PNG bytes
                    output_buffer = io.BytesIO()
                    pil_image.save(output_buffer, format='PNG')
                    return output_buffer.getvalue()

                return im.tostring('png')
            elif format == 'pdf':
                # Mapnik PDF rendering via Cairo
                with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as pdf_file:
                    pdf_path = pdf_file.name

                try:
                    # Use cairo surface for PDF
                    import cairo
                    surface = cairo.PDFSurface(pdf_path, width, height)
                    mapnik.render(map_obj, surface)
                    surface.finish()

                    with open(pdf_path, 'rb') as f:
                        return f.read()
                finally:
                    if os.path.exists(pdf_path):
                        os.unlink(pdf_path)
            elif format == 'svg':
                # Mapnik SVG rendering via Cairo
                with tempfile.NamedTemporaryFile(suffix='.svg', delete=False) as svg_file:
                    svg_path = svg_file.name

                try:
                    import cairo
                    surface = cairo.SVGSurface(svg_path, width, height)
                    mapnik.render(map_obj, surface)
                    surface.finish()

                    with open(svg_path, 'rb') as f:
                        return f.read()
                finally:
                    if os.path.exists(svg_path):
                        os.unlink(svg_path)
            else:
                raise ValueError(f"Unsupported format: {format}. Supported: png, pdf, svg")
        finally:
            # Clean up temporary XML file
            if os.path.exists(xml_file):
                os.unlink(xml_file)

