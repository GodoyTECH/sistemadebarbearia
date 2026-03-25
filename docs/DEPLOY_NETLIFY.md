# Deploy Netlify + Render

## Passo a passo
1. Publique o backend FastAPI no Render com **Root Directory = `backend`**.
2. Configure no Render:
   - Build: `pip install -e .`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Health Check Path: `/healthz`
3. Defina no backend as variáveis obrigatórias:
   - `DATABASE_URL` (Neon)
   - `SECRET_KEY`
   - `ACCESS_TOKEN_EXPIRE_MINUTES`
   - `ALLOWED_ORIGINS`
   - `ENV`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (quando upload estiver habilitado)
4. Execute migrações antes do primeiro tráfego:
   - `alembic upgrade head` (rodando em `backend/` com as mesmas envs de produção)
5. No Netlify, conecte este repositório e mantenha o `netlify.toml`.
6. Defina `BACKEND_URL` no Netlify com a URL pública do backend para o redirect `/api/*`.

## Variáveis no Netlify
- `BACKEND_URL`: URL base do backend.

## Observação
- Este projeto usa Netlify (frontend), Render (backend) e Neon (PostgreSQL) como stack oficial.


## Troubleshooting rápido
- Se aparecer `POST /api/auth/login 404` no Netlify, o backend não está sendo roteado pelo redirect de `/api/*`.
- Este repositório agora gera `dist/public/_redirects` durante o build usando `BACKEND_URL`.
- Em builds da Netlify, `BACKEND_URL` é obrigatório e o deploy falha cedo se a variável não existir (evita publicar front quebrado).

## Acesso de teste (seed bootstrap)
Com `SEED_BOOTSTRAP_ENABLED=true` (padrão), o backend cria usuários para validar login sem cadastrar manualmente:
- Gerente: `admin@luxe.com` / `AdminLuxe2026`
- Profissional: `profissional@luxe.com` / `ProfLuxe2026`
- Código da loja de teste: `LUXETEST01`
