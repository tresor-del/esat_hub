# EduHub Backend API

## Architecture des dossiers

- **`app/api/v1/`** : Les routes de l'API organisées par domaine (auth, social, realtime, admin).
- **`app/models/`** : Définitions des tables SQLAlchemy (PostgreSQL).
- **`app/db/schemas/`** : Modèles Pydantic pour la validation et la sérialisation (DTO).
- **`app/services/`** : Logique métier et interaction avec la base de données.
- **`app/tasks/`** : Tâches asynchrones (BackgroundTasks) pour les emails et notifications.
- **`app/core/`** : Configuration centrale (JWT, sécurité, logging, rate limiting).
- **`alembic/`** : Scripts de migration pour l'évolution de la base de données.
- **`tests/`** : Suite complète de tests unitaires et d'intégration.

## Base de données
Les migrations sont gérées avec **Alembic**.
- Appliquer les migrations : `poetry run alembic upgrade head`
- Créer une migration : `poetry run alembic revision --autogenerate -m "titre"`

## Realtime & WebSocket
La gestion du chat et des notifications en temps réel est centralisée dans `app/api/v1/realtime/` avec un gestionnaire de connexion (`ws_manager.py`) situé dans les services.

## Tests
Lancer la suite de tests avec **Pytest** :
```bash
poetry run pytest
```
