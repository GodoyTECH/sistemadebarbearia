# Deploy: Render + Netlify + Neon + Cloudinary

## Backend (Render)
1. Criar Web Service no Render apontando para este repositório.
2. Build command: `npm ci && npm run build`.
3. Start command: `npm run start`.
4. Definir variáveis do backend (ver `docs/ENV_VARS_FINAL.md`).
5. Aplicar migração SQL no Neon antes do primeiro boot em produção.

## Frontend (Netlify)
1. Site conectado ao mesmo repositório.
2. Build command: `npm ci && npm run build`.
3. Publish directory: `dist/public`.
4. Definir `BACKEND_URL` quando usar domínio separado.

## Banco (Neon)
1. Usar `DATABASE_URL` com SSL.
2. Executar SQL de migração principal.
3. Se falhar, aplicar contingência de `docs/NEON_SQL_CONTINGENCIA.md`.

## Uploads (Cloudinary)
- Configurar `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` no Render.
- Pastas geradas:
  - `salons/{shopId}/professionals/{professionalId}/profile`
  - `salons/{shopId}/payments/{professionalId}/receipts`
