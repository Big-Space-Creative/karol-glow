-- Textos da página do produto (modo de uso e ingredientes), editáveis no cadastro. Seguro para rodar mais de uma vez.
ALTER TABLE products ADD COLUMN IF NOT EXISTS usage_instructions text NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients        text NOT NULL DEFAULT '';
