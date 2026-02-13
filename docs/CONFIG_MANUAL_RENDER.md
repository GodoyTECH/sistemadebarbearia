# Configuração manual Render (backend)

## Objetivo
Publicar backend com menor risco para a Fase 2.

## Recomendação de trilha
Usar backend **Node/Express** do root inicialmente (já alinhado com scripts `npm run build/start`).

---

## 1) Criar Web Service
- Runtime: Node
- Branch: principal de release
- Build Command: `npm ci && npm run build`
- Start Command: `npm run start`
- Health Check Path: `/api/health`

---

## 2) Variáveis de ambiente (Render)

Obrigatórias:
- `DATABASE_URL` = conexão Neon (PostgreSQL)
- `SESSION_SECRET` = segredo longo e aleatório
- `NODE_ENV` = `production`
- `PORT` = Render injeta automaticamente (manter leitura por `process.env.PORT`)

Se usar recursos Replit/OIDC (opcional):
- `REPL_ID`
- `ISSUER_URL`

---

## 3) Observações de risco

- Há backend FastAPI no repositório. Não publicar ambos no mesmo domínio sem roteamento explícito.
- Healthcheck deve responder 200 em `/api/health`.
- Se upload ainda estiver em object storage legado/local, garantir permissões/limites.

---

## 4) Smoke test pós-deploy

1. `GET /api/health` retorna `{"status":"ok"}`.
2. Login/cadastro responde sem erro 500.
3. Dashboard carrega com sessão.
4. Cadastro de atendimento e aprovação seguem funcionando.
