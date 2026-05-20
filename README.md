<p align="center">
  <img src="frontend/public/logo_circle.png" alt="Logo EsatHub" width="150" height="auto">
</p>

# ESAT-HUB

ESAT-HUB is a school activity platform that combines social posting, real-time chat, notifications, and administration tools in a unified web application.

## What it includes
- A FastAPI backend with REST endpoints and WebSocket support
- A React frontend built with Vite and Firebase integration
- PostgreSQL database managed with Alembic migrations
- Modular architecture for authentication, social feeds, chat, notifications, and rooms

## Tech Stack
- Backend: FastAPI, SQLModel, Uvicorn, Alembic
- Frontend: React, Vite, React Router, Firebase, PWA support
- Database: PostgreSQL
- Dependency management: Poetry (backend), npm (frontend)
- Containerization: Docker Compose for PostgreSQL

## Quick start
### 1. Start the database
```bash
docker compose up -d db
```

### 2. Backend
```bash
cd backend
poetry install
poetry run alembic upgrade head
./scripts/start_backend.sh
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Repository layout
- `backend/`: FastAPI application and backend services
- `frontend/`: React UI application
- `docker-compose.yml`: Database service configuration
- `scripts/`: Utility scripts to start services

## Notes
The root `docker-compose.yml` currently defines the PostgreSQL database service. Backend and frontend services are present but commented out and can be enabled if needed.

## Useful commands
- `docker compose up -d db` – Launch Postgres
- `cd backend && poetry run pytest` – Run backend tests
- `cd frontend && npm run build` – Build frontend for production


