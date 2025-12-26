FROM ghcr.io/osgeo/gdal:ubuntu-small-3.8.0

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-requests \
    osmium-tool \
    openjdk-21-jdk \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip3 install --no-cache-dir -r /app/requirements.txt

# Install Planetiler (for OSM tile generation)
RUN mkdir -p /app/bin && \
    wget -O /app/bin/planetiler.jar https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar && \
    chmod +x /app/bin/planetiler.jar

# Install Tippecanoe (for contour tile generation)
RUN apt-get update && apt-get install -y \
    build-essential \
    libsqlite3-dev \
    zlib1g-dev \
    git \
    && git clone https://github.com/felt/tippecanoe.git /tmp/tippecanoe \
    && cd /tmp/tippecanoe && make -j$(nproc) && make install \
    && rm -rf /tmp/tippecanoe \
    && apt-get remove -y build-essential git \
    && apt-get autoremove -y

# Copy application code
COPY src/ /app/src/
COPY scripts/ /app/scripts/
COPY config/ /app/config/

# Make scripts executable
RUN chmod +x /app/scripts/*.sh

WORKDIR /app

ENTRYPOINT ["python3"]
