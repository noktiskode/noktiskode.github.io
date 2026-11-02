-- d1/schema.sql — esquema de la base D1 "bmm-db" (Barberena Mi Municipio)
-- Aplicar con:  npx wrangler d1 execute bmm-db --remote --file=d1/schema.sql

CREATE TABLE IF NOT EXISTS posts (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  excerpt      TEXT NOT NULL DEFAULT '',
  body         TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT 'barberena',
  image_url    TEXT,
  video_url    TEXT,
  tags         TEXT NOT NULL DEFAULT '[]',   -- arreglo JSON, ej. ["Agua","Obras"]
  published    INTEGER NOT NULL DEFAULT 1,   -- 1 = publicado, 0 = borrador
  noindex      INTEGER NOT NULL DEFAULT 0,
  featured     INTEGER NOT NULL DEFAULT 0,
  published_at TEXT NOT NULL,                -- ISO 8601 en UTC (2026-07-10T18:30:06.000Z)
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  search_text  TEXT NOT NULL DEFAULT ''      -- título+resumen+etiquetas+texto sin tildes ni mayúsculas
);

CREATE INDEX IF NOT EXISTS idx_posts_pub      ON posts (published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_cat      ON posts (category, published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts (featured, published, published_at DESC);

-- Intentos fallidos de inicio de sesión del panel (freno contra fuerza bruta)
CREATE TABLE IF NOT EXISTS login_fails (
  ip TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_fails ON login_fails (ip, at);
