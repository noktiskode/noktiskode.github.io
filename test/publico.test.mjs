import { crearDB } from './d1mock.mjs';
const base = new URL('../', import.meta.url).pathname;
const DB = crearDB([base + 'd1/schema.sql', base + 'd1/import.sql']);
const env = { DB };
const next = async () => new Response('NEXT', { status: 404 });
const req = (path, ua = 'Mozilla/5.0') => new Request('https://barberenamimunicipio.top' + path, { headers: { 'user-agent': ua } });
let fallos = 0;
function ok(cond, msg) { if (!cond) { fallos++; console.log('FALLA:', msg); } else console.log('ok   :', msg); }

const imp = (p) => import(base + 'functions/' + p);

// Portada
{
  const m = await imp('index.js');
  const r = await m.onRequestGet({ env, request: req('/'), next });
  const h = await r.text();
  ok(r.status === 200 && h.length > 5000, 'portada responde 200 (' + h.length + ' bytes)');
  ok((h.match(/class="cb-post/g) || []).length >= 10, 'portada tiene tarjetas');
  const r2 = await m.onRequestGet({ env, request: req('/?pagina=2'), next });
  ok((await r2.text()).length > 5000, 'portada página 2');
  const r3 = await m.onRequestGet({ env, request: req('/', 'Android Mobi'), next });
  ok(r3.status === 200, 'portada móvil');
}
// Categorías y archivo
for (const [f, nombre] of [['barberena.js', 'barberena'], ['opiniones.js', 'opiniones'], ['historias.js', 'historias'], ['archivo.js', 'archivo']]) {
  const m = await imp(f);
  const r = await m.onRequestGet({ env, request: req('/' + nombre + '/'), next });
  const h = await r.text();
  ok(r.status === 200 && h.includes('cb-post'), nombre + ' lista posts (' + (h.match(/class="cb-post/g) || []).length + ' tarjetas)');
}
// Post individual: todos
{
  const m = await imp('[slug].js');
  const slugs = DB._raw.prepare('SELECT slug FROM posts').all().map((r) => r.slug);
  let bien = 0, mal = [];
  for (const slug of slugs) {
    const r = await m.onRequestGet({ env, params: { slug }, request: req('/' + slug + '/'), next });
    const h = await r.text();
    if (r.status === 200 && h.includes('<article') || h.includes('post-')) bien++; else mal.push(slug);
  }
  ok(mal.length === 0, `los ${slugs.length} posts se renderizan (${bien} bien, ${mal.length} mal)`);
  const r = await m.onRequestGet({ env, params: { slug: 'no-existe-xyz' }, request: req('/no-existe-xyz/'), next });
  ok((await r.text()) === 'NEXT', 'slug inexistente delega a next()');
  const r2 = await m.onRequestGet({ env, params: { slug: slugs[0] }, request: req('/x/'), next });
  const h2 = await r2.text();
  ok(/Relacionad|relacionad|related/i.test(h2) || h2.includes('/etiqueta/'), 'post muestra etiquetas/relacionados');
}
// Etiqueta
{
  const m = await imp('etiqueta/[tag].js');
  const r = await m.onRequestGet({ env, params: { tag: 'barberena' }, request: req('/etiqueta/barberena/'), next });
  const h = await r.text();
  ok(r.status === 200 && h.includes('cb-post'), 'etiqueta barberena lista posts');
  const r2 = await m.onRequestGet({ env, params: { tag: 'zzz-no-existe' }, request: req('/etiqueta/zzz/'), next });
  ok((await r2.text()) === 'NEXT', 'etiqueta inexistente delega a next()');
}
// Buscar
{
  const m = await imp('buscar/index.js');
  const r = await m.onRequestGet({ env, request: req('/buscar/?q=ampliación cementerio'), next });
  const h = await r.text();
  ok(h.includes('cementerio'), 'búsqueda con tilde encuentra "ampliación cementerio"');
  const r2 = await m.onRequestGet({ env, request: req('/buscar/?q=AMPLIACION'), next });
  ok((await r2.text()).includes('cb-post'), 'búsqueda sin tilde y en mayúsculas');
  const r3 = await m.onRequestGet({ env, request: req("/buscar/?q=%25_'"), next });
  ok(r3.status === 200, 'búsqueda con caracteres especiales no rompe');
}
// Sitemap
{
  const m = await imp('sitemap.xml.js');
  const r = await m.onRequestGet({ env, request: req('/sitemap.xml'), next });
  const x = await r.text();
  ok((x.match(/<url>/g) || []).length === 519 + 8, 'sitemap tiene 519 posts + 8 páginas fijas (' + (x.match(/<url>/g) || []).length + ')');
}
console.log(fallos ? `\n${fallos} FALLOS` : '\nTODO BIEN');
process.exit(fallos ? 1 : 0);
