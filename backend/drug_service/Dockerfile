FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir \
    flask \
    flask-cors \
    requests \
    boto3

# Copy app
COPY app.py .

EXPOSE 8010

CMD ["python", "app.py"]
