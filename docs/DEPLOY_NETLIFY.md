# Deploy Netlify + Render

## Passo a passo
1. Publique o backend no Render.
2. Configure no backend: `DATABASE_URL` (Neon), `SESSION_SECRET`, `NODE_ENV` e `PORT`.
3. Configure no backend as credenciais Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) quando o upload estiver habilitado.
4. No Netlify, conecte este repositório e mantenha o `netlify.toml`.
5. Defina `BACKEND_URL` no Netlify com a URL pública do backend para o redirect `/api/*`.

## Variáveis no Netlify
- `BACKEND_URL`: URL base do backend.

## Observação
- Este projeto usa Netlify (frontend), Render (backend) e Neon (PostgreSQL) como stack oficial.
