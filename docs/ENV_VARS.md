# Variáveis de Ambiente

## Backend (FastAPI)
- `ENV`: local | production
- `DATABASE_URL`: conexão PostgreSQL (Neon)
- `SECRET_KEY`: segredo JWT
- `ACCESS_TOKEN_EXPIRE_MINUTES`: tempo de expiração do cookie
- `ALLOWED_ORIGINS`: lista de origins (CORS)
- `UPLOAD_DIR`: diretório local de uploads
- `ADMIN_EMAIL`: usuário gerente bootstrap
- `ADMIN_PASSWORD`: senha gerente bootstrap
- `WHATSAPP_ENABLED`: habilita envio de WhatsApp (true/false)

## Frontend (Vite/Netlify)
- Nenhuma obrigatória. Ajuste `netlify.toml` para o host do backend.
