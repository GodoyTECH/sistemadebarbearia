# Arquitetura

## Visão Geral
```
/ (repo)
├── client/            # React + Vite + Tailwind
├── server/            # Express + Drizzle ORM (API)
├── shared/            # Contratos e schemas compartilhados (types)
├── docs/              # Documentação de deploy e migração
```

## Backend
- **Express** como framework de API.
- **Drizzle ORM** para acesso ao PostgreSQL.
- **Zod** para validação de entrada e saída.
- **RBAC** baseado em `profiles.role`.

## Frontend
- React + Vite + Tailwind.
- Consumo via `/api/*` com proxy local (Vite) e redirect (Netlify).
- Layout responsivo com AppShell e drawer mobile.

## Banco de Dados
- PostgreSQL (Neon).
- Tabelas principais: users, profiles, services, appointments, audit_logs.
