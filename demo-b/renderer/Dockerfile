# Demo B Renderer - Mapnik-based deterministic rendering
#
# v1.1 Operational Hardening - Pinned for reproducibility
#
# WARNING: Changes to this file may affect rendering output!
# Always run golden baseline regression tests after modifications.
# See: docs/V1_1_OPERATIONAL_HARDENING.md

FROM python:3.11.7-bookworm

# Install mapnik and dependencies with specific versions where possible
# Note: Debian Bookworm provides mapnik 3.1.0, GDAL 3.6.2, pycairo 1.20.1
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-mapnik \
    python3-cairo \
    libmapnik3.1 \
    mapnik-utils \
    fonts-dejavu \
    fonts-liberation \
    postgresql-client \
    libpq-dev \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Create symlinks so Python can find mapnik and cairo
RUN ln -sf /usr/lib/python3/dist-packages/mapnik /usr/local/lib/python3.11/site-packages/mapnik || true
RUN ln -sf /usr/lib/python3/dist-packages/_mapnik.cpython-311-x86_64-linux-gnu.so /usr/local/lib/python3.11/site-packages/ || true
RUN ln -sf /usr/lib/python3/dist-packages/cairo /usr/local/lib/python3.11/site-packages/cairo || true

# Add system packages to Python path
ENV PYTHONPATH="/usr/lib/python3/dist-packages:${PYTHONPATH}"

# Reproducibility: Set deterministic locale
ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8

# Reproducibility: Disable Python bytecode caching
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ src/

EXPOSE 5001

# Labels for traceability
LABEL org.opencontainers.image.title="Demo B Renderer"
LABEL org.opencontainers.image.description="Mapnik-based deterministic map renderer"
LABEL org.opencontainers.image.version="1.1.0"

CMD ["python", "src/server.py"]
