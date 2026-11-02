// functions/api/admin/posts/[slug].js
//   GET    /api/admin/posts/<slug>   -> un post completo (para editar)
//   PUT    /api/admin/posts/<slug>   -> guarda cambios (puede cambiar el slug)
//   DELETE /api/admin/posts/<slug>   -> elimina el post y las imágenes que nadie más usa

import { json, exigirSesion } from '../../../_auth.js';
import { aPost } from '../../../_db.js';
import {
  validarPost, slugExiste, actualizarPost, claveDesdeUrl, clavesEnTexto, archivoEnUso
} from '../../../_posts_admin.js';

async function buscar(db, slug) {
  return db.prepare(
    'SELECT id,slug,title,excerpt,body,category,image_url,video_url,tags,published,noindex,featured,published_at FROM posts WHERE slug = ?1'
  ).bind(slug).first();
}

export async function onRequestGet(context) {
  const error = await exigirSesion(context);
  if (error) return error;
  const fila = await buscar(context.env.DB, context.params.slug);
  if (!fila) return json({ error: 'No existe esa publicación.' }, 404);
  return json({ post: aPost(fila) });
}

export async function onRequestPut(context) {
  const error = await exigirSesion(context);
  if (error) return error;
  const db = context.env.DB;
  const actual = await buscar(db, context.params.slug);
  if (!actual) return json({ error: 'No existe esa publicación.' }, 404);
  let datos;
  try { datos = await context.request.json(); } catch (e) { return json({ error: 'Solicitud inválida.' }, 400); }
  try {
    const p = validarPost(datos);
    if (await slugExiste(db, p.slug, actual.id)) return json({ error: 'Ese slug ya existe. Elegí otro o generá uno nuevo.' }, 409);
    await actualizarPost(db, actual.id, p);
    return json({ ok: true, slug: p.slug });
  } catch (e) {
    return json({ error: e.message || 'No se pudo guardar.' }, 400);
  }
}

export async function onRequestDelete(context) {
  const error = await exigirSesion(context);
  if (error) return error;
  const { env } = context;
  const db = env.DB;
  const slug = context.params.slug;
  const actual = await buscar(db, slug);
  if (!actual) return json({ error: 'No existe esa publicación.' }, 404);

  // 1) Qué imágenes usaba (antes de borrar)
  const claves = new Set();
  const principal = claveDesdeUrl(env, actual.image_url);
  if (principal) claves.add(principal);
  clavesEnTexto(env, actual.body).forEach((c) => claves.add(c));

  // 2) Borrar la fila (si falla, no se toca ninguna imagen)
  await db.prepare('DELETE FROM posts WHERE id = ?1').bind(actual.id).run();

  // 3) Borrar las imágenes que ya nadie usa
  let borradas = 0, conservadas = 0, fallidas = 0;
  if (env.IMAGES) {
    for (const clave of claves) {
      try {
        if (await archivoEnUso(db, clave, null)) { conservadas++; continue; }
        await env.IMAGES.delete(clave);
        borradas++;
      } catch (e) { fallidas++; }
    }
  }
  return json({ ok: true, imagenes: { borradas, conservadas, fallidas } });
}
