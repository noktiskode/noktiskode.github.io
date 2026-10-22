// functions/api/sugerir-seo.js
//
// Recibe el título y el contenido de un post desde el panel y devuelve
// sugerencias de SEO: etiquetas, resumen, slug y frases de búsqueda.
//
// Requisitos en Cloudflare Pages (Settings → Variables and Secrets):
//   - ANTHROPIC_API_KEY  (secreto)  -> usa Claude. Recomendado.
//   - ANTHROPIC_MODEL    (opcional) -> por defecto "claude-haiku-5-5".
// Si ANTHROPIC_API_KEY no existe, usa Workers AI (gratis) siempre que
// tengas un binding llamado "AI" (Settings → Bindings → Workers AI).
//
// Solo responde a quien tenga sesión iniciada en el panel: el token de
// Supabase que manda el navegador se valida contra Supabase.

const SUPABASE_URL = 'https://iolchsadedieagiqrxzu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbGNoc2FkZWRpZWFnaXFyeHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NzI1ODYsImV4cCI6MjEwNjA0ODU4Nn0.lOUc-vt2JFfDIidKO7m_dFgjnmDWIGQnzXADHcBTjyg';

const MAX_BODY_CHARS = 12000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=UTF-8', 'cache-control': 'no-store' }
  });
}

async function sesionValida(token) {
  if (!token) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// Etiquetas que ya existen en el sitio, para que la IA las reutilice
// en vez de inventar variantes ("Agua", "Agua potable", "agua").
async function etiquetasExistentes() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=tags&limit=500`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    if (!res.ok) return [];
    const rows = await res.json();
    const conteo = new Map();
    for (const r of rows) {
      for (const t of (r.tags || [])) conteo.set(t, (conteo.get(t) || 0) + 1);
    }
    return [...conteo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 80).map(([t]) => t);
  } catch (e) {
    return [];
  }
}

function construirPrompt({ title, body, category, existentes }) {
  const sistema = `Eres editor SEO de "Barberena Mi Municipio" (BMM), una página de periodismo cívico local de Barberena, Santa Rosa, Guatemala. Cubre gobierno municipal, compras públicas, obras, agua, servicios y vida comunitaria.

Devuelves SOLO un objeto JSON válido, sin texto antes ni después, sin bloques de código, con estas claves:
- "tags": arreglo de 5 a 8 etiquetas. Mezcla tema (ej. "Compras públicas"), lugar (aldeas, barrios, "Barberena"), instituciones (ej. "Municipalidad de Barberena", "Guatecompras") y personas solo si el texto las nombra. Con mayúscula inicial, 1 a 3 palabras cada una, sin repetir ideas.
- "excerpt": resumen de máximo 155 caracteres, en español de Guatemala, que diga lo esencial y dé ganas de abrir la nota. Sin emojis, sin comillas, sin cerrar con puntos suspensivos.
- "slug": URL corta en minúsculas, sin tildes, con guiones, máximo 7 palabras, con las palabras clave principales.
- "keywords": arreglo de 4 a 6 frases tal como las escribiría un vecino en Google para encontrar esta nota (ej. "por qué no hay agua en Barberena").
- "notes": una frase corta con algo que mejorar en el texto desde el punto de vista SEO, o cadena vacía si no hay nada.

Reglas: no inventes datos que no estén en el texto. No uses emojis. Si una etiqueta ya existe en la lista del sitio y aplica, usa exactamente esa escritura.`;

  const usuario = `Categoría: ${category || 'barberena'}
Etiquetas que ya existen en el sitio: ${existentes.length ? existentes.join(', ') : '(ninguna todavía)'}

Título: ${title}

Contenido:
${body}`;

  return { sistema, usuario };
}

async function conClaude(env, { sistema, usuario }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
      max_tokens: 900,
      system: sistema,
      messages: [{ role: 'user', content: usuario }]
    })
  });
  if (!res.ok) {
    const detalle = await res.text();
    throw new Error(`Claude respondió ${res.status}: ${detalle.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.content || []).map((b) => b.text || '').join('');
}

async function conWorkersAI(env, { sistema, usuario }) {
  const out = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: sistema },
      { role: 'user', content: usuario }
    ],
    max_tokens: 900
  });
  return out.response || '';
}

function extraerJson(texto) {
  const inicio = texto.indexOf('{');
  const fin = texto.lastIndexOf('}');
  if (inicio === -1 || fin === -1) throw new Error('La IA no devolvió un JSON.');
  return JSON.parse(texto.slice(inicio, fin + 1));
}

function slugify(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function limpiar(r) {
  const tags = [...new Set((Array.isArray(r.tags) ? r.tags : [])
    .map((t) => String(t).trim()).filter(Boolean))].slice(0, 8);
  let excerpt = String(r.excerpt || '').replace(/\s+/g, ' ').trim();
  if (excerpt.length > 160) excerpt = excerpt.slice(0, 157).replace(/\s+\S*$/, '') + '…';
  return {
    tags,
    excerpt,
    slug: slugify(r.slug),
    keywords: (Array.isArray(r.keywords) ? r.keywords : []).map((k) => String(k).trim()).filter(Boolean).slice(0, 6),
    notes: String(r.notes || '').trim()
  };
}

export async function onRequestPost({ request, env }) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!(await sesionValida(token))) return json({ error: 'Sesión no válida. Iniciá sesión en el panel.' }, 401);

  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return json({ error: 'Solicitud inválida.' }, 400);
  }

  const title = String(payload.title || '').trim().slice(0, 200);
  const body = String(payload.body || '').trim().slice(0, MAX_BODY_CHARS);
  if (!title || body.length < 80) {
    return json({ error: 'Escribí el título y un poco de contenido antes de pedir sugerencias.' }, 400);
  }

  if (!env.ANTHROPIC_API_KEY && !env.AI) {
    return json({ error: 'Falta configurar ANTHROPIC_API_KEY o el binding "AI" en Cloudflare Pages.' }, 500);
  }

  try {
    const existentes = await etiquetasExistentes();
    const prompt = construirPrompt({ title, body, category: payload.category, existentes });
    const texto = env.ANTHROPIC_API_KEY ? await conClaude(env, prompt) : await conWorkersAI(env, prompt);
    return json({ ok: true, ...limpiar(extraerJson(texto)) });
  } catch (e) {
    console.error(e);
    return json({ error: 'No se pudo generar la sugerencia: ' + (e.message || 'error desconocido') }, 502);
  }
}
