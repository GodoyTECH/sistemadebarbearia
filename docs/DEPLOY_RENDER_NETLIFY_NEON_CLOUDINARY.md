# Deploy oficial: Render (FastAPI) + Netlify + Neon + Cloudinary

## Backend (Render)
1. Crie um **Web Service** apontando para este repositório.
2. Root Directory: `backend`
3. Build command:
   ```bash
   pip install -e .
   ```
4. Start command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. Health Check Path: `/healthz`
6. Defina as variáveis em `docs/ENV_VARS_FINAL.md`.
7. Aplique as migrações antes do primeiro tráfego (sem etapa oculta):
   ```bash
   cd backend && alembic upgrade head
   ```

## Frontend (Netlify)
1. Site conectado ao mesmo repositório.
2. Build command: `npm ci && npm run build`
3. Publish directory: `dist/public`
4. Defina `BACKEND_URL` quando usar domínio separado.

## Banco (Neon)
1. Use `DATABASE_URL` com SSL.
2. Migração principal: `backend/alembic/versions/0002_fastapi_parity.py`.
3. Se necessário, aplique SQL manual em `docs/NEON_SQL_CONTINGENCIA.md`.

## Uploads (Cloudinary)
Pastas padrão:
- `salons/{shopId}/professionals/{professionalId}/profile`
- `salons/{shopId}/payments/{professionalId}/receipts`
