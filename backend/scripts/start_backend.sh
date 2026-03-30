#!/usr/bin/env bash
set -e

echo "Starting Enrollix backend..."

# Lancer les migrations
echo "Running database migrations..."
poetry run alembic upgrade head

echo "Initialisation de la base de données..."
poetry run python -c "from app.initial_data import init_db; init_db()"

# 4. Démarrer l'API FastAPI
echo "Launching FastAPI..."
poetry run uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --reload
