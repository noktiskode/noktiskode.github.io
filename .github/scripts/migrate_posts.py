"""
Migración de posts de Jekyll (_posts/*.md) hacia la tabla `posts` de Supabase.

Uso:
    python migrate_posts.py --limit 10      # prueba con los primeros 10
    python migrate_posts.py                 # migra todos

Requiere las variables de entorno:
    SUPABASE_URL              -> ej: https://iolchsadedi....supabase.co
    SUPABASE_SERVICE_ROLE_KEY -> Settings > API > service_role key (secreta, NUNCA la uses en el sitio público)

Requiere: pip install python-frontmatter requests
"""

import os
import re
import sys
import argparse
from pathlib import Path

import frontmatter
import requests

POSTS_DIR = Path("_posts")
FILENAME_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})-(.+)\.md$")


def strip_markdown(text):
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    text = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", text)
    return text.strip()


def generate_excerpt(body, max_words=40):
    first_paragraph = body.strip().split("\n\n")[0] if body.strip() else ""
    plain = strip_markdown(first_paragraph)
    words = plain.split()
    if len(words) > max_words:
        return " ".join(words[:max_words]) + "…"
    return plain


def parse_post(path: Path):
    match = FILENAME_RE.match(path.name)
    if not match:
        print(f"  [omitido] nombre de archivo no reconocido: {path.name}")
        return None

    file_date, slug_from_filename = match.groups()
    post = frontmatter.load(path)

    slug = post.get("slug", slug_from_filename)
    title = post.get("title")
    if not title:
        print(f"  [omitido] sin título: {path.name}")
        return None

    # Fecha de publicación: usa el campo 'date' del front matter si existe,
    # si no, la fecha del nombre del archivo (medianoche UTC)
    raw_date = post.get("date")
    if raw_date:
        try:
            published_at = raw_date if isinstance(raw_date, str) else raw_date.isoformat()
        except Exception:
            published_at = f"{file_date}T00:00:00+00:00"
    else:
        published_at = f"{file_date}T00:00:00+00:00"

    excerpt = post.get("excerpt") or generate_excerpt(post.content)

    return {
        "slug": slug,
        "title": title,
        "excerpt": excerpt,
        "body": post.content.strip(),
        "category": post.get("category", "barberena"),
        "image_url": post.get("image"),
        "video_url": post.get("video_url"),
        "tags": post.get("tags", []),
        "featured": bool(post.get("featured", False)),
        "published": True,
        "published_at": published_at,
    }


def insert_batch(rows, supabase_url, service_key):
    # on_conflict=slug es necesario para que "resolution=ignore-duplicates"
    # realmente ignore la fila conflictiva en vez de fallar el lote entero.
    endpoint = f"{supabase_url}/rest/v1/posts?on_conflict=slug"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal,resolution=ignore-duplicates",
    }
    res = requests.post(endpoint, json=rows, headers=headers)
    if res.status_code not in (200, 201, 204):
        print(f"  [ERROR] {res.status_code}: {res.text[:500]}")
        return False
    return True


def dedupe_slugs(parsed_rows):
    """Si dos posts distintos comparten slug, le agrega la fecha al segundo
    en adelante para no perderlos ni pisar el primero."""
    seen = {}
    duplicates_found = []
    for row in parsed_rows:
        slug = row["slug"]
        if slug not in seen:
            seen[slug] = 1
        else:
            seen[slug] += 1
            original = slug
            date_part = row["published_at"][:10]  # YYYY-MM-DD
            row["slug"] = f"{original}-{date_part}"
            duplicates_found.append((original, row["slug"]))
    return duplicates_found


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="0 = todos los posts")
    parser.add_argument("--batch-size", type=int, default=20)
    args = parser.parse_args()

    supabase_url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_key:
        print("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.")
        sys.exit(1)

    files = sorted(POSTS_DIR.glob("*.md"))
    if args.limit:
        files = files[: args.limit]

    print(f"Encontrados {len(files)} archivos para procesar.")

    parsed_rows, skipped = [], 0
    for path in files:
        row = parse_post(path)
        if row is None:
            skipped += 1
            continue
        parsed_rows.append(row)

    duplicates = dedupe_slugs(parsed_rows)
    if duplicates:
        print(f"\n{len(duplicates)} slug(s) duplicado(s) — se les agregó la fecha para diferenciarlos:")
        for original, new_slug in duplicates:
            print(f"  {original}  ->  {new_slug}")
        print()

    ok, failed = 0, 0
    for i in range(0, len(parsed_rows), args.batch_size):
        batch = parsed_rows[i : i + args.batch_size]
        success = insert_batch(batch, supabase_url, service_key)
        ok += len(batch) if success else 0
        failed += 0 if success else len(batch)

    print(f"\nListo. Insertados: {ok} | Fallidos: {failed} | Omitidos: {skipped}")


if __name__ == "__main__":
    main()
