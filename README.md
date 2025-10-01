# Puzzle App - Docker Deployment

## Prerequisites
- Docker and Docker Compose installed

## Run with Docker

```bash
docker compose up --build
```

The app will be available at http://localhost:3000/admin and connects to PostgreSQL.

## Environment

The container uses these defaults (override in compose if needed):

- PGHOST=db
- PGPORT=5432
- PGUSER=postgres
- PGPASSWORD=postgres
- PGDATABASE=puzzle_app

## Migrations / Schema

Tables are auto-created on startup by `config/database.js`.

