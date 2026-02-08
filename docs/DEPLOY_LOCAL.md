# Deploy Local

## Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e .
cp ../.env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

> Configure `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env` para criar o primeiro usuário admin.
## Frontend
```bash
npm install
npm run build
npx vite --host 0.0.0.0 --port 5173
```

> O Vite faz proxy para `http://localhost:8000` em `/api` e `/uploads`.

> Uploads locais são salvos em `backend/uploads` e servidos em `/uploads/*`.
