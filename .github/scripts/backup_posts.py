"""
Respaldo de los posts de Cloudflare D1 -> archivos .md (mismo formato que _posts/).

Variables de entorno:
  CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, D1_DATABASE_ID
                    (token con permiso "D1 Read" o "D1 Edit"; van como secretos de GitHub)
  OUT_DIR           carpeta donde escribir (default: posts)
  INCLUDE_DRAFTS    "true" para incluir borradores (default: false; si el repo es público, déjalo en false)
  FORCE             "true" para saltarse la protección contra respaldos incompletos

Solo usa la librería estándar de Python.
"""
import json
import os
import sys
import urllib.request
from pathlib import Path

TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN", "")
ACCOUNT = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
DB_ID = os.environ.get("D1_DATABASE_ID", "")
OUT = Path(os.environ.get("OUT_DIR", "posts"))
DRAFTS = os.environ.get("INCLUDE_DRAFTS", "false").lower() == "true"
FORCE = os.environ.get("FORCE", "false").lower() == "true"
PAGE = 200

if not TOKEN or not ACCOUNT or not DB_ID:
    sys.exit("Faltan CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID o D1_DATABASE_ID.")


def d1_query(sql, params):
    req = urllib.request.Request(
        f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/d1/database/{DB_ID}/query",
        data=json.dumps({"sql": sql, "params": params}).encode("utf-8"),
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.load(r)
    if not data.get("success"):
        raise RuntimeError(f"D1 respondió con error: {data.get('errors')}")
    return data["result"][0].get("results", [])


def fetch_all():
    rows, offset = [], 0
    where = "" if DRAFTS else "WHERE published = 1"
    while True:
        batch = d1_query(
            "SELECT id,slug,title,excerpt,body,category,image_url,video_url,tags,published,featured,"
            f"published_at,updated_at FROM posts {where} ORDER BY published_at ASC, slug ASC LIMIT ? OFFSET ?",
            [PAGE, offset],
        )
        for p in batch:
            try:
                p["tags"] = json.loads(p.get("tags") or "[]")
            except ValueError:
                p["tags"] = []
        rows += batch
        if len(batch) < PAGE:
            return rows
        offset += PAGE


def jstr(v):
    # JSON es YAML válido: evita problemas con comillas, dos puntos, tildes, etc.
    return json.dumps(v, ensure_ascii=False)


def render(p):
    fm = [
        "---",
        f"title: {jstr(p.get('title') or '')}",
        f"slug: {jstr(p.get('slug'))}",
        f"date: {jstr(p.get('published_at'))}",
        f"updated_at: {jstr(p.get('updated_at'))}",
        f"category: {jstr(p.get('category'))}",
        f"image: {jstr(p.get('image_url'))}",
        f"video_url: {jstr(p.get('video_url'))}",
        f"featured: {jstr(bool(p.get('featured')))}".lower(),
        f"published: {jstr(bool(p.get('published')))}".lower(),
        f"excerpt: {jstr(p.get('excerpt'))}",
        f"tags: {jstr(p.get('tags') or [])}",
        "---",
        "",
    ]
    return "\n".join(fm) + (p.get("body") or "").strip() + "\n"


def main():
    posts = fetch_all()
    if not posts:
        sys.exit("D1 devolvió 0 posts: no toco el respaldo anterior.")

    OUT.mkdir(parents=True, exist_ok=True)
    previos = list(OUT.glob("*.md"))
    if previos and len(posts) < len(previos) * 0.8 and not FORCE:
        sys.exit(f"Respaldo sospechoso: {len(posts)} posts ahora vs {len(previos)} antes. "
                 "Si es intencional, corre el workflow con forzar = true.")

    nuevos = set()
    for p in posts:
        fecha = (p.get("published_at") or "0000-00-00")[:10]
        nombre = f"{fecha}-{p['slug']}.md"
        nuevos.add(nombre)
        (OUT / nombre).write_text(render(p), encoding="utf-8")

    borrados = 0
    for f in previos:
        if f.name not in nuevos:
            f.unlink()
            borrados += 1

    print(f"Respaldados {len(posts)} posts | archivos retirados: {borrados} | borradores: {DRAFTS}")


main()
