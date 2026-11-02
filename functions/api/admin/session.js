// functions/api/admin/session.js
// GET -> { ok: true } si hay sesión válida; 401 si no.
import { json, exigirSesion } from '../../_auth.js';

export async function onRequestGet(context) {
  const error = await exigirSesion(context);
  if (error) return error;
  return json({ ok: true });
}
