// functions/buscar/index.js
//
// Página de búsqueda: /buscar/?q=palabra
// Usa la función search_posts de Supabase (ignora tildes y mayúsculas).
// Si esa función todavía no existe, cae a una búsqueda simple por título y resumen.

const SUPABASE_URL = 'https://iolchsadedieagiqrxzu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbGNoc2FkZWRpZWFnaXFyeHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NzI1ODYsImV4cCI6MjEwNjA0ODU4Nn0.lOUc-vt2JFfDIidKO7m_dFgjnmDWIGQnzXADHcBTjyg';
const SITE_URL = 'https://barberenamimunicipio.top';
const CATEGORY_LABELS = { opiniones: 'Opiniones', barberena: 'Barberena', historias: 'Historias' };

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  };

  let posts = [];
  let failed = false;

  if (q.length >= 2) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ term: q })
      });
      if (res.ok) {
        posts = await res.json();
      } else {
        // Respaldo: búsqueda simple (sensible a tildes) si la función SQL aún no existe
        const safe = q.replace(/[*,()]/g, ' ');
        const fb = await fetch(
          `${SUPABASE_URL}/rest/v1/posts?published=eq.true&or=(title.ilike.*${encodeURIComponent(safe)}*,excerpt.ilike.*${encodeURIComponent(safe)}*)&select=*&order=published_at.desc&limit=60`,
          { headers }
        );
        if (fb.ok) posts = await fb.json();
        else failed = true;
      }
    } catch (e) {
      failed = true;
    }
  }

  return new Response(renderSearch(q, posts, failed), {
    headers: { 'content-type': 'text/html; charset=UTF-8', 'cache-control': 'no-store' }
  });
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function resolveImage(post) {
  if (!post.image_url) return `${SITE_URL}/images/portada.webp`;
  return post.image_url.startsWith('http') ? post.image_url : `${SITE_URL}${post.image_url}`;
}
function readingMinutes(body) {
  const words = (body || '').split(/\s+/).filter(Boolean).length;
  return Math.floor(words / 200) + 1;
}
function fechaCorta(iso) {
  return new Date(iso).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function headerHtml() {
  return `<header class="cb-navbar">
  <div class="cb-container cb-navbar-inner">
    <a class="cb-brand" href="/"><img src="/images/bmm-logo.png" alt="" class="cb-brand-icon"><span>Barberena Mi Municipio</span></a>
    <button class="cb-menu-toggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="mainNav">Menú</button>
    <nav id="mainNav" class="cb-nav" aria-label="Navegación principal">
      <a href="/">Inicio</a><a href="/barberena/">Barberena</a><a href="/opiniones/">Opiniones</a><a href="/historias/">Historias</a><a href="/archivo/">Archivo</a><a href="/buscar/">Buscar</a>
    </nav>
  </div>
</header>
<script>(function(){var b=document.querySelector('.cb-menu-toggle'),n=document.getElementById('mainNav');if(!b||!n)return;b.addEventListener('click',function(){var open=n.classList.toggle('is-open');b.setAttribute('aria-expanded',open?'true':'false');});})();</script>`;
}
function footerHtml() {
  const year = new Date().getFullYear();
  return `<footer class="cb-footer">
  <div class="cb-container">
    <a href="/" class="cb-footer-brand"><img src="/images/icon-bmm.png" alt=""><span>Barberena Mi Municipio</span></a>
    <p>Blog personal · Opiniones abiertas · Página independiente</p>
    <nav aria-label="Enlaces del pie de página">
      <a href="/que-publicamos/">¿Qué publicamos?</a><a href="/como-participar/">¿Cómo participar?</a><a href="/manifiesto/">Manifiesto</a>
      <a href="https://www.facebook.com/BarberenaMiMunicipio/" target="_blank" rel="noopener">Facebook</a>
    </nav>
    <small>© ${year} Barberena Mi Municipio</small>
  </div>
</footer>`;
}
function mediaBlock(post, title) {
  if (!post.video_url && !post.image_url) return '';
  const bg = post.image_url
    ? `<img src="${resolveImage(post)}" alt="${title}" loading="lazy" class="cb-media-bg">`
    : (post.video_url ? '<div class="cb-video-fallback-bg"></div>' : '');
  const overlay = post.video_url
    ? `<div class="cb-video-mask"><img src="/assets/img/ver-video.svg" alt="Este post contiene un video" loading="lazy" class="cb-video-icon"></div>`
    : '';
  return `<a class="cb-post-image${post.video_url ? ' has-video-overlay' : ''}" href="/${post.slug}/">${bg}${overlay}</a>`;
}
function postCard(post) {
  const title = escapeHtml(post.title);
  const label = CATEGORY_LABELS[post.category] || 'Barberena';
  const minutes = readingMinutes(post.body);
  const media = mediaBlock(post, title);
  return `<article class="cb-post">
  ${media}
  <div class="cb-post-meta"><span class="cat">${label}</span> · ${fechaCorta(post.published_at)} · ${minutes} min de lectura</div>
  <h2><a href="/${post.slug}/">${title}</a></h2>
  ${post.excerpt ? `<p class="cb-post-excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
  <a class="cb-readmore" href="/${post.slug}/">Leer publicación →</a>
  <a class="cb-edit" href="#" data-edit-link data-slug="${post.slug}" data-inline-field="title" style="display:none;">✏️ Editar título</a>
</article>`;
}

function renderSearch(q, posts, failed) {
  let status = '';
  let listHtml = '';

  if (!q) {
    status = 'Escribí una palabra o frase para buscar en todas las publicaciones.';
  } else if (q.length < 2) {
    status = 'Escribí al menos 2 letras.';
  } else if (failed) {
    status = 'No se pudo completar la búsqueda ahora. Probá de nuevo en un momento.';
  } else if (!posts.length) {
    status = `No encontramos publicaciones para "${escapeHtml(q)}". Probá con otra palabra.`;
  } else {
    status = `${posts.length === 60 ? 'Más de 60' : posts.length} resultado${posts.length === 1 ? '' : 's'} para "${escapeHtml(q)}".`;
    listHtml = `<div class="cb-post-list">${posts.map(postCard).join('\n')}</div>`;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${q ? escapeHtml(q) + ' — Buscar' : 'Buscar'} — Barberena Mi Municipio</title>
  <meta name="description" content="Buscá en todas las publicaciones de Barberena Mi Municipio.">
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${SITE_URL}/buscar/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@500;600;700;800;900&family=Roboto:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/assets/css/clean-blog.css">
  <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
${headerHtml()}
<main class="cb-page">
  <div class="cb-container">
    <header class="cb-page-header">
      <h1>Buscar</h1>
      <form class="cb-search-form" action="/buscar/" method="get" role="search">
        <input type="search" name="q" value="${escapeHtml(q)}" placeholder="Buscar publicaciones…" aria-label="Buscar publicaciones" autocomplete="off" ${q ? '' : 'autofocus'}>
        <button type="submit">Buscar</button>
      </form>
      <p class="cb-search-status">${status}</p>
    </header>
    ${listHtml}
  </div>
</main>
${footerHtml()}
<script src="/assets/js/supabase-auth.js"></script>
<script src="/assets/js/inline-edit-supabase.js" defer></script>
</body>
</html>`;
}
