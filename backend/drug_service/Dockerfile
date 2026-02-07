FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
RUN pip install --no-cache-dir \
    flask \
    flask-cors \
    requests \
    boto3

# Copy app
COPY . .

EXPOSE 8010

CMD ["python", "app.py"]
