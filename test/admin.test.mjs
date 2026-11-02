import { crearDB } from './d1mock.mjs';
const base = new URL('../', import.meta.url).pathname;
const DB = crearDB([base + 'd1/schema.sql', base + 'd1/import.sql']);
const archivos = new Map();
const IMAGES = {
  async put(k, body, o) { const chunks = []; for await (const c of body) chunks.push(c); archivos.set(k, { n: chunks.length, o }); },
  async delete(k) { archivos.delete(k); }
};
const env = { DB, IMAGES, ADMIN_PASSWORD: 'clave-secreta-123', SESSION_SECRET: 'una-clave-larga-de-prueba-123456' };
let fallos = 0;
const ok = (c, m) => { if (!c) { fallos++; console.log('FALLA:', m); } else console.log('ok   :', m); };
const imp = (p) => import(base + 'functions/' + p);
const H = 'https://barberenamimunicipio.top';
const call = (m, ctx) => m(ctx);
const mk = (method, path, { body, cookie, csrf = true, form, ip = '1.1.1.1', origin } = {}) => {
  const headers = { 'CF-Connecting-IP': ip };
  if (cookie) headers.Cookie = cookie;
  if (csrf) headers['X-Requested-With'] = 'bmm-admin';
  if (origin) headers.Origin = origin;
  let b;
  if (body !== undefined) { headers['content-type'] = 'application/json'; b = JSON.stringify(body); }
  if (form) b = form;
  return new Request(H + path, { method, headers, body: b });
};

const login = await imp('api/admin/login.js');
const session = await imp('api/admin/session.js');
const logout = await imp('api/admin/logout.js');
const lista = await imp('api/admin/posts/index.js');
const uno = await imp('api/admin/posts/[slug].js');
const upload = await imp('api/admin/upload.js');
const imagen = await imp('api/admin/imagen.js');

// Configuración incompleta
{
  const r = await login.onRequestPost({ request: mk('POST', '/api/admin/login', { body: { password: 'x' } }), env: { DB } });
  ok(r.status === 500, 'sin secretos configurados → 500 con mensaje claro');
}
// Contraseña incorrecta y luego correcta
let cookie;
{
  const r = await login.onRequestPost({ request: mk('POST', '/api/admin/login', { body: { password: 'mala' }, ip: '9.9.9.9' }), env });
  ok(r.status === 401, 'contraseña incorrecta → 401');
  const r2 = await login.onRequestPost({ request: mk('POST', '/api/admin/login', { body: { password: 'clave-secreta-123' }, ip: '2.2.2.2' }), env });
  ok(r2.status === 200, 'contraseña correcta → 200');
  const sc = r2.headers.get('Set-Cookie');
  ok(/HttpOnly/.test(sc) && /Secure/.test(sc) && /SameSite=Strict/.test(sc), 'cookie HttpOnly + Secure + SameSite=Strict');
  cookie = sc.split(';')[0];
}
// Sesión
{
  const g = (ck) => session.onRequestGet({ request: mk('GET', '/api/admin/session', { cookie: ck }), env });
  ok((await g(cookie)).status === 200, 'sesión válida → 200');
  ok((await g(undefined)).status === 401, 'sin cookie → 401');
  const partes = cookie.split('.');
  ok((await g(partes[0] + '.' + (Number(partes[1]) + 1000) + '.' + partes[2])).status === 401, 'cookie manipulada → 401');
  const vencida = 'bmm_session=v1.' + (Date.now() - 1000) + '.' + '0'.repeat(64);
  ok((await g(vencida)).status === 401, 'cookie vencida/falsa → 401');
}
// Freno de fuerza bruta
{
  let ultimo;
  for (let i = 0; i < 6; i++) ultimo = await login.onRequestPost({ request: mk('POST', '/api/admin/login', { body: { password: 'mala' }, ip: '7.7.7.7' }), env });
  ok(ultimo.status === 429, 'tras 5 fallos → 429');
  const r = await login.onRequestPost({ request: mk('POST', '/api/admin/login', { body: { password: 'clave-secreta-123' }, ip: '7.7.7.7' }), env });
  ok(r.status === 429, 'esa IP sigue bloqueada aunque acierte');
}
// Crear
const nuevo = { title: 'Prueba: "comillas" & ñandú', slug: 'Prueba Ñandú Número 1', excerpt: '', body: 'Primer párrafo de prueba con ñ.\n\nSegundo párrafo.', category: 'opiniones', image_url: 'https://img.barberenamimunicipio.top/test-1.webp', video_url: '', tags: ['Prueba', 'prueba', ' Ñandú '], featured: true, published: true, published_at: '2026-11-01T12:00:00.000Z' };
{
  const sinCsrf = await lista.onRequestPost({ request: mk('POST', '/api/admin/posts', { body: nuevo, cookie, csrf: false }), env });
  ok(sinCsrf.status === 403, 'POST sin cabecera X-Requested-With → 403');
  const otroOrigen = await lista.onRequestPost({ request: mk('POST', '/api/admin/posts', { body: nuevo, cookie, origin: 'https://malo.example' }), env });
  ok(otroOrigen.status === 403, 'POST desde otro origen → 403');
  const sinSesion = await lista.onRequestPost({ request: mk('POST', '/api/admin/posts', { body: nuevo }), env });
  ok(sinSesion.status === 401, 'POST sin sesión → 401');
  const r = await lista.onRequestPost({ request: mk('POST', '/api/admin/posts', { body: nuevo, cookie }), env });
  const d = await r.json();
  ok(r.status === 201 && d.slug === 'prueba-nandu-numero-1', 'crear post → 201 y slug normalizado: ' + d.slug);
  const dup = await lista.onRequestPost({ request: mk('POST', '/api/admin/posts', { body: nuevo, cookie }), env });
  ok(dup.status === 409, 'slug repetido → 409');
  const res = await lista.onRequestPost({ request: mk('POST', '/api/admin/posts', { body: { ...nuevo, slug: 'Admin' }, cookie }), env });
  ok(res.status === 400, 'slug reservado → 400');
  const cat = await lista.onRequestPost({ request: mk('POST', '/api/admin/posts', { body: { ...nuevo, slug: 'otra', category: 'noticias' }, cookie }), env });
  ok(cat.status === 400, 'categoría inválida → 400');
  const vid = await lista.onRequestPost({ request: mk('POST', '/api/admin/posts', { body: { ...nuevo, slug: 'otra2', video_url: 'javascript:alert(1)' }, cookie }), env });
  ok(vid.status === 400, 'video con javascript: → 400');
}
// Se ve en el sitio público, en la búsqueda y en el sitemap
{
  const slugPub = await imp('[slug].js');
  const r = await slugPub.onRequestGet({ env, params: { slug: 'prueba-nandu-numero-1' }, request: new Request(H + '/x/'), next: async () => new Response('NEXT') });
  const h = await r.text();
  ok(r.status === 200 && h.includes('ñandú') && h.includes('&quot;comillas&quot;'), 'el post nuevo aparece en su página (con comillas escapadas)');
  const bus = await imp('buscar/index.js');
  const rb = await bus.onRequestGet({ env, request: new Request(H + '/buscar/?q=nandu') });
  ok((await rb.text()).includes('prueba-nandu-numero-1'), 'la búsqueda "nandu" encuentra "ñandú"');
  const fila = DB._raw.prepare("SELECT tags, excerpt, noindex FROM posts WHERE slug='prueba-nandu-numero-1'").get();
  ok(fila.tags === '["Prueba","Ñandú"]', 'etiquetas sin duplicados: ' + fila.tags);
  ok(fila.excerpt.startsWith('Primer párrafo'), 'resumen automático desde el primer párrafo');
}
// Listar / leer / editar
{
  const r = await lista.onRequestGet({ request: mk('GET', '/api/admin/posts?q=ñandú', { cookie }), env });
  const d = await r.json();
  ok(d.posts.length === 1 && d.posts[0].slug === 'prueba-nandu-numero-1', 'listar con búsqueda por título (con ñ)');
  const r0 = await lista.onRequestGet({ request: mk('GET', '/api/admin/posts', { cookie }), env });
  ok((await r0.json()).posts.length === 10, 'listar sin búsqueda trae 10');
  const g = await uno.onRequestGet({ request: mk('GET', '/x', { cookie }), env, params: { slug: 'prueba-nandu-numero-1' } });
  const gp = (await g.json()).post;
  ok(Array.isArray(gp.tags) && gp.featured === true, 'leer post devuelve tags como arreglo y featured booleano');
  const put = await uno.onRequestPut({ request: mk('PUT', '/x', { cookie, body: { ...gp, title: 'Título editado', slug: 'prueba-editada' } }), env, params: { slug: 'prueba-nandu-numero-1' } });
  ok(put.status === 200, 'editar (cambiando el slug) → 200');
  const viejo = DB._raw.prepare("SELECT COUNT(*) n FROM posts WHERE slug='prueba-nandu-numero-1'").get().n;
  const nuevoN = DB._raw.prepare("SELECT title FROM posts WHERE slug='prueba-editada'").get();
  ok(viejo === 0 && nuevoN.title === 'Título editado', 'el post cambió de slug sin duplicarse');
  const conflicto = await uno.onRequestPut({ request: mk('PUT', '/x', { cookie, body: { ...gp, slug: 'agua-potable-en-barberena' } }), env, params: { slug: 'prueba-editada' } });
  ok(conflicto.status === 409, 'editar a un slug que ya existe → 409');
  const noex = await uno.onRequestGet({ request: mk('GET', '/x', { cookie }), env, params: { slug: 'nada' } });
  ok(noex.status === 404, 'post inexistente → 404');
}
// Imágenes
{
  const png = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' });
  const f = new FormData(); f.append('file', png, 'a.png');
  const r = await upload.onRequestPost({ request: mk('POST', '/api/admin/upload', { cookie, form: f }), env });
  const d = await r.json();
  ok(r.status === 201 && d.url.startsWith('https://img.barberenamimunicipio.top/') && d.url.endsWith('.png') && archivos.size === 1, 'subir imagen → URL pública en img.barberenamimunicipio.top');
  const pdf = new FormData(); pdf.append('file', new Blob(['x'], { type: 'application/pdf' }), 'a.pdf');
  const r2 = await upload.onRequestPost({ request: mk('POST', '/api/admin/upload', { cookie, form: pdf }), env });
  ok(r2.status === 415, 'archivo que no es imagen → 415');

  // Una imagen usada por dos posts no se borra; la que solo usa uno, sí
  const clave = d.url.split('/').pop();
  await lista.onRequestPost({ request: mk('POST', '/api/admin/posts', { cookie, body: { ...nuevo, slug: 'con-imagen-a', image_url: d.url, body: 'Texto ![](' + d.url + ')' } }), env });
  await lista.onRequestPost({ request: mk('POST', '/api/admin/posts', { cookie, body: { ...nuevo, slug: 'con-imagen-b', image_url: d.url } }), env });
  const del1 = await imagen.onRequestDelete({ request: mk('DELETE', '/api/admin/imagen', { cookie, body: { url: d.url, excluirSlug: 'con-imagen-a' } }), env });
  ok((await del1.json()).motivo === 'en-uso' && archivos.has(clave), 'imagen usada por otro post → no se borra');
  const ext = await imagen.onRequestDelete({ request: mk('DELETE', '/api/admin/imagen', { cookie, body: { url: 'https://otro.com/x.jpg' } }), env });
  ok((await ext.json()).motivo === 'externa', 'imagen de otro sitio → no se toca');

  const dA = await uno.onRequestDelete({ request: mk('DELETE', '/x', { cookie }), env, params: { slug: 'con-imagen-a' } });
  const rA = await dA.json();
  ok(rA.imagenes.conservadas === 1 && archivos.has(clave), 'borrar post A: la imagen se conserva porque la usa B');
  const dB = await uno.onRequestDelete({ request: mk('DELETE', '/x', { cookie }), env, params: { slug: 'con-imagen-b' } });
  const rB = await dB.json();
  ok(rB.imagenes.borradas === 1 && !archivos.has(clave), 'borrar post B: la imagen ya sin uso se elimina del bucket');
  const n = DB._raw.prepare("SELECT COUNT(*) n FROM posts WHERE slug LIKE 'con-imagen-%'").get().n;
  ok(n === 0, 'los posts quedaron eliminados');
}
// Salir
{
  const r = await logout.onRequestPost({ request: mk('POST', '/api/admin/logout', { cookie }), env });
  ok(/Max-Age=0/.test(r.headers.get('Set-Cookie')), 'cerrar sesión borra la cookie');
}
// Total de posts intacto
{
  const n = DB._raw.prepare('SELECT COUNT(*) n FROM posts').get().n;
  ok(n === 519 + 1, 'quedan 519 originales + 1 de prueba (' + n + ')');
}
console.log(fallos ? `\n${fallos} FALLOS` : '\nTODO BIEN');
process.exit(fallos ? 1 : 0);
