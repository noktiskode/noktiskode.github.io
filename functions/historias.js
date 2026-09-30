// functions/historias/index.js
const SUPABASE_URL = 'https://iolchsadedieagiqrxzu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbGNoc2FkZWRpZWFnaXFyeHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NzI1ODYsImV4cCI6MjEwNjA0ODU4Nn0.lOUc-vt2JFfDIidKO7m_dFgjnmDWIGQnzXADHcBTjyg';
const SITE_URL = 'https://barberenamimunicipio.top';
const CATEGORY = 'historias';
const LABEL = 'Historias';
const DESCRIPTION = 'Memoria, patrimonio y relatos de Barberena: lugares, personajes, fotografías antiguas, tradiciones y la historia que nos conecta.';
const PATH = '/historias/';

export async function onRequestGet() {
  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };
  let posts = [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?category=eq.${CATEGORY}&published=eq.true&select=*&order=published_at.desc&limit=200`,
      { headers }
    );
    posts = res.ok ? await res.json() : [];
  } catch (e) { posts = []; }

  return new Response(renderCategoryPage(posts), {
    headers: { 'content-type': 'text/html; charset=UTF-8' }
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
      <img src="/images/bmm-logo.png" alt="" class="cb-brand-icon">
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
    : `<img src="/assets/img/default-thumb.png" alt="${title}" loading="lazy" class="cb-media-bg">`;
  const overlay = post.video_url
    ? `<div class="cb-video-mask"><img src="/assets/img/ver-video.png" alt="Este post contiene un video" loading="lazy" class="cb-video-icon"></div>`
    : '';
  return `<a class="cb-post-image${post.video_url ? ' has-video-overlay' : ''}" href="/${post.slug}/">${bg}${overlay}</a>`;
}
function postCard(post) {
  const title = escapeHtml(post.title);
  const minutes = readingMinutes(post.body);
  const media = mediaBlock(post, title);
  return `<article class="cb-post cb-post--${CATEGORY}">
  ${media}
  <div class="cb-post-meta"><span class="cat">${LABEL}</span> · ${fechaCorta(post.published_at)} · ${minutes} min de lectura</div>
  <h2><a href="/${post.slug}/">${title}</a></h2>
  ${post.excerpt ? `<p class="cb-post-excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
  <a class="cb-readmore" href="/${post.slug}/">Leer publicación</a>
  <a class="cb-edit" href="#" data-edit-link data-slug="${post.slug}" data-inline-field="title" style="display:none;">✏️ Editar título</a>
</article>`;
}
function renderCategoryPage(posts) {
  const listHtml = posts.length
    ? `<div class="category-list">${posts.map(postCard).join('\n')}</div>`
    : '<p class="category-empty">Todavía no hay publicaciones en esta sección.</p>';
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <script>(function(){try{var t=localStorage.getItem('bmm-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${LABEL} — Barberena Mi Municipio</title>
  <meta name="description" content="${escapeHtml(DESCRIPTION)}">
  <link rel="canonical" href="${SITE_URL}${PATH}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Barberena Mi Municipio">
  <meta property="og:title" content="${LABEL} — Barberena Mi Municipio">
  <meta property="og:description" content="${escapeHtml(DESCRIPTION)}">
  <meta property="og:url" content="${SITE_URL}${PATH}">
  <meta property="og:image" content="${SITE_URL}/images/portada.webp">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@500;600;700;800;900&family=Roboto:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
${headerHtml()}
<section class="category-page">
  <header class="category-masthead">
    <h1>${LABEL}</h1>
    <p class="category-intro">${escapeHtml(DESCRIPTION)}</p>
  </header>
  ${listHtml}
</section>
<div class="site-back"><a href="" data-site-back aria-label="Volver a la página anterior">← Volver</a></div>
${footerHtml()}
<script src="/assets/js/supabase-auth.js"></script>
<script src="/assets/js/inline-edit-supabase.js" defer></script>
<script src="/assets/js/site-ui.js" defer></script>
</body>
</html>`;
}
