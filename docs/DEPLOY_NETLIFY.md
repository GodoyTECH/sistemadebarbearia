# Deploy Netlify

## Passo a passo
1. Suba o backend Express (Render, Railway, Fly.io, etc.).
2. Configure `DATABASE_URL` (Neon) e `PORT` no backend.
3. No Netlify, aponte o repositório e use o `netlify.toml`.
4. Defina `BACKEND_URL` no Netlify com o host do backend para o redirect `/api/*`.

## Variáveis no Netlify
- `BACKEND_URL`: URL base do backend usada pelos redirects do Netlify.

## Uploads
- Para produção, recomendamos substituir o upload local por storage (S3, R2, GCS) e ajustar o endpoint `/api/uploads/request-url`.
