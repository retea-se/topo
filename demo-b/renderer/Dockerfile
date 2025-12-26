FROM python:3.11-bookworm

# Install mapnik and dependencies
RUN apt-get update && apt-get install -y \
    python3-mapnik \
    libmapnik3.1 \
    mapnik-utils \
    fonts-dejavu \
    fonts-liberation \
    postgresql-client \
    libpq-dev \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Create symlink so Python can find mapnik
RUN ln -sf /usr/lib/python3/dist-packages/mapnik /usr/local/lib/python3.11/site-packages/mapnik || true
RUN ln -sf /usr/lib/python3/dist-packages/_mapnik.cpython-311-x86_64-linux-gnu.so /usr/local/lib/python3.11/site-packages/ || true

# Add system packages to Python path
ENV PYTHONPATH="/usr/lib/python3/dist-packages:${PYTHONPATH}"

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ src/

EXPOSE 5001

CMD ["python", "src/server.py"]
