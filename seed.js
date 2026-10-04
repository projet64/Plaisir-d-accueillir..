// Reprise des soirées déjà faites (fiches OneDrive « Recettes soirées maison »).
// Chaque lot n'est importé qu'une seule fois, repéré dans la table meta.
const { q } = require('./db');

const PLANCHA = 'Plancha Mainho TEB-75';

const LOTS = [
  {
    key: 'reprise-2026-07-04-plancha',
    soiree: {
      title: 'Soirée plancha entre amis', date: '2026-07-04', time: '20:30', guests: 11,
      notes: `9 adultes + 2 enfants. Convivial, sans chichi, avec deux-trois surprises.\nApéro léger (olives, tapenade, radis, un peu de charcuterie) : trop copieux, personne ne touche à la plancha ensuite.\nBoisson : rosé frais ou bière blonde.\nLe réflexe : un grand plat au chaud à côté de la plaque pour stocker au fur et à mesure. Préchauffer à fond (7) 10-15 min, zone chaude côté gaz pour saisir, zone douce pour brochettes et légumes.`
    },
    recipes: [
      {
        course: 'apero',
        name: 'Brochettes de poulet yakitori', category: 'apero', servings: 11, prep_minutes: 30, difficulty: 'Facile',
        description: `Les brochettes qui font patienter tout le monde en fin d'apéro, pendant que la plancha enchaîne. ${PLANCHA}.`,
        ingredients: [
          { name: 'Filets de poulet', qty: 1000, unit: 'g' },
          { name: 'Sauce soja', qty: 12, unit: 'cl' },
          { name: 'Miel', qty: 3, unit: 'c. à s.' },
          { name: 'Gingembre frais râpé', qty: 2, unit: 'c. à s.' },
          { name: 'Gousse d’ail', qty: 1, unit: '' }
        ],
        steps: [
          { text: 'Couper le poulet en cubes. Mélanger 12 cl de soja, 3 c. à s. de miel, le gingembre et l’ail râpé. Verser sur le poulet et laisser au frais.', minutes: 15, passive: true, veille: true, watch: '' },
          { text: 'Embrocher le poulet mariné.', minutes: 15, passive: false, veille: false, watch: '' },
          { text: 'Cuire sur la zone douce de la plancha, feu 4-5, en tournant régulièrement.', minutes: 10, passive: false, veille: false, watch: 'La marinade caramélise et nappe les morceaux.' }
        ]
      },
      {
        course: 'plat',
        name: 'Légumes grillés à l’huile aillée', category: 'plat', servings: 11, prep_minutes: 25, difficulty: 'Facile',
        description: `Poivrons, courgettes et asperges à la plancha, arrosés d’huile aillée. À faire en premier : ils tiennent au chaud. ${PLANCHA}.`,
        ingredients: [
          { name: 'Poivrons rouges et jaunes', qty: 4, unit: '' },
          { name: 'Courgettes moyennes', qty: 3, unit: '' },
          { name: 'Bottes d’asperges vertes', qty: 2, unit: '' },
          { name: 'Huile d’olive (huile aillée)', qty: 8, unit: 'c. à s.' },
          { name: 'Gousses d’ail (huile aillée)', qty: 6, unit: '' },
          { name: 'Persil plat', qty: 1, unit: '' }
        ],
        steps: [
          { text: 'Huile aillée : dans un bol, 8 c. à s. d’huile d’olive, l’ail haché fin et le persil ciselé. Au frais. Elle sert aussi pour les gambas et les finitions.', minutes: 10, passive: false, veille: true, watch: '' },
          { text: 'Préchauffer la plancha à fond (7) pendant 10 à 15 minutes avant de poser quoi que ce soit.', minutes: 15, passive: true, veille: false, watch: 'Une goutte d’eau grésille et s’évapore aussitôt.' },
          { text: 'Couper les poivrons en lanières et les courgettes en rondelles épaisses. Cuire avec les asperges sur la zone douce, feu 4-5, arrosés d’huile aillée. Réserver dans un plat au chaud.', minutes: 8, passive: false, veille: false, watch: 'Légèrement grillés, encore un peu fermes.' }
        ]
      },
      {
        course: 'plat',
        name: 'Pluma ibérique à la plancha', category: 'plat', servings: 11, prep_minutes: 15, difficulty: 'Facile',
        description: `Saisie très chaude, rosée à cœur, fleur de sel et piment d’Espelette. ${PLANCHA}.`,
        ingredients: [
          { name: 'Pluma de cochon ibérique (ou échine persillée)', qty: 1200, unit: 'g' },
          { name: 'Piment d’Espelette', qty: 2, unit: 'c. à c.' },
          { name: 'Fleur de sel', qty: null, unit: '' }
        ],
        steps: [
          { text: 'Saisir sur plaque très chaude, feu 6-7, 3 à 4 minutes par face.', minutes: 8, passive: false, veille: false, watch: 'La viande doit rester rosée.' },
          { text: 'Fleur de sel et Espelette à la sortie. Laisser reposer 5 minutes, puis trancher.', minutes: 5, passive: true, veille: false, watch: '' }
        ]
      },
      {
        course: 'plat',
        name: 'Saumon au miso, peau croustillante', category: 'plat', servings: 11, prep_minutes: 15, difficulty: 'Facile',
        description: `Pavés laqués au miso, cuits côté peau sans y toucher. ${PLANCHA}.`,
        ingredients: [
          { name: 'Pavés de saumon avec peau', qty: 1100, unit: 'g' },
          { name: 'Pâte de miso', qty: 2, unit: 'c. à s.' },
          { name: 'Miel', qty: 1, unit: 'c. à s.' },
          { name: 'Huile d’olive', qty: 1, unit: 'c. à s.' },
          { name: 'Citron', qty: 1, unit: '' }
        ],
        steps: [
          { text: 'Mélanger le miso, le miel et un filet d’huile. Badigeonner les pavés côté chair seulement (pas la peau). Au frais.', minutes: 10, passive: true, veille: true, watch: '' },
          { text: 'Poser côté peau sur plaque chaude, feu 6-7. NE PAS TOUCHER pendant 4 à 5 minutes.', minutes: 5, passive: false, veille: false, watch: 'La peau croustille et le poisson se décolle tout seul.' },
          { text: 'Retourner 1 minute côté chair. Un trait de citron à la sortie.', minutes: 1, passive: false, veille: false, watch: '' }
        ]
      },
      {
        course: 'plat',
        name: 'Gambas à l’huile aillée', category: 'plat', servings: 11, prep_minutes: 10, difficulty: 'Facile',
        description: `Le final spectaculaire : 2 minutes par face, huile aillée et citron, servies immédiatement. ${PLANCHA}.`,
        ingredients: [
          { name: 'Gambas crues entières', qty: 1200, unit: 'g' },
          { name: 'Huile aillée (voir légumes grillés)', qty: 3, unit: 'c. à s.' },
          { name: 'Citron', qty: 1, unit: '' }
        ],
        steps: [
          { text: 'Plaque très chaude, feu 6-7 : 2 minutes par face.', minutes: 4, passive: false, veille: false, watch: 'Elles deviennent bien roses.' },
          { text: 'Arroser d’huile aillée et d’un trait de citron. Servir immédiatement.', minutes: 1, passive: false, veille: false, watch: '' }
        ]
      },
      {
        course: 'plat',
        name: 'Sucrines grillées au parmesan', category: 'plat', servings: 11, prep_minutes: 5, difficulty: 'Facile',
        description: `La surprise : des demi-sucrines fondantes et grillées, copeaux de parmesan. Personne ne s’y attend. ${PLANCHA}.`,
        ingredients: [
          { name: 'Sucrines (gem)', qty: 5, unit: '' },
          { name: 'Parmesan en copeaux', qty: 100, unit: 'g' },
          { name: 'Huile d’olive', qty: 2, unit: 'c. à s.' }
        ],
        steps: [
          { text: 'Couper les sucrines en deux. Poser face coupée sur la plaque, feu 6-7.', minutes: 2, passive: false, veille: false, watch: 'Fondantes et bien grillées.' },
          { text: 'Filet d’huile d’olive et copeaux de parmesan. Servir.', minutes: 1, passive: false, veille: false, watch: '' }
        ]
      }
    ]
  },
  {
    key: 'reprise-2026-08-30-tataki',
    soiree: {
      title: 'Thon tataki à la plancha', date: '2026-08-30', time: '20:30', guests: 7,
      notes: `Les 2 réflexes : mariner court (20-30 min) et saisir court (1-2 min par face, cœur rosé).\nAttention au sésame et au miel, ils caramélisent et brûlent vite.`
    },
    recipes: [
      {
        course: 'plat',
        name: 'Thon tataki à la plancha', category: 'plat', servings: 7, prep_minutes: 45, difficulty: 'Moyen',
        description: `Croûte de sésame, cœur rosé, sauce réduite à la marinade : l’effet restaurant. Marinade sésame, soja, gingembre. ${PLANCHA}.`,
        ingredients: [
          { name: 'Thon rouge ou albacore, en pavés épais', qty: 1200, unit: 'g' },
          { name: 'Graines de sésame', qty: 1, unit: 'c. à s.' },
          { name: 'Huile neutre (pour saisir)', qty: null, unit: '' },
          { name: 'Fleur de sel', qty: null, unit: '' },
          { name: 'Sauce soja', qty: 4, unit: 'c. à s.' },
          { name: 'Huile de sésame grillé', qty: 2, unit: 'c. à s.' },
          { name: 'Miel', qty: 1, unit: 'c. à s.' },
          { name: 'Gingembre frais râpé', qty: 1, unit: 'c. à s.' },
          { name: 'Gousse d’ail', qty: 1, unit: '' },
          { name: 'Citron vert', qty: 0.5, unit: '' }
        ],
        steps: [
          { text: 'Mélanger soja, huile de sésame, miel, gingembre, ail râpé et jus de citron vert. Verser sur les pavés. 20 à 30 minutes MAXIMUM : le soja et le citron « cuisent » la chair à froid.', minutes: 25, passive: true, veille: false, watch: 'Trop long, la chair devient molle et grise.' },
          { text: 'Préchauffer la plancha à fond, feu 6-7.', minutes: 10, passive: true, veille: false, watch: '' },
          { text: 'Égoutter les pavés en GARDANT la marinade pour la sauce. Presser les graines de sésame sur les deux faces.', minutes: 5, passive: false, veille: false, watch: '' },
          { text: 'Saisir sur plaque très chaude avec un filet d’huile, 1 à 2 minutes par face MAXIMUM. Le traiter comme une viande rouge.', minutes: 4, passive: false, veille: false, watch: 'Le cœur doit rester rosé, sinon le thon devient sec et cotonneux.' },
          { text: 'Faire réduire la marinade restante 2 minutes dans une petite casserole.', minutes: 2, passive: false, veille: false, watch: 'Elle devient sirupeuse.' },
          { text: 'Trancher le thon, napper de sauce, fleur de sel et un trait de citron vert.', minutes: 3, passive: false, veille: false, watch: '' }
        ]
      }
    ]
  }
];

async function seed() {
  await q('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now())');
  for (const lot of LOTS) {
    const done = await q('SELECT 1 FROM meta WHERE key = $1', [lot.key]);
    if (done.rows.length) continue;
    const s = lot.soiree;
    const sr = await q('INSERT INTO soirees (title, date, time, guests, notes, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [s.title, s.date, s.time, s.guests, s.notes, 'Reprise OneDrive']);
    const sid = sr.rows[0].id;
    for (const r of lot.recipes) {
      let rid;
      const existing = await q('SELECT id FROM recipes WHERE lower(name) = lower($1)', [r.name]);
      if (existing.rows.length) rid = existing.rows[0].id;
      else {
        const ins = await q(`INSERT INTO recipes (name, category, servings, prep_minutes, difficulty, description, ingredients, steps, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
          [r.name, r.category, r.servings, r.prep_minutes, r.difficulty, r.description, JSON.stringify(r.ingredients), JSON.stringify(r.steps), 'Reprise OneDrive']);
        rid = ins.rows[0].id;
      }
      await q('INSERT INTO soiree_recipes (soiree_id, recipe_id, course) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [sid, rid, r.course]);
    }
    await q('INSERT INTO meta (key, value) VALUES ($1, $2)', [lot.key, String(sid)]);
    console.log(`Reprise importée : ${s.title} (${s.date})`);
  }
}

// Invités des soirées reprises
const GUESTS = {
  key: 'reprise-invites-v1',
  links: [
    { soiree: 'reprise-2026-07-04-plancha', friends: [
      { name: 'Raphael Brayer et sa femme', know: 'Raphael, copain architecte' },
      { name: 'Stéphane & Anne Trenel' },
      { name: 'Éric & Anso Rodier' }
    ] },
    { soiree: 'reprise-2026-08-30-tataki', friends: [
      { name: 'Frédéric, Sandrine & Valentine Michel', know: 'Frédéric, cousin de Jérôme ; Valentine, leur fille' },
      { name: 'Maman', know: 'Famille' },
      { name: 'Ma sœur', know: 'Famille' }
    ] }
  ]
};

async function seedGuests() {
  const done = await q('SELECT 1 FROM meta WHERE key = $1', [GUESTS.key]);
  if (done.rows.length) return;
  for (const l of GUESTS.links) {
    const m = await q('SELECT value FROM meta WHERE key = $1', [l.soiree]);
    if (!m.rows.length) continue;
    const sid = parseInt(m.rows[0].value, 10);
    for (const f of l.friends) {
      const ex = await q('SELECT id FROM friends WHERE lower(name) = lower($1)', [f.name]);
      const fid = ex.rows.length ? ex.rows[0].id
        : (await q('INSERT INTO friends (name, know) VALUES ($1, $2) RETURNING id', [f.name, f.know || null])).rows[0].id;
      await q('INSERT INTO soiree_friends VALUES ($1, $2) ON CONFLICT DO NOTHING', [sid, fid]);
    }
  }
  await q('INSERT INTO meta (key, value) VALUES ($1, $2)', [GUESTS.key, 'ok']);
  console.log('Reprise importée : invités des soirées plancha et tataki');
}

async function seedAll() {
  await seed();
  await seedGuests();
}

module.exports = { seed: seedAll };
