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
    <a class="cb-brand" href="/">
      <img src="/images/bmm-orange-logo.svg" alt="" class="cb-brand-icon">
      <span>Barberena Mi Municipio</span>
    </a>
    <nav id="mainNav" class="cb-nav" aria-label="Navegación principal">
      <a href="/">Inicio</a>
      <a href="/barberena/">Barberena</a>
      <a href="/opiniones/">Opiniones</a>
      <a href="/historias/">Historias</a>
      <a href="/archivo/">Archivo</a>
    </nav>
    <div class="cb-nav-actions">
      <button class="cb-search-toggle" type="button" aria-label="Buscar" aria-expanded="false" aria-controls="searchPanel">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4.2-4.2"/></svg>
      </button>
      <button class="cb-theme-toggle" type="button" aria-label="Cambiar a modo oscuro" aria-pressed="false">
        <svg class="icon-sun" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M4.9 4.9 6.3 6.3M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g></svg>
        <svg class="icon-moon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
      </button>
      <button class="cb-menu-toggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="mainNav">☰</button>
    </div>
  </div>
  <div class="cb-search-panel" id="searchPanel" hidden>
    <div class="cb-container">
      <form class="cb-search-bar" action="/buscar/" method="get" role="search">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4.2-4.2"/></svg>
        <input type="search" name="q" placeholder="Buscar publicaciones…" aria-label="Buscar publicaciones" autocomplete="off" enterkeyhint="search">
        <button type="button" class="cb-search-close" aria-label="Cerrar búsqueda">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </form>
    </div>
  </div>
</header>
<script>
(function(){
  var b=document.querySelector('.cb-menu-toggle'),n=document.getElementById('mainNav');
  var s=document.querySelector('.cb-search-toggle'),p=document.getElementById('searchPanel');
  var i=p&&p.querySelector('input'),c=p&&p.querySelector('.cb-search-close');
  function closeMenu(){if(n&&b){n.classList.remove('is-open');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Abrir menú');}}
  function openSearch(){closeMenu();p.hidden=false;s.setAttribute('aria-expanded','true');setTimeout(function(){if(i)i.focus();},30);}
  function closeSearch(){p.hidden=true;s.setAttribute('aria-expanded','false');}
  if(b&&n){b.addEventListener('click',function(){if(p&&!p.hidden)closeSearch();var open=n.classList.toggle('is-open');b.setAttribute('aria-expanded',open?'true':'false');b.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');});}
  if(s&&p&&i&&c){
    s.addEventListener('click',function(){if(p.hidden)openSearch();else closeSearch();});
    c.addEventListener('click',closeSearch);
    document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(!p.hidden)closeSearch();if(n&&n.classList.contains('is-open'))closeMenu();}});
    document.addEventListener('click',function(e){if(!p.hidden&&!p.contains(e.target)&&!s.contains(e.target))closeSearch();});
  }
})();
(function(){
  var STORAGE_KEY='bmm-theme',btn=document.querySelector('.cb-theme-toggle');
  if(!btn)return;
  function isDarkNow(){var t=document.documentElement.getAttribute('data-theme');if(t==='dark')return true;if(t==='light')return false;return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;}
  function updateLabel(dark){btn.setAttribute('aria-pressed',dark?'true':'false');btn.setAttribute('aria-label',dark?'Cambiar a modo claro':'Cambiar a modo oscuro');}
  updateLabel(isDarkNow());
  btn.addEventListener('click',function(){var next=isDarkNow()?'light':'dark';document.documentElement.setAttribute('data-theme',next);try{localStorage.setItem(STORAGE_KEY,next);}catch(e){}updateLabel(next==='dark');});
})();
</script>`;
}
function footerHtml() {
  const year = new Date().getFullYear();
  return `<footer class="cb-footer">
  <div class="cb-container">
    <a href="/" class="cb-footer-brand"><img src="/images/bmm-black-logo.svg" alt=""><span>Barberena Mi Municipio</span></a>
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
    : `<img src="/assets/img/default-thumb.png" alt="${title}" loading="lazy" class="cb-media-bg">`;
  const overlay = post.video_url
    ? `<div class="cb-video-mask"><img src="/assets/img/ver-video.png" alt="Este post contiene un video" loading="lazy" class="cb-video-icon"></div>`
    : '';
  return `<a class="cb-post-image${post.video_url ? ' has-video-overlay' : ''}" href="/${post.slug}/">${bg}${overlay}</a>`;
}
const ICON_CAL = '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 10h17M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const ICON_CLOCK = '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function postCard(post) {
  const title = escapeHtml(post.title);
  const label = CATEGORY_LABELS[post.category] || 'Barberena';
  const categoryClass = ['barberena', 'opiniones', 'historias'].includes(post.category) ? post.category : 'barberena';
  const minutes = readingMinutes(post.body);
  const media = mediaBlock(post, title);
  return `<article class="cb-post cb-post--${categoryClass}">
  ${media}
  <div class="cb-post-meta"><span>${ICON_CAL}${fechaCorta(post.published_at)}</span><span class="cat">${label}</span><span>${ICON_CLOCK}${minutes} min de lectura</span></div>
  <h2><a href="/${post.slug}/">${title}</a></h2>
  ${post.excerpt ? `<p class="cb-post-excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
  <a class="cb-readmore" href="/${post.slug}/" aria-label="Leer más: ${title}">Leer más &gt;</a>
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
  <script>(function(){try{var t=localStorage.getItem('bmm-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${q ? escapeHtml(q) + ' — Buscar' : 'Buscar'} — Barberena Mi Municipio</title>
  <meta name="description" content="Buscá en todas las publicaciones de Barberena Mi Municipio.">
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${SITE_URL}/buscar/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@500;600;700;800;900&family=Roboto:wght@300;400;500;600&display=swap" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@500;600;700;800;900&family=Roboto:wght@300;400;500;600&display=swap"></noscript>
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96">
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
</body>
</html>`;
}
