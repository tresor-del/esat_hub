# Backend API

## Folder Architecture

- **`app/api/v1/`**: API routes organized by domain (auth, social, realtime, admin).
- **`app/models/`**: SQLAlchemy table definitions (PostgreSQL).
- **`app/db/schemas/`**: Pydantic models for validation and serialization (DTO).
- **`app/services/`**: Business logic and database interactions.
- **`app/tasks/`**: Asynchronous tasks (BackgroundTasks) for emails and notifications.
- **`app/core/`**: Central configuration (JWT, security, logging, rate limiting).
- **`alembic/`**: Migration scripts for database evolution.
- **`tests/`**: Comprehensive suite of unit and integration tests.

## Database
Migrations are managed using **Alembic**.
- **Apply migrations**: `poetry run alembic upgrade head`
- **Create a migration**: `poetry run alembic revision --autogenerate -m "title"`

## Realtime & WebSocket
Chat and real-time notification management is centralized in `app/api/v1/realtime/`, utilizing a connection manager (`ws_manager.py`) located in the services directory.

## Tests
Run the test suite with **Pytest**:
```bash
poetry run pytest
```
