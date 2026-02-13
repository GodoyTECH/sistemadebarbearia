# FASE 2 — Diagnóstico detalhado (ETAPA 0)

> Escopo: análise read-only do estado atual para preparar PRs pequenos sem regressão.

## 1) Resumo executivo

O repositório está em **estado híbrido**: há um backend Node/Express ativo no root e um backend FastAPI em `backend/` com documentação de migração, mas sem integração consolidada de deploy único. Isso aumenta risco de regressão se mudanças forem feitas sem definir o backend canônico.

**Foco do momento (cadastro de loja)**: hoje **não existe modelo de loja/salão** no banco nem fluxo separado de cadastro gerente vs profissional com vínculo por `storeId`.

---

## 2) Evidências por área (A)

### A.1 Autenticação
**IMPLEMENTADO (base), com inconsistência de stack**

- Node/Express:
  - login local por e-mail/senha com sessão cookie: `POST /api/auth/login`.
  - cadastro básico: `POST /api/auth/register`.
  - sessão local gravada em `req.session.userId`.
  - arquivo: `server/routes.ts`.
- Integração Replit Auth também existe (OIDC), com fallback de middleware.
  - arquivos: `server/replit_integrations/auth/replitAuth.ts`, `server/replit_integrations/auth/routes.ts`.
- FastAPI também implementa login/logout/user com cookie JWT-like.
  - arquivo: `backend/app/api/auth.py`.

**Risco:** duas implementações de auth em paralelo.

### A.2 Cadastro
**PARCIAL**

- Existe onboarding com campos: nome, e-mail, senha, telefone, role (`manager`/`professional`), tudo no mesmo fluxo.
  - arquivo: `client/src/pages/Onboarding.tsx`.
- Backend salva `users` + `profiles`, mas:
  - não separa “cadastro de loja (ADM)” de “cadastro profissional”.
  - não exige `@luxic.com` fixo.
  - não cria `storeId`.
  - não valida regras de senha solicitadas (mín. 8, alfanumérica sem símbolos/espaços) — hoje está com mínimo 6.

### A.3 Perfis (ADM/profissional)
**IMPLEMENTADO (base)**

- Enum de role existe (`manager`, `professional`) e profile vinculado ao usuário.
  - arquivo: `shared/schema.ts`.
- Redirecionamento por role no frontend existe.
  - arquivo: `client/src/pages/Onboarding.tsx`, `client/src/pages/Landing.tsx`.

**Lacuna:** não há papel “gerente de loja com loja própria” no modelo de dados.

### A.4 Dashboards
**IMPLEMENTADO (base)**

- Rotas e páginas de dashboard admin/profissional existem.
  - arquivo: `client/src/App.tsx`.
- Admin mostra métricas e pendências (pendências hoje são de aprovação de atendimentos/comprovantes, não de cadastro profissional).
  - arquivos: `client/src/pages/admin/Dashboard.tsx`, `shared/routes.ts`.

### A.5 Pagamentos/comprovantes
**PARCIAL**

- Profissional registra atendimento com método de pagamento e comprovante.
  - arquivo: `client/src/pages/professional/Dashboard.tsx`.
- Comprovante visualizado e aprovado/rejeitado no admin (status de appointment).
  - arquivo: `client/src/pages/admin/Appointments.tsx`.
- Banco guarda `paymentMethod`, `transactionId`, `proofUrl`, `status`.
  - arquivo: `shared/schema.ts`.

**Lacuna:** campos Cloudinary (`public_id`, `asset_id`) não existem; organização por pasta por loja/profissional não existe.

### A.6 Upload de imagens
**PARCIAL**

- Upload existe via URL assinada/fluxo de object storage (integração Replit/GCS-like) e também versão local no FastAPI.
  - arquivos: `server/replit_integrations/object_storage/routes.ts`, `backend/app/api/uploads.py`.
- Não existe integração Cloudinary implementada.

### A.7 Deploy (Render/Netlify)
**PARCIAL**

- Netlify está preparado para frontend estático + redirect `/api/*` para backend.
  - arquivo: `netlify.toml`.
- Não há `render.yaml` / `Dockerfile` / `Procfile` no root.
- Documentação cita ambos cenários (Express e FastAPI), com divergência.
  - arquivos: `docs/DEPLOY_NETLIFY.md`, `docs/MIGRACAO.md`.

### A.8 Banco/migrações (Neon)
**PARCIAL**

- Node usa Drizzle com `DATABASE_URL` e `drizzle-kit push`.
  - arquivos: `server/db.ts`, `drizzle.config.ts`, `package.json`.
- FastAPI usa Alembic (`backend/alembic/versions/0001_initial.py`).
- Não há modelo de loja nem fluxo de aprovação de profissional por loja.

---

## 3) Classificação IMPLEMENTADO / PARCIAL / AUSENTE (B)

| Área | Status | Evidência | Falta principal |
|---|---|---|---|
| Auth base (login/sessão) | IMPLEMENTADO | `server/routes.ts`, `backend/app/api/auth.py` | Unificar backend canônico |
| Cadastro único com role | PARCIAL | `client/src/pages/Onboarding.tsx` | Separar gerente/profissional por tela e regra |
| Cadastro de loja (ADM) | AUSENTE | sem tabela `stores/salons` | criar loja + ID único + vínculo gerente |
| Cadastro profissional via `storeId` | AUSENTE | não há campo `storeId` no schema/fluxo | validação + pendência aprovação |
| Aprovação profissional por ADM | AUSENTE | hoje aprovação é de appointment | entidade de solicitação/estado |
| Dashboard com nome+ID loja | AUSENTE | dashboard não exibe `storeId` | trazer dados da loja no `/api/me`/stats |
| Pagamento manual base | IMPLEMENTADO | `appointments` + telas | expandir identificador e anexos estruturados |
| Upload Cloudinary | AUSENTE | upload atual é Replit/local | integração Cloudinary completa |
| Deploy Netlify redirect | IMPLEMENTADO | `netlify.toml` | validar envs finais |
| Deploy Render padronizado | PARCIAL | sem manifesto Render | definir Start/Build/Health |
| Migração automática Neon | PARCIAL | Drizzle push + Alembic | padronizar uma trilha única |

---

## 4) Configuração manual necessária (C)

### Neon SQL
- **Hoje**: nenhum script obrigatório manual foi encontrado no repo para o estado atual.
- **Para Fase 2**: pode ser 100% por migração (recomendado) — ver `docs/CONFIG_MANUAL_NEON_SQL.md`.

### Render
- Definir serviço backend canônico (recomendado: Node/Express para menor impacto imediato no frontend atual).
- Configurar envs mínimas (`DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production`, `PORT`).
- Definir Health Check em `/api/health`.

### Netlify
- `build.command = npm run build`, `publish = dist/public` já está pronto.
- Definir `BACKEND_URL` apontando para Render.

### Cloudinary
- Criar credenciais (`cloud_name`, `api_key`, `api_secret`), definir política de upload e pastas por `storeId`.
- Decidir upload assinado (recomendado para comprovantes).

---

## 5) O que pode ser automatizado por código (D)

Tudo abaixo pode ir por PR e push (sem SQL manual obrigatório):

1. **Migração de banco**
   - novas tabelas: `stores`, `store_memberships`, `professional_requests`.
   - novos campos para anexos (`public_id`, `asset_id`, etc.).
   - índices/constraints (`store_code` único, FK, status).
2. **Validações de cadastro**
   - e-mail prefixo + sufixo fixo `@luxic.com`.
   - senha: min 8, `[A-Za-z0-9]+`, sem espaço.
3. **API**
   - endpoint separado para cadastro gerente com criação de loja.
   - endpoint de cadastro profissional com `storeId` + status pendente.
   - endpoints de aprovação/reprovação por ADM.
4. **Cloudinary**
   - assinatura server-side + upload para pastas padronizadas.
   - persistência em Neon: `image_url`, `public_id`, `asset_id`, `created_at` + FK.
5. **Dashboard**
   - exibir nome + ID da loja sob nome do salão.

---

## 6) Plano da Fase 2 em PRs pequenos (E)

## PR-00 (este)
- Objetivo: diagnóstico + documentação operacional.
- Risco: baixo (somente docs).
- Teste manual: revisão de docs.

## PR-01 — Cadastro de loja (gerente/ADM)
- Arquivos-alvo (estimado <=10): schema, rotas auth, onboarding, dashboard admin, tipos/contratos.
- Entrega:
  - split de entrada: “Cadastrar como gerente/ADM” e “Cadastrar como profissional”.
  - cadastro gerente cria loja + `storeId` único + vínculo gerente.
  - dashboard mostra nome da loja + ID.
- Risco: médio (auth + onboarding).
- Teste manual:
  1. cadastrar gerente com prefixo e-mail;
  2. validar sufixo `@luxic.com`;
  3. conferir loja criada e ID exibido no dashboard.

## PR-02 — Cadastro profissional com `storeId` e pendência
- Entrega:
  - formulário separado de profissional com `storeId`;
  - validação amigável de ID inválido;
  - status inicial pendente.
- Risco: médio.
- Teste manual:
  - tentar ID inválido (erro amigável), depois válido (pendente criado).

## PR-03 — Aprovação no painel ADM
- Entrega:
  - lista de solicitações pendentes;
  - ações Aceitar/Recusar;
  - feedback para profissional.
- Risco: médio.
- Teste manual:
  - aprovar/recusar e validar mudança de estado.

## PR-04 — Cloudinary (perfil + comprovante)
- Entrega:
  - upload cloudinary por pasta:
    - `salons/{storeId}/professionals/{professionalId}/profile`
    - `salons/{storeId}/payments/{professionalId}/receipts`
  - persistência de metadados no Neon.
- Risco: médio/alto (integração externa).
- Teste manual:
  - upload de foto de perfil e comprovante, validação no banco e visualização.

## PR-05 — Ajustes finais painel/status + hardening
- Entrega:
  - botão Disponível/Indisponível no painel profissional;
  - entrada para painel profissional no ADM;
  - revisão final de regressão.
- Risco: baixo/médio.
- Teste manual:
  - smoke completo dos dois perfis.

---

## 7) Riscos atuais identificados

1. **Dois backends concorrentes** (Node e FastAPI) com documentação mista.
2. **Build TypeScript falhando no estado atual** (erro de sintaxe pré-existente em `server/routes.ts`).
3. **Estratégia de migração duplicada** (Drizzle + Alembic) sem “fonte única da verdade”.

Recomendação para reduzir risco na execução dos PRs funcionais: **eleger Node/Express + Drizzle como trilha principal da Fase 2**, mantendo FastAPI intacto por enquanto (sem remover nada neste ciclo).
