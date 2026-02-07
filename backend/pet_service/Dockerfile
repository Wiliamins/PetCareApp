FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*


COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY *.py .

EXPOSE 8012

CMD ["python", "app.py"]
#CMD ["gunicorn", "--bind", "0.0.0.0:8012", "--workers", "2", "app:app"]
