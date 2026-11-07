FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 APEX_HOST=0.0.0.0 APEX_PORT=10000 APEX_COOKIE_SECURE=true APEX_DATA_DIR=/var/data
WORKDIR /app
COPY requirements.txt ./
RUN python -m pip install --no-cache-dir --upgrade pip && python -m pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p /var/data/uploads/announcement /var/data/backups
EXPOSE 10000
CMD ["python", "server.py"]
