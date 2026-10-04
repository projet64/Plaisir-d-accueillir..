// Plaisir d'accueillir — serveur
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const { q, init } = require('./db');
const { draftRecipe } = require('./ai');
const { seed } = require('./seed');
const photos = require('./photos');

const app = express();
app.use(express.json({ limit: '20mb' }));

// ---------- Accès famille (code partagé, cookie signé) ----------
const CODE = process.env.CODE_ACCES || '';
const SECRET = process.env.SESSION_SECRET || crypto.createHash('sha256').update('pda:' + CODE).digest('hex');
const sign = (v) => crypto.createHmac('sha256', SECRET).update(v).digest('hex');
const TOKEN = sign('famille');

function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  const m = raw.split(/;\s*/).find((c) => c.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : null;
}
function authed(req) {
  return !CODE || readCookie(req, 'pda') === TOKEN;
}

app.post('/api/login', (req, res) => {
  const code = String((req.body && req.body.code) || '').trim().toLowerCase();
  if (CODE && code !== CODE.trim().toLowerCase()) return res.status(401).json({ error: 'Code incorrect' });
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `pda=${TOKEN}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${60 * 60 * 24 * 400}`);
  res.json({ ok: true });
});
app.get('/api/me', (req, res) => res.json({ authed: authed(req), ai: !!process.env.ANTHROPIC_API_KEY }));
app.use('/api', (req, res, next) => (authed(req) ? next() : res.status(401).json({ error: 'Non connecté' })));

const who = (req) => { try { return decodeURIComponent(String(req.headers['x-who'] || '')).slice(0, 40) || null; } catch { return null; } };
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e);
  res.status(e.status || 500).json({ error: e.message || 'Erreur serveur' });
});
const int = (v) => parseInt(v, 10);

// ---------- Photos ----------
app.post('/api/photos', wrap(async (req, res) => {
  const { data, mime } = req.body || {};
  if (!data) return res.status(400).json({ error: 'Photo manquante' });
  const r = await q('INSERT INTO photos (data, mime) VALUES ($1, $2) RETURNING id', [Buffer.from(data, 'base64'), mime || 'image/jpeg']);
  res.json({ id: r.rows[0].id });
}));
// Recherche de photos libres de droits (Wikimedia Commons) et import par le serveur
app.get('/api/photos/search', wrap(async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (!query) return res.json([]);
  res.json(await photos.searchCommons(query));
}));
app.post('/api/photos/from-url', wrap(async (req, res) => {
  const { url } = req.body || {};
  const { buf, mime } = await photos.download(url);
  const r = await q('INSERT INTO photos (data, mime) VALUES ($1, $2) RETURNING id', [buf, mime]);
  res.json({ id: r.rows[0].id });
}));
app.get('/api/photos/:id', wrap(async (req, res) => {
  const r = await q('SELECT data, mime FROM photos WHERE id = $1', [int(req.params.id)]);
  if (!r.rows[0]) return res.status(404).end();
  res.setHeader('Content-Type', r.rows[0].mime);
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
  res.end(r.rows[0].data);
}));

// ---------- Recettes ----------
const RECIPE_FIELDS = ['name', 'category', 'servings', 'prep_minutes', 'difficulty', 'description', 'ingredients', 'steps', 'photo_id', 'photo_kind', 'source', 'favorite', 'photo_credit'];
function recipeValues(b) {
  return [
    String(b.name || 'Sans titre').slice(0, 200),
    b.category || 'plat',
    Math.max(1, int(b.servings) || 4),
    int(b.prep_minutes) || null,
    b.difficulty || null,
    b.description || null,
    JSON.stringify(Array.isArray(b.ingredients) ? b.ingredients : []),
    JSON.stringify(Array.isArray(b.steps) ? b.steps : []),
    int(b.photo_id) || null,
    b.photo_kind || null,
    b.source || null,
    !!b.favorite,
    b.photo_credit || null
  ];
}

app.get('/api/recipes', wrap(async (req, res) => {
  const r = await q(`SELECT r.id, r.name, r.category, r.servings, r.prep_minutes, r.difficulty, r.photo_id, r.favorite, r.created_at,
      (SELECT COUNT(*) FROM soiree_recipes sr WHERE sr.recipe_id = r.id)::int AS served
    FROM recipes r ORDER BY r.created_at DESC`);
  res.json(r.rows);
}));
app.get('/api/recipes/:id', wrap(async (req, res) => {
  const id = int(req.params.id);
  const r = await q('SELECT * FROM recipes WHERE id = $1', [id]);
  if (!r.rows[0]) return res.status(404).json({ error: 'Recette introuvable' });
  const hist = await q(`SELECT s.id, s.title, s.date, s.guests, sr.note,
      COALESCE((SELECT string_agg(f.name, ', ' ORDER BY f.name) FROM soiree_friends sf JOIN friends f ON f.id = sf.friend_id WHERE sf.soiree_id = s.id), '') AS friends
    FROM soiree_recipes sr JOIN soirees s ON s.id = sr.soiree_id WHERE sr.recipe_id = $1 ORDER BY s.date DESC`, [id]);
  res.json({ ...r.rows[0], history: hist.rows });
}));
app.post('/api/recipes', wrap(async (req, res) => {
  const v = recipeValues(req.body || {});
  const r = await q(`INSERT INTO recipes (${RECIPE_FIELDS.join(', ')}, created_by)
    VALUES (${RECIPE_FIELDS.map((_, i) => '$' + (i + 1)).join(', ')}, $${RECIPE_FIELDS.length + 1}) RETURNING id`, [...v, who(req)]);
  res.json({ id: r.rows[0].id });
}));
app.put('/api/recipes/:id', wrap(async (req, res) => {
  const v = recipeValues(req.body || {});
  await q(`UPDATE recipes SET ${RECIPE_FIELDS.map((f, i) => `${f} = $${i + 1}`).join(', ')}, updated_at = now()
    WHERE id = $${RECIPE_FIELDS.length + 1}`, [...v, int(req.params.id)]);
  res.json({ ok: true });
}));
app.delete('/api/recipes/:id', wrap(async (req, res) => {
  await q('DELETE FROM recipes WHERE id = $1', [int(req.params.id)]);
  res.json({ ok: true });
}));

// ---------- Amis ----------
app.get('/api/friends', wrap(async (req, res) => {
  const r = await q(`SELECT f.*, (SELECT COUNT(*) FROM soiree_friends sf WHERE sf.friend_id = f.id)::int AS visits,
      (SELECT MAX(s.date) FROM soiree_friends sf JOIN soirees s ON s.id = sf.soiree_id WHERE sf.friend_id = f.id) AS last_visit
    FROM friends f ORDER BY f.name`);
  res.json(r.rows);
}));
app.get('/api/friends/:id', wrap(async (req, res) => {
  const id = int(req.params.id);
  const f = await q('SELECT * FROM friends WHERE id = $1', [id]);
  if (!f.rows[0]) return res.status(404).json({ error: 'Ami introuvable' });
  const visits = await q(`SELECT s.id, s.title, s.date, s.guests, s.notes,
      COALESCE(json_agg(json_build_object('id', r.id, 'name', r.name, 'course', sr.course, 'note', sr.note, 'photo_id', r.photo_id)) FILTER (WHERE r.id IS NOT NULL), '[]') AS menu,
      (SELECT sp.photo_id FROM soiree_photos sp WHERE sp.soiree_id = s.id LIMIT 1) AS photo_id
    FROM soiree_friends sf JOIN soirees s ON s.id = sf.soiree_id
    LEFT JOIN soiree_recipes sr ON sr.soiree_id = s.id LEFT JOIN recipes r ON r.id = sr.recipe_id
    WHERE sf.friend_id = $1 GROUP BY s.id ORDER BY s.date DESC`, [id]);
  res.json({ ...f.rows[0], visits: visits.rows });
}));
app.post('/api/friends', wrap(async (req, res) => {
  const b = req.body || {};
  const r = await q('INSERT INTO friends (name, know, likes, avoid) VALUES ($1, $2, $3, $4) RETURNING id', [String(b.name || '').trim() || 'Sans nom', b.know || null, b.likes || null, b.avoid || null]);
  res.json({ id: r.rows[0].id });
}));
app.put('/api/friends/:id', wrap(async (req, res) => {
  const b = req.body || {};
  await q('UPDATE friends SET name = $1, know = $2, likes = $3, avoid = $4 WHERE id = $5', [String(b.name || '').trim() || 'Sans nom', b.know || null, b.likes || null, b.avoid || null, int(req.params.id)]);
  res.json({ ok: true });
}));
app.delete('/api/friends/:id', wrap(async (req, res) => {
  await q('DELETE FROM friends WHERE id = $1', [int(req.params.id)]);
  res.json({ ok: true });
}));

// ---------- Soirées ----------
app.get('/api/soirees', wrap(async (req, res) => {
  const r = await q(`SELECT s.id, s.title, s.date, s.time, s.guests, s.checked,
      COALESCE((SELECT string_agg(f.name, ', ' ORDER BY f.name) FROM soiree_friends sf JOIN friends f ON f.id = sf.friend_id WHERE sf.soiree_id = s.id), '') AS friends,
      COALESCE((SELECT string_agg(r.name, ' · ' ORDER BY array_position(ARRAY['cocktail','apero','entree','plat','fromage','dessert'], sr.course)) FROM soiree_recipes sr JOIN recipes r ON r.id = sr.recipe_id WHERE sr.soiree_id = s.id), '') AS menu,
      (SELECT sp.photo_id FROM soiree_photos sp WHERE sp.soiree_id = s.id LIMIT 1) AS photo_id
    FROM soirees s ORDER BY s.date DESC, s.time DESC`);
  res.json(r.rows);
}));
app.get('/api/soirees/:id', wrap(async (req, res) => {
  const id = int(req.params.id);
  const s = await q('SELECT * FROM soirees WHERE id = $1', [id]);
  if (!s.rows[0]) return res.status(404).json({ error: 'Soirée introuvable' });
  const friends = await q('SELECT f.* FROM soiree_friends sf JOIN friends f ON f.id = sf.friend_id WHERE sf.soiree_id = $1 ORDER BY f.name', [id]);
  const recipes = await q('SELECT r.*, sr.course, sr.note FROM soiree_recipes sr JOIN recipes r ON r.id = sr.recipe_id WHERE sr.soiree_id = $1', [id]);
  const photos = await q('SELECT photo_id, caption FROM soiree_photos WHERE soiree_id = $1 ORDER BY photo_id', [id]);
  // Alerte : plats du menu déjà servis aux mêmes amis lors d'une soirée précédente
  const repeats = await q(`SELECT DISTINCT r.name AS recipe, f.name AS friend, s2.date
    FROM soiree_recipes sr JOIN soiree_recipes sr2 ON sr2.recipe_id = sr.recipe_id AND sr2.soiree_id <> sr.soiree_id
    JOIN soirees s2 ON s2.id = sr2.soiree_id
    JOIN soiree_friends sf ON sf.soiree_id = sr.soiree_id JOIN soiree_friends sf2 ON sf2.soiree_id = s2.id AND sf2.friend_id = sf.friend_id
    JOIN friends f ON f.id = sf.friend_id JOIN recipes r ON r.id = sr.recipe_id
    WHERE sr.soiree_id = $1 AND s2.date < $2 ORDER BY s2.date DESC`, [id, s.rows[0].date]);
  res.json({ ...s.rows[0], friends: friends.rows, recipes: recipes.rows, photos: photos.rows, repeats: repeats.rows });
}));
async function saveSoireeLinks(id, b) {
  if (Array.isArray(b.friend_ids)) {
    await q('DELETE FROM soiree_friends WHERE soiree_id = $1', [id]);
    for (const fid of b.friend_ids) await q('INSERT INTO soiree_friends VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, int(fid)]);
  }
  if (Array.isArray(b.recipes)) {
    const old = await q('SELECT recipe_id, note FROM soiree_recipes WHERE soiree_id = $1', [id]);
    const notes = Object.fromEntries(old.rows.map((r) => [r.recipe_id, r.note]));
    await q('DELETE FROM soiree_recipes WHERE soiree_id = $1', [id]);
    for (const r of b.recipes) {
      const rid = int(r.recipe_id);
      await q('INSERT INTO soiree_recipes (soiree_id, recipe_id, course, note) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', [id, rid, r.course || 'plat', r.note !== undefined ? r.note : (notes[rid] || null)]);
    }
  }
}
app.post('/api/soirees', wrap(async (req, res) => {
  const b = req.body || {};
  const r = await q('INSERT INTO soirees (title, date, time, guests, notes, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [b.title || 'Soirée', b.date, b.time || '20:30', Math.max(1, int(b.guests) || 6), b.notes || null, who(req)]);
  await saveSoireeLinks(r.rows[0].id, b);
  res.json({ id: r.rows[0].id });
}));
app.put('/api/soirees/:id', wrap(async (req, res) => {
  const id = int(req.params.id);
  const b = req.body || {};
  const cur = (await q('SELECT * FROM soirees WHERE id = $1', [id])).rows[0];
  if (!cur) return res.status(404).json({ error: 'Soirée introuvable' });
  await q('UPDATE soirees SET title = $1, date = $2, time = $3, guests = $4, notes = $5, checked = $6 WHERE id = $7', [
    b.title ?? cur.title, b.date ?? cur.date, b.time ?? cur.time, Math.max(1, int(b.guests ?? cur.guests) || 6),
    b.notes !== undefined ? b.notes : cur.notes, JSON.stringify(b.checked ?? cur.checked), id
  ]);
  await saveSoireeLinks(id, b);
  res.json({ ok: true });
}));
app.put('/api/soirees/:id/recipes/:rid/note', wrap(async (req, res) => {
  await q('UPDATE soiree_recipes SET note = $1 WHERE soiree_id = $2 AND recipe_id = $3', [(req.body && req.body.note) || null, int(req.params.id), int(req.params.rid)]);
  res.json({ ok: true });
}));
app.post('/api/soirees/:id/photos', wrap(async (req, res) => {
  await q('INSERT INTO soiree_photos (soiree_id, photo_id, caption) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [int(req.params.id), int(req.body.photo_id), req.body.caption || null]);
  res.json({ ok: true });
}));
app.delete('/api/soirees/:id', wrap(async (req, res) => {
  await q('DELETE FROM soirees WHERE id = $1', [int(req.params.id)]);
  res.json({ ok: true });
}));

// ---------- IA ----------
app.post('/api/ai/recipe', wrap(async (req, res) => {
  res.json(await draftRecipe(req.body || {}));
}));

// ---------- Fichiers de l'appli ----------
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, p) => { if (p.endsWith('sw.js') || p.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); }
}));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 8080;
init()
  .then(() => {
    app.listen(PORT, () => console.log(`Plaisir d'accueillir sur le port ${PORT}`));
    // Reprises et menus en arrière-plan : l'appli répond pendant ce temps
    seed().catch((e) => console.error('Reprise des soirées : erreur', e));
  })
  .catch((e) => { console.error('Base de données injoignable', e); process.exit(1); });
