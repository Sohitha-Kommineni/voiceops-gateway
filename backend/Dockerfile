FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY app ./app
COPY migrations ./migrations
COPY alembic.ini ./alembic.ini
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e ".[test]"

EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
