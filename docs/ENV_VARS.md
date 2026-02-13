# Variáveis de Ambiente

Stack oficial:
- Frontend: Netlify
- Backend: Render
- Banco: Neon PostgreSQL
- Upload de imagens: Cloudinary

## Backend (Render)
- `DATABASE_URL`: conexão PostgreSQL (Neon).
- `SESSION_SECRET`: segredo de sessão usado na autenticação.
- `NODE_ENV`: `development` | `production`.
- `PORT`: porta do servidor.

### Upload de imagens (Cloudinary)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Frontend (Netlify)
- `BACKEND_URL`: URL pública do backend no Render usada no redirect `/api/*`.
