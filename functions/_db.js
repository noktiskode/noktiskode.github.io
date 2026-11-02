// functions/_db.js
//
// Capa de acceso a los posts en Cloudflare D1 (binding "DB").
// No exporta onRequest*, así que Cloudflare Pages no lo trata como una ruta.
//
// Todas las funciones devuelven los posts con la misma forma que antes daba
// Supabase (tags como arreglo, published/featured/noindex como booleanos),
// para que las plantillas de cada página no cambien.

export function normalizar(texto) {
  return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Convierte una fila de D1 en un post "normal".
export function aPost(row) {
  if (!row) return null;
  let tags = [];
  try { tags = JSON.parse(row.tags || '[]'); } catch (e) { tags = []; }
  if (!Array.isArray(tags)) tags = [];
  return {
    ...row,
    tags,
    published: !!row.published,
    featured: !!row.featured,
    noindex: !!row.noindex
  };
}

const aPosts = (res) => ((res && res.results) || []).map(aPost);

// Columnas de las listas (sin search_text, que solo sirve para buscar).
const COLS = 'id,slug,title,excerpt,body,category,image_url,video_url,tags,published,noindex,featured,published_at,created_at,updated_at';

export async function postPorSlug(db, slug, { soloPublicados = true } = {}) {
  const sql = `SELECT ${COLS} FROM posts WHERE slug = ?1` + (soloPublicados ? ' AND published = 1' : '') + ' LIMIT 1';
  return aPost(await db.prepare(sql).bind(slug).first());
}

export async function ultimos(db, { categoria = null, limite = 200, desplazamiento = 0 } = {}) {
  let sql = `SELECT ${COLS} FROM posts WHERE published = 1`;
  const args = [];
  if (categoria) { sql += ' AND category = ?'; args.push(categoria); }
  sql += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
  args.push(limite, desplazamiento);
  return aPosts(await db.prepare(sql).bind(...args).all());
}

export async function destacados(db, limite) {
  return aPosts(await db.prepare(
    `SELECT ${COLS} FROM posts WHERE published = 1 AND featured = 1 ORDER BY published_at DESC LIMIT ?1`
  ).bind(limite).all());
}

// Lista paginada excluyendo algunos slugs (los del carrusel). Devuelve { posts, total }.
export async function paginaExcluyendo(db, excluir, limite, desplazamiento) {
  const marcas = excluir.map(() => '?').join(',');
  const filtro = excluir.length ? ` AND slug NOT IN (${marcas})` : '';
  const [lista, cuenta] = await db.batch([
    db.prepare(`SELECT ${COLS} FROM posts WHERE published = 1${filtro} ORDER BY published_at DESC LIMIT ? OFFSET ?`)
      .bind(...excluir, limite, desplazamiento),
    db.prepare(`SELECT COUNT(*) AS n FROM posts WHERE published = 1${filtro}`).bind(...excluir)
  ]);
  return { posts: aPosts(lista), total: (cuenta.results[0] && cuenta.results[0].n) || 0 };
}

// Posts publicados con solo los campos que usa el sitemap.
export async function paraSitemap(db) {
  const res = await db.prepare('SELECT slug,published_at FROM posts WHERE published = 1 ORDER BY published_at DESC').all();
  return res.results || [];
}

// Todos los posts publicados con tags (página de etiqueta).
export async function conEtiquetas(db, limite = 1000) {
  return aPosts(await db.prepare(
    `SELECT ${COLS} FROM posts WHERE published = 1 ORDER BY published_at DESC LIMIT ?1`
  ).bind(limite).all());
}

// Relacionados: primero por etiquetas compartidas, luego completa con la misma categoría.
export async function relacionados(db, post, cantidad = 3) {
  let rel = [];
  const tags = (post.tags || []).filter(Boolean);
  if (tags.length) {
    const marcas = tags.map(() => '?').join(',');
    const res = await db.prepare(
      `SELECT slug,title,published_at FROM posts
        WHERE published = 1 AND slug != ?
          AND EXISTS (SELECT 1 FROM json_each(posts.tags) WHERE json_each.value IN (${marcas}))
        ORDER BY published_at DESC LIMIT ?`
    ).bind(post.slug, ...tags, cantidad).all();
    rel = res.results || [];
  }
  if (rel.length < cantidad) {
    const excluidos = [post.slug, ...rel.map((r) => r.slug)];
    const marcas = excluidos.map(() => '?').join(',');
    const res = await db.prepare(
      `SELECT slug,title,published_at FROM posts
        WHERE published = 1 AND category = ? AND slug NOT IN (${marcas})
        ORDER BY published_at DESC LIMIT ?`
    ).bind(post.category, ...excluidos, cantidad - rel.length).all();
    rel = rel.concat(res.results || []);
  }
  return rel;
}

// Búsqueda sin tildes ni mayúsculas; cada palabra debe aparecer (AND).
export async function buscar(db, termino, limite = 60) {
  const palabras = normalizar(termino).split(/\s+/).filter(Boolean).slice(0, 6);
  if (!palabras.length) return [];
  const cond = palabras.map(() => "search_text LIKE ? ESCAPE '\\'").join(' AND ');
  const args = palabras.map((p) => '%' + p.replace(/[\\%_]/g, '\\$&') + '%');
  return aPosts(await db.prepare(
    `SELECT ${COLS} FROM posts WHERE published = 1 AND ${cond} ORDER BY published_at DESC LIMIT ?`
  ).bind(...args, limite).all());
}

// Etiquetas existentes con su frecuencia (para sugerir SEO).
export async function etiquetasFrecuentes(db, limite = 80) {
  const res = await db.prepare(
    `SELECT j.value AS tag, COUNT(*) AS n
       FROM posts p, json_each(p.tags) j
      WHERE p.published = 1
      GROUP BY j.value ORDER BY n DESC LIMIT ?1`
  ).bind(limite).all();
  return (res.results || []).map((r) => r.tag);
}
