# Deploy Netlify

## Passo a passo
1. Crie o backend FastAPI em um host (Render, Railway, Fly.io, etc.).
2. Configure `DATABASE_URL` (Neon), `SECRET_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` no backend.
3. No Netlify, aponte o repositório e use o `netlify.toml`.
4. Atualize o redirect `/api/*` no `netlify.toml` com o host do backend.

## Variáveis no Netlify
- Nenhuma variável obrigatória no frontend (a API é proxied via redirect).

## Uploads
- Para produção, recomendamos substituir o upload local por storage (S3, R2, GCS) e ajustar o endpoint `/api/uploads/request-url`.
