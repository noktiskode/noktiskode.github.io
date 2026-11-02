// functions/_auth.js
//
// Sesión del panel de administración, sin servicios externos.
//
// Cómo funciona:
//   - La contraseña vive en el secreto ADMIN_PASSWORD (Cloudflare Pages →
//     Settings → Variables and Secrets). No está en el repo ni en la base.
//   - Al entrar, se crea una cookie firmada (HMAC-SHA256 con SESSION_SECRET).
//     La cookie es HttpOnly (el JavaScript de la página no puede leerla),
//     Secure y SameSite=Strict (otros sitios no pueden usarla).
//   - Cada API del panel revisa esa cookie antes de hacer nada.
//
// No exporta onRequest*, así que Cloudflare Pages no lo trata como una ruta.

const COOKIE = 'bmm_session';
const DURACION_DIAS = 30;
const enc = new TextEncoder();

function aHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function deHex(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

async function llave(secreto) {
  return crypto.subtle.importKey('raw', enc.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

// Compara dos textos en tiempo constante (comparando sus hashes).
export async function igualesSeguro(a, b) {
  const [x, y] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(String(a))),
    crypto.subtle.digest('SHA-256', enc.encode(String(b)))
  ]);
  const ax = new Uint8Array(x), by = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < ax.length; i++) diff |= ax[i] ^ by[i];
  return diff === 0;
}

export function configuracionCompleta(env) {
  return !!(env.ADMIN_PASSWORD && env.SESSION_SECRET && String(env.SESSION_SECRET).length >= 16);
}

export async function crearCookieSesion(env) {
  const vence = Date.now() + DURACION_DIAS * 86400 * 1000;
  const datos = 'v1.' + vence;
  const firma = await crypto.subtle.sign('HMAC', await llave(env.SESSION_SECRET), enc.encode(datos));
  const valor = datos + '.' + aHex(firma);
  return `${COOKIE}=${valor}; Path=/; Max-Age=${DURACION_DIAS * 86400}; HttpOnly; Secure; SameSite=Strict`;
}

export function cookieBorrada() {
  return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

function leerCookie(request) {
  const raw = request.headers.get('Cookie') || '';
  for (const parte of raw.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === COOKIE) return v.join('=');
  }
  return '';
}

export async function sesionValida(request, env) {
  if (!configuracionCompleta(env)) return false;
  const valor = leerCookie(request);
  const partes = valor.split('.');
  if (partes.length !== 3 || partes[0] !== 'v1' || !/^[0-9a-f]{64}$/.test(partes[2])) return false;
  const vence = Number(partes[1]);
  if (!Number.isFinite(vence) || vence < Date.now()) return false;
  try {
    return await crypto.subtle.verify('HMAC', await llave(env.SESSION_SECRET), deHex(partes[2]), enc.encode(partes[0] + '.' + partes[1]));
  } catch (e) {
    return false;
  }
}

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=UTF-8', 'cache-control': 'no-store', ...extra }
  });
}

// Revisa sesión y, en peticiones que cambian datos, que vengan del propio sitio.
// Devuelve una Response de error, o null si todo está bien.
export async function exigirSesion({ request, env }) {
  if (!configuracionCompleta(env)) {
    return json({ error: 'Falta configurar ADMIN_PASSWORD y SESSION_SECRET en Cloudflare Pages.' }, 500);
  }
  if (!(await sesionValida(request, env))) {
    return json({ error: 'Sesión no válida. Iniciá sesión de nuevo.' }, 401);
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const origen = request.headers.get('Origin');
    if (origen && new URL(origen).host !== new URL(request.url).host) {
      return json({ error: 'Origen no permitido.' }, 403);
    }
    if (request.headers.get('X-Requested-With') !== 'bmm-admin') {
      return json({ error: 'Solicitud no permitida.' }, 403);
    }
  }
  return null;
}
