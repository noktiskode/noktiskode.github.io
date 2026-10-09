// functions/index.js
//
// Sirve la portada del sitio leyendo los posts desde Supabase.
// Reemplaza al index.html generado por Jekyll para que los posts
// creados desde el panel de admin (que solo existen en Supabase)
// aparezcan sin necesitar un build de Jekyll.

const SUPABASE_URL = 'https://iolchsadedieagiqrxzu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbGNoc2FkZWRpZWFnaXFyeHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NzI1ODYsImV4cCI6MjEwNjA0ODU4Nn0.lOUc-vt2JFfDIidKO7m_dFgjnmDWIGQnzXADHcBTjyg';
const SITE_URL = 'https://barberenamimunicipio.top';
const CATEGORY_LABELS = { opiniones: 'Opiniones', barberena: 'Barberena', historias: 'Historias' };
// Cuántas tarjetas lleva el carrusel de destacados (en computadora se ven 3 a la vez)
const CAROUSEL_SIZE = 6;

export async function onRequestGet(context) {
  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

  let featuredPosts = [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?featured=eq.true&published=eq.true&select=*&order=published_at.desc&limit=${CAROUSEL_SIZE}`,
      { headers }
    );
    featuredPosts = res.ok ? await res.json() : [];
  } catch (e) { featuredPosts = []; }

  let posts = [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?published=eq.true&select=*&order=published_at.desc&limit=60`,
      { headers }
    );
    posts = res.ok ? await res.json() : [];
  } catch (e) { posts = []; }

  // Si hay menos destacados que tarjetas, completa el carrusel con los más recientes
  if (featuredPosts.length < CAROUSEL_SIZE) {
    const usedSlugs = new Set(featuredPosts.map((p) => p.slug));
    for (const p of posts) {
      if (featuredPosts.length >= CAROUSEL_SIZE) break;
      if (!usedSlugs.has(p.slug)) { featuredPosts.push(p); usedSlugs.add(p.slug); }
    }
  }

  const carouselSlugs = new Set(featuredPosts.map((p) => p.slug));
  const gridPosts = posts.filter((p) => !carouselSlugs.has(p.slug));

  return new Response(renderHome(featuredPosts, gridPosts), {
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
    <a href="/" class="cb-footer-brand">
      <img src="/images/bmm-black-logo.svg" alt="">
      <span>Barberena Mi Municipio</span>
    </a>
    <p>Blog personal · Opiniones abiertas · Página independiente</p>
    <nav aria-label="Enlaces del pie de página">
      <a href="/que-publicamos/">¿Qué publicamos?</a>
      <a href="/como-participar/">¿Cómo participar?</a>
      <a href="/manifiesto/">Manifiesto</a>
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
const ICON_ARROW = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function destacadoCard(post, i, total) {
  const title = escapeHtml(post.title);
  const cat = CATEGORY_LABELS[post.category] ? post.category : 'barberena';
  const img = `<img src="${resolveImage(post)}" alt=""${i === 0 ? ' fetchpriority="high"' : (i < 3 ? '' : ' loading="lazy" decoding="async"')}>`;
  return `<li class="dest-slide" role="group" aria-roledescription="publicación" aria-label="${i + 1} de ${total}">
      <article class="dest-card">
        <div class="dest-media">${img}<span class="dest-badge" data-cat="${cat}">${CATEGORY_LABELS[cat]}</span></div>
        <div class="dest-body">
          <p class="dest-meta"><span>${ICON_CAL}${fechaCorta(post.published_at)}</span><span>${ICON_CLOCK}${readingMinutes(post.body)} min de lectura</span></p>
          <h3 class="dest-title"><a href="/${post.slug}/">${title}</a></h3>
          ${post.excerpt ? `<p class="dest-excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
          <span class="dest-cta" aria-hidden="true">Leer publicación ${ICON_ARROW}</span>
        </div>
      </article>
    </li>`;
}

function destacadosHtml(featuredPosts) {
  if (!featuredPosts.length) return '';
  const cards = featuredPosts.map((p, i) => destacadoCard(p, i, featuredPosts.length)).join('\n    ');
  return `<section class="dest" id="destCarrusel" aria-roledescription="carrusel" aria-label="Publicaciones destacadas">
  <div class="cb-container">
    <header class="dest-head">
      <span class="dest-chip">Destacados</span>
      <h2>Historias y opiniones de Barberena</h2>
    </header>
    <div class="dest-wrap">
      <div class="dest-viewport">
        <ul class="dest-track" aria-live="off">
    ${cards}
        </ul>
      </div>
      <button type="button" class="dest-arrow dest-prev" aria-label="Publicaciones anteriores"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <button type="button" class="dest-arrow dest-next" aria-label="Publicaciones siguientes"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>
    <div class="dest-dots" role="group" aria-label="Elegir posición del carrusel"></div>
  </div>
</section>`;
}

function postCard(post) {
  const title = escapeHtml(post.title);
  const label = CATEGORY_LABELS[post.category] || 'Barberena';
  const minutes = readingMinutes(post.body);
  const media = mediaBlock(post, title);

  return `<article class="cb-post">
  ${media}
  <div class="cb-post-meta">
    ${fechaCorta(post.published_at)} · <span class="cat">${label}</span> · ${minutes} min de lectura
  </div>
  <h2><a href="/${post.slug}/">${title}</a></h2>
  ${post.excerpt ? `<p class="cb-post-excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
  <a class="cb-readmore" href="/${post.slug}/" aria-label="Leer más: ${title}">Leer más &gt;</a>
</article>`;
}

function renderHome(featuredPosts, gridPosts) {
  const desc = 'Blog personal sobre Barberena y El Cerinal. Opiniones, historias, acontecimientos y cosas que vale la pena comentar.';
  const og = featuredPosts[0];

  const destHtml = destacadosHtml(featuredPosts);

  const cardsHtml = gridPosts.length
    ? gridPosts.map(postCard).join('\n')
    : '<p class="cb-empty">Todavía no hay más publicaciones.</p>';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <script>(function(){try{var t=localStorage.getItem('bmm-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Barberena Mi Municipio</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <link rel="canonical" href="${SITE_URL}/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Barberena Mi Municipio">
  <meta property="og:title" content="Barberena Mi Municipio">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:url" content="${SITE_URL}/">
  <meta property="og:image" content="${og ? resolveImage(og) : SITE_URL + '/images/portada.webp'}">
  <meta property="og:locale" content="es_GT">
  <meta name="twitter:card" content="summary_large_image">
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
${destHtml}
<main class="cb-page">
  <div class="cb-container">
    <header class="cb-page-header">
      <h1>Las últimas</h1>
      <p>De tishudos para tishudos. Historias, opiniones y cosas que vale la pena comentar sobre Barberena.</p>
    </header>
    <div class="cb-post-list">
      ${cardsHtml}
    </div>
    <div class="cb-more-wrap">
      <button type="button" class="cb-more" id="cbMore" hidden>Ver más publicaciones</button>
    </div>
  </div>
</main>
${footerHtml()}
<script>
(function () {
  var root = document.getElementById('destCarrusel');
  if (!root) return;
  var vp = root.querySelector('.dest-viewport');
  var track = root.querySelector('.dest-track');
  var slides = [].slice.call(track.children);
  var dotsBox = root.querySelector('.dest-dots');
  var prevBtn = root.querySelector('.dest-prev');
  var nextBtn = root.querySelector('.dest-next');
  var n = slides.length;
  var per = 1, maxIdx = 0, current = 0, dots = [];
  var DURATION = 6000, remaining = DURATION, startedAt = 0, timer = null;
  var hovering = false, inView = true;
  var reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function step() {
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return slides[0].getBoundingClientRect().width + gap;
  }
  function paintDots() {
    dots.forEach(function (d, i) {
      if (i === current) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
  }
  function measure() {
    per = parseInt(getComputedStyle(track).getPropertyValue('--per'), 10) || 1;
    maxIdx = Math.max(0, n - per);
    root.classList.toggle('sin-control', maxIdx === 0);
    if (dots.length !== maxIdx + 1) {
      dotsBox.innerHTML = '';
      dots = [];
      for (var i = 0; i <= maxIdx; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'dest-dot';
        b.setAttribute('aria-label', 'Ir a la posición ' + (i + 1) + ' de ' + (maxIdx + 1));
        b.appendChild(document.createElement('span'));
        b.addEventListener('click', (function (k) { return function () { goTo(k, true); restart(); }; })(i));
        dotsBox.appendChild(b);
        dots.push(b);
      }
    }
    paintDots();
  }
  function goTo(i, smooth) {
    i = Math.max(0, Math.min(maxIdx, i));
    vp.scrollTo({ left: i * step(), behavior: (smooth && !reducido) ? 'smooth' : 'auto' });
  }
  function next() { goTo(current >= maxIdx ? 0 : current + 1, true); }
  function prev() { goTo(current <= 0 ? maxIdx : current - 1, true); }

  // El punto activo sigue al desplazamiento (también cuando se desliza con el dedo)
  var ticking = false;
  vp.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var s = step();
      var idx = Math.max(0, Math.min(maxIdx, Math.round(vp.scrollLeft / s)));
      if (idx !== current) { current = idx; paintDots(); }
    });
  }, { passive: true });

  // Avance automático con pausa: al reanudar continúa con el tiempo que faltaba
  function schedule() {
    clearTimeout(timer);
    startedAt = Date.now();
    timer = setTimeout(function () { next(); remaining = DURATION; schedule(); }, remaining);
  }
  function canRun() { return maxIdx > 0 && !hovering && inView && !document.hidden; }
  function pauseAuto() {
    if (!timer) return;
    clearTimeout(timer); timer = null;
    remaining = Math.max(400, remaining - (Date.now() - startedAt));
  }
  function resumeAuto() { if (!timer && canRun()) schedule(); }
  function restart() { clearTimeout(timer); timer = null; remaining = DURATION; if (canRun()) schedule(); }

  if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restart(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { next(); restart(); });

  // Pausa con el mouse (no con el dedo), con el foco de teclado y si el carrusel no se ve
  root.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hovering = true; pauseAuto(); } });
  root.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hovering = false; resumeAuto(); } });
  root.addEventListener('focusin', function (e) { if (e.target.matches && e.target.matches(':focus-visible')) pauseAuto(); });
  root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) resumeAuto(); });
  vp.addEventListener('touchstart', pauseAuto, { passive: true });
  vp.addEventListener('touchend', restart, { passive: true });
  vp.addEventListener('touchcancel', restart, { passive: true });
  vp.addEventListener('wheel', function () { restart(); }, { passive: true });
  document.addEventListener('visibilitychange', function () { document.hidden ? pauseAuto() : resumeAuto(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      inView ? resumeAuto() : pauseAuto();
    }, { threshold: 0.15 }).observe(root);
  }

  var rt = null;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { measure(); goTo(Math.min(current, maxIdx), false); }, 120);
  });

  measure();
  restart();
})();
</script>
<script>
(function () {
  var step = 7, shown = step;
  var items = [].slice.call(document.querySelectorAll('.cb-post-list .cb-post'));
  var btn = document.getElementById('cbMore');
  if (!btn) return;
  function render() {
    items.forEach(function (el, i) { el.hidden = i >= shown; });
    btn.hidden = shown >= items.length;
  }
  btn.addEventListener('click', function () { shown += step; render(); });
  render();
})();
</script>
</body>
</html>`;
}
