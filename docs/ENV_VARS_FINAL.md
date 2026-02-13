# ENV VARS FINAL (alvo da Fase 2)

## Backend (Render)

Obrigatórias:
- `NODE_ENV=production`
- `PORT` (injetada pela plataforma)
- `DATABASE_URL` (Neon PostgreSQL)
- `SESSION_SECRET` (string longa aleatória)

Cloudinary (PR-04):
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Opcional (se Replit OIDC permanecer ativo):
- `REPL_ID`
- `ISSUER_URL`

## Frontend (Netlify)

Obrigatória:
- `BACKEND_URL` (URL do backend Render)

## Convenções recomendadas

- Nunca commitar `.env`.
- Rotacionar `SESSION_SECRET` em incidente.
- Validar variáveis obrigatórias no boot da aplicação com erro claro.
