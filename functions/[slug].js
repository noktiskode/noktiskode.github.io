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
      `${SUPABASE_URL}/rest/v1/posts?category=eq.${encodeURIComponent(post.category)}&slug=neq.${encodeURIComponent(slug)}&select=slug,title,published_at&order=published_at.desc&limit=2`,
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
  return `<div id="bmm-comentarios" data-slug="${slug}" style="max-width:640px;margin:2.5rem auto;font-family:-apple-system,sans-serif;color:var(--texto);">
  <h3 style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:28px;text-transform:uppercase;letter-spacing:.5px;border-bottom:3px solid #ef4f1d;padding-bottom:.5rem;margin-bottom:1.3rem;color:var(--texto);">Comentarios</h3>
  <div id="comment-list" style="margin-bottom:1.75rem;"></div>
  <label style="display:block;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:15px;text-transform:uppercase;letter-spacing:.2px;margin:.6rem 0 .3rem;color:var(--texto-suave);">Nombre (opcional)</label>
  <input type="text" id="c-nombre" placeholder="Vecino" maxlength="60" style="width:100%;padding:11px 13px;font-size:15px;border:1.5px solid var(--borde);border-radius:6px;box-sizing:border-box;background:var(--bg-card);color:var(--texto);">
  <label style="display:block;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:15px;text-transform:uppercase;letter-spacing:.2px;margin:1rem 0 .3rem;color:var(--texto-suave);">Comentario</label>
  <textarea id="c-texto" placeholder="Escribí tu comentario" maxlength="1000" style="width:100%;min-height:90px;padding:11px 13px;font-size:15px;border:1.5px solid var(--borde);border-radius:6px;box-sizing:border-box;font-family:inherit;background:var(--bg-card);color:var(--texto);"></textarea>
  <p id="err-texto" style="display:none;color:#A32D2D;font-size:13px;margin-top:.4rem;">Escribí algo antes de enviar.</p>
  <button id="btn-comentar" style="margin-top:1rem;padding:12px 26px;font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#fff;background:#ef4f1d;border:none;border-radius:6px;cursor:pointer;">Enviar comentario</button>
  <p id="ok-msg" style="display:none;color:#2F6B4E;font-size:13.5px;margin-top:.8rem;font-weight:600;">Comentario enviado. Se publicará tras revisión.</p>
</div>
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
      <img src="/images/bmm-logo.png" alt="" class="cb-brand-icon">
      <span>Barberena Mi Municipio</span>
    </a>
    <button class="cb-menu-toggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="mainNav">Menú</button>
    <nav id="mainNav" class="cb-nav" aria-label="Navegación principal">
      <a href="/">Inicio</a>
      <a href="/barberena/">Barberena</a>
      <a href="/opiniones/">Opiniones</a>
      <a href="/historias/">Historias</a>
      <a href="/archivo/">Archivo</a>
    </nav>
  </div>
</header>
<script>
(function(){
  var b=document.querySelector('.cb-menu-toggle'),n=document.getElementById('mainNav');
  if(!b||!n)return;
  b.addEventListener('click',function(){var open=n.classList.toggle('is-open');b.setAttribute('aria-expanded',open?'true':'false');});
})();
</script>`;
}

function footerHtml() {
  const year = new Date().getFullYear();
  return `<footer class="cb-footer">
  <div class="cb-container">
    <a href="/" class="cb-footer-brand">
      <img src="/images/icon-bmm.png" alt="">
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
${related.map((r) => `      <a class="cb-related-card" href="/${r.slug}/"><small>${new Date(r.published_at).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })}</small><h3>${escapeHtml(r.title)}</h3></a>`).join('\n')}
    </div></section>`
    : '';

  const mediaHtml = post.video_url
    ? `<div class="cb-article-image">${videoEmbed(post.video_url)}</div>`
    : (post.image_url ? `<figure class="cb-article-image"><img src="${image}" alt="${title}"></figure>` : '');

  return `<!DOCTYPE html>
<html lang="es">
<head>
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
  <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@500;600;700;800;900&family=Roboto:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/assets/css/clean-blog.css">
  <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="google-site-verification" content="rnI2_KGt4xMqGnZfDKDdzVr7GxNS1HKlzvXbb8d2ja4">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
${headerHtml()}
<main class="cb-post-page">
  <article class="cb-article">
    <header class="cb-article-header">
      <div class="meta"><a href="/${post.category}/">${categoryLabel}</a> · ${fecha} · ${minutes} min de lectura</div>
      <h1 data-edit-target data-slug="${slug}" data-inline-field="title">${title}</h1>
      ${post.excerpt ? `<p class="cb-article-lead" data-edit-target data-slug="${slug}" data-inline-field="excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
    </header>
    ${mediaHtml}
    <div class="cb-article-body" data-edit-target data-slug="${slug}" data-inline-field="body">${bodyHtml}</div>
    <div class="cb-share">
      <span class="cb-share-label">Compartir:</span>
      <a class="cb-share-btn" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}" target="_blank" rel="noopener" aria-label="Compartir en Facebook">
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12"/></svg>
      </a>
      <a class="cb-share-btn" href="https://api.whatsapp.com/send?text=${encodeURIComponent(post.title)}%20${encodeURIComponent(canonical)}" target="_blank" rel="noopener" aria-label="Compartir en WhatsApp">
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2m0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2m4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.6.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4.3-.4c.1-.1.1-.3 0-.4s-.6-1.4-.8-1.9-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.3 5.3 0 0 0 1.1 2.7 12 12 0 0 0 4.5 4c.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1s1.5-.6 1.7-1.2.2-1.1.1-1.2-.2-.2-.4-.3"/></svg>
      </a>
      <a class="cb-share-btn" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(canonical)}" target="_blank" rel="noopener" aria-label="Compartir en X">
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M18.9 2h3.4l-7.5 8.6L23.6 22h-6.9l-5.4-7-6.2 7H1.7l8-9.2L1 2h7l4.9 6.4zm-1.2 18h1.9L7.3 4H5.2z"/></svg>
      </a>
      <a class="cb-share-btn" href="https://t.me/share/url?url=${encodeURIComponent(canonical)}&text=${encodeURIComponent(post.title)}" target="_blank" rel="noopener" aria-label="Compartir en Telegram">
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M22 2 2 10.5l5.5 1.8L9.5 19l4-3.5 4.7 3.5L22 2zM8.9 12.1 17 6.5l-6.5 6-.2 2.8-1.4-3.2z"/></svg>
      </a>
    </div>
    ${tagsHtml}
    <div class="cb-after"><strong>Barberena Mi Municipio</strong><br>Blog personal · Opiniones abiertas. Un espacio independiente para hablar de Barberena.</div>
    ${relatedHtml}
    <div class="post-comments">${comentariosBlock(slug)}</div>
  </article>
</main>
${footerHtml()}
<script src="/assets/js/supabase-auth.js"></script>
<script src="/assets/js/inline-edit-supabase.js" defer></script>
</body>
</html>`;
}
