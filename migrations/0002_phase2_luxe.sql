DO $$ BEGIN
  CREATE TYPE professional_approval_status AS ENUM ('pending_approval', 'active', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE upload_type AS ENUM ('profile', 'receipt');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approval_status professional_approval_status DEFAULT 'active' NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_by_user_id varchar REFERENCES users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approval_at timestamp;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rejection_at timestamp;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability boolean DEFAULT true NOT NULL;

ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS profiles_user_id_unique UNIQUE(user_id);
CREATE INDEX IF NOT EXISTS profiles_shop_id_idx ON profiles(shop_id);
CREATE UNIQUE INDEX IF NOT EXISTS shops_code_unique ON shops(code);

CREATE TABLE IF NOT EXISTS professional_approvals (
  id serial PRIMARY KEY,
  professional_user_id varchar NOT NULL REFERENCES users(id),
  manager_user_id varchar NOT NULL REFERENCES users(id),
  action varchar(16) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_uploads (
  id serial PRIMARY KEY,
  type upload_type NOT NULL,
  shop_id integer REFERENCES shops(id),
  professional_user_id varchar REFERENCES users(id),
  appointment_id integer,
  secure_url text NOT NULL,
  public_id text NOT NULL,
  asset_id text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

UPDATE profiles
SET approval_status = 'pending_approval'
WHERE role = 'professional' AND shop_id IS NOT NULL AND approval_status = 'active';
