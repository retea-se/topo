FROM ghcr.io/osgeo/gdal:ubuntu-small-3.8.0

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Stockholm

RUN apt-get update && apt-get install -y \
    osm2pgsql \
    postgresql-client \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

COPY import.sh /app/
RUN dos2unix /app/import.sh && chmod +x /app/import.sh

WORKDIR /app

ENTRYPOINT ["/bin/bash", "/app/import.sh"]
