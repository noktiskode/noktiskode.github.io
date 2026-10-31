// functions/_middleware.js
//
// Caché en el borde de Cloudflare para las páginas públicas que se arman
// leyendo Supabase: portada, secciones, archivo, posts, etiquetas y sitemap.
//
// Sin esto, cada visita dispara varias consultas a Supabase. Con esto, la
// primera visita arma la página y las siguientes (de cualquier persona, en ese
// centro de datos de Cloudflare) se sirven de la copia guardada hasta que
// vence el tiempo (TTL). Lo que publicás en el panel puede tardar hasta ese
// tiempo en aparecer en la portada y en las listas.
//
// No toca: /admin, /login, /buscar, /api, archivos estáticos ni peticiones que
// no sean GET. Tampoco guarda errores ni páginas vacías (señal de que Supabase
// falló), para no dejar una página rota en el caché.
//
// El caché solo guarda en el dominio propio (barberenamimunicipio.top). En
// *.pages.dev no guarda nada y el sitio sigue funcionando igual, sin caché.
//
// Para comprobarlo: la respuesta trae el encabezado X-BMM-Cache con el valor
// MISS (se armó la página) o HIT (salió del caché).

// Tiempos de vida, en segundos. Cambiá estos números si querés más o menos caché.
const TTL_PAGINA = 120;   // portada, secciones y posts
const TTL_LARGA = 300;    // archivo y etiquetas
const TTL_SITEMAP = 3600; // sitemap.xml

// Rutas de una sola palabra que nunca se cachean.
const RESERVADOS = new Set(['admin', 'login', 'buscar', 'api', 'assets', 'images', 'functions']);

// Si la página trae alguna de estas marcas, no hay publicaciones que mostrar.
// Con el sitio lleno de posts eso solo pasa si Supabase falló, así que no se guarda.
const MARCAS_VACIO = ['class="cb-empty"', 'class="category-empty"'];

const MOVIL = /Mobi|Android|iPhone|iPod/i;

function ttlParaRuta(pathname) {
  if (pathname === '/sitemap.xml') return TTL_SITEMAP;
  if (pathname === '/') return TTL_PAGINA;
  const partes = pathname.split('/').filter(Boolean);
  if (partes.length === 1) {
    const p = partes[0];
    if (p.includes('.') || RESERVADOS.has(p)) return 0;
    return p === 'archivo' ? TTL_LARGA : TTL_PAGINA;
  }
  if (partes.length === 2 && partes[0] === 'etiqueta') return TTL_LARGA;
  return 0;
}

// Llave del caché: sin parámetros de seguimiento (fbclid, utm...) para que
// todos los enlaces de Facebook compartan la misma copia.
function llaveDeCache(url, request) {
  const key = new URL(url.origin + url.pathname);
  if (url.pathname === '/') {
    const pagina = parseInt(url.searchParams.get('pagina'), 10);
    if (pagina > 1) key.searchParams.set('pagina', String(pagina));
    key.searchParams.set('_d', MOVIL.test(request.headers.get('user-agent') || '') ? 'm' : 'd');
  }
  return new Request(key.toString(), { method: 'GET' });
}

// Lo que recibe la persona: siempre vuelve a preguntar al borde (que responde
// rápido desde el caché), así el navegador no guarda copias viejas por su cuenta.
function paraCliente(resp, estado) {
  const r = new Response(resp.body, resp);
  r.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  r.headers.set('X-BMM-Cache', estado);
  return r;
}

export async function onRequest(context) {
  const { request, next } = context;
  if (request.method !== 'GET') return next();

  const url = new URL(request.url);
  const ttl = ttlParaRuta(url.pathname);
  if (!ttl) return next();

  let cache = null;
  try { cache = caches.default; } catch (e) { cache = null; }
  if (!cache) return next();

  const keyReq = llaveDeCache(url, request);

  try {
    const hit = await cache.match(keyReq);
    if (hit) return paraCliente(hit, 'HIT');
  } catch (e) { /* si el caché falla, se sirve la página normal */ }

  const resp = await next();
  const tipo = resp.headers.get('content-type') || '';
  const esTexto = tipo.includes('text/html') || tipo.includes('xml');
  if (resp.status !== 200 || !esTexto || resp.headers.has('set-cookie')) return resp;

  const cuerpo = await resp.clone().text();
  if (tipo.includes('text/html') && MARCAS_VACIO.some((m) => cuerpo.includes(m))) return resp;

  try {
    const guardar = new Response(cuerpo, resp);
    guardar.headers.set('Cache-Control', 'public, max-age=' + ttl);
    guardar.headers.delete('Vary');
    guardar.headers.delete('Content-Encoding');
    guardar.headers.delete('Content-Length');
    context.waitUntil(cache.put(keyReq, guardar).catch(() => {}));
  } catch (e) { /* si no se pudo guardar, igual se responde la página */ }

  return paraCliente(resp, 'MISS');
}
