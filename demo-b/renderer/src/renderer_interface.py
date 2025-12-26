"""Renderer interface abstraction."""
from abc import ABC, abstractmethod

class RendererInterface(ABC):
    """Abstract base class for renderers."""

    @abstractmethod
    def render(self, theme: dict, bbox_3857: tuple, output_size: tuple, dpi: int, format: str = 'png', preset: str = 'stockholm_core') -> bytes:
        """Render map and return PNG/PDF bytes.

        Args:
            theme: Theme JSON dictionary
            bbox_3857: (min_x, min_y, max_x, max_y) in EPSG:3857
            output_size: (width_px, height_px)
            dpi: Output DPI
            format: 'png' or 'pdf'
            preset: Bbox preset name (used for data file paths)

        Returns:
            Rendered image bytes
        """
        pass




