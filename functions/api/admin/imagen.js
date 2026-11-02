// functions/api/admin/imagen.js
// DELETE { url, excluirSlug? } -> borra la imagen del bucket R2 solo si ninguna otra publicación la usa.

import { json, exigirSesion } from '../../_auth.js';
import { claveDesdeUrl, archivoEnUso } from '../../_posts_admin.js';

export async function onRequestDelete(context) {
  const error = await exigirSesion(context);
  if (error) return error;
  const { env, request } = context;
  let d;
  try { d = await request.json(); } catch (e) { return json({ error: 'Solicitud inválida.' }, 400); }

  const clave = claveDesdeUrl(env, d.url);
  if (!clave) return json({ borrada: false, motivo: 'externa' });
  if (!env.IMAGES) return json({ error: 'Falta el binding R2 "IMAGES" en Cloudflare Pages.' }, 500);
  if (await archivoEnUso(env.DB, clave, d.excluirSlug || null)) return json({ borrada: false, motivo: 'en-uso' });
  await env.IMAGES.delete(clave);
  return json({ borrada: true });
}
