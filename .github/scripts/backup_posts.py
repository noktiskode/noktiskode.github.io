"""
Respaldo de los posts de Supabase -> archivos .md (mismo formato que _posts/).

Variables de entorno:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (los mismos secretos que ya usas)
  OUT_DIR           carpeta donde escribir (default: posts)
  INCLUDE_DRAFTS    "true" para incluir borradores (default: false; si el repo es público, déjalo en false)
  FORCE             "true" para saltarse la protección contra respaldos incompletos

Solo usa la librería estándar de Python.
"""
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
OUT = Path(os.environ.get("OUT_DIR", "posts"))
DRAFTS = os.environ.get("INCLUDE_DRAFTS", "false").lower() == "true"
FORCE = os.environ.get("FORCE", "false").lower() == "true"
PAGE = 500

if not URL or not KEY:
    sys.exit("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.")


def fetch_all():
    rows, offset = [], 0
    while True:
        q = {"select": "*", "order": "published_at.asc,slug.asc", "limit": PAGE, "offset": offset}
        if not DRAFTS:
            q["published"] = "eq.true"
        req = urllib.request.Request(
            f"{URL}/rest/v1/posts?{urllib.parse.urlencode(q)}",
            headers={"apikey": KEY, "Authorization": f"Bearer {KEY}"},
        )
        with urllib.request.urlopen(req, timeout=60) as r:
            batch = json.load(r)
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
        sys.exit("Supabase devolvió 0 posts: no toco el respaldo anterior.")

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
