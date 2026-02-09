# PetCareApp - Dockerfile dla mikroserwisów Python
# @author VS

FROM python:3.11-slim

WORKDIR /app

# Instalacja zależności systemowych - VS
RUN apt-get update && apt-get install -y \
    gcc \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y curl

# Kopiowanie requirements - VS
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiowanie kodu aplikacji - VS
COPY . .

# Ekspozycja portu (nadpisywana w docker-compose) - VS
EXPOSE 8013

# Uruchomienie aplikacji - VS
CMD ["python", "app.py"]
