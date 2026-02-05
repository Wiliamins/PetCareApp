FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY *.py .

<<<<<<< HEAD
EXPOSE 8012

CMD ["gunicorn", "--bind", "0.0.0.0:8012", "--workers", "2", "app:app"]
=======
EXPOSE 8003

CMD ["gunicorn", "--bind", "0.0.0.0:8003", "--workers", "2", "app:app"]
>>>>>>> 93048a3e (New code parts)
