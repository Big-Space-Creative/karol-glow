-- Karol Glow · esquema PostgreSQL (>= 14)
-- Reflete os dados que a interface usa hoje (src/stores/products.js) e a autenticação do admin.
-- Aplicar: psql "$DATABASE_URL" -f db/schema.sql
-- Observação: a API/servidor que acessa este banco ainda não existe neste repositório.

BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;   -- e-mails sem diferença de maiúsculas
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- Mantém updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Admin e sessões
-- ---------------------------------------------------------------------------
CREATE TABLE admin_users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          citext NOT NULL UNIQUE,
  name           text   NOT NULL,
  password_hash  text   NOT NULL,            -- hash scrypt calculado no servidor (server/src/lib/password.js); nunca texto puro
  is_active      boolean NOT NULL DEFAULT true,
  last_login_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER admin_users_updated BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Sessão guardada como hash do token (o token em si vai só no cookie HttpOnly)
CREATE TABLE admin_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash     text NOT NULL UNIQUE,
  ip             inet,
  user_agent     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at   timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL,
  revoked_at     timestamptz
);
CREATE INDEX admin_sessions_user_idx ON admin_sessions (user_id);
CREATE INDEX admin_sessions_expires_idx ON admin_sessions (expires_at);

-- Bloqueio por tentativas (por e-mail e por IP)
CREATE TABLE login_attempts (
  id             bigserial PRIMARY KEY,
  email          citext,
  ip             inet,
  succeeded      boolean NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX login_attempts_email_idx ON login_attempts (email, created_at DESC);
CREATE INDEX login_attempts_ip_idx    ON login_attempts (ip, created_at DESC);

-- ---------------------------------------------------------------------------
-- Catálogo (listas gerenciadas em Admin › Catálogo)
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
  id         serial PRIMARY KEY,
  name       text NOT NULL UNIQUE,
  position   integer NOT NULL DEFAULT 0      -- ordem de exibição (arrastar no admin)
);

CREATE TABLE brands (
  id    serial PRIMARY KEY,
  name  text NOT NULL UNIQUE
);

CREATE TABLE skin_types (
  id        serial PRIMARY KEY,
  name      text NOT NULL UNIQUE,
  position  integer NOT NULL DEFAULT 0
);

CREATE TABLE variation_types (          -- Tamanho, Cor, Volume, Fragrância...
  id    serial PRIMARY KEY,
  name  text NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------------
-- Produtos
-- ---------------------------------------------------------------------------
CREATE TABLE products (
  id           bigserial PRIMARY KEY,
  sku          text NOT NULL UNIQUE,                         -- ex.: KG-0001
  name         text NOT NULL,
  description  text NOT NULL DEFAULT '',
  category_id  integer NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  brand_id     integer REFERENCES brands(id) ON DELETE SET NULL,
  price        numeric(10,2) NOT NULL CHECK (price >= 0),
  promo_price  numeric(10,2) CHECK (promo_price IS NULL OR (promo_price >= 0 AND promo_price < price)),
  stock        integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  volume       text,                                         -- ex.: "30 ml"
  tag          text,                                         -- "Novo", "Mais vendido"...
  is_active    boolean NOT NULL DEFAULT true,                -- inativos não aparecem no site
  is_featured  boolean NOT NULL DEFAULT false,
  is_best_seller boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON products (category_id);
CREATE INDEX products_brand_idx    ON products (brand_id);
CREATE INDEX products_active_idx   ON products (is_active, created_at DESC);
CREATE INDEX products_name_idx     ON products (lower(name));
CREATE TRIGGER products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Produto ↔ tipos de pele (vários por produto; "Todos os tipos" é um registro)
CREATE TABLE product_skin_types (
  product_id    bigint  NOT NULL REFERENCES products(id)   ON DELETE CASCADE,
  skin_type_id  integer NOT NULL REFERENCES skin_types(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, skin_type_id)
);

-- A primeira imagem (position = 0) é a capa
CREATE TABLE product_images (
  id          bigserial PRIMARY KEY,
  product_id  bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         text   NOT NULL,
  alt         text,
  position    integer NOT NULL DEFAULT 0,
  UNIQUE (product_id, position)
);

-- Variações: preço, estoque e SKU próprios (substituem os do produto)
CREATE TABLE product_variations (
  id                 bigserial PRIMARY KEY,
  product_id         bigint  NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variation_type_id  integer NOT NULL REFERENCES variation_types(id) ON DELETE RESTRICT,
  label              text    NOT NULL,                       -- "30 ml", "Rosé"...
  sku                text    NOT NULL UNIQUE,
  price              numeric(10,2) NOT NULL CHECK (price >= 0),
  stock              integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  UNIQUE (product_id, variation_type_id, label)
);
CREATE INDEX product_variations_product_idx ON product_variations (product_id);

-- ---------------------------------------------------------------------------
-- Vendas (Admin › Vendas): registrar baixa estoque; desfazer devolve
-- ---------------------------------------------------------------------------
CREATE TABLE sales (
  id            bigserial PRIMARY KEY,
  product_id    bigint NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variation_id  bigint REFERENCES product_variations(id) ON DELETE SET NULL,
  quantity      integer NOT NULL CHECK (quantity > 0),
  unit_price    numeric(10,2) NOT NULL CHECK (unit_price >= 0),  -- preço no momento da venda
  total         numeric(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  customer      text NOT NULL DEFAULT 'Balcão',
  sold_by       uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  undone_at     timestamptz                                      -- venda desfeita (estoque devolvido)
);
CREATE INDEX sales_created_idx ON sales (created_at DESC);
CREATE INDEX sales_product_idx ON sales (product_id);

-- Baixa/devolução de estoque atômica junto com a venda
CREATE OR REPLACE FUNCTION apply_sale_stock() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET stock = stock - NEW.quantity WHERE id = NEW.product_id;  -- CHECK (stock >= 0) barra venda sem estoque
  ELSIF TG_OP = 'UPDATE' AND OLD.undone_at IS NULL AND NEW.undone_at IS NOT NULL THEN
    UPDATE products SET stock = stock + NEW.quantity WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER sales_stock AFTER INSERT OR UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION apply_sale_stock();

-- ---------------------------------------------------------------------------
-- Dados iniciais do catálogo (iguais aos da interface)
-- ---------------------------------------------------------------------------
INSERT INTO categories (name, position) VALUES
  ('Rosto',0),('Corpo',1),('Cabelo',2),('Maquiagem',3),('Kits',4);
INSERT INTO brands (name) VALUES ('Marca 01'),('Marca 02'),('Marca 03'),('Marca 04'),('Marca 05');
INSERT INTO skin_types (name, position) VALUES
  ('Todos os tipos',0),('Seca',1),('Oleosa',2),('Mista',3),('Sensível',4);
INSERT INTO variation_types (name) VALUES ('Volume'),('Tamanho'),('Cor'),('Fragrância');

COMMIT;
