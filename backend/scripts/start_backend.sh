#!/usr/bin/env bash
set -e

echo "Starting Enrollix backend..."

# Lancer les migrations
echo "Running database migrations..."
poetry run alembic upgrade head

# Créer les données intiales
echo "Creating initial data..."
poetry run python -m app.initial_data

# 4. Démarrer l'API FastAPI
echo "Launching FastAPI..."
poetry run uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --reload
