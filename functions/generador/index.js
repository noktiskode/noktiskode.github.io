// functions/generador/index.js
//
// Generador de carteles y avisos vecinales: /generador/
// Página estática (no consulta Supabase). Los fondos se dibujan con código
// (colores, degradados y patrones) y la imagen final se genera en el navegador.

const SITE_URL = 'https://barberenamimunicipio.top';

export async function onRequestGet() {
  return new Response(renderPage(), {
    headers: { 'content-type': 'text/html; charset=UTF-8' }
  });
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

function renderPage() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <script>(function(){try{var t=localStorage.getItem('bmm-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generador de carteles — Barberena Mi Municipio</title>
  <meta name="description" content="Armá carteles y avisos vecinales para compartir en WhatsApp y redes sociales.">
  <link rel="canonical" href="${SITE_URL}/generador/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@500;600;700;800;900&family=Roboto:wght@300;400;500;600&family=Anton&family=Bebas+Neue&family=Oswald:wght@700&family=Montserrat:wght@900&family=Playfair+Display:wght@900&family=Permanent+Marker&display=swap">
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <style>
    /* ---------- Generador de carteles (usa las variables de styles.css) ---------- */
    .gen-wrap { padding: 3.5rem 0 4.5rem; }
    .gen-head { margin-bottom: 2.25rem; }
    .gen-head h1 { font-size: 2.25rem; line-height: 1.2; }
    .gen-head p { margin-top: .5rem; max-width: 42rem; color: var(--texto-mudo); font-size: 1.125rem; font-weight: 300; }

    .gen { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr); gap: 2.25rem; align-items: start; }
    .gen-preview { position: sticky; top: 5rem; }
    .gen-panel { background: var(--bg-card); border: 1px solid var(--borde); border-radius: 12px; padding: 1.75rem; }

    .gen-sec + .gen-sec { margin-top: 1.75rem; padding-top: 1.75rem; border-top: 1px solid var(--borde); }
    .gen-sec-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
    .gen-sec h2 { font-size: 1.5rem; }
    .gen-reset { border: 0; background: none; padding: .25rem 0; color: var(--texto-mudo); font-size: .9375rem; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
    .gen-reset:hover { color: var(--rojo); }

    .gen-label { display: block; margin-bottom: .4rem; color: var(--texto-suave); font: 600 .9375rem var(--fuente-texto); }
    .gen-group + .gen-group { margin-top: 1.25rem; }

    /* Muestras de fondo */
    .gen-swatches { display: flex; flex-wrap: wrap; gap: .625rem; }
    .gen-sw {
      width: 46px; height: 46px; padding: 0; border: 1px solid rgba(0, 0, 0, .18); border-radius: 10px;
      cursor: pointer; transition: box-shadow .15s ease;
    }
    .gen-sw[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--bg-card), 0 0 0 4px var(--texto); }
    .gen-custom { display: inline-flex; align-items: center; gap: .6rem; margin-top: .875rem; font-size: .9375rem; color: var(--texto-suave); }
    .gen-custom input { width: 46px; height: 46px; padding: 2px; border: 1px solid var(--borde); border-radius: 10px; background: transparent; cursor: pointer; }

    /* Patrones */
    .gen-chips { display: flex; flex-wrap: wrap; gap: .5rem; }
    .gen-chip {
      min-height: 40px; padding: .35rem .95rem; border: 1px solid var(--borde); border-radius: 999px;
      background: transparent; color: var(--texto); font: 500 .9375rem var(--fuente-texto); cursor: pointer;
      transition: background .15s ease, color .15s ease, border-color .15s ease;
    }
    .gen-chip:hover { border-color: var(--rojo); }
    .gen-chip[aria-pressed="true"] { background: #c93c0b; border-color: #c93c0b; color: #fff; }

    /* Campos de texto, selects y controles (mismo trazo que el buscador del sitio) */
    .gen-input, .gen-select {
      width: 100%; min-width: 0; padding: .6rem 0; border: 0; border-bottom: 1px solid var(--borde); border-radius: 0;
      background: transparent; color: var(--texto); font-size: 1.0625rem; -webkit-appearance: none; appearance: none;
    }
    .gen-select { padding-right: 1.5rem; cursor: pointer;
      background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%);
      background-position: calc(100% - 9px) 55%, calc(100% - 4px) 55%; background-size: 5px 5px; background-repeat: no-repeat; }
    .gen-select option { background: var(--bg-card); color: var(--texto); }
    .gen-input:focus, .gen-select:focus { outline: none; border-bottom-color: var(--rojo); box-shadow: 0 1px 0 var(--rojo); }
    .gen-color { width: 100%; height: 2.6rem; padding: 2px; border: 1px solid var(--borde); border-radius: .375rem; background: transparent; cursor: pointer; }
    .gen input[type="range"] { width: 100%; accent-color: var(--rojo); margin-top: .6rem; }
    .gen-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1.25rem; margin-top: 1.25rem; }
    .gen-check { display: flex; align-items: center; gap: .6rem; margin-top: 1.25rem; font-size: 1rem; color: var(--texto-suave); cursor: pointer; }
    .gen-check input { width: 1.15rem; height: 1.15rem; accent-color: var(--rojo); }

    .gen-upload { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem 1rem; }
    .gen-btn { display: inline-flex; align-items: center; justify-content: center; gap: .55rem; }
    .gen-btn svg { flex-shrink: 0; }
    .gen-btn-quiet {
      padding: .75rem 1.5rem; border: 1px solid var(--borde); border-radius: .375rem; background: transparent; color: var(--texto);
      font: 600 .875rem var(--fuente-texto); letter-spacing: .0625em; text-transform: uppercase; cursor: pointer;
      transition: border-color .2s ease, color .2s ease;
    }
    .gen-btn-quiet:hover { border-color: var(--rojo); color: var(--rojo); }
    .gen-btn-small { padding: .55rem 1rem; }
    .gen-actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 1.25rem; }
    .gen-actions .cb-more { flex: 1 1 200px; }

    /* Vista previa */
    .gen-frame { background: var(--bg-alt); border: 1px solid var(--borde); border-radius: 12px; padding: .75rem; }
    #cartel { display: block; width: 100%; height: auto; border-radius: 6px; box-shadow: 0 6px 24px rgba(0, 0, 0, .22); }
    .gen-meta { display: flex; justify-content: space-between; gap: 1rem; margin: 0 0 .75rem; color: var(--texto-mudo); font-size: .9375rem; }
    .gen-note { margin-top: .875rem; color: var(--texto-mudo); font-size: 1rem; font-weight: 300; line-height: 1.5; }

    .gen-toast {
      position: fixed; left: 50%; bottom: 1.5rem; z-index: 60; max-width: min(92vw, 28rem);
      padding: .8rem 1.1rem; border-radius: .5rem; background: #111110; color: #fff; font-size: .9375rem; line-height: 1.4;
      box-shadow: 0 10px 30px rgba(0, 0, 0, .35);
      transform: translate(-50%, 1.5rem); opacity: 0; pointer-events: none; transition: transform .25s ease, opacity .25s ease;
    }
    .gen-toast.is-on { transform: translate(-50%, 0); opacity: 1; }

    @media (max-width: 900px) {
      .gen { grid-template-columns: minmax(0, 1fr); gap: 1.5rem; }
      .gen-preview { position: static; order: -1; }
      .gen-wrap { padding: 2.25rem 0 3rem; }
      .gen-head h1 { font-size: 2rem; }
      .gen-panel { padding: 1.25rem; }
    }
    @media (prefers-reduced-motion: reduce) { .gen-toast, .gen-sw, .gen-chip { transition: none; } }
  </style>
</head>
<body>
${headerHtml()}
<main class="gen-wrap">
  <div class="cb-container">
    <header class="gen-head">
      <h1>Generador de carteles</h1>
      <p>Carteles y avisos vecinales listos para compartir en WhatsApp y redes sociales.</p>
    </header>

    <div class="gen">
      <!-- Controles -->
      <div class="gen-panel">
        <section class="gen-sec" aria-labelledby="secFondo">
          <div class="gen-sec-head">
            <h2 id="secFondo">1. Fondo</h2>
            <button type="button" class="gen-reset" id="resetBtn">Reiniciar todo</button>
          </div>

          <div class="gen-group">
            <span class="gen-label" id="lblColores">Colores</span>
            <div class="gen-swatches" id="swColores" role="group" aria-labelledby="lblColores"></div>
            <label class="gen-custom">
              <input type="color" id="customColor" value="#ef4f1d">
              <span>Otro color</span>
            </label>
          </div>

          <div class="gen-group">
            <span class="gen-label" id="lblDegradados">Degradados</span>
            <div class="gen-swatches" id="swDegradados" role="group" aria-labelledby="lblDegradados"></div>
          </div>

          <div class="gen-group">
            <span class="gen-label" id="lblPatron">Patrón</span>
            <div class="gen-chips" id="chipsPatron" role="group" aria-labelledby="lblPatron"></div>
          </div>

          <div class="gen-group">
            <label class="gen-label" for="scrim">Oscurecer arriba y abajo (<span id="scrimVal">60</span>%)</label>
            <input type="range" id="scrim" min="0" max="100" value="60">
          </div>

          <div class="gen-group">
            <span class="gen-label">Imagen propia (reemplaza el color o degradado)</span>
            <div class="gen-upload">
              <label class="gen-btn gen-btn-quiet gen-btn-small" for="imageLoader" style="cursor:pointer">
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Subir imagen
              </label>
              <input type="file" id="imageLoader" accept="image/*" hidden>
              <button type="button" class="gen-reset" id="removeImg" hidden>Quitar imagen</button>
            </div>
          </div>
        </section>

        <section class="gen-sec" aria-labelledby="secTop">
          <div class="gen-sec-head"><h2 id="secTop">2. Texto superior (titular)</h2></div>
          <label class="gen-label" for="topText">Texto</label>
          <input type="text" id="topText" class="gen-input" value="¡AVISO IMPORTANTE!" placeholder="Ej: ¡ATENCIÓN VECINOS!" autocomplete="off">
          <div class="gen-row">
            <div>
              <label class="gen-label" for="topColor">Color</label>
              <input type="color" id="topColor" class="gen-color" value="#ffffff">
            </div>
            <div>
              <label class="gen-label" for="topSize">Tamaño (<span id="topSizeVal">40</span>)</label>
              <input type="range" id="topSize" min="20" max="70" value="40">
            </div>
            <div>
              <label class="gen-label" for="topFont">Tipografía</label>
              <select id="topFont" class="gen-select"></select>
            </div>
          </div>
        </section>

        <section class="gen-sec" aria-labelledby="secBottom">
          <div class="gen-sec-head"><h2 id="secBottom">3. Texto inferior (detalles)</h2></div>
          <label class="gen-label" for="bottomText">Texto</label>
          <input type="text" id="bottomText" class="gen-input" value="REUNIÓN DE VECINOS - SÁBADO 10 AM, PARQUE CENTRAL" placeholder="Ej: Sábado 10:00 AM en el Parque Central" autocomplete="off">
          <div class="gen-row">
            <div>
              <label class="gen-label" for="bottomColor">Color</label>
              <input type="color" id="bottomColor" class="gen-color" value="#ffffff">
            </div>
            <div>
              <label class="gen-label" for="bottomSize">Tamaño (<span id="bottomSizeVal">32</span>)</label>
              <input type="range" id="bottomSize" min="16" max="60" value="32">
            </div>
            <div>
              <label class="gen-label" for="bottomFont">Tipografía</label>
              <select id="bottomFont" class="gen-select"></select>
            </div>
          </div>
          <label class="gen-check"><input type="checkbox" id="outline" checked> Contorno oscuro en las letras</label>
        </section>

        <div class="gen-actions">
          <button type="button" class="cb-more gen-btn" id="downloadBtn">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 4v12m0 0 5-5m-5 5-5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Descargar PNG
          </button>
          <button type="button" class="gen-btn-quiet gen-btn" id="shareBtn">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 15V4m0 0L8 8m4-4 4 4M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Compartir
          </button>
        </div>
      </div>

      <!-- Vista previa -->
      <div class="gen-preview">
        <p class="gen-meta"><span>Vista previa</span><span>1080 × 1080 px</span></p>
        <div class="gen-frame">
          <canvas id="cartel" width="1080" height="1080" role="img" aria-label="Vista previa del cartel"></canvas>
        </div>
        <p class="gen-note">El tamaño cuadrado se ve completo en WhatsApp y Facebook. En el celular, Compartir abre el menú para enviarlo directo.</p>
      </div>
    </div>
  </div>
</main>
${footerHtml()}
<div class="gen-toast" id="genToast" role="status" aria-live="polite"></div>

<script>
(function () {
  var W = 1080, K = W / 800;
  var canvas = document.getElementById('cartel');
  var ctx = canvas.getContext('2d');

  // Tipografías: nombre en Google Fonts, grosor disponible y cómo se muestra en la lista
  var FONTS = {
    'Roboto Condensed': { w: 800, label: 'Roboto Condensed (la del sitio)' },
    'Anton': { w: 400, label: 'Anton (alta y gruesa)' },
    'Bebas Neue': { w: 400, label: 'Bebas Neue (titular limpio)' },
    'Oswald': { w: 700, label: 'Oswald' },
    'Montserrat': { w: 900, label: 'Montserrat Black' },
    'Playfair Display': { w: 900, label: 'Playfair Display (con serifa)' },
    'Permanent Marker': { w: 400, label: 'Permanent Marker (a mano)' }
  };

  // Colores y degradados de la marca y de las categorías del sitio
  var COLORES = [
    { id: 'naranja', name: 'Naranja BMM', c: '#ef4f1d' },
    { id: 'naranja-oscuro', name: 'Naranja oscuro', c: '#c93c0b' },
    { id: 'negro', name: 'Negro', c: '#111110' },
    { id: 'carbon', name: 'Gris carbón', c: '#464d53' },
    { id: 'verde', name: 'Verde azulado (Opiniones)', c: '#0f766e' },
    { id: 'ambar', name: 'Ámbar (Historias)', c: '#a16207' }
  ];
  var DEGRADADOS = [
    { id: 'atardecer', name: 'Atardecer', stops: ['#ff8a50', '#ef4f1d', '#7c2206'] },
    { id: 'brasa', name: 'Brasa a noche', stops: ['#ef4f1d', '#111110'] },
    { id: 'noche', name: 'Noche', stops: ['#4f575e', '#111110'] },
    { id: 'selva', name: 'Selva', stops: ['#14907f', '#042f2e'] },
    { id: 'oro', name: 'Oro viejo', stops: ['#d28a0a', '#5c3205'] },
    { id: 'ceniza', name: 'Ceniza', stops: ['#7b848c', '#1b1a18'] }
  ];
  var ANGULO = 160;
  var PATRONES = [
    ['none', 'Ninguno'], ['diagonales', 'Diagonales'], ['puntos', 'Puntos'],
    ['cuadricula', 'Cuadrícula'], ['rayos', 'Rayos'], ['ondas', 'Ondas']
  ];
  var DEFAULTS = {
    topText: '¡AVISO IMPORTANTE!', bottomText: 'REUNIÓN DE VECINOS - SÁBADO 10 AM, PARQUE CENTRAL',
    topColor: '#ffffff', bottomColor: '#ffffff', topSize: 40, bottomSize: 32,
    topFont: 'Roboto Condensed', bottomFont: 'Roboto Condensed', scrim: 60, outline: true
  };

  var base = { type: 'solid', id: 'naranja', c: '#ef4f1d' };
  var pattern = 'diagonales';
  var image = null;

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    topText: $('topText'), bottomText: $('bottomText'), topColor: $('topColor'), bottomColor: $('bottomColor'),
    topSize: $('topSize'), bottomSize: $('bottomSize'), topFont: $('topFont'), bottomFont: $('bottomFont'),
    scrim: $('scrim'), outline: $('outline'), customColor: $('customColor'), imageLoader: $('imageLoader'), removeImg: $('removeImg')
  };

  // ---- Construcción de la interfaz ----
  function cssGradient(stops) { return 'linear-gradient(' + ANGULO + 'deg,' + stops.join(',') + ')'; }

  function makeSwatch(item, grid, isGrad) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'gen-sw';
    b.dataset.id = item.id;
    b.title = item.name;
    b.setAttribute('aria-label', item.name);
    b.setAttribute('aria-pressed', 'false');
    b.style.background = isGrad ? cssGradient(item.stops) : item.c;
    b.addEventListener('click', function () {
      image = null;
      base = isGrad ? { type: 'grad', id: item.id, stops: item.stops } : { type: 'solid', id: item.id, c: item.c };
      if (!isGrad) el.customColor.value = item.c;
      el.imageLoader.value = '';
      syncUI();
      draw();
    });
    grid.appendChild(b);
  }
  COLORES.forEach(function (c) { makeSwatch(c, $('swColores'), false); });
  DEGRADADOS.forEach(function (g) { makeSwatch(g, $('swDegradados'), true); });

  PATRONES.forEach(function (p) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'gen-chip';
    b.dataset.id = p[0];
    b.textContent = p[1];
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () { pattern = p[0]; syncUI(); draw(); });
    $('chipsPatron').appendChild(b);
  });

  [el.topFont, el.bottomFont].forEach(function (sel) {
    Object.keys(FONTS).forEach(function (name) {
      var o = document.createElement('option');
      o.value = name; o.textContent = FONTS[name].label;
      sel.appendChild(o);
    });
  });

  function syncUI() {
    [].forEach.call(document.querySelectorAll('.gen-sw'), function (b) {
      b.setAttribute('aria-pressed', (!image && base.id === b.dataset.id) ? 'true' : 'false');
    });
    [].forEach.call(document.querySelectorAll('.gen-chip'), function (b) {
      b.setAttribute('aria-pressed', b.dataset.id === pattern ? 'true' : 'false');
    });
    el.removeImg.hidden = !image;
    $('scrimVal').textContent = el.scrim.value;
    $('topSizeVal').textContent = el.topSize.value;
    $('bottomSizeVal').textContent = el.bottomSize.value;
  }

  // ---- Tipografías: se cargan bajo demanda para que el canvas las use ----
  var fontState = {};
  function ensureFont(name) {
    if (fontState[name] || !document.fonts || !document.fonts.load) return;
    fontState[name] = 'pending';
    document.fonts.load(FONTS[name].w + ' 48px "' + name + '"').then(function () {
      fontState[name] = 'ready'; draw();
    }, function () { fontState[name] = 'ready'; });
  }

  // ---- Dibujo ----
  function drawBase() {
    if (image) {
      var ia = image.width / image.height, rw, rh, ox = 0, oy = 0;
      if (ia > 1) { rh = W; rw = image.width * (W / image.height); ox = (W - rw) / 2; }
      else { rw = W; rh = image.height * (W / image.width); oy = (W - rh) / 2; }
      ctx.drawImage(image, ox, oy, rw, rh);
      return;
    }
    if (base.type === 'grad') {
      var a = ANGULO * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a);
      var len = W * (Math.abs(dx) + Math.abs(dy)) / 2;
      var g = ctx.createLinearGradient(W / 2 - dx * len, W / 2 - dy * len, W / 2 + dx * len, W / 2 + dy * len);
      base.stops.forEach(function (c, i) { g.addColorStop(i / (base.stops.length - 1), c); });
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = base.c;
    }
    ctx.fillRect(0, 0, W, W);
  }

  function drawPattern() {
    if (pattern === 'none') return;
    var i, x, y;
    ctx.save();
    if (pattern === 'diagonales') {
      ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.lineWidth = 16;
      ctx.beginPath();
      for (x = -W; x < W; x += 60) { ctx.moveTo(x, W); ctx.lineTo(x + W, 0); }
      ctx.stroke();
    } else if (pattern === 'puntos') {
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      for (y = 30, i = 0; y < W + 30; y += 54, i++) {
        for (x = (i % 2) * 27 + 20; x < W + 30; x += 54) { ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill(); }
      }
    } else if (pattern === 'cuadricula') {
      ctx.strokeStyle = 'rgba(255,255,255,0.11)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (x = 0; x <= W; x += 72) { ctx.moveTo(x, 0); ctx.lineTo(x, W); ctx.moveTo(0, x); ctx.lineTo(W, x); }
      ctx.stroke();
    } else if (pattern === 'rayos') {
      var n = 32, cx = W / 2, cy = W * 0.55, r = W * 1.6;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (i = 0; i < n; i += 2) {
        var a0 = i * 2 * Math.PI / n, a1 = (i + 1) * 2 * Math.PI / n;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r);
        ctx.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
        ctx.closePath(); ctx.fill();
      }
    } else if (pattern === 'ondas') {
      ctx.strokeStyle = 'rgba(255,255,255,0.13)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      for (y = 20; y < W + 60; y += 60) {
        ctx.beginPath();
        for (x = -10; x <= W + 10; x += 8) {
          var yy = y + Math.sin(x / 60) * 16;
          if (x === -10) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawScrim(level) {
    var s = level / 100, h = 220 * K;
    var gt = ctx.createLinearGradient(0, 0, 0, h);
    gt.addColorStop(0, 'rgba(0,0,0,' + Math.min(1, s * 1.0) + ')'); gt.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gt; ctx.fillRect(0, 0, W, h);
    var gb = ctx.createLinearGradient(0, W - h, 0, W);
    gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, 'rgba(0,0,0,' + Math.min(1, s * 1.2) + ')');
    ctx.fillStyle = gb; ctx.fillRect(0, W - h, W, h);
  }

  function drawBlock(text, where, size, color, fontName, outline) {
    var f = FONTS[fontName], px = size * K, pad = 50 * K, maxW = W - pad * 2;
    ctx.font = f.w + ' ' + px + 'px "' + fontName + '", "Roboto Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = where === 'top' ? 'top' : 'bottom';
    ctx.lineJoin = 'round';

    var words = text.split(/\\s+/).filter(Boolean), lines = [], cur = words[0] || '';
    for (var i = 1; i < words.length; i++) {
      if (ctx.measureText(cur + ' ' + words[i]).width < maxW) cur += ' ' + words[i];
      else { lines.push(cur); cur = words[i]; }
    }
    lines.push(cur);

    var lh = px * 1.15;
    lines.forEach(function (line, idx) {
      var y = where === 'top' ? pad + idx * lh : W - pad - (lines.length - 1 - idx) * lh;
      if (outline) {
        ctx.lineWidth = Math.max(3 * K, px / 12);
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.strokeText(line, W / 2, y);
      }
      ctx.fillStyle = color;
      ctx.fillText(line, W / 2, y);
    });
  }

  function draw() {
    ensureFont(el.topFont.value);
    ensureFont(el.bottomFont.value);
    ctx.clearRect(0, 0, W, W);
    drawBase();
    drawPattern();
    drawScrim(parseInt(el.scrim.value, 10));
    var outline = el.outline.checked;
    var t = el.topText.value.toUpperCase(), b = el.bottomText.value.toUpperCase();
    if (t.trim()) drawBlock(t, 'top', parseInt(el.topSize.value, 10), el.topColor.value, el.topFont.value, outline);
    if (b.trim()) drawBlock(b, 'bottom', parseInt(el.bottomSize.value, 10), el.bottomColor.value, el.bottomFont.value, outline);
  }

  // ---- Eventos ----
  ['topText', 'bottomText', 'topColor', 'bottomColor', 'topSize', 'bottomSize', 'topFont', 'bottomFont', 'scrim', 'outline'].forEach(function (k) {
    el[k].addEventListener('input', function () { syncUI(); draw(); });
    el[k].addEventListener('change', function () { syncUI(); draw(); });
  });

  el.customColor.addEventListener('input', function () {
    image = null;
    base = { type: 'solid', id: 'custom', c: el.customColor.value };
    el.imageLoader.value = '';
    syncUI(); draw();
  });

  el.imageLoader.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      var im = new Image();
      im.onload = function () { image = im; syncUI(); draw(); };
      im.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
  el.removeImg.addEventListener('click', function () { image = null; el.imageLoader.value = ''; syncUI(); draw(); });

  function toast(msg) {
    var t = $('genToast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.classList.remove('is-on'); }, 3600);
  }

  function download() {
    canvas.toBlob(function (blob) {
      if (!blob) return;
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'cartel-barberena.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    }, 'image/png');
  }
  $('downloadBtn').addEventListener('click', download);

  $('shareBtn').addEventListener('click', function () {
    canvas.toBlob(function (blob) {
      if (!blob) return;
      var file = new File([blob], 'cartel-barberena.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Cartel - Barberena Mi Municipio' }).catch(function () {});
      } else {
        download();
        toast('Este navegador no permite compartir directo. Se descargó la imagen para que la envíes.');
      }
    }, 'image/png');
  });

  $('resetBtn').addEventListener('click', function () {
    el.topText.value = DEFAULTS.topText; el.bottomText.value = DEFAULTS.bottomText;
    el.topColor.value = DEFAULTS.topColor; el.bottomColor.value = DEFAULTS.bottomColor;
    el.topSize.value = DEFAULTS.topSize; el.bottomSize.value = DEFAULTS.bottomSize;
    el.topFont.value = DEFAULTS.topFont; el.bottomFont.value = DEFAULTS.bottomFont;
    el.scrim.value = DEFAULTS.scrim; el.outline.checked = DEFAULTS.outline;
    el.customColor.value = '#ef4f1d'; el.imageLoader.value = '';
    base = { type: 'solid', id: 'naranja', c: '#ef4f1d' };
    pattern = 'diagonales'; image = null;
    syncUI(); draw();
    toast('Se restablecieron los valores iniciales.');
  });

  el.topFont.value = DEFAULTS.topFont;
  el.bottomFont.value = DEFAULTS.bottomFont;
  syncUI();
  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
})();
</script>
</body>
</html>
`;
}
