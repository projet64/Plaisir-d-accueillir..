/* Plaisir d'accueillir — application (vanilla JS, routage par #) */
(() => {
'use strict';

// ---------- Utilitaires ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = $('#app');
let WHO = localStorage.getItem('pda-who') || '';
let AI_ON = false;

const CATS = [
  ['apero', 'Apéro'], ['entree', 'Entrée'], ['plat', 'Plat'], ['dessert', 'Dessert'], ['cocktail', 'Cocktail']
];
const CAT = Object.fromEntries(CATS);
const COURSE_ORDER = ['cocktail', 'apero', 'entree', 'plat', 'dessert'];
// Moment du service par rapport à l'heure « à table » (minutes)
const SERVE_OFFSET = { cocktail: -30, apero: -30, entree: 0, plat: 30, dessert: 75 };
const UNITS = ['', 'g', 'kg', 'ml', 'cl', 'l', 'c. à s.', 'c. à c.', 'pincée'];

const I = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  photo: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  spark: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  play: '<path d="M7 5l12 7-12 7z"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  warn: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  cart: '<path d="M6 6h15l-2 9H8L6 3H3"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  plate: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>'
};
const ico = (n, extra = '') => `<svg viewBox="0 0 24 24" fill="${n === 'heart-on' ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${I[n === 'heart-on' ? 'heart' : n]}</svg>`;

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json', 'x-who': encodeURIComponent(WHO) },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin'
  });
  if (res.status === 401 && !url.startsWith('/api/login')) { renderLogin(); throw new Error('Non connecté'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
}
const GET = (u) => api('GET', u);

const photoUrl = (id) => (id ? `/api/photos/${id}` : '');
const thumb = (id, cls = 'thumb') => id
  ? `<div class="${cls}" style="background-image:url('${photoUrl(id)}')"></div>`
  : `<div class="${cls} ph">${ico('plate', 'class="ph-ico"')}</div>`;

const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dateObj = (iso) => { const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
const fmtDate = (iso, opts = { weekday: 'long', day: 'numeric', month: 'long' }) => dateObj(iso).toLocaleDateString('fr-FR', opts);
const fmtDateShort = (iso) => dateObj(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (t) => String(t || '20:30').replace(':', ' h ');
const fmtMin = (m) => { m = +m || 0; if (m < 60) return `${m} min`; const h = Math.floor(m / 60), r = m % 60; return r ? `${h} h ${String(r).padStart(2, '0')}` : `${h} h`; };
const daysUntil = (iso) => Math.round((dateObj(iso) - dateObj(todayISO())) / 86400000);
const initials = (n) => String(n || '?').trim().split(/\s+|&/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const AV_COLORS = ['#5E6B3A', '#9E4526', '#7A5A3A', '#4E5A6B', '#8A6A2A', '#6B4A5E'];
const avColor = (s) => AV_COLORS[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];

function fmtQty(q, unit) {
  if (q === null || q === undefined || q === '' || isNaN(q)) return unit ? unit : 'selon le goût';
  let v = +q, u = unit || '';
  if (u === 'g' && v >= 1000) { v /= 1000; u = 'kg'; }
  if (u === 'ml' && v >= 1000) { v /= 1000; u = 'l'; }
  if (u === 'cl' && v >= 100) { v /= 100; u = 'l'; }
  let s;
  if (u === 'g' || u === 'ml') s = String(v >= 100 ? Math.round(v / 5) * 5 : Math.round(v));
  else if (!u) s = String(Math.ceil(v * 2) / 2).replace('.5', ' ½').replace(/^0 ½$/, '½');
  else s = String(Math.round(v * 10) / 10);
  return `${s.replace('.', ',')}${u ? ' ' + u : ''}`;
}

// Compression des photos côté iPad avant envoi (max 1600 px, JPEG)
function compressImage(file, max = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const dataUrl = c.toDataURL('image/jpeg', quality);
      resolve({ data: dataUrl.split(',')[1], mime: 'image/jpeg', preview: dataUrl });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible')); };
    img.src = url;
  });
}
function pickPhoto() {
  return new Promise((resolve) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async () => { const f = inp.files && inp.files[0]; resolve(f ? await compressImage(f) : null); };
    inp.click();
  });
}
async function uploadPhoto() {
  const img = await pickPhoto();
  if (!img) return null;
  toast('Envoi de la photo…');
  const r = await api('POST', '/api/photos', { data: img.data, mime: img.mime });
  return r.id;
}

function modal(html, onMount) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="card modal" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(bg);
  const close = () => bg.remove();
  bg.addEventListener('click', (e) => { if (e.target === bg) close(); });
  onMount && onMount($('.modal', bg), close);
  return close;
}

// ---------- Mise en page ----------
const NAV = [
  ['#/', 'home', 'Accueil'], ['#/recettes', 'book', 'Recettes'], ['#/soirees', 'cal', 'Soirées'], ['#/amis', 'users', 'Amis'], ['#/souvenirs', 'photo', 'Souvenirs']
];
function shell(active, content) {
  app.innerHTML = `<div class="shell">
    <nav class="side" aria-label="Navigation">
      <a class="brand" href="#/">Plaisir<br><em class="acc">d’accueillir</em></a>
      <div class="nav">${NAV.map(([h, i, l]) => `<a href="${h}" class="${active === h ? 'on' : ''}">${ico(i)}${l}</a>`).join('')}</div>
      <button class="me" type="button" id="me-btn"><span class="avatar">${esc(initials(WHO))}</span><span><b style="display:block;font-size:14px">${esc(WHO || 'Qui es-tu ?')}</b><span class="muted" style="font-size:12px">Famille Bouzeran</span></span></button>
    </nav>
    <main class="main" id="view">${content}</main>
  </div>`;
  const me = $('#me-btn');
  if (me) me.onclick = askWho;
  window.scrollTo(0, 0);
}
const loading = (active) => shell(active, '<div class="empty"><div class="spinner"></div></div>');
const backLink = (href, label) => `<a class="back" href="${href}">${ico('back', 'width="18" height="18"')}${esc(label)}</a>`;

function askWho() {
  modal(`<h2>Qui utilise l’appli ?</h2>
    <p class="muted" style="margin:0">Ton prénom apparaît sur les recettes et soirées que tu crées.</p>
    <div class="chips">${['Jérôme', 'Véronique'].map((n) => `<button class="chip" data-n="${n}">${n}</button>`).join('')}</div>
    <div class="field"><label for="who-in">Ou un autre prénom</label><input class="input" id="who-in" value="${esc(WHO)}"></div>
    <div class="row-end"><button class="btn btn-primary" id="who-ok">Valider</button></div>`, (m, close) => {
    $$('[data-n]', m).forEach((b) => (b.onclick = () => { $('#who-in', m).value = b.dataset.n; }));
    $('#who-ok', m).onclick = () => { WHO = $('#who-in', m).value.trim(); localStorage.setItem('pda-who', WHO); close(); route(); };
  });
}

// ---------- Connexion ----------
function renderLogin() {
  app.innerHTML = `<div class="login"><form class="card" id="login">
    <h1>Plaisir <em class="acc" style="color:var(--terra-dark)">d’accueillir</em></h1>
    <p class="muted" style="margin:0">L’appli des recettes et des soirées de la famille.</p>
    <div class="field"><label for="code">Code famille</label><input class="input" id="code" autocomplete="current-password" autocapitalize="none" required></div>
    <div class="field"><label for="who">Ton prénom</label><input class="input" id="who" value="${esc(WHO)}" placeholder="Jérôme, Véronique…"></div>
    <button class="btn btn-primary btn-lg" type="submit">Entrer</button>
    <p id="err" style="margin:0;color:var(--terra-dark)"></p>
  </form></div>`;
  $('#login').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await api('POST', '/api/login', { code: $('#code').value });
      WHO = $('#who').value.trim(); localStorage.setItem('pda-who', WHO);
      route();
    } catch (err) { $('#err').textContent = err.message; }
  };
}

// ---------- Accueil ----------
async function viewHome() {
  loading('#/');
  const [recipes, soirees] = await Promise.all([GET('/api/recipes'), GET('/api/soirees')]);
  const today = todayISO();
  const next = soirees.filter((s) => s.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  let nextHtml;
  if (next) {
    const full = await GET(`/api/soirees/${next.id}`);
    const list = shoppingList(full);
    const got = list.filter((i) => full.checked && full.checked[i.key]).length;
    const cover = (full.photos[0] && full.photos[0].photo_id) || (full.recipes.find((r) => r.photo_id) || {}).photo_id;
    const d = daysUntil(next.date);
    nextHtml = `<section class="card next">
      <div class="cover" style="${cover ? `background-image:url('${photoUrl(cover)}')` : ''}"></div>
      <div class="body">
        <span class="eyebrow">Prochaine soirée · ${d === 0 ? 'ce soir' : d === 1 ? 'demain' : `dans ${d} jours`}</span>
        <h2>${esc(fmtDate(next.date))}, ${fmtTime(next.time)}</h2>
        <div class="muted" style="line-height:1.45">${next.guests} convives${full.friends.length ? ' · ' + esc(full.friends.map((f) => f.name).join(', ')) : ''}${next.menu ? '<br>' + esc(next.menu) : ''}</div>
        ${list.length ? `<div class="row" style="flex-wrap:nowrap"><div style="flex-grow:1;display:flex;flex-direction:column;gap:6px"><div class="row muted" style="justify-content:space-between;font-size:13px"><span>Courses</span><span>${got} / ${list.length}</span></div><div class="bar"><div style="width:${Math.round(100 * got / list.length)}%"></div></div></div>
        <a class="btn btn-primary" href="#/soiree/${next.id}/planning">Rétroplanning</a></div>` : `<a class="btn btn-primary" href="#/soiree/${next.id}" style="align-self:flex-start">Composer le menu</a>`}
      </div></section>`;
  } else {
    nextHtml = `<section class="card empty"><h2>Aucune soirée prévue</h2><p class="muted" style="margin:0">On invite qui, et quand ?</p><a class="btn btn-primary" href="#/soiree/new">Prévoir une soirée</a></section>`;
  }
  const counts = Object.fromEntries(CATS.map(([k]) => [k, recipes.filter((r) => r.category === k).length]));
  const h = new Date().getHours();
  shell('#/', `<div class="home">
    <div class="page-head">
      <div><span class="muted" style="color:#E8D9C4">${esc(fmtDate(today))}</span><h1 style="color:#FFF8EE">${h < 18 ? 'Bonjour' : 'Bonsoir'}${WHO ? ' ' + esc(WHO) : ''}</h1></div>
      <a class="btn btn-ghost" href="#/soiree/new">${ico('plus')}Nouvelle soirée</a>
    </div>
    <div class="home-grid">
      <div>${nextHtml}
        <form class="card ask" id="ask"><span style="color:var(--terra-dark);display:flex">${ico('spark', 'width="24" height="24"')}</span>
          <label class="sr" for="ask-in">Demander une recette</label>
          <input id="ask-in" placeholder="Invente-moi un dessert aux figues pour 8, ou colle un lien…" autocomplete="off">
          <button type="submit" aria-label="Envoyer">${ico('arrow', 'width="22" height="22"')}</button></form>
      </div>
      <div class="stack">
        <section class="stack" style="gap:12px"><h2 style="color:#FFF8EE">Le carnet</h2>
          <div class="cats">${CATS.map(([k, l]) => `<a class="card" href="#/recettes?cat=${k}"><b>${counts[k]}</b><span>${l}</span></a>`).join('')}</div></section>
        <section class="stack" style="gap:12px"><div class="row" style="justify-content:space-between"><h2 style="color:#FFF8EE">Ajoutées récemment</h2><a href="#/recettes">Tout voir</a></div>
          ${recipes.length ? `<div class="grid-2" style="gap:14px">${recipes.slice(0, 4).map(recipeCard).join('')}</div>`
            : `<div class="card empty"><p style="margin:0">Le carnet est vide pour l’instant.</p><a class="btn btn-primary" href="#/ajouter">Ajouter une première recette</a></div>`}
        </section>
      </div>
    </div></div>`);
  $('#ask').onsubmit = (e) => {
    e.preventDefault();
    const v = $('#ask-in').value.trim();
    if (!v) return;
    const mode = /^https?:\/\//i.test(v) ? 'link' : 'name';
    sessionStorage.setItem('pda-ask', JSON.stringify({ mode, input: v }));
    location.hash = '#/ajouter';
  };
}
const recipeCard = (r) => `<a class="rcard" href="#/recette/${r.id}">${thumb(r.photo_id)}<span class="t">${esc(r.name)}</span><span class="m">${CAT[r.category] || ''}${r.prep_minutes ? ' · ' + fmtMin(r.prep_minutes) : ''}${r.served ? ` · servie ${r.served}×` : ''}</span></a>`;

// ---------- Recettes ----------
async function viewRecipes(params) {
  loading('#/recettes');
  const recipes = await GET('/api/recipes');
  let cat = params.get('cat') || '';
  let qtxt = params.get('q') || '';
  shell('#/recettes', `<div class="page-head"><div><span class="eyebrow">Le carnet</span><h1>Nos <em class="acc">recettes</em></h1></div>
      <a class="btn btn-primary" href="#/ajouter">${ico('plus')}Ajouter une recette</a></div>
    <div class="stack"><input class="input" id="rq" type="search" placeholder="Chercher une recette…" value="${esc(qtxt)}">
      <div class="chips" id="rcats"><button class="chip" data-c="">Toutes</button>${CATS.map(([k, l]) => `<button class="chip" data-c="${k}">${l}</button>`).join('')}<button class="chip" data-c="fav">${ico('heart', 'width="16" height="16"')}Favorites</button></div>
      <div class="grid-cards" id="rgrid"></div></div>`);
  const draw = () => {
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const list = recipes.filter((r) => (!cat || (cat === 'fav' ? r.favorite : r.category === cat)) && (!qtxt || norm(r.name).includes(norm(qtxt))));
    $$('#rcats .chip').forEach((c) => c.classList.toggle('on', c.dataset.c === cat));
    $('#rgrid').innerHTML = list.length ? list.map(recipeCard).join('') : `<p class="muted">Rien ici pour l’instant.</p>`;
  };
  $$('#rcats .chip').forEach((c) => (c.onclick = () => { cat = c.dataset.c; draw(); }));
  $('#rq').oninput = (e) => { qtxt = e.target.value; draw(); };
  draw();
}

async function viewRecipe(id) {
  loading('#/recettes');
  const r = await GET(`/api/recipes/${id}`);
  let n = r.servings;
  const lastNote = r.history.find((h) => h.note);
  const render = () => {
    const k = n / r.servings;
    shell('#/recettes', `${backLink('#/recettes', 'Recettes')}
    <div class="recipe">
      <div class="stack">
        <div class="photo" style="${r.photo_id ? `background-image:url('${photoUrl(r.photo_id)}')` : ''}">
          ${r.photo_id && r.photo_kind === 'illustration' ? '<span class="tag">Illustration</span>' : ''}
          ${!r.photo_id ? `<div style="margin:auto;text-align:center;display:flex;flex-direction:column;gap:12px;align-items:center"><span class="muted">Pas encore de photo du plat</span></div>` : ''}
          <div class="row"><button class="btn btn-amber" id="ph">${ico('cam')}${r.photo_id ? 'Changer la photo' : 'Ajouter ma photo'}</button></div>
          ${lastNote ? `<div class="card" style="padding:14px 16px"><span style="font-family:var(--serif);font-style:italic;font-size:17px">« ${esc(lastNote.note)} »</span><br><span class="muted" style="font-size:12px">Souvenir · ${esc(lastNote.title)}, ${fmtDateShort(lastNote.date)}</span></div>` : ''}
        </div>
      </div>
      <div class="stack" style="gap:22px">
        <div class="stack" style="gap:8px">
          <div class="row" style="justify-content:space-between;flex-wrap:nowrap;align-items:flex-start"><span class="eyebrow">${CAT[r.category] || ''}</span>
            <button class="icon-btn" id="fav" aria-label="${r.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}" style="color:var(--amber)">${ico(r.favorite ? 'heart-on' : 'heart')}</button></div>
          <h1>${esc(r.name)}</h1>
          <div class="muted">${[r.prep_minutes ? fmtMin(r.prep_minutes) : '', r.difficulty, r.steps.some((s) => s.veille) ? 'à préparer la veille' : ''].filter(Boolean).map(esc).join(' · ')}</div>
          ${r.description ? `<p style="margin:4px 0 0;line-height:1.5">${esc(r.description)}</p>` : ''}
        </div>
        <div class="grid-auto">
          <section>
            <div class="card stepper"><span style="font-weight:500">Pour ${n} convive${n > 1 ? 's' : ''}</span><div class="ctl">
              <button id="minus" aria-label="Un convive de moins">−</button><b>${n}</b><button id="plus" aria-label="Un convive de plus">+</button></div></div>
            <div class="ings">${r.ingredients.map((i) => `<div><span>${esc(i.name)}</span><b>${esc(fmtQty(i.qty === null ? null : i.qty * k, i.unit))}</b></div>`).join('') || '<p class="muted">Aucun ingrédient.</p>'}</div>
          </section>
          <section class="stack" style="gap:12px"><h2>Les étapes</h2>
            <ol class="steps">${r.steps.map((s, i) => `<li><span class="n">${i + 1}</span><span>${s.veille ? '<b>La veille :</b> ' : ''}${esc(s.text)}${s.minutes ? ` <span class="d">${fmtMin(s.minutes)}</span>` : ''}</span></li>`).join('') || '<li class="muted">Aucune étape.</li>'}</ol>
          </section>
        </div>
        <div class="row-end">
          <a class="btn btn-ghost" href="#/recette/${r.id}/edit">${ico('pen')}Modifier</a>
          <button class="btn btn-ghost" id="to-soiree">Ajouter à une soirée</button>
          ${r.steps.length ? `<a class="btn btn-primary btn-lg" href="#/cuisson/${r.id}?n=${n}">${ico('play')}Mode cuisson</a>` : ''}
        </div>
        <section class="stack" style="gap:12px"><h2>Déjà servie à</h2>
          ${r.history.length ? `<div class="hist">${r.history.map((h) => `<a href="#/soiree/${h.id}"><b>${esc(h.title)}</b><span class="muted" style="font-size:14px">${fmtDateShort(h.date)} · ${h.guests} convives${h.friends ? ' · ' + esc(h.friends) : ''}</span>${h.note ? `<span class="note">« ${esc(h.note)} »</span>` : ''}</a>`).join('')}</div>` : '<p class="muted" style="margin:0">Pas encore servie lors d’une soirée.</p>'}
          ${r.source ? `<p class="muted" style="margin:0;font-size:13px">Source : <a href="${esc(r.source)}" target="_blank" rel="noopener">${esc(new URL(r.source).hostname)}</a></p>` : ''}
        </section>
      </div>
    </div>`);
    $('#minus').onclick = () => { n = Math.max(1, n - 1); render(); };
    $('#plus').onclick = () => { n = Math.min(60, n + 1); render(); };
    $('#fav').onclick = async () => { r.favorite = !r.favorite; await api('PUT', `/api/recipes/${r.id}`, r); render(); };
    $('#ph').onclick = async () => {
      const pid = await uploadPhoto(); if (!pid) return;
      r.photo_id = pid; r.photo_kind = 'mine';
      await api('PUT', `/api/recipes/${r.id}`, r); toast('Photo enregistrée'); render();
    };
    $('#to-soiree').onclick = () => addToSoiree(r);
  };
  render();
}

async function addToSoiree(r) {
  const soirees = (await GET('/api/soirees')).filter((s) => s.date >= todayISO());
  modal(`<h2>Ajouter « ${esc(r.name)} » à…</h2>
    <div class="pick">${soirees.map((s) => `<button data-id="${s.id}"><span><b>${esc(s.title)}</b><br><span class="muted">${esc(fmtDate(s.date))}</span></span>${ico('plus', 'width="20" height="20"')}</button>`).join('') || '<p class="muted">Aucune soirée à venir.</p>'}</div>
    <div class="row-end"><a class="btn btn-ghost-dark" href="#/soiree/new?recipe=${r.id}">Nouvelle soirée</a></div>`, (m, close) => {
    $$('[data-id]', m).forEach((b) => (b.onclick = async () => {
      const s = await GET(`/api/soirees/${b.dataset.id}`);
      const recipes = s.recipes.map((x) => ({ recipe_id: x.id, course: x.course }));
      if (!recipes.some((x) => x.recipe_id === r.id)) recipes.push({ recipe_id: r.id, course: r.category });
      await api('PUT', `/api/soirees/${s.id}`, { recipes });
      close(); toast('Ajoutée au menu'); location.hash = `#/soiree/${s.id}`;
    }));
    $('a', m).onclick = close;
  });
}

// ---------- Édition d'une recette ----------
async function viewRecipeEdit(id, draft) {
  let r;
  if (draft) r = draft;
  else if (id === 'new') r = { name: '', category: 'plat', servings: 4, ingredients: [{ name: '', qty: null, unit: 'g' }], steps: [{ text: '', minutes: 0 }] };
  else { loading('#/recettes'); r = await GET(`/api/recipes/${id}`); }
  const isNew = !r.id;
  const render = () => {
    shell('#/recettes', `${backLink(isNew ? '#/ajouter' : `#/recette/${r.id}`, isNew ? 'Ajouter' : 'Retour à la fiche')}
    <div class="page-head"><h1>${isNew ? 'Vérifier la <em class="acc">fiche</em>' : 'Modifier la <em class="acc">fiche</em>'}</h1>
      ${draft ? '<span class="muted">Préparée par l’IA · corrige ce qu’il faut avant d’enregistrer</span>' : ''}</div>
    <form id="rf" class="stack" style="gap:28px">
      <div class="form-grid">
        <div class="field span-4"><label for="f-name">Nom</label><input class="input" id="f-name" value="${esc(r.name)}" required></div>
        <div class="field"><label for="f-cat">Catégorie</label><select class="input" id="f-cat">${CATS.map(([k, l]) => `<option value="${k}" ${r.category === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label for="f-serv">Pour (convives)</label><input class="input" id="f-serv" type="number" min="1" value="${r.servings || 4}"></div>
        <div class="field"><label for="f-prep">Temps total (min)</label><input class="input" id="f-prep" type="number" min="0" value="${r.prep_minutes || ''}"></div>
        <div class="field"><label for="f-diff">Difficulté</label><select class="input" id="f-diff">${['Facile', 'Moyen', 'Difficile'].map((d) => `<option ${r.difficulty === d ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
        <div class="field span-4"><label for="f-desc">Description</label><textarea class="input" id="f-desc" rows="2">${esc(r.description || '')}</textarea></div>
      </div>
      <section class="stack"><h2>Ingrédients <span class="muted" style="font-size:15px;font-family:var(--sans);font-weight:400">pour ${r.servings || 4}</span></h2>
        <div class="lines" id="ings">${r.ingredients.map((i, k) => `<div class="line ing" data-k="${k}">
          <input class="input" type="number" step="any" min="0" placeholder="Qté" value="${i.qty ?? ''}" data-f="qty" aria-label="Quantité">
          <select class="input" data-f="unit" aria-label="Unité">${UNITS.map((u) => `<option value="${u}" ${i.unit === u ? 'selected' : ''}>${u || 'pièce'}</option>`).join('')}</select>
          <input class="input" placeholder="Ingrédient" value="${esc(i.name)}" data-f="name" aria-label="Ingrédient">
          <button type="button" class="icon-btn" data-del aria-label="Supprimer">${ico('trash')}</button></div>`).join('')}</div>
        <button type="button" class="btn btn-quiet" id="add-ing" style="align-self:flex-start">${ico('plus')}Ingrédient</button>
      </section>
      <section class="stack"><h2>Étapes</h2>
        <div class="lines" id="steps">${r.steps.map((s, k) => `<div class="line step" data-k="${k}">
          <span style="font-family:var(--serif);font-size:20px;color:var(--amber);padding-top:10px">${k + 1}</span>
          <div><textarea class="input" rows="2" data-f="text" placeholder="Consigne" aria-label="Consigne">${esc(s.text)}</textarea>
            <div class="step-opts"><label class="check">Durée <input class="input" type="number" min="0" value="${s.minutes || 0}" data-f="minutes" aria-label="Durée en minutes"> min</label>
              <label class="check"><input type="checkbox" data-f="passive" ${s.passive ? 'checked' : ''}> Sans surveillance</label>
              <label class="check"><input type="checkbox" data-f="veille" ${s.veille ? 'checked' : ''}> La veille</label></div>
            <input class="input" style="margin-top:6px;min-height:40px" placeholder="À guetter (facultatif) : « la sauce nappe la cuillère »" value="${esc(s.watch || '')}" data-f="watch" aria-label="Signe à guetter"></div>
          <button type="button" class="icon-btn" data-del aria-label="Supprimer">${ico('trash')}</button></div>`).join('')}</div>
        <button type="button" class="btn btn-quiet" id="add-step" style="align-self:flex-start">${ico('plus')}Étape</button>
      </section>
      <div class="row-end">${!isNew ? '<button type="button" class="btn btn-danger" id="del">Supprimer</button>' : ''}
        <button class="btn btn-primary btn-lg" type="submit">Enregistrer dans le carnet</button></div>
    </form>`);
    const collect = () => {
      r.name = $('#f-name').value.trim(); r.category = $('#f-cat').value; r.servings = +$('#f-serv').value || 4;
      r.prep_minutes = +$('#f-prep').value || null; r.difficulty = $('#f-diff').value; r.description = $('#f-desc').value.trim();
      r.ingredients = $$('#ings .line').map((l) => ({ qty: $('[data-f=qty]', l).value === '' ? null : +$('[data-f=qty]', l).value, unit: $('[data-f=unit]', l).value, name: $('[data-f=name]', l).value.trim() }));
      r.steps = $$('#steps .line').map((l) => ({ text: $('[data-f=text]', l).value.trim(), minutes: +$('[data-f=minutes]', l).value || 0, passive: $('[data-f=passive]', l).checked, veille: $('[data-f=veille]', l).checked, watch: $('[data-f=watch]', l).value.trim() }));
    };
    $('#add-ing').onclick = () => { collect(); r.ingredients.push({ name: '', qty: null, unit: 'g' }); render(); };
    $('#add-step').onclick = () => { collect(); r.steps.push({ text: '', minutes: 0 }); render(); };
    $$('[data-del]').forEach((b) => (b.onclick = () => {
      collect(); const line = b.closest('.line'); const k = +line.dataset.k;
      (line.classList.contains('ing') ? r.ingredients : r.steps).splice(k, 1); render();
    }));
    const del = $('#del');
    if (del) del.onclick = async () => { if (!confirm('Supprimer cette recette ?')) return; await api('DELETE', `/api/recipes/${r.id}`); toast('Recette supprimée'); location.hash = '#/recettes'; };
    $('#rf').onsubmit = async (e) => {
      e.preventDefault(); collect();
      r.ingredients = r.ingredients.filter((i) => i.name); r.steps = r.steps.filter((s) => s.text);
      if (isNew) { const res = await api('POST', '/api/recipes', r); toast('Recette enregistrée'); location.hash = `#/recette/${res.id}`; }
      else { await api('PUT', `/api/recipes/${r.id}`, r); toast('Modifications enregistrées'); location.hash = `#/recette/${r.id}`; }
    };
  };
  render();
}

// ---------- Ajouter une recette ----------
function viewAdd() {
  const pending = JSON.parse(sessionStorage.getItem('pda-ask') || 'null');
  sessionStorage.removeItem('pda-ask');
  let mode = (pending && pending.mode) || 'name';
  let image = null;
  const DOORS = [['name', 'pen', 'Un nom ou une idée', 'l’IA rédige la fiche'], ['photo', 'cam', 'Photo de la recette', 'cahier, livre, capture'], ['link', 'link', 'Un lien web', 'site, blog'], ['text', 'mic', 'La dicter', 'comme tu la racontes']];
  const render = () => {
    shell('#/recettes', `${backLink('#/recettes', 'Recettes')}
    <div class="page-head"><h1>Ajouter une <em class="acc">recette</em></h1><a class="btn btn-ghost" href="#/recette/new/edit">Saisir à la main</a></div>
    ${!AI_ON ? `<div class="alert" style="margin-bottom:20px">${ico('warn')}<span>L’IA n’est pas encore branchée (clé API à ajouter sur Railway). En attendant, utilise « Saisir à la main ».</span></div>` : ''}
    <div class="doors">${DOORS.map(([k, i, t, s]) => `<button class="door ${mode === k ? 'on' : ''}" data-m="${k}" type="button">${ico(i)}<span><b>${t}</b><span>${s}</span></span></button>`).join('')}</div>
    <form id="af" class="stack section">
      ${mode === 'name' ? `<div class="field"><label for="a-in">Nom de la recette, ou ton envie</label><input class="input" id="a-in" placeholder="Gardiane de taureau · un dessert léger aux figues pour 8…" value="${esc(pending && pending.mode === 'name' ? pending.input : '')}"></div>` : ''}
      ${mode === 'link' ? `<div class="field"><label for="a-in">Adresse de la page</label><input class="input" id="a-in" type="url" placeholder="https://…" value="${esc(pending && pending.mode === 'link' ? pending.input : '')}"></div>` : ''}
      ${mode === 'text' ? `<div class="field"><label for="a-in">Raconte la recette</label><textarea class="input" id="a-in" rows="8" placeholder="Touche le micro du clavier de l’iPad pour dicter : « Pour la tarte tatin de mamie, il faut un kilo et demi de reinettes… »"></textarea></div>` : ''}
      ${mode === 'photo' ? `<div class="drop">${image ? `<img src="${image.preview}" alt="Recette photographiée">` : `<span class="muted">Prends en photo la page du cahier ou du livre, ou choisis une capture d’écran.</span>`}
          <button type="button" class="btn btn-amber" id="a-ph">${ico('cam')}${image ? 'Reprendre la photo' : 'Prendre ou choisir la photo'}</button></div>
        <div class="field"><label for="a-in">Une précision ? (facultatif)</label><input class="input" id="a-in" placeholder="C’est la recette de mamie Jeanne…"></div>` : ''}
      <div class="row-end"><button class="btn btn-primary btn-lg" type="submit" ${!AI_ON ? 'disabled' : ''}>${ico('spark')}Créer la fiche</button></div>
      <div id="a-wait" hidden class="row" style="justify-content:center"><div class="spinner"></div><span class="muted">L’IA prépare la fiche, quelques secondes…</span></div>
    </form>`);
    $$('[data-m]').forEach((b) => (b.onclick = () => { mode = b.dataset.m; render(); }));
    const ph = $('#a-ph');
    if (ph) ph.onclick = async () => { image = await pickPhoto(); render(); };
    $('#af').onsubmit = async (e) => {
      e.preventDefault();
      const input = ($('#a-in') && $('#a-in').value.trim()) || '';
      if (mode !== 'photo' && !input) return toast('Écris d’abord quelque chose');
      if (mode === 'photo' && !image) return toast('Prends d’abord la photo');
      $('#a-wait').hidden = false; $('#af button[type=submit]').disabled = true;
      try {
        const draft = await api('POST', '/api/ai/recipe', { mode, input, image: image && image.data, mime: image && image.mime });
        viewRecipeEdit('new', draft);
      } catch (err) { toast(err.message); $('#a-wait').hidden = true; $('#af button[type=submit]').disabled = false; }
    };
    if (pending && AI_ON && (pending.mode === 'name' || pending.mode === 'link')) { pending.auto = false; $('#af').requestSubmit(); }
  };
  render();
}

// ---------- Mode cuisson ----------
async function viewCook(id, params) {
  const r = await GET(`/api/recipes/${id}`);
  const n = +params.get('n') || r.servings;
  let i = 0, remaining = 0, total = 0, running = false, tick = null, wake = null;
  const steps = r.steps;
  try { if ('wakeLock' in navigator) wake = await navigator.wakeLock.request('screen'); } catch (e) { /* écran allumé non garanti */ }
  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, .35, .7, 1.05].forEach((t) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(.25, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + t + .3); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + .3); });
    } catch (e) { /* pas de son */ }
    navigator.vibrate && navigator.vibrate([300, 150, 300]);
  };
  const fmt = (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  const setStep = (k) => { i = k; clearInterval(tick); running = false; total = remaining = (steps[i].minutes || 0) * 60; draw(); };
  const draw = () => {
    const s = steps[i];
    const C = 2 * Math.PI * 156;
    const pct = total ? remaining / total : 0;
    const scaledNote = n !== r.servings ? `<span class="muted"> · quantités pour ${n}</span>` : '';
    app.innerHTML = `<div class="cook">
      <div class="cook-top"><button class="icon-btn" id="quit" aria-label="Quitter le mode cuisson">${ico('close')}</button>
        <div class="cook-prog">${steps.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>
        <span class="muted">${esc(r.name)} · étape ${i + 1} sur ${steps.length}${scaledNote}</span></div>
      <div class="cook-main">
        <div><h1>${s.veille ? '<em class="acc">La veille</em> · ' : ''}Étape ${i + 1}</h1>
          <p class="big">${esc(s.text)}</p>
          ${s.watch ? `<div class="watch">${ico('eye')}<div><span class="eyebrow">À guetter</span><div style="font-size:19px;line-height:1.4;margin-top:4px">${esc(s.watch)}</div></div></div>` : ''}</div>
        <div class="timer">${s.minutes ? `
          <div class="ring ${remaining <= 0 && total ? 'ringing' : ''}"><svg viewBox="0 0 340 340" aria-hidden="true"><circle cx="170" cy="170" r="156" fill="none" stroke="#3D2F27" stroke-width="14"/><circle cx="170" cy="170" r="156" fill="none" stroke="#E3A857" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg>
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px"><span class="v" aria-live="polite">${remaining <= 0 ? 'Prêt !' : fmt(remaining)}</span>
            <span class="muted">${running ? 'sonnera à ' + new Date(Date.now() + remaining * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ' h ') : fmtMin(s.minutes)}</span></div></div>
          <div class="row" style="justify-content:center"><button class="btn btn-ghost" id="go">${running ? 'Pause' : remaining < total ? 'Reprendre' : 'Lancer le minuteur'}</button><button class="btn btn-ghost" id="plus5">+ 5 min</button></div>`
          : '<p class="muted" style="text-align:center">Pas de minuteur pour cette étape.</p>'}</div>
      </div>
      <div class="cook-bot"><button class="icon-btn" id="prev" aria-label="Étape précédente" style="width:72px;height:64px;border-radius:32px" ${i === 0 ? 'disabled' : ''}>${ico('back')}</button>
        <span class="next-txt">${steps[i + 1] ? 'Ensuite · ' + esc(steps[i + 1].text.slice(0, 90)) + (steps[i + 1].text.length > 90 ? '…' : '') : 'Dernière étape, bon appétit !'}</span>
        <button class="btn btn-amber" id="next">${steps[i + 1] ? 'Étape suivante' : 'Terminer'}</button></div>
    </div>`;
    $('#quit').onclick = quit;
    $('#prev').onclick = () => i > 0 && setStep(i - 1);
    $('#next').onclick = () => (steps[i + 1] ? setStep(i + 1) : quit());
    const go = $('#go');
    if (go) go.onclick = () => {
      if (running) { running = false; clearInterval(tick); draw(); return; }
      if (remaining <= 0) remaining = total;
      running = true;
      let last = Date.now();
      tick = setInterval(() => {
        const now = Date.now(); remaining -= (now - last) / 1000; last = now;
        if (remaining <= 0) { remaining = 0; running = false; clearInterval(tick); beep(); }
        draw();
      }, 1000);
      draw();
    };
    const p5 = $('#plus5');
    if (p5) p5.onclick = () => { remaining += 300; total += 300; draw(); };
  };
  const quit = () => { clearInterval(tick); try { wake && wake.release(); } catch (e) { /* rien */ } location.hash = `#/recette/${r.id}`; };
  if (!steps.length) { location.hash = `#/recette/${r.id}`; return; }
  window.__cookCleanup = () => { clearInterval(tick); try { wake && wake.release(); } catch (e) { /* rien */ } };
  setStep(0);
}

// ---------- Soirées ----------
async function viewSoirees() {
  loading('#/soirees');
  const list = await GET('/api/soirees');
  const today = todayISO();
  const up = list.filter((s) => s.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = list.filter((s) => s.date < today);
  const card = (s) => `<a class="card scard" href="#/soiree/${s.id}">${thumb(s.photo_id)}<div class="stack" style="gap:6px;min-width:0">
      <div class="row" style="justify-content:space-between"><h3>${esc(s.title)}</h3><span class="muted" style="font-size:13px">${esc(fmtDate(s.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }))} · ${s.guests} convives</span></div>
      ${s.friends ? `<span style="font-size:15px">${esc(s.friends)}</span>` : ''}<span class="muted" style="font-size:14px">${esc(s.menu || 'Menu à composer')}</span></div></a>`;
  shell('#/soirees', `<div class="page-head"><div><span class="eyebrow">Recevoir</span><h1>Nos <em class="acc">soirées</em></h1></div><a class="btn btn-primary" href="#/soiree/new">${ico('plus')}Nouvelle soirée</a></div>
    <section class="stack"><h2>À venir</h2>${up.length ? `<div class="slist">${up.map(card).join('')}</div>` : '<p class="muted">Rien de prévu pour l’instant.</p>'}</section>
    <section class="section"><h2>Déjà passées</h2>${past.length ? `<div class="slist">${past.map(card).join('')}</div>` : '<p class="muted">L’historique se remplira au fil des soirées.</p>'}</section>`);
}

async function viewSoiree(id, params) {
  loading('#/soirees');
  const [allRecipes, allFriends] = await Promise.all([GET('/api/recipes'), GET('/api/friends')]);
  let s;
  if (id === 'new') {
    const rid = +params.get('recipe');
    const rr = allRecipes.find((x) => x.id === rid);
    const inv = JSON.parse(sessionStorage.getItem('pda-invite') || 'null');
    sessionStorage.removeItem('pda-invite');
    s = { title: 'Dîner', date: todayISO(), time: '20:30', guests: 6, notes: '', friends: inv ? [inv] : [], recipes: rr ? [{ ...rr, course: rr.category }] : [], photos: [], repeats: [], checked: {} };
  } else s = await GET(`/api/soirees/${id}`);
  const isNew = !s.id;
  const isPast = !isNew && s.date < todayISO();
  const saveLinks = async () => {
    if (isNew) return;
    await api('PUT', `/api/soirees/${s.id}`, { friend_ids: s.friends.map((f) => f.id), recipes: s.recipes.map((r) => ({ recipe_id: r.id, course: r.course })) });
    const fresh = await GET(`/api/soirees/${s.id}`); s.repeats = fresh.repeats; render();
  };
  const render = () => {
    const menu = [...s.recipes].sort((a, b) => COURSE_ORDER.indexOf(a.course) - COURSE_ORDER.indexOf(b.course));
    shell('#/soirees', `${backLink('#/soirees', 'Soirées')}
    <form id="sf" class="stack" style="gap:28px">
      <div class="form-grid">
        <div class="field span-4"><label for="s-title">Nom de la soirée</label><input class="input" id="s-title" value="${esc(s.title)}" style="font-family:var(--serif);font-size:22px"></div>
        <div class="field"><label for="s-date">Date</label><input class="input" id="s-date" type="date" value="${esc(String(s.date).slice(0, 10))}"></div>
        <div class="field"><label for="s-time">À table à</label><input class="input" id="s-time" type="time" value="${esc(s.time)}"></div>
        <div class="field"><label for="s-guests">Convives (nous compris)</label><input class="input" id="s-guests" type="number" min="1" value="${s.guests}"></div>
        <div class="field" style="justify-content:flex-end"><button class="btn btn-primary" type="submit">${isNew ? 'Créer la soirée' : 'Enregistrer'}</button></div>
      </div>
    </form>
    ${s.repeats.length ? `<div class="alert" style="margin-top:20px">${ico('warn')}<div>${s.repeats.map((x) => `<b>${esc(x.recipe)}</b> a déjà été servi à ${esc(x.friend)} le ${fmtDateShort(x.date)}.`).join('<br>')}</div></div>` : ''}
    <div class="grid-2 section">
      <section class="stack"><div class="row" style="justify-content:space-between"><h2>Les invités</h2><button class="btn btn-quiet" id="add-f">${ico('plus')}Inviter</button></div>
        <div class="chips">${s.friends.map((f) => `<span class="chip"><a href="#/ami/${f.id}" style="color:inherit;text-decoration:none">${esc(f.name)}</a><button type="button" data-rmf="${f.id}" aria-label="Retirer ${esc(f.name)}" style="background:none;border:0;color:inherit;cursor:pointer;padding:0 0 0 4px">×</button></span>`).join('') || '<span class="muted">Personne pour l’instant.</span>'}</div>
        ${s.friends.filter((f) => f.avoid || f.know).map((f) => `<div class="panel" style="padding:12px 14px;font-size:15px"><b>${esc(f.name)}</b> · ${esc([f.avoid && 'évite : ' + f.avoid, f.know].filter(Boolean).join(' · '))}</div>`).join('')}
      </section>
      <section class="stack"><div class="row" style="justify-content:space-between"><h2>Le menu</h2><button class="btn btn-quiet" id="add-r">${ico('plus')}Ajouter un plat</button></div>
        ${menu.map((r) => `<div class="menu-row">${thumb(r.photo_id)}<div class="grow"><a href="#/recette/${r.id}" style="color:var(--text);text-decoration:none;font-weight:600">${esc(r.name)}</a>
          <select class="input" data-course="${r.id}" aria-label="Moment du service">${COURSE_ORDER.map((c) => `<option value="${c}" ${r.course === c ? 'selected' : ''}>${CAT[c]}</option>`).join('')}</select></div>
          <button class="icon-btn" data-rmr="${r.id}" aria-label="Retirer du menu">${ico('trash')}</button></div>`).join('') || '<span class="muted">Ajoute les plats depuis le carnet.</span>'}
      </section>
    </div>
    ${!isNew ? `<div class="row" style="margin-top:32px">
      <a class="btn btn-amber btn-lg" href="#/soiree/${s.id}/planning">${ico('clock')}Rétroplanning</a>
      <a class="btn btn-ghost btn-lg" href="#/soiree/${s.id}/courses">${ico('cart')}Liste de courses</a></div>
    <section class="section"><h2>${isPast ? 'Souvenirs de la soirée' : 'Souvenirs (après la soirée)'}</h2>
      <div class="field"><label for="s-notes">Notes de la soirée</label><textarea class="input" id="s-notes" placeholder="Ambiance, ce qui a plu, ce qu’on changerait…">${esc(s.notes || '')}</textarea></div>
      ${menu.map((r) => `<div class="field"><label for="rn-${r.id}">${esc(r.name)} · ce qu’on en retient</label><input class="input" id="rn-${r.id}" data-note="${r.id}" value="${esc(r.note || '')}" placeholder="« Ça a cartonné », « trop salé »…"></div>`).join('')}
      <div class="row"><button class="btn btn-quiet" id="save-notes">Enregistrer les souvenirs</button><button class="btn btn-amber" id="add-ph">${ico('cam')}Ajouter une photo</button></div>
      ${s.photos.length ? `<div class="gallery">${s.photos.map((p) => `<a href="${photoUrl(p.photo_id)}" target="_blank" rel="noopener"><img src="${photoUrl(p.photo_id)}" alt="Photo de la soirée" loading="lazy"></a>`).join('')}</div>` : ''}
      <div class="row-end"><button class="btn btn-danger" id="del-s">Supprimer la soirée</button></div>
    </section>` : ''}`);
    $('#sf').onsubmit = async (e) => {
      e.preventDefault();
      const body = { title: $('#s-title').value.trim() || 'Soirée', date: $('#s-date').value, time: $('#s-time').value || '20:30', guests: +$('#s-guests').value || 6,
        friend_ids: s.friends.map((f) => f.id), recipes: s.recipes.map((r) => ({ recipe_id: r.id, course: r.course })) };
      if (isNew) { const res = await api('POST', '/api/soirees', body); toast('Soirée créée'); location.hash = `#/soiree/${res.id}`; }
      else { await api('PUT', `/api/soirees/${s.id}`, body); Object.assign(s, body); toast('Enregistré'); const fresh = await GET(`/api/soirees/${s.id}`); s.repeats = fresh.repeats; render(); }
    };
    $$('[data-rmf]').forEach((b) => (b.onclick = () => { s.friends = s.friends.filter((f) => f.id !== +b.dataset.rmf); saveLinks(); render(); }));
    $$('[data-rmr]').forEach((b) => (b.onclick = () => { s.recipes = s.recipes.filter((r) => r.id !== +b.dataset.rmr); saveLinks(); render(); }));
    $$('[data-course]').forEach((sel) => (sel.onchange = () => { s.recipes.find((r) => r.id === +sel.dataset.course).course = sel.value; saveLinks(); }));
    $('#add-f').onclick = () => pickFriend(allFriends, s.friends, async (f) => { s.friends.push(f); await saveLinks(); render(); });
    $('#add-r').onclick = () => pickRecipe(allRecipes, s.recipes, async (r) => { s.recipes.push({ ...r, course: r.category }); await saveLinks(); render(); });
    if (!isNew) {
      $('#save-notes').onclick = async () => {
        await api('PUT', `/api/soirees/${s.id}`, { notes: $('#s-notes').value });
        for (const inp of $$('[data-note]')) await api('PUT', `/api/soirees/${s.id}/recipes/${inp.dataset.note}/note`, { note: inp.value.trim() });
        s.notes = $('#s-notes').value; $$('[data-note]').forEach((inp) => { s.recipes.find((r) => r.id === +inp.dataset.note).note = inp.value.trim(); });
        toast('Souvenirs enregistrés');
      };
      $('#add-ph').onclick = async () => { const pid = await uploadPhoto(); if (!pid) return; await api('POST', `/api/soirees/${s.id}/photos`, { photo_id: pid }); s.photos.push({ photo_id: pid }); toast('Photo ajoutée'); render(); };
      $('#del-s').onclick = async () => { if (!confirm('Supprimer cette soirée ?')) return; await api('DELETE', `/api/soirees/${s.id}`); location.hash = '#/soirees'; };
    }
  };
  render();
}

function pickFriend(all, current, onPick) {
  const ids = new Set(current.map((f) => f.id));
  modal(`<h2>Inviter</h2><input class="input" id="pf-q" placeholder="Chercher ou créer (ex. : Anne & Marc)">
    <div class="pick" id="pf-list"></div>`, (m, close) => {
    const draw = () => {
      const q = $('#pf-q', m).value.trim().toLowerCase();
      const list = all.filter((f) => !ids.has(f.id) && (!q || f.name.toLowerCase().includes(q)));
      $('#pf-list', m).innerHTML = list.map((f) => `<button data-id="${f.id}"><span>${esc(f.name)}</span><span class="muted" style="font-size:13px">${f.visits ? f.visits + ' soirée' + (f.visits > 1 ? 's' : '') : 'nouveau'}</span></button>`).join('')
        + (q && !all.some((f) => f.name.toLowerCase() === q) ? `<button data-new="1"><span>Créer « ${esc($('#pf-q', m).value.trim())} »</span>${ico('plus', 'width="20" height="20"')}</button>` : '');
      $$('[data-id]', m).forEach((b) => (b.onclick = () => { close(); onPick(all.find((f) => f.id === +b.dataset.id)); }));
      const nb = $('[data-new]', m);
      if (nb) nb.onclick = async () => { const name = $('#pf-q', m).value.trim(); const r = await api('POST', '/api/friends', { name }); const f = { id: r.id, name }; all.push(f); close(); onPick(f); };
    };
    $('#pf-q', m).oninput = draw; draw(); $('#pf-q', m).focus();
  });
}
function pickRecipe(all, current, onPick) {
  const ids = new Set(current.map((r) => r.id));
  modal(`<h2>Ajouter un plat</h2><input class="input" id="pr-q" placeholder="Chercher dans le carnet"><div class="pick" id="pr-list"></div>
    <div class="row-end"><a class="btn btn-ghost-dark" href="#/ajouter">Nouvelle recette</a></div>`, (m, close) => {
    const draw = () => {
      const q = $('#pr-q', m).value.trim().toLowerCase();
      $('#pr-list', m).innerHTML = all.filter((r) => !ids.has(r.id) && (!q || r.name.toLowerCase().includes(q)))
        .map((r) => `<button data-id="${r.id}"><span>${esc(r.name)}</span><span class="muted" style="font-size:13px">${CAT[r.category] || ''}</span></button>`).join('') || '<p class="muted">Aucune recette trouvée.</p>';
      $$('[data-id]', m).forEach((b) => (b.onclick = () => { close(); onPick(all.find((r) => r.id === +b.dataset.id)); }));
    };
    $('#pr-q', m).oninput = draw; draw();
    $('a', m).onclick = close;
  });
}

// ---------- Rétroplanning ----------
function buildPlan(s) {
  const [hh, mm] = String(s.time || '20:30').split(':').map(Number);
  const base = dateObj(s.date); base.setHours(hh, mm, 0, 0);
  const items = [];
  for (const r of s.recipes) {
    let end = new Date(base.getTime() + (SERVE_OFFSET[r.course] ?? 0) * 60000);
    const steps = r.steps || [];
    const veille = steps.filter((x) => x.veille);
    const jour = steps.filter((x) => !x.veille);
    for (let k = jour.length - 1; k >= 0; k--) {
      const st = jour[k];
      const start = new Date(end.getTime() - (st.minutes || 5) * 60000);
      items.push({ at: start, label: st.text, minutes: st.minutes, recipe: r.name, rid: r.id });
      end = start;
    }
    veille.forEach((st) => items.push({ veille: true, label: st.text, minutes: st.minutes, recipe: r.name, rid: r.id }));
  }
  const arrival = new Date(base.getTime() - 30 * 60000);
  items.push({ at: arrival, label: 'Arrivée des invités', recipe: '', fixed: true });
  items.push({ at: base, label: 'À table !', recipe: '', end: true });
  items.sort((a, b) => (a.veille ? -1 : b.veille ? 1 : a.at - b.at));
  return items;
}
async function viewPlanning(id) {
  loading('#/soirees');
  const s = await GET(`/api/soirees/${id}`);
  const items = buildPlan(s);
  const now = new Date();
  const hm = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const isToday = String(s.date).slice(0, 10) === todayISO();
  const fi = items.findIndex((x) => !x.veille && x.at > now);
  const nowIdx = !isToday ? -1 : fi === -1 ? items.length : fi - 1;
  shell('#/soirees', `${backLink(`#/soiree/${s.id}`, s.title)}
    <div class="page-head"><div><span class="eyebrow">${esc(fmtDate(s.date))}</span><h1>À table à <em class="acc">${fmtTime(s.time)}</em></h1><span class="muted">${s.guests} convives · l’appli remonte le temps pour toi</span></div>
      <a class="btn btn-ghost" href="#/soiree/${s.id}/courses">${ico('cart')}Courses</a></div>
    ${s.recipes.length ? `<div>${items.map((x, k) => {
      const cls = x.end ? 'end' : (k < nowIdx ? 'done' : k === nowIdx ? 'now' : '');
      return `<div class="tl-row ${cls}"><span class="tl-time">${x.veille ? 'Veille' : hm(x.at)}</span><div class="tl-dot"><i></i>${k < items.length - 1 ? '<s></s>' : ''}</div>
        <div class="tl-body"><span class="l">${esc(x.label)}${x.minutes ? ` <span class="muted">· ${fmtMin(x.minutes)}</span>` : ''}</span><span class="t">${x.rid ? `<a href="#/cuisson/${x.rid}?n=${s.guests}">${esc(x.recipe)}</a>` : ''}</span></div></div>`;
    }).join('')}</div>
    <p class="muted" style="font-size:14px">Apéro et cocktail servis à l’arrivée (30 min avant), entrée à l’heure dite, plat 30 min après, dessert 1 h 15 après. Les durées viennent des fiches : ajuste-les dans « Modifier ».</p>`
    : '<p class="muted">Ajoute des plats au menu pour obtenir le rétroplanning.</p>'}`);
}

// ---------- Liste de courses ----------
function shoppingList(s) {
  const map = new Map();
  for (const r of s.recipes) {
    const k = s.guests / (r.servings || 4);
    for (const i of r.ingredients || []) {
      const key = `${i.name.trim().toLowerCase()}|${i.unit || ''}`;
      const cur = map.get(key) || { key, name: i.name.trim(), unit: i.unit || '', qty: 0, free: false, from: new Set() };
      if (i.qty === null || i.qty === undefined) cur.free = true; else cur.qty += i.qty * k;
      cur.from.add(r.name);
      map.set(key, cur);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}
async function viewShopping(id) {
  loading('#/soirees');
  const s = await GET(`/api/soirees/${id}`);
  const list = shoppingList(s);
  const checked = s.checked || {};
  const render = () => {
    const got = list.filter((i) => checked[i.key]).length;
    shell('#/soirees', `${backLink(`#/soiree/${s.id}`, s.title)}
      <div class="page-head"><div><span class="eyebrow">${esc(fmtDate(s.date))} · ${s.guests} convives</span><h1>Liste de <em class="acc">courses</em></h1></div><span class="muted">${got} / ${list.length} dans le panier</span></div>
      ${list.length ? `<div class="shop">${list.map((i) => `<label class="${checked[i.key] ? 'got' : ''}"><input type="checkbox" data-k="${esc(i.key)}" ${checked[i.key] ? 'checked' : ''}>
        <span>${esc(i.name)}<span class="from">${esc([...i.from].join(' · '))}</span></span><span class="q">${i.qty ? esc(fmtQty(i.qty, i.unit)) : ''}${i.free ? (i.qty ? ' + ' : '') + 'selon le goût' : ''}</span></label>`).join('')}</div>`
      : '<p class="muted">Ajoute des plats au menu pour générer la liste.</p>'}`);
    $$('[data-k]').forEach((c) => (c.onchange = async () => {
      if (c.checked) checked[c.dataset.k] = true; else delete checked[c.dataset.k];
      render();
      await api('PUT', `/api/soirees/${s.id}`, { checked });
    }));
  };
  render();
}

// ---------- Amis ----------
async function viewFriends() {
  loading('#/amis');
  const list = await GET('/api/friends');
  shell('#/amis', `<div class="page-head"><div><span class="eyebrow">Ceux qu’on reçoit</span><h1>Nos <em class="acc">amis</em></h1></div><button class="btn btn-primary" id="new-f">${ico('plus')}Ajouter</button></div>
    ${list.length ? `<div class="grid-cards">${list.map((f) => `<a class="card" href="#/ami/${f.id}" style="padding:18px;text-decoration:none;display:flex;gap:14px;align-items:center">
      <span class="big-av" style="background:${avColor(f.name)};width:52px;height:52px;font-size:20px">${esc(initials(f.name))}</span>
      <span style="display:flex;flex-direction:column;gap:2px;min-width:0"><b style="font-size:17px">${esc(f.name)}</b><span class="muted" style="font-size:13px">${f.visits ? `${f.visits} soirée${f.visits > 1 ? 's' : ''} · dernière le ${fmtDateShort(f.last_visit)}` : 'Pas encore reçus'}</span></span></a>`).join('')}</div>`
    : '<p class="muted">Ajoute tes amis, ou invite-les directement depuis une soirée.</p>'}`);
  $('#new-f').onclick = () => modal(`<h2>Nouvel ami</h2><div class="field"><label for="nf">Nom (un couple peut être « Anne & Marc »)</label><input class="input" id="nf"></div><div class="row-end"><button class="btn btn-primary" id="nf-ok">Ajouter</button></div>`, (m, close) => {
    $('#nf-ok', m).onclick = async () => { const name = $('#nf', m).value.trim(); if (!name) return; const r = await api('POST', '/api/friends', { name }); close(); location.hash = `#/ami/${r.id}`; };
  });
}
async function viewFriend(id) {
  loading('#/amis');
  const [f, recipes] = await Promise.all([GET(`/api/friends/${id}`), GET('/api/recipes')]);
  const servedIds = new Set(f.visits.flatMap((v) => v.menu.map((m) => m.id)));
  const ideas = recipes.filter((r) => !servedIds.has(r.id) && ['plat', 'dessert', 'entree'].includes(r.category)).sort((a, b) => (b.favorite - a.favorite) || (b.served - a.served)).slice(0, 4);
  shell('#/amis', `${backLink('#/amis', 'Amis')}
    <div class="grid-2" style="grid-template-columns:minmax(0,380px) minmax(0,1fr)">
      <aside class="stack" style="gap:22px">
        <div class="friend-head"><span class="big-av" style="background:${avColor(f.name)}">${esc(initials(f.name))}</span>
          <div><h1 style="font-size:32px">${esc(f.name)}</h1><span class="muted">${f.visits.length ? `${f.visits.length} soirée${f.visits.length > 1 ? 's' : ''} depuis ${esc(fmtDate(f.visits[f.visits.length - 1].date, { month: 'long', year: 'numeric' }))}` : 'Pas encore reçus'}</span></div></div>
        <form id="ff" class="stack">
          <span class="eyebrow">À savoir</span>
          <div class="field"><label for="ff-avoid">Ne mange pas / allergies</label><input class="input" id="ff-avoid" value="${esc(f.avoid || '')}" placeholder="Pas de poisson…"></div>
          <div class="field"><label for="ff-likes">Adore</label><input class="input" id="ff-likes" value="${esc(f.likes || '')}" placeholder="Les figues, le chocolat noir…"></div>
          <div class="field"><label for="ff-know">Autres notes</label><textarea class="input" id="ff-know" rows="2" placeholder="Plutôt vin blanc…">${esc(f.know || '')}</textarea></div>
          <div class="field"><label for="ff-name">Nom</label><input class="input" id="ff-name" value="${esc(f.name)}"></div>
          <div class="row"><button class="btn btn-quiet" type="submit">Enregistrer</button><button class="btn btn-danger" type="button" id="ff-del">Supprimer</button></div>
        </form>
        ${ideas.length ? `<div class="stack" style="gap:10px"><span class="eyebrow">Jamais servi, ça leur plairait</span><div class="chips">${ideas.map((r) => `<a class="chip" href="#/recette/${r.id}">${esc(r.name)}</a>`).join('')}</div></div>` : ''}
        <a class="btn btn-primary" href="#/soiree/new" id="invite">Les inviter à une soirée</a>
      </aside>
      <section class="stack"><h2>Ce qu’on leur a servi</h2>
        ${f.visits.length ? f.visits.map((v) => `<a class="card visit" href="#/soiree/${v.id}">${thumb(v.photo_id || (v.menu.find((m) => m.photo_id) || {}).photo_id)}
          <div class="stack" style="gap:6px;min-width:0"><div class="row" style="justify-content:space-between"><b style="font-family:var(--serif);font-size:19px">${esc(v.title)}</b><span class="muted" style="font-size:13px">${fmtDateShort(v.date)} · ${v.guests} convives</span></div>
          <span style="font-size:15px;line-height:1.4">${esc([...v.menu].sort((a, b) => COURSE_ORDER.indexOf(a.course) - COURSE_ORDER.indexOf(b.course)).map((m) => m.name).join(' · ') || 'Menu non renseigné')}</span>
          ${v.menu.filter((m) => m.note).map((m) => `<span style="font-family:var(--serif);font-style:italic;color:var(--olive)">« ${esc(m.note)} »</span>`).join('')}</div></a>`).join('')
        : '<p class="muted">L’historique se remplira à chaque soirée où ils sont invités.</p>'}
      </section>
    </div>`);
  $('#ff').onsubmit = async (e) => { e.preventDefault(); await api('PUT', `/api/friends/${f.id}`, { name: $('#ff-name').value, avoid: $('#ff-avoid').value, likes: $('#ff-likes').value, know: $('#ff-know').value }); toast('Enregistré'); };
  $('#ff-del').onclick = async () => { if (!confirm(`Supprimer ${f.name} ?`)) return; await api('DELETE', `/api/friends/${f.id}`); location.hash = '#/amis'; };
  $('#invite').onclick = (e) => {
    e.preventDefault();
    sessionStorage.setItem('pda-invite', JSON.stringify({ id: f.id, name: f.name }));
    location.hash = '#/soiree/new';
  };
}

// ---------- Souvenirs ----------
async function viewMemories() {
  loading('#/souvenirs');
  const list = (await GET('/api/soirees')).filter((s) => s.date < todayISO());
  shell('#/souvenirs', `<div class="page-head"><div><span class="eyebrow">Nos plus belles tablées</span><h1>Les <em class="acc">souvenirs</em></h1></div></div>
    ${list.length ? `<div class="grid-cards">${list.map((s) => `<a class="rcard" href="#/soiree/${s.id}">${thumb(s.photo_id)}<span class="t">${esc(s.title)}</span><span class="m">${fmtDateShort(s.date)}${s.friends ? ' · ' + esc(s.friends) : ''}</span></a>`).join('')}</div>`
    : '<p class="muted">Après chaque soirée, ajoutez photos et notes : elles apparaîtront ici.</p>'}`);
}

// ---------- Routage ----------
async function route() {
  if (window.__cookCleanup) { window.__cookCleanup(); window.__cookCleanup = null; }
  const [path, qs] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(qs || '');
  const p = path.split('/').filter(Boolean);
  try {
    if (!p.length) return await viewHome();
    if (p[0] === 'recettes') return await viewRecipes(params);
    if (p[0] === 'ajouter') return viewAdd();
    if (p[0] === 'recette' && p[2] === 'edit') return await viewRecipeEdit(p[1]);
    if (p[0] === 'recette') return await viewRecipe(p[1]);
    if (p[0] === 'cuisson') return await viewCook(p[1], params);
    if (p[0] === 'soirees') return await viewSoirees();
    if (p[0] === 'soiree' && p[2] === 'planning') return await viewPlanning(p[1]);
    if (p[0] === 'soiree' && p[2] === 'courses') return await viewShopping(p[1]);
    if (p[0] === 'soiree') return await viewSoiree(p[1], params);
    if (p[0] === 'amis') return await viewFriends();
    if (p[0] === 'ami') return await viewFriend(p[1]);
    if (p[0] === 'souvenirs') return await viewMemories();
    location.hash = '#/';
  } catch (e) {
    if (e.message !== 'Non connecté') shell('', `<div class="empty"><h2>Oups</h2><p class="muted">${esc(e.message)}</p><a class="btn btn-primary" href="#/">Retour à l’accueil</a></div>`);
  }
}

window.addEventListener('hashchange', route);
(async () => {
  try {
    const me = await (await fetch('/api/me', { credentials: 'same-origin' })).json();
    AI_ON = !!me.ai;
    if (!me.authed) return renderLogin();
    route();
  } catch (e) { renderLogin(); }
})();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
})();
