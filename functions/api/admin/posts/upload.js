// functions/api/admin/upload.js
// POST multipart/form-data con el campo "file" -> sube la imagen a R2 y devuelve su URL pública.
// Requiere el binding R2 "IMAGES" (bucket bmm-imagenes) en Cloudflare Pages.

import { json, exigirSesion } from '../../_auth.js';
import { urlBaseImagenes } from '../../_posts_admin.js';

const MAX_BYTES = 8 * 1024 * 1024; // el panel ya reduce las fotos; esto es solo un tope de seguridad
const TIPOS = {
  'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/avif': 'avif'
};

export async function onRequestPost(context) {
  const error = await exigirSesion(context);
  if (error) return error;
  const { env, request } = context;
  if (!env.IMAGES) return json({ error: 'Falta el binding R2 "IMAGES" en Cloudflare Pages (bucket bmm-imagenes).' }, 500);

  let form;
  try { form = await request.formData(); } catch (e) { return json({ error: 'Solicitud inválida.' }, 400); }
  const file = form.get('file');
  if (!file || typeof file === 'string') return json({ error: 'No llegó ningún archivo.' }, 400);
  const ext = TIPOS[file.type];
  if (!ext) return json({ error: 'Formato no permitido. Usá JPG, PNG, WebP, GIF o AVIF.' }, 415);
  if (file.size > MAX_BYTES) return json({ error: 'La imagen pesa más de 8 MB.' }, 413);

  const clave = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
  await env.IMAGES.put(clave, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' }
  });
  return json({ url: urlBaseImagenes(env) + '/' + clave }, 201);
}
