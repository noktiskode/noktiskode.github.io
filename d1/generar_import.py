#!/usr/bin/env python3
"""
Convierte el CSV exportado de Supabase (tabla posts) en un archivo SQL para D1.

Uso:
    python3 d1/generar_import.py posts_rows1.csv d1/import.sql

Es seguro volver a correrlo: usa INSERT OR REPLACE, así que si exportas de nuevo
y vuelves a importar, los posts se actualizan por id sin duplicarse.
"""
import csv, json, re, sys, unicodedata
from datetime import datetime, timezone

csv.field_size_limit(10_000_000)


def norm(s):
    s = unicodedata.normalize("NFD", str(s or ""))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.lower()


def iso(value):
    """'2026-07-10 18:30:06+00' o con microsegundos -> '2026-07-10T18:30:06.000Z'"""
    v = (value or "").strip()
    if not v:
        return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    v = v.replace(" ", "T", 1)
    if re.search(r"[+-]\d\d$", v):
        v += ":00"
    if v.endswith("Z"):
        v = v[:-1] + "+00:00"
    d = datetime.fromisoformat(v)
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.") + f"{d.microsecond // 1000:03d}Z"


def parse_tags(raw):
    raw = (raw or "").strip()
    if not raw:
        return []
    if raw.startswith("["):
        data = json.loads(raw)
    elif raw.startswith("{"):          # formato arreglo de Postgres: {a,b,"c d"}
        data = next(csv.reader([raw[1:-1]], skipinitialspace=True), [])
    else:
        data = [t for t in raw.split(",")]
    seen, out = set(), []
    for t in data:
        t = str(t).strip()
        if t and t.lower() not in seen:
            seen.add(t.lower())
            out.append(t)
    return out


def boolean(v):
    return 1 if str(v).strip().lower() in ("true", "t", "1", "yes") else 0


def q(v):
    if v is None:
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"


def main(src, dst):
    with open(src, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    out = []
    for r in rows:
        tags = parse_tags(r.get("tags"))
        title = (r.get("title") or "").strip()
        excerpt = (r.get("excerpt") or "").strip()
        body = r.get("body") or ""
        search = norm(" ".join([title, excerpt, " ".join(tags), body]))
        image = (r.get("image_url") or "").strip() or None
        video = (r.get("video_url") or "").strip() or None
        vals = [
            q(r["id"]), q(r["slug"].strip()), q(title), q(excerpt), q(body),
            q((r.get("category") or "barberena").strip()), q(image), q(video),
            q(json.dumps(tags, ensure_ascii=False)),
            str(boolean(r.get("published"))), str(boolean(r.get("noindex"))), str(boolean(r.get("featured"))),
            q(iso(r.get("published_at"))), q(iso(r.get("created_at"))), q(iso(r.get("updated_at"))),
            q(search),
        ]
        out.append(
            "INSERT OR REPLACE INTO posts (id,slug,title,excerpt,body,category,image_url,video_url,tags,"
            "published,noindex,featured,published_at,created_at,updated_at,search_text) VALUES ("
            + ",".join(vals) + ");"
        )
    with open(dst, "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")
    print(f"{len(out)} posts -> {dst}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
