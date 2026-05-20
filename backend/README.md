# ESAT-HUB Backend

API backend for the ESAT-HUB application, built with FastAPI and SQLModel.

## Overview
This backend exposes REST endpoints for authentication, social interactions, chat, notifications, administration, and room management.

## Prerequisites
- Python 3.11
- Poetry
- PostgreSQL (or Docker Compose with the included `docker-compose.yml`)
- `.env` file configured from `backend/.env.example`

## Installation
```bash
cd backend
poetry install
```

## Database setup
Start the database before launching the backend:
```bash
docker compose up -d db
```
Then apply migrations:
```bash
cd backend
poetry run alembic upgrade head
```

## Run the backend
Use the provided startup script:
```bash
cd backend
./scripts/start_backend.sh
```

Or run directly with Uvicorn:
```bash
cd backend
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Project structure
- `app/api/v1/`: API routes organized by domain (auth, social, realtime, admin, common)
- `app/models/`: SQLModel models and database table definitions
- `app/db/schemas/`: Pydantic schemas for request validation and response serialization
- `app/services/`: Business logic and data access layers
- `app/tasks/`: Background tasks for emails and notifications
- `app/core/`: Configuration, Firebase initialization, logging, and rate limiting
- `alembic/`: Database migrations
- `tests/`: Backend tests

## Realtime
Real-time chat and notification transport use WebSockets and the connection manager under `app/services/realtime/ws_manager.py`.

## Tests
```bash
cd backend
poetry run pytest
```
