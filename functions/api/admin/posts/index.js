// functions/api/admin/posts/index.js
//   GET  /api/admin/posts?q=texto&limit=10   -> lista para el panel (incluye borradores)
//   POST /api/admin/posts                     -> crea una publicación

import { json, exigirSesion } from '../../../_auth.js';
import { validarPost, slugExiste, insertarPost } from '../../../_posts_admin.js';

export async function onRequestGet(context) {
  const error = await exigirSesion(context);
  if (error) return error;
  const url = new URL(context.request.url);
  const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const limite = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit'), 10) || (q ? 30 : 10)));
  const db = context.env.DB;
  let res;
  if (q) {
    const patron = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
    res = await db.prepare(
      `SELECT slug,title,category,published,published_at FROM posts
        WHERE title LIKE ?1 ESCAPE '\\' ORDER BY published_at DESC LIMIT ?2`).bind(patron, limite).all();
  } else {
    res = await db.prepare(
      'SELECT slug,title,category,published,published_at FROM posts ORDER BY published_at DESC LIMIT ?1'
    ).bind(limite).all();
  }
  return json({ posts: res.results || [] });
}

export async function onRequestPost(context) {
  const error = await exigirSesion(context);
  if (error) return error;
  let datos;
  try { datos = await context.request.json(); } catch (e) { return json({ error: 'Solicitud inválida.' }, 400); }
  try {
    const p = validarPost(datos);
    if (await slugExiste(context.env.DB, p.slug)) return json({ error: 'Ese slug ya existe. Elegí otro o generá uno nuevo.' }, 409);
    await insertarPost(context.env.DB, p);
    return json({ ok: true, slug: p.slug }, 201);
  } catch (e) {
    return json({ error: e.message || 'No se pudo guardar.' }, 400);
  }
}
