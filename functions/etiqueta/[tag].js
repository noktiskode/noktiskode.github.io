// functions/etiqueta/[tag].js
//
// Página de una etiqueta: /etiqueta/agua/ lista todos los posts que tengan
// esa etiqueta (sin importar mayúsculas ni tildes). Si ningún post la usa,
// delega a next() y el sitio responde 404 como siempre.
//
// Usa las mismas tarjetas (.cb-post) y el mismo encabezado (.category-masthead)
// que las páginas de categoría, así que hereda el estilo de styles.css.

import { SUPABASE_URL, SUPABASE_ANON_KEY, SITE_URL, escapeHtml, slugify, headerHtml, footerHtml } from '../_shared.js';

const CATEGORY_LABELS = { opiniones: 'Opiniones', barberena: 'Barberena', historias: 'Historias' };

const ICON_CAL = '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 10h17M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

export async function onRequestGet({ params, next }) {
  const tagSlug = slugify(params.tag || '');
  if (!tagSlug) return next();

  let rows;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?select=slug,title,excerpt,category,image_url,published_at,tags&order=published_at.desc&limit=1000`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    if (!res.ok) return next();
    rows = await res.json();
  } catch (e) {
    return next();
  }

  let nombre = '';
  const posts = rows.filter((p) => {
    const hit = (p.tags || []).find((t) => slugify(t) === tagSlug);
    if (hit && !nombre) nombre = hit;
    return !!hit;
  });
  if (!posts.length) return next();

  return new Response(renderTag(nombre, tagSlug, posts), {
    headers: {
      'content-type': 'text/html; charset=UTF-8',
      'cache-control': 'public, max-age=300'
    }
  });
}

function cardHtml(p) {
  const href = `/${encodeURIComponent(p.slug)}/`;
  const fecha = new Date(p.published_at).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const cat = CATEGORY_LABELS[p.category] || '';
  const title = escapeHtml(p.title);
  const img = p.image_url
    ? `<a class="cb-post-image" href="${href}" tabindex="-1" aria-hidden="true"><img class="cb-media-bg" src="${escapeHtml(p.image_url)}" alt="" loading="lazy"></a>`
    : '';
  return `<article class="cb-post">
      ${img}
      <p class="cb-post-meta">${cat ? `<span class="cat">${escapeHtml(cat)}</span>` : ''}<span>${ICON_CAL}${fecha}</span></p>
      <h2><a href="${href}">${title}</a></h2>
      ${p.excerpt ? `<p class="cb-post-excerpt">${escapeHtml(p.excerpt)}</p>` : ''}
      <a class="cb-readmore" href="${href}" aria-label="Leer: ${title}">Leer más &rsaquo;</a>
    </article>`;
}

function renderTag(nombre, tagSlug, posts) {
  const title = `${escapeHtml(nombre)} — Barberena Mi Municipio`;
  const canonical = `${SITE_URL}/etiqueta/${tagSlug}/`;
  const n = posts.length;
  const conteo = `${n} ${n === 1 ? 'publicación' : 'publicaciones'}`;
  const desc = escapeHtml(`${conteo} de Barberena Mi Municipio sobre ${nombre}.`);
  // Una etiqueta con un solo post es contenido delgado: se deja fuera del índice de Google.
  const robots = n < 2 ? '<meta name="robots" content="noindex, follow">' : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: nombre,
    url: canonical,
    inLanguage: 'es-GT',
    isPartOf: { '@type': 'WebSite', name: 'Barberena Mi Municipio', url: SITE_URL }
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <script>(function(){try{var t=localStorage.getItem('bmm-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  ${robots}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Barberena Mi Municipio">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE_URL}/images/portada.webp">
  <meta property="og:locale" content="es_GT">
  <link rel="canonical" href="${canonical}">
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@500;600;700;800;900&family=Roboto:wght@300;400;500;600&display=swap" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@500;600;700;800;900&family=Roboto:wght@300;400;500;600&display=swap"></noscript>
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="google-site-verification" content="rnI2_KGt4xMqGnZfDKDdzVr7GxNS1HKlzvXbb8d2ja4">
</head>
<body>
${headerHtml()}
<main class="cb-page cb-tag-page">
  <div class="cb-container">
    <header class="category-masthead">
      <h1>${escapeHtml(nombre)}</h1>
      <span class="category-intro">Etiqueta &middot; ${conteo}</span>
    </header>
    <div class="cb-post-list">
    ${posts.map(cardHtml).join('\n    ')}
    </div>
  </div>
</main>
<div class="site-back"><a href="" data-site-back aria-label="Volver a la página anterior">← Volver</a></div>
${footerHtml()}
<script src="/assets/js/site-ui.js" defer></script>
</body>
</html>`;
}
