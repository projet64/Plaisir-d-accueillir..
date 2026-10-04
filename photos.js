// Recherche de photos de plats sous licence libre (Wikimedia Commons) et téléchargement côté serveur
const UA = 'PlaisirDAccueillir/1.0 (appli familiale privee; contact bouzeran)';

const strip = (h) => String(h || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function searchCommons(query, limit = 12) {
  const p = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: '6', gsrlimit: String(limit), prop: 'imageinfo',
    iiprop: 'url|mime|size|extmetadata', iiurlwidth: '1200', iiextmetadatafilter: 'LicenseShortName|Artist'
  });
  const res = await fetch('https://commons.wikimedia.org/w/api.php?' + p, { headers: { 'user-agent': UA } });
  if (!res.ok) throw Object.assign(new Error('Recherche de photos indisponible'), { status: 502 });
  const data = await res.json();
  const pages = Object.values((data.query && data.query.pages) || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  return pages.map((pg) => {
    const ii = (pg.imageinfo || [])[0] || {};
    const md = ii.extmetadata || {};
    return {
      title: String(pg.title || '').replace(/^File:/, ''),
      thumb: ii.thumburl || ii.url,
      page: ii.descriptionurl,
      mime: ii.mime,
      width: ii.width,
      license: strip(md.LicenseShortName && md.LicenseShortName.value),
      artist: strip(md.Artist && md.Artist.value)
    };
  }).filter((x) => x.thumb && /jpeg|png|webp/.test(x.mime || '') && (x.width || 0) >= 600);
}

// Télécharge une image autorisée (Wikimedia uniquement) et renvoie ses octets
async function download(url) {
  const u = new URL(url);
  if (u.hostname !== 'upload.wikimedia.org') throw Object.assign(new Error('Source d’image non autorisée'), { status: 400 });
  const res = await fetch(u, { headers: { 'user-agent': UA } });
  if (!res.ok) throw Object.assign(new Error('Téléchargement impossible'), { status: 502 });
  const mime = res.headers.get('content-type') || 'image/jpeg';
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 8 * 1024 * 1024) throw Object.assign(new Error('Image trop lourde'), { status: 400 });
  return { buf, mime };
}

const credit = (r) => [r.artist, r.license, 'Wikimedia Commons'].filter(Boolean).join(' · ');

module.exports = { searchCommons, download, credit };
