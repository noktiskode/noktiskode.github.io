// functions/[slug].js
//
// Sirve la página de un post leyendo de Supabase, replicando el layout
// real del sitio (_layouts/post.html + header/footer). Si el slug no
// existe en la tabla `posts`, delega la solicitud al sitio estático de
// Jekyll (context.next()) — así las páginas que no son posts (categorías,
// historia, manifiesto...) siguen funcionando sin cambios.

const SUPABASE_URL = 'https://iolchsadedieagiqrxzu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbGNoc2FkZWRpZWFnaXFyeHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NzI1ODYsImV4cCI6MjEwNjA0ODU4Nn0.lOUc-vt2JFfDIidKO7m_dFgjnmDWIGQnzXADHcBTjyg';
const SITE_URL = 'https://barberenamimunicipio.top';

const CATEGORY_LABELS = { opiniones: 'Opiniones', barberena: 'Barberena', historias: 'Historias' };

export async function onRequestGet(context) {
  const { params, next } = context;
  const slug = params.slug;

  if (!slug || slug.includes('.') || slug === 'admin' || slug === 'login.html' || slug === 'moderar.html') {
    return next();
  }

  let rows;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    if (!res.ok) return next();
    rows = await res.json();
  } catch (e) {
    return next();
  }

  if (!rows || rows.length === 0) return next();

  const post = rows[0];

  let related = [];
  try {
    const relRes = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?category=eq.${encodeURIComponent(post.category)}&slug=neq.${encodeURIComponent(slug)}&select=slug,title,published_at&order=published_at.desc&limit=3`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    if (relRes.ok) related = await relRes.json();
  } catch (e) {
    related = [];
  }

  return new Response(renderPost(post, slug, related), {
    headers: { 'content-type': 'text/html; charset=UTF-8' }
  });
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function markdownToHtml(md) {
  if (!md) return '';
  // Separa el cuerpo en bloques de HTML crudo (figure/div/img sueltos, que
  // ya vienen escritos a mano en tus posts) y bloques de texto/markdown.
  const htmlBlockRegex = /<figure[\s\S]*?<\/figure>|<div[\s\S]*?<\/div>|<img[^>]*>/gi;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = htmlBlockRegex.exec(md)) !== null) {
    if (match.index > lastIndex) parts.push({ type: 'text', content: md.slice(lastIndex, match.index) });
    parts.push({ type: 'html', content: match[0] });
    lastIndex = htmlBlockRegex.lastIndex;
  }
  if (lastIndex < md.length) parts.push({ type: 'text', content: md.slice(lastIndex) });

  return parts
    .map((part) => (part.type === 'html' ? part.content.trim() : textBlockToHtml(part.content)))
    .filter(Boolean)
    .join('\n');
}

function textBlockToHtml(text) {
  const blocks = text.trim().split(/\n\s*\n/).filter((b) => b.trim());
  return blocks
    .map((block) => {
      let html = escapeHtml(block.trim());
      // Imagen markdown: ![alt](url)
      html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (m, alt, url) =>
        `<img src="${url}" alt="${alt}" style="max-width:100%;border-radius:8px;">`);
      // Enlace markdown: [texto](url)
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, url) =>
        `<a href="${url}" target="_blank" rel="noopener">${t}</a>`);
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
      html = html.replace(/\n/g, '<br>');
      return `<p>${html}</p>`;
    })
    .join('\n');
}

function videoEmbed(url) {
  if (!url) return '';
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = '';
    if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
    else if (url.includes('watch?v=')) videoId = url.split('v=')[1].split('&')[0];
    else if (url.includes('/embed/')) videoId = url.split('/embed/')[1].split('?')[0];
    return `<div class="video-wrapper youtube-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen loading="lazy"></iframe></div>`;
  }
  if (url.includes('facebook.com')) {
    return `<div id="fb-root"></div>
<script async defer crossorigin="anonymous" src="https://connect.facebook.net/es_LA/sdk.js#xfbml=1&version=v19.0"></script>
<div class="video-wrapper fb-video-wrapper"><div class="fb-video" data-href="${escapeHtml(url)}" data-width="auto" data-show-text="false"></div></div>`;
  }
  return '';
}

function comentariosBlock(slug) {
  return `<details class="comments-details">
  <summary>Comentarios</summary>
  <div class="comments-panel">
  <div id="bmm-comentarios" data-slug="${slug}" style="font-family:-apple-system,sans-serif;color:var(--texto);">
  <div id="comment-list" style="margin-bottom:1.75rem;"></div>
  <label style="display:block;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:15px;text-transform:uppercase;letter-spacing:.2px;margin:.6rem 0 .3rem;color:var(--texto-suave);">Nombre (opcional)</label>
  <input type="text" id="c-nombre" placeholder="Vecino" maxlength="60" style="width:100%;padding:11px 13px;font-size:15px;border:1.5px solid var(--borde);border-radius:6px;box-sizing:border-box;background:var(--bg-card);color:var(--texto);">
  <label style="display:block;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:15px;text-transform:uppercase;letter-spacing:.2px;margin:1rem 0 .3rem;color:var(--texto-suave);">Comentario</label>
  <textarea id="c-texto" placeholder="Escribí tu comentario" maxlength="1000" style="width:100%;min-height:90px;padding:11px 13px;font-size:15px;border:1.5px solid var(--borde);border-radius:6px;box-sizing:border-box;font-family:inherit;background:var(--bg-card);color:var(--texto);"></textarea>
  <p id="err-texto" style="display:none;color:#A32D2D;font-size:13px;margin-top:.4rem;">Escribí algo antes de enviar.</p>
  <button id="btn-comentar" style="margin-top:1rem;padding:12px 26px;font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#fff;background:#ef4f1d;border:none;border-radius:6px;cursor:pointer;">Enviar comentario</button>
  <p id="ok-msg" style="display:none;color:#2F6B4E;font-size:13.5px;margin-top:.8rem;font-weight:600;">Comentario enviado. Se publicará tras revisión.</p>
</div>
  </div>
</details>
<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
  import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
  const app = initializeApp({
    apiKey: "AIzaSyC1jgfupbu5YUvfSeMh5Je9DVExXNgYd1o",
    authDomain: "bmm-comentarios.firebaseapp.com",
    projectId: "bmm-comentarios",
    storageBucket: "bmm-comentarios.firebasestorage.app",
    messagingSenderId: "601712463771",
    appId: "1:601712463771:web:60468f91d14b780aad9b3e"
  });
  const db = getFirestore(app);
  function escapeHtml(v) {
    return String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }
  const slug = document.getElementById('bmm-comentarios').dataset.slug;
  const q = query(collection(db, "comentarios"), where("postSlug", "==", slug), where("estado", "==", "aprobado"), orderBy("creado", "desc"));
  onSnapshot(q, snap => {
    const list = document.getElementById('comment-list');
    if (snap.empty) {
      list.innerHTML = '<div style="text-align:center;padding:2.2rem 1rem 1.6rem;"><img src="/images/icons/comments-icon.png" alt="" style="display:block;width:64px;height:auto;margin:0 auto 1rem;"><p style="font-weight:700;font-size:19px;margin:0 0 .3rem;color:var(--texto);">Aún no hay comentarios</p><p style="color:var(--texto-mudo);font-size:15px;margin:0;">Sé la primera persona en comentar.</p></div>';
      return;
    }
    list.innerHTML = snap.docs.map(d => {
      const c = d.data();
      return '<div style="border-bottom:1px solid var(--borde);padding:.9rem 0;"><strong style="font-family:\\'Barlow Condensed\\',sans-serif;font-weight:700;font-size:16px;letter-spacing:.2px;color:#ef4f1d;">' + escapeHtml(c.nombre || 'Vecino') + '</strong><p style="font-size:15px;margin:.35rem 0 0;line-height:1.5;color:var(--texto);">' + escapeHtml(c.texto) + '</p></div>';
    }).join('');
  }, err => console.error('Error leyendo comentarios:', err));
  document.getElementById('btn-comentar').addEventListener('click', async () => {
    const texto = document.getElementById('c-texto').value.trim();
    const errEl = document.getElementById('err-texto');
    if (!texto) { errEl.style.display = 'block'; return; }
    errEl.style.display = 'none';
    const nombre = document.getElementById('c-nombre').value.trim();
    try {
      await addDoc(collection(db, "comentarios"), { postSlug: slug, nombre: nombre || "Vecino", texto, estado: "pendiente", creado: serverTimestamp() });
      document.getElementById('c-texto').value = '';
      document.getElementById('ok-msg').style.display = 'block';
      setTimeout(() => document.getElementById('ok-msg').style.display = 'none', 4000);
    } catch (err) {
      console.error('Error enviando comentario:', err);
      alert('No se pudo enviar el comentario. Revisá la consola.');
    }
  });
</script>`;
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

function renderPost(post, slug, related) {
  const title = escapeHtml(post.title);
  const desc = escapeHtml((post.excerpt || '').slice(0, 155));
  const canonical = `${SITE_URL}/${slug}/`;
  const image = post.image_url
    ? (post.image_url.startsWith('http') ? post.image_url : `${SITE_URL}${post.image_url}`)
    : `${SITE_URL}/images/portada.webp`;
  const bodyHtml = markdownToHtml(post.body);
  const fecha = new Date(post.published_at).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const publishedIso = new Date(post.published_at).toISOString();
  const categoryLabel = CATEGORY_LABELS[post.category] || 'Barberena';
  const words = (post.body || '').split(/\s+/).filter(Boolean).length;
  const minutes = Math.floor(words / 200) + 1;
  const robotsTag = post.noindex ? '<meta name="robots" content="noindex, follow">' : '';

  const tagsHtml = (post.tags && post.tags.length)
    ? `<div class="cb-tags"><p class="cb-tags-label">Etiquetas</p>${post.tags.map((t) => `<span class="cb-tag">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';

  const relatedHtml = (related && related.length)
    ? `<section class="cb-related"><h2>También puedes leer</h2><div class="cb-related-grid">
${related.slice(0, 3).map((r) => `      <a class="cb-related-card" href="/${r.slug}/"><small>${new Date(r.published_at).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })}</small><h3>${escapeHtml(r.title)}</h3></a>`).join('\n')}
    </div></section>`
    : '';

  const mediaHtml = post.video_url
    ? `<div class="cb-article-image">${videoEmbed(post.video_url)}</div>`
    : (post.image_url ? `<figure class="cb-article-image"><img src="${image}" alt="${title}"></figure>` : '');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <script>(function(){try{var t=localStorage.getItem('bmm-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  ${robotsTag}
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Barberena Mi Municipio">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${image}">
  <meta property="og:locale" content="es_GT">
  <meta property="article:published_time" content="${publishedIso}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${image}">
  <link rel="canonical" href="${canonical}">
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
<main class="cb-post-page">
  <article class="cb-article">
    <header class="cb-article-header">
      <div class="meta"><a href="/${post.category}/">${categoryLabel}</a> · ${fecha} · ${minutes} min de lectura</div>
      <h1>${title}</h1>
      ${post.excerpt ? `<p class="cb-article-lead">${escapeHtml(post.excerpt)}</p>` : ''}
    </header>
    ${mediaHtml}
    <div class="cb-article-body">${bodyHtml}</div>
    <div class="cb-share" data-share data-url="${escapeHtml(canonical)}" data-title="${title}">
      <span class="cb-share-label">Compartir:</span>
      <button type="button" class="cb-share-native" data-share-native hidden aria-label="Compartir publicación">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
        <span>Compartir</span>
      </button>
      <div class="cb-share-fallback" data-share-fallback hidden aria-label="Opciones para compartir">
        <a class="cb-share-btn cb-share-facebook" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}" target="_blank" rel="noopener" aria-label="Compartir en Facebook" title="Facebook">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
        <a class="cb-share-btn cb-share-x" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(canonical)}" target="_blank" rel="noopener" aria-label="Compartir en X" title="X">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a class="cb-share-btn cb-share-whatsapp" href="https://api.whatsapp.com/send?text=${encodeURIComponent(post.title)}%20${encodeURIComponent(canonical)}" target="_blank" rel="noopener" aria-label="Compartir en WhatsApp" title="WhatsApp">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
        <button type="button" class="cb-share-btn cb-share-copy" data-share-copy aria-label="Copiar enlace" title="Copiar enlace">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </button>
      </div>
    </div>
    ${tagsHtml}
    <div class="cb-after"><strong>Barberena Mi Municipio</strong><br>Blog personal · Opiniones abiertas. Un espacio independiente para hablar de Barberena.</div>
    ${relatedHtml}
    <div class="post-comments">${comentariosBlock(slug)}</div>
  </article>
</main>
<div class="site-back"><a href="" data-site-back aria-label="Volver a la página anterior">← Volver</a></div>
${footerHtml()}
<script>
/* Supabase solo se descarga si hay una sesión de admin guardada en este navegador */
(function(){try{
  if(!localStorage.getItem('sb-iolchsadedieagiqrxzu-auth-token'))return;
  var a=document.createElement('script');
  a.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  a.onload=function(){var b=document.createElement('script');b.src='/assets/js/supabase-auth.js';document.body.appendChild(b);};
  document.head.appendChild(a);
}catch(e){}})();
</script>
<script src="/assets/js/site-ui.js" defer></script>
</body>
</html>`;
}
