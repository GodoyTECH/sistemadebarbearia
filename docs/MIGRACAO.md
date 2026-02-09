# Migração para FastAPI

## O que foi migrado
- Backend principal substituído por FastAPI, com SQLAlchemy + Alembic + Pydantic v2.
- Endpoints compatíveis com o frontend atual, mantendo contratos essenciais.
- Autenticação com cookie HTTP-only e RBAC (manager/professional).
- Upload local funcional com URL final retornada, pronto para trocar por storage externo.
- Logs de auditoria para aprovações/reprovações.
- Multi-tenant com criação automática de loja para gerente e vínculo por store_number.
- Base de agenda para disponibilidade e solicitações de agendamento.

## O que permaneceu
- Frontend React + Vite + Tailwind foi preservado, com ajustes de responsividade, login/cadastro e tema.
- Estrutura do frontend e fluxos principais mantidos.

## Observações
- O backend Node antigo não foi removido para evitar regressão, mas o novo backend está em `/backend`.
- Recomendado usar o novo backend em produção.
