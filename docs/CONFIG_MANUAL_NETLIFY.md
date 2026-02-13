# Configuração manual Netlify (frontend)

## 1) Build settings

Conforme `netlify.toml` já versionado:
- Build command: `npm run build`
- Publish directory: `dist/public`

## 2) Redirects necessários

Já definidos em `netlify.toml`:
- `/api/*` -> `${BACKEND_URL}/:splat` (status 200)
- `/*` -> `/index.html` (SPA fallback)

## 3) Variável obrigatória

- `BACKEND_URL` = URL pública do backend no Render (sem barra final)

Exemplo:
- `https://sistema-barbearia-api.onrender.com`

## 4) Checklist pós-configuração

- [ ] Home (`/`) abre sem 404
- [ ] Chamada para `/api/health` via frontend responde
- [ ] Login/onboarding sem erro de CORS/cookie

## 5) Nota de segurança

Como o frontend chama `/api/*` no mesmo domínio Netlify (redirect), simplifica CORS no browser.
