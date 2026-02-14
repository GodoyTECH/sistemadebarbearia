# SQL de contingência (Neon) — idempotente

```sql
CREATE TABLE IF NOT EXISTS shops (
  id serial PRIMARY KEY,
  name text NOT NULL,
  code varchar(12) NOT NULL UNIQUE,
  manager_user_id varchar NOT NULL REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shop_id integer REFERENCES shops(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approval_status varchar NOT NULL DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_by_user_id varchar REFERENCES users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approval_at timestamp;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rejection_at timestamp;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS profiles_shop_id_idx ON profiles(shop_id);

CREATE TABLE IF NOT EXISTS professional_approvals (
  id serial PRIMARY KEY,
  professional_user_id varchar NOT NULL REFERENCES users(id),
  manager_user_id varchar NOT NULL REFERENCES users(id),
  action varchar(16) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS professional_approvals_professional_idx ON professional_approvals(professional_user_id);

CREATE TABLE IF NOT EXISTS media_uploads (
  id serial PRIMARY KEY,
  type varchar(16) NOT NULL,
  shop_id integer REFERENCES shops(id),
  professional_id varchar REFERENCES users(id),
  payment_id integer,
  secure_url text NOT NULL,
  public_id text NOT NULL,
  asset_id text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_uploads_shop_idx ON media_uploads(shop_id);
CREATE INDEX IF NOT EXISTS media_uploads_professional_idx ON media_uploads(professional_id);
```
