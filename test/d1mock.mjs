// Mock mínimo de D1 sobre node:sqlite, solo para pruebas locales.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

export function crearDB(archivos) {
  const db = new DatabaseSync(':memory:');
  for (const f of archivos) db.exec(fs.readFileSync(f, 'utf8'));
  const stmt = (sql) => {
    let args = [];
    const s = {
      bind(...a) { args = a; return s; },
      async all() { const rows = db.prepare(sql).all(...args); return { results: rows, success: true, meta: {} }; },
      async first() { const r = db.prepare(sql).get(...args); return r ?? null; },
      async run() { const r = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(r.changes) } }; },
      _exec() { return db.prepare(sql).all(...args); }
    };
    return s;
  };
  return {
    prepare: stmt,
    async batch(list) {
      const out = [];
      for (const s of list) out.push({ results: s._exec(), success: true });
      return out;
    },
    _raw: db
  };
}
