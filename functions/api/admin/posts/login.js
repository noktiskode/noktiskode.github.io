// functions/api/admin/login.js
// POST { password } -> crea la cookie de sesión.
// Frena la fuerza bruta: 5 intentos fallidos por IP cada 15 minutos.

import { json, igualesSeguro, crearCookieSesion, configuracionCompleta } from '../../_auth.js';

const MAX_FALLOS = 5;
const VENTANA_MS = 15 * 60 * 1000;

export async function onRequestPost({ request, env }) {
  if (!configuracionCompleta(env)) {
    return json({ error: 'Falta configurar ADMIN_PASSWORD y SESSION_SECRET en Cloudflare Pages.' }, 500);
  }
  const origen = request.headers.get('Origin');
  if (origen && new URL(origen).host !== new URL(request.url).host) return json({ error: 'Origen no permitido.' }, 403);

  const ip = request.headers.get('CF-Connecting-IP') || 'desconocida';
  const ahora = Date.now();

  try {
    await env.DB.prepare('DELETE FROM login_fails WHERE at < ?1').bind(ahora - VENTANA_MS).run();
    const fila = await env.DB.prepare('SELECT COUNT(*) AS n FROM login_fails WHERE ip = ?1 AND at >= ?2')
      .bind(ip, ahora - VENTANA_MS).first();
    if (fila && fila.n >= MAX_FALLOS) {
      return json({ error: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.' }, 429);
    }
  } catch (e) { /* si la tabla no existe todavía, se sigue sin freno */ }

  let datos;
  try { datos = await request.json(); } catch (e) { return json({ error: 'Solicitud inválida.' }, 400); }

  const correcta = await igualesSeguro(String(datos.password || ''), env.ADMIN_PASSWORD);
  if (!correcta) {
    try { await env.DB.prepare('INSERT INTO login_fails (ip, at) VALUES (?1, ?2)').bind(ip, ahora).run(); } catch (e) {}
    await new Promise((r) => setTimeout(r, 600));
    return json({ error: 'Contraseña incorrecta.' }, 401);
  }

  try { await env.DB.prepare('DELETE FROM login_fails WHERE ip = ?1').bind(ip).run(); } catch (e) {}
  return json({ ok: true }, 200, { 'Set-Cookie': await crearCookieSesion(env) });
}
