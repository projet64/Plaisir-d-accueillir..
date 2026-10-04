// Accès Postgres + création du schéma au démarrage
const { Pool, types } = require('pg');

// Les dates de soirée restent des chaînes AAAA-MM-JJ (pas de décalage de fuseau)
types.setTypeParser(1082, (v) => v);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 5
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  data BYTEA NOT NULL,
  mime TEXT NOT NULL DEFAULT 'image/jpeg',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'plat',
  servings INT NOT NULL DEFAULT 4,
  prep_minutes INT,
  difficulty TEXT,
  description TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]',
  steps JSONB NOT NULL DEFAULT '[]',
  photo_id INT REFERENCES photos(id) ON DELETE SET NULL,
  photo_kind TEXT,
  source TEXT,
  favorite BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS friends (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  know TEXT,
  likes TEXT,
  avoid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS soirees (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL DEFAULT '20:30',
  guests INT NOT NULL DEFAULT 6,
  notes TEXT,
  checked JSONB NOT NULL DEFAULT '{}',
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS soiree_friends (
  soiree_id INT NOT NULL REFERENCES soirees(id) ON DELETE CASCADE,
  friend_id INT NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
  PRIMARY KEY (soiree_id, friend_id)
);

CREATE TABLE IF NOT EXISTS soiree_recipes (
  soiree_id INT NOT NULL REFERENCES soirees(id) ON DELETE CASCADE,
  recipe_id INT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  course TEXT NOT NULL DEFAULT 'plat',
  note TEXT,
  PRIMARY KEY (soiree_id, recipe_id)
);

CREATE TABLE IF NOT EXISTS soiree_photos (
  soiree_id INT NOT NULL REFERENCES soirees(id) ON DELETE CASCADE,
  photo_id INT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  caption TEXT,
  PRIMARY KEY (soiree_id, photo_id)
);
`;

async function init() {
  await pool.query(SCHEMA);
  await pool.query('ALTER TABLE recipes ADD COLUMN IF NOT EXISTS photo_credit TEXT');
}

module.exports = { pool, init, q: (text, params) => pool.query(text, params) };
