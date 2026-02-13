# Configuração manual Neon SQL

## Status
Para a Fase 2, o objetivo é **não depender de SQL manual**, usando migração versionada por código.

Ainda assim, abaixo estão scripts de contingência (copy/paste) caso a automação não rode no ambiente.

---

## 1) SQL manual (contingência)

> Execute no SQL Editor do Neon **somente se o PR correspondente não puder rodar migração automática**.

```sql
-- 1. Loja/salão
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  store_code VARCHAR(20) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  owner_user_id VARCHAR NOT NULL REFERENCES users(id),
  phone TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Vínculo usuário <-> loja
CREATE TABLE IF NOT EXISTS store_memberships (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- manager/professional
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active/pending/rejected
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, user_id)
);

-- 3. Solicitações de profissional para loja
CREATE TABLE IF NOT EXISTS professional_requests (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending/approved/rejected
  reviewed_by_user_id VARCHAR REFERENCES users(id),
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. Metadados Cloudinary para perfil
CREATE TABLE IF NOT EXISTS profile_images (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  professional_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  public_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. Metadados Cloudinary para comprovantes
CREATE TABLE IF NOT EXISTS payment_receipts (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  professional_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  public_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_store_memberships_store ON store_memberships(store_id);
CREATE INDEX IF NOT EXISTS idx_prof_requests_store_status ON professional_requests(store_id, status);
CREATE INDEX IF NOT EXISTS idx_profile_images_prof ON profile_images(professional_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_appointment ON payment_receipts(appointment_id);
```

---

## 2) Versão automática (preferencial)

No PR funcional correspondente:

1. Atualizar `shared/schema.ts` com novas entidades.
2. Gerar migração versionada (Drizzle) e comitar no repositório.
3. Aplicar no deploy via pipeline/command (ex.: `npm run db:push` enquanto não houver migration runner formal).

---

## 3) Checklist pós-migração

- [ ] tabelas novas existentes
- [ ] `store_code` único funcionando
- [ ] vínculos gerente/profissional por loja válidos
- [ ] metadados Cloudinary persistindo
