FROM python:3.11-slim

LABEL maintainer="digital-teacher@wandou.com"
LABEL org.opencontainers.image.title="digital-teacher-render"

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

COPY app ./app

RUN useradd -m app
USER app

EXPOSE 8084

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8084/health').status==200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8084"]
