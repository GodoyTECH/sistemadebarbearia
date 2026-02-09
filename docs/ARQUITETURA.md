# Arquitetura

## Visão Geral
```
/ (repo)
├── backend/           # FastAPI + SQLAlchemy + Alembic
├── client/            # React + Vite + Tailwind
├── shared/            # Contratos e schemas compartilhados (types)
├── docs/              # Documentação de deploy e migração
```

## Backend
- **FastAPI** como framework de API.
- **SQLAlchemy 2.0** para ORM.
- **Alembic** para migrations.
- **Pydantic v2** para validação de entrada e saída.
- **RBAC** baseado em `users.role` e `profiles.role`.
- **Multi-tenant** por `stores` (store_number/store_name).
- Base de agenda com disponibilidade, bloqueios e solicitações de agendamento.

## Frontend
- React + Vite + Tailwind.
- Consumo via `/api/*` com proxy local (Vite) e redirect (Netlify).
- Layout responsivo com AppShell e drawer mobile.

## Banco de Dados
- PostgreSQL (Neon).
- Tabelas principais: users, profiles, services, appointments, audit_logs.
