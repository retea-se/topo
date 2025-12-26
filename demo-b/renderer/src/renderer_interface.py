"""Renderer interface abstraction."""
from abc import ABC, abstractmethod

class RendererInterface(ABC):
    """Abstract base class for renderers."""

    @abstractmethod
    def render(self, theme: dict, bbox_3857: tuple, output_size: tuple, dpi: int, format: str = 'png') -> bytes:
        """Render map and return PNG/PDF bytes."""
        pass



