# Variáveis de Ambiente

Stack oficial:
- Frontend: Netlify
- Backend: Render (Python/FastAPI)
- Banco: Neon PostgreSQL
- Mídia: Cloudinary

## Backend (Render)
- `DATABASE_URL`: conexão PostgreSQL do Neon.
- `SECRET_KEY`: segredo para JWT/cookies de autenticação.
- `ACCESS_TOKEN_EXPIRE_MINUTES`: tempo de expiração do token.
- `ALLOWED_ORIGINS`: lista separada por vírgula de origens CORS.
- `PORT`: porta fornecida pelo Render.
- `ENV`: `local` ou `production`.

### Upload de imagens (Cloudinary)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Frontend (Netlify)
- `BACKEND_URL`: URL pública do backend no Render (quando não usar proxy local `/api`).
