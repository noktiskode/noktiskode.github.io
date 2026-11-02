// functions/_posts_admin.js
//
// Validación y escritura de posts para el panel (solo lo usan las APIs de /api/admin).
// No exporta onRequest*, así que Cloudflare Pages no lo trata como una ruta.

import { normalizar } from './_db.js';

export const CATEGORIAS = ['barberena', 'opiniones', 'historias'];

// Rutas que ya existen en el sitio: un post con uno de estos slugs quedaría tapado.
const RESERVADOS = new Set([
  'admin', 'api', 'assets', 'images', 'functions', 'login', 'moderar', 'buscar', 'etiqueta',
  'archivo', 'barberena', 'opiniones', 'historias', 'generador', 'que-publicamos',
  'como-participar', 'manifiesto', 'sitemap', 'robots', 'llms', 'favicon', '404', 'index'
]);

export function slugify(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 180);
}

function resumenDesde(body) {
  const plano = body.replace(/<[^>]+>/g, '').replace(/[*_`#]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
  const primero = plano.split(/\n\s*\n/)[0].trim();
  const palabras = primero.split(/\s+/).filter(Boolean);
  return palabras.length > 40 ? palabras.slice(0, 40).join(' ') + '…' : primero;
}

function urlOpcional(v, { permitirRuta = false } = {}) {
  const t = String(v || '').trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t.slice(0, 1000);
  if (permitirRuta && t.startsWith('/')) return t.slice(0, 1000);
  throw new Error('Una de las direcciones (imagen o video) no es válida.');
}

// Convierte lo que manda el panel en una fila lista para guardar.
// Lanza Error con un mensaje claro si algo no cuadra.
export function validarPost(d) {
  const title = String(d.title || '').trim();
  const slug = slugify(d.slug);
  const body = String(d.body || '').trim();
  if (!title || !slug || !body) throw new Error('Completá el título, slug y contenido.');
  if (title.length > 180) throw new Error('El título es demasiado largo (máximo 180 caracteres).');
  if (RESERVADOS.has(slug)) throw new Error(`El slug "${slug}" está reservado por el sitio. Elegí otro.`);
  const category = String(d.category || '');
  if (!CATEGORIAS.includes(category)) throw new Error('Categoría no válida.');

  let tags = Array.isArray(d.tags) ? d.tags : [];
  const vistos = new Set();
  tags = tags.map((t) => String(t).trim().slice(0, 60)).filter((t) => {
    const k = t.toLowerCase();
    if (!t || vistos.has(k)) return false;
    vistos.add(k); return true;
  }).slice(0, 25);

  const fecha = new Date(d.published_at);
  if (isNaN(fecha)) throw new Error('La fecha no es válida.');

  const excerpt = (String(d.excerpt || '').trim() || resumenDesde(body)).slice(0, 500);
  return {
    slug, title, excerpt, body, category,
    image_url: urlOpcional(d.image_url, { permitirRuta: true }),
    video_url: urlOpcional(d.video_url),
    tags,
    featured: d.featured ? 1 : 0,
    published: d.published === false ? 0 : 1,
    published_at: fecha.toISOString(),
    search_text: normalizar([title, excerpt, tags.join(' '), body].join(' '))
  };
}

const COLUMNAS = ['slug', 'title', 'excerpt', 'body', 'category', 'image_url', 'video_url', 'tags',
  'featured', 'published', 'published_at', 'search_text'];

export async function slugExiste(db, slug, exceptoId = null) {
  const fila = await db.prepare('SELECT id FROM posts WHERE slug = ?1').bind(slug).first();
  return !!fila && fila.id !== exceptoId;
}

export async function insertarPost(db, p) {
  const ahora = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO posts (id, ${COLUMNAS.join(', ')}, noindex, created_at, updated_at)
     VALUES (?1, ${COLUMNAS.map((_, i) => '?' + (i + 2)).join(', ')}, 0, ?${COLUMNAS.length + 2}, ?${COLUMNAS.length + 2})`
  ).bind(id, ...COLUMNAS.map((c) => (c === 'tags' ? JSON.stringify(p.tags) : p[c])), ahora).run();
  return id;
}

export async function actualizarPost(db, id, p) {
  const ahora = new Date().toISOString();
  const sets = COLUMNAS.map((c, i) => `${c} = ?${i + 2}`).join(', ');
  await db.prepare(`UPDATE posts SET ${sets}, updated_at = ?${COLUMNAS.length + 2} WHERE id = ?1`)
    .bind(id, ...COLUMNAS.map((c) => (c === 'tags' ? JSON.stringify(p.tags) : p[c])), ahora).run();
}

// ---------- Imágenes en R2 ----------

export function urlBaseImagenes(env) {
  return String(env.IMAGES_BASE_URL || 'https://img.barberenamimunicipio.top').replace(/\/+$/, '');
}

// Clave (nombre del archivo en el bucket) a partir de la URL pública, o null si no es nuestra.
export function claveDesdeUrl(env, url) {
  const base = urlBaseImagenes(env) + '/';
  const t = String(url || '');
  if (!t.startsWith(base)) return null;
  let clave = t.slice(base.length).split('?')[0].split('#')[0];
  try { clave = decodeURIComponent(clave); } catch (e) { /* se usa tal cual */ }
  return clave && !clave.includes('..') ? clave : null;
}

// Todas las imágenes de nuestro bucket usadas en un texto (Markdown/HTML).
export function clavesEnTexto(env, texto) {
  const base = urlBaseImagenes(env).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(base + '/[^\\s)"\'<>]+', 'g');
  return (String(texto || '').match(re) || []).map((u) => claveDesdeUrl(env, u)).filter(Boolean);
}

// ¿Alguna otra publicación usa este archivo? Si la consulta falla se asume que sí (por seguridad).
export async function archivoEnUso(db, clave, exceptoSlug = null) {
  const patron = '%' + clave.replace(/[\\%_]/g, '\\$&') + '%';
  try {
    const fila = await db.prepare(
      `SELECT slug FROM posts WHERE (image_url LIKE ?1 ESCAPE '\\' OR body LIKE ?1 ESCAPE '\\')
         AND (?2 IS NULL OR slug != ?2) LIMIT 1`
    ).bind(patron, exceptoSlug).first();
    return !!fila;
  } catch (e) {
    return true;
  }
}
