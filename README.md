# Esat-hub - School Activity Management Platform

A modern web platform designed for students to manage, share, and track school activities, achievements, and collaborative projects throughout the academic year.

## Features
- **Social Feed:** Share achievements and school projects.
- **Real-time Chat:** Instant messaging between students.
- **Room Management:** Keep track of school spaces and activities.
- **AI-Powered Insights:** Smart analysis of student interactions.

## Tech Stack
- **Frontend:** React, TypeScript, Vite
- **Backend:** FastAPI 
- **Database:** PostgreSQL
- **Migrations:** Alembic
- **Dependency Management:** Poetry (Backend), NPM (Frontend)
- **Containerization:** Docker & Docker Compose

## System Requirements
- OS: Linux / macOS (for Windows, need to update the scripts)
- [Poetry](https://python-poetry.org)
- Docker & Docker Compose
- Node.js (v18+)

## Getting Started

### 1. Database & Infrastructure
Start the database services using Docker:
```bash
docker compose up -d
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, and run migrations:
```bash
cd ./backend
poetry install
poetry run alembic upgrade head
./scripts/start_backend.sh
```

### 3. Frontend Setup
Navigate to the frontend directory and start the development server:
```bash
cd ./frontend
npm install
npm run dev
```

## Project Structure
- **/frontend**: React application (UI/UX)
- **/backend**: FastAPI server (Business logic & API)
- **/scripts**: Automation scripts for deployment and development


