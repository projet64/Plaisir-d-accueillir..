// Création de fiches recettes avec Claude (clé ANTHROPIC_API_KEY côté serveur uniquement)
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

const FORMAT = `Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :
{
  "name": "Nom de la recette",
  "category": "apero" | "entree" | "plat" | "fromage" | "dessert" | "cocktail",
  "servings": 4,
  "prep_minutes": 45,
  "difficulty": "Facile" | "Moyen" | "Difficile",
  "description": "Une ou deux phrases qui donnent envie.",
  "ingredients": [ { "name": "Farine", "qty": 250, "unit": "g" } ],
  "steps": [ { "text": "Consigne claire, à l'impératif.", "minutes": 10, "passive": false, "veille": false, "watch": "Signe à guetter (facultatif)" } ]
}
Règles :
- Tout en français, ton chaleureux et précis, comme un bon chef qui explique à un ami.
- "unit" parmi : g, kg, ml, cl, l, c. à s., c. à c., pincée, ou "" pour les pièces (œufs, oignons...). "qty" est un nombre, ou null pour "selon le goût".
- "minutes" = durée réaliste de l'étape (cuissons, repos, marinades comprises). 0 si instantané.
- "passive": true si l'étape ne demande pas d'être devant (mijotage, repos, four).
- "veille": true seulement si l'étape doit être faite la veille (marinade, dessalage...).
- "watch": le signe concret qui dit que c'est prêt (« la sauce nappe la cuillère »), sinon "".
- 4 à 12 étapes, dans l'ordre.
- ALLERGIE DANS LA FAMILLE : Jérôme est allergique aux POIS CHICHES. N'utilise JAMAIS de pois chiches ni de dérivés (houmous, farine de pois chiche / besan, falafel, socca, panisse, aquafaba). Si la recette d'origine en contient, remplace-les par une alternative adaptée et signale le remplacement dans la description.`;

const ALLERGEN = /pois[\s-]*chiche|chick[\s-]*pea|garbanzo|houmous|hummus|falafel|socca|panisse|aquafaba|besan/i;
const hasAllergen = (r) => ALLERGEN.test(JSON.stringify(r.ingredients || [])) || r.steps.some((x) => ALLERGEN.test(x.text));

async function callClaude(content, retry = false) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    const e = new Error("La clé API Claude n'est pas encore configurée sur le serveur.");
    e.status = 503;
    throw e;
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system: "Tu es le chef de cuisine de la famille Bouzeran, à Nîmes. Tu rédiges des fiches recettes fiables pour l'appli familiale « Plaisir d'accueillir ».",
      messages: [{ role: 'user', content }]
    })
  });
  const data = await res.json();
  if (!res.ok) {
    const e = new Error((data && data.error && data.error.message) || 'Erreur de l’IA');
    e.status = 502;
    throw e;
  }
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw Object.assign(new Error("L'IA n'a pas renvoyé de fiche exploitable."), { status: 502 });
  const r = normalize(JSON.parse(m[0]));
  if (hasAllergen(r) && !retry) {
    // Une seconde chance, avec la consigne rappelée en tête
    const again = typeof content === 'string'
      ? 'RAPPEL ABSOLU : aucun pois chiche ni dérivé, Jérôme est allergique.\n\n' + content
      : [{ type: 'text', text: 'RAPPEL ABSOLU : aucun pois chiche ni dérivé, Jérôme est allergique.' }, ...content];
    return callClaude(again, true);
  }
  if (hasAllergen(r)) throw Object.assign(new Error('La fiche proposée contenait des pois chiches : refusée. Reformule la demande.'), { status: 422 });
  return r;
}

const CATS = ['apero', 'entree', 'plat', 'fromage', 'dessert', 'cocktail'];
function normalize(r) {
  return {
    name: String(r.name || 'Nouvelle recette').slice(0, 200),
    category: CATS.includes(r.category) ? r.category : 'plat',
    servings: Math.max(1, parseInt(r.servings, 10) || 4),
    prep_minutes: parseInt(r.prep_minutes, 10) || null,
    difficulty: r.difficulty || 'Facile',
    description: r.description || '',
    ingredients: (Array.isArray(r.ingredients) ? r.ingredients : []).map((i) => ({
      name: String(i.name || '').trim(),
      qty: i.qty === null || i.qty === undefined || i.qty === '' ? null : Number(i.qty),
      unit: i.unit || ''
    })).filter((i) => i.name),
    steps: (Array.isArray(r.steps) ? r.steps : []).map((s) => ({
      text: String(s.text || '').trim(),
      minutes: Math.max(0, parseInt(s.minutes, 10) || 0),
      passive: !!s.passive,
      veille: !!s.veille,
      watch: s.watch || ''
    })).filter((s) => s.text)
  };
}

function htmlToText(html) {
  // Garde d'abord les données structurées de recette si le site en publie (JSON-LD)
  const ld = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join('\n');
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
  return (ld.slice(0, 15000) + '\n' + body.slice(0, 20000)).trim();
}

async function draftRecipe({ mode, input, image, mime }) {
  if (mode === 'photo') {
    if (!image) throw Object.assign(new Error('Photo manquante.'), { status: 400 });
    return callClaude([
      { type: 'image', source: { type: 'base64', media_type: mime || 'image/jpeg', data: image } },
      { type: 'text', text: `Voici la photo d'une recette (cahier manuscrit, page de livre ou capture d'écran). Retranscris-la fidèlement en fiche, en complétant seulement les durées manquantes.${input ? ' Précision de la famille : ' + input : ''}\n\n${FORMAT}` }
    ]);
  }
  if (mode === 'link') {
    let url;
    try { url = new URL(input); } catch { throw Object.assign(new Error('Lien invalide.'), { status: 400 }); }
    if (/(^|\.)(instagram|tiktok|facebook|fb)\.com$/.test(url.hostname)) {
      throw Object.assign(new Error('Instagram, TikTok et Facebook bloquent la lecture de leurs pages. Fais une capture d’écran de la publication et passe par « Photo de la recette », ou copie la légende dans « La dicter ».'), { status: 400 });
    }
    const page = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (PlaisirDAccueillir)' } });
    if (!page.ok) throw Object.assign(new Error('Impossible d’ouvrir ce lien.'), { status: 400 });
    const text = htmlToText(await page.text());
    const r = await callClaude(`Voici le contenu d'une page web contenant une recette. Retranscris-la fidèlement en fiche.\n\n---\n${text}\n---\n\n${FORMAT}`);
    r.source = url.toString();
    return r;
  }
  if (mode === 'text') {
    return callClaude(`Voici une recette racontée par la famille (dictée ou tapée). Mets-la au propre en fiche, sans en changer l'esprit.\n\n---\n${input}\n---\n\n${FORMAT}`);
  }
  // mode "name" ou idée libre (« invente-moi un dessert aux figues pour 8 »)
  return callClaude(`Demande de la famille : « ${input} ».\nSi c'est un nom de plat, rédige la recette classique, bien faite. Si c'est une envie ou une idée, invente une recette qui y répond.\n\n${FORMAT}`);
}

module.exports = { draftRecipe };
