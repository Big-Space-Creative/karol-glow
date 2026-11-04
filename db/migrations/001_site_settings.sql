-- Informações de contato exibidas no site (editáveis no painel). Seguro para rodar mais de uma vez.
CREATE TABLE IF NOT EXISTS site_settings (
  key         text PRIMARY KEY,
  value       text NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO site_settings (key, value) VALUES
  ('email',     'karolynneglow@gmail.com'),
  ('phone',     '558894045293'),
  ('instagram', 'karolglow.oficial99')
ON CONFLICT (key) DO NOTHING;
