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
- Containerization: Docker Compose for the full local stack

## Quick start
### 1. Configure the environment
```bash
cp .env.example .env
```

### 2. Start the application
```bash
docker compose up --build
```

The frontend is available at <http://localhost:3000>, the API at <http://localhost:8000>, and the local email inbox at <http://localhost:8025>. PostgreSQL migrations run automatically when the backend starts. Database files persist in the `db_data` Docker volume, and uploaded files persist in `uploads_data`.

Firebase push notifications remain disabled unless `FIREBASE_CREDENTIALS_PATH` points to a mounted service-account file. To stop the stack, press `Ctrl+C`; use `docker compose down` to remove its containers while keeping persistent data.

## Repository layout
- `backend/`: FastAPI application and backend services
- `frontend/`: React UI application
- `docker-compose.yml`: Local application stack and dependent services
- `scripts/`: Utility scripts to start services

## Useful commands
- `docker compose up --build` – Build and launch the full stack
- `docker compose down` – Stop and remove containers (persistent volumes are kept)
- `docker compose logs -f backend` – Follow backend logs
- `cd backend && poetry run pytest` – Run backend tests
- `cd frontend && npm run build` – Build frontend for production


