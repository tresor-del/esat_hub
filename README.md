# Esat-Hub

A web platform for managing and sharing school activities, achievements, and projects at our school.
Esat Hub helps esat students to keep track of their favourite moments all along the academic year

## Stack:
- Frontend: React, Typescript
- Backend: FastAPI
- Database: PostgreSQL
- Database Migration: Alembic
- Deps Handler: Poetry

## System Requirements:
- OS: Linux
- Poetry
- Docker
- Nodejs

## How to run:

### Server Dependencies installation:
```bash
    cd ./backend
    poetry install
```

### Run the server:
```bash
    ./scripts/start_backend.sh
```

### Run the database:
```bash
    docker compose up
```

### Frontend Dependencies intallation
```bash
    cd ./frontend
    npm install
```

### Run the frontend:
```bash
    npm run dev
```

## Important folders:
- Frontend: [frontend](./frontend)
- Backend: [backend](./backend/README.md)
