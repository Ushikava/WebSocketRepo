# Ushikava pet-projects repo

FastAPI backend + React/TypeScript frontend monolit architecture.

---

## Local development

### Backend

```bash
cd backend/app
python -m venv venv
venv/Scripts/pip install -r ../requirements.txt 

cp env.template .env

venv/Scripts/alembic upgrade head

venv/Scripts/uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment variables

File: `backend/app/.env`

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:pass@localhost/dbname` | — |
| `SECRET_KEY` | Secret for JWT signing | `mysecretkey` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token lifetime | `180` |

---

## Database migrations (Alembic)

Migrations live in `backend/app/alembic/versions/`.

### Apply pending migrations

```bash
cd backend/app
venv/Scripts/alembic upgrade head
```

### Create a new migration after changing a model

```bash
cd backend/app
venv/Scripts/alembic revision --autogenerate -m "describe the change"
venv/Scripts/alembic upgrade head
```

### Other useful commands

```bash
# check if DB matches models
venv/Scripts/alembic check

# show current revision in DB
venv/Scripts/alembic current

# show migration history
venv/Scripts/alembic history

# roll back one migration
venv/Scripts/alembic downgrade -1
```

---

## Deploy

```bash
/srv/ushikavapetproj/deploy.sh
```

The deploy script builds the Docker image and restarts the container.
After deploying a version with new migrations, SSH in and run:

```bash
cd /app/backend/app
alembic upgrade head
```
