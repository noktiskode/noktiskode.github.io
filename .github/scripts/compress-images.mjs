// Comprime las imágenes que ya están en el bucket de Supabase Storage.
// - Mantiene el MISMO path/URL (no hay que tocar la tabla posts).
// - Antes de sobrescribir, guarda el original en _originals/<nombre> (una sola vez).
// - Por defecto corre en modo prueba (DRY_RUN=true): solo muestra qué haría.
//
// Variables de entorno:
//   SUPABASE_URL                 (default: el proyecto bmm-blog)
//   SUPABASE_SERVICE_ROLE_KEY    (obligatoria; va como secreto, NUNCA en el código)
//   BUCKET                       (default: post-images)
//   DRY_RUN                      ("false" para aplicar cambios de verdad)
//   MIN_KB                       (default: 200, no toca imágenes más livianas)
//   MAX_WIDTH                    (default: 1200)

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const URL = process.env.SUPABASE_URL || 'https://iolchsadedieagiqrxzu.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.BUCKET || 'post-images';
const DRY_RUN = process.env.DRY_RUN !== 'false';
const MIN_BYTES = Number(process.env.MIN_KB || 200) * 1024;
const MAX_WIDTH = Number(process.env.MAX_WIDTH || 1200);

if (!KEY) {
  console.error('Falta SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(URL, KEY, { auth: { persistSession: false } });
const store = sb.storage.from(BUCKET);
const kb = (n) => (n / 1024).toFixed(0) + ' KB';

// Lista todos los archivos de la raíz del bucket (las carpetas vienen con id null)
async function listAll() {
  const out = [];
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const { data, error } = await store.list('', {
      limit, offset, sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw error;
    out.push(...data.filter((f) => f.id));
    if (data.length < limit) break;
  }
  return out;
}

function encode(buf, ext) {
  let img = sharp(buf).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });
  if (ext === 'webp') return img.webp({ quality: 75 }).toBuffer();
  if (ext === 'jpg' || ext === 'jpeg') return img.jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  if (ext === 'png') return img.png({ compressionLevel: 9, palette: true }).toBuffer();
  return null;
}

const MIME = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };

const files = await listAll();
console.log(`${files.length} archivos en "${BUCKET}" | modo: ${DRY_RUN ? 'PRUEBA (no cambia nada)' : 'APLICAR'}\n`);

let before = 0, after = 0, changed = 0;

for (const f of files) {
  const size = f.metadata?.size ?? 0;
  const ext = f.name.split('.').pop().toLowerCase();

  if (!MIME[ext] || size < MIN_BYTES) continue;

  try {
    const { data: blob, error: dlErr } = await store.download(f.name);
    if (dlErr) throw dlErr;
    const original = Buffer.from(await blob.arrayBuffer());
    const result = await encode(original, ext);
    if (!result) continue;

    // Solo vale la pena si ahorra al menos 10%
    if (result.length > original.length * 0.9) {
      console.log(`= ${f.name}: ${kb(original.length)} (sin ganancia, se deja igual)`);
      continue;
    }

    before += original.length;
    after += result.length;
    changed++;
    console.log(`${DRY_RUN ? '~' : '+'} ${f.name}: ${kb(original.length)} -> ${kb(result.length)}`);

    if (DRY_RUN) continue;

    // 1) Respaldo del original (si ya existe respaldo, no se pisa)
    const { error: bkErr } = await store.upload(`_originals/${f.name}`, original, {
      contentType: MIME[ext], upsert: false,
    });
    if (bkErr && !/exists|Duplicate/i.test(bkErr.message)) throw bkErr;

    // 2) Sobrescribir en el mismo path
    const { error: upErr } = await store.upload(f.name, result, {
      contentType: MIME[ext], cacheControl: '31536000', upsert: true,
    });
    if (upErr) throw upErr;
  } catch (e) {
    console.error(`! ${f.name}: ${e.message}`);
  }
}

console.log(`\n${changed} imágenes ${DRY_RUN ? 'se comprimirían' : 'comprimidas'}: ${kb(before)} -> ${kb(after)} (ahorro ${kb(before - after)})`);
if (DRY_RUN) console.log('Esto fue una prueba. Corre de nuevo con dry_run = false para aplicar.');
