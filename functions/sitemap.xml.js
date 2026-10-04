// functions/sitemap.xml.js
// Sitemap dinámico: lee los posts publicados de Supabase en cada petición
// (con caché de 1 hora), así lo que publicas desde el panel aparece solo.
// Si Supabase falla, entrega el sitemap estático de Jekyll como respaldo.

const SUPABASE_URL = 'https://iolchsadedieagiqrxzu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbGNoc2FkZWRpZWFnaXFyeHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NzI1ODYsImV4cCI6MjEwNjA0ODU4Nn0.lOUc-vt2JFfDIidKO7m_dFgjnmDWIGQnzXADHcBTjyg';
const SITE_URL = 'https://barberenamimunicipio.top';

// Páginas fijas que sí deben indexarse (no incluir /buscar/, /admin/, login, etc.)
const STATIC_PATHS = [
  '/',
  '/barberena/',
  '/opiniones/',
  '/historias/',
  '/archivo/',
  '/que-publicamos/',
  '/como-participar/',
  '/manifiesto/',
];

const PAGE_SIZE = 1000; // máximo de filas que devuelve Supabase por petición

function xmlEscape(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  }[c]));
}

function isoDate(value) {
  const d = new Date(value);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
}

async function fetchAllPosts() {
  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };
  const posts = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?published=eq.true&select=slug,published_at&order=published_at.desc&limit=${PAGE_SIZE}&offset=${offset}`,
      { headers }
    );
    if (!res.ok) throw new Error(`Supabase respondió ${res.status}`);
    const rows = await res.json();
    posts.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return posts;
}

function urlEntry(path, lastmod) {
  return `  <url>\n    <loc>${xmlEscape(SITE_URL + path)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
}

export async function onRequestGet(context) {
  let posts;
  try {
    posts = await fetchAllPosts();
  } catch (e) {
    // Respaldo: el sitemap estático generado por Jekyll
    return context.next();
  }

  // Ignora filas sin slug válido
  posts = posts.filter((p) => p && typeof p.slug === 'string' && p.slug.trim() !== '');

  const newest = posts.length ? isoDate(posts[0].published_at) : null;

  const entries = [];
  for (const path of STATIC_PATHS) {
    // Portada y secciones cambian cuando se publica algo nuevo
    const dynamic = path !== '/que-publicamos/' && path !== '/como-participar/' && path !== '/manifiesto/';
    entries.push(urlEntry(path, dynamic ? newest : null));
  }
  for (const p of posts) {
    entries.push(urlEntry(`/${encodeURIComponent(p.slug)}/`, isoDate(p.published_at)));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=UTF-8',
      'cache-control': 'public, max-age=300, s-maxage=3600'
    }
  });
}
