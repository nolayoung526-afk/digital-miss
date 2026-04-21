# ---------- Build Stage ----------
FROM python:3.11-slim AS build
WORKDIR /build

RUN pip install --no-cache-dir uv
COPY pyproject.toml .
RUN uv pip install --system --no-cache .

# ---------- Runtime ----------
FROM python:3.11-slim
LABEL maintainer="digital-teacher@wandou.com"
LABEL org.opencontainers.image.title="strategy-engine"

WORKDIR /app
COPY --from=build /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=build /usr/local/bin /usr/local/bin
COPY app ./app
COPY rules ./rules

RUN useradd -m app
USER app

EXPOSE 8083

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8083/health').status==200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8083", "--workers", "2"]
