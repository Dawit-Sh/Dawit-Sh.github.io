"""Fill in each Bandcamp album in assets/data/playlists.json from its album page.

For every entry with a "bandcamp" link this sets: album (the numeric id the embedded player needs),
released (YYYY-MM-DD), image (350 px cover) and tracks ([{"n", "title", "secs", "id"}]).
Your own "title" and "by" are left as they are, so you can still word them your way.

Run from the repo root after adding or changing an album link:
    python tools/bandcamp-tracks.py
"""
import html
import json
import pathlib
import re
import sys
import urllib.request
from datetime import datetime

DATA = pathlib.Path(__file__).resolve().parent.parent / "assets" / "data" / "playlists.json"


def album_page(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (portfolio tracklist refresh)"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read().decode("utf-8")


def parse(page):
    m = re.search(r'data-tralbum="([^"]+)"', page)
    if not m:
        raise ValueError("no data-tralbum on the page")
    d = json.loads(html.unescape(m.group(1)))
    released = d.get("current", {}).get("release_date") or d.get("album_release_date")
    released = datetime.strptime(released, "%d %b %Y %H:%M:%S %Z").strftime("%Y-%m-%d") if released else None
    art = re.search(r'<meta property="og:image" content="([^"]+)"', page)
    image = art.group(1).replace("_5.jpg", "_2.jpg") if art else None
    tracks = [{"n": t["track_num"], "title": t["title"], "secs": round(t.get("duration") or 0), "id": t["track_id"]}
              for t in d["trackinfo"]]
    return {"album": d["id"], "released": released, "image": image, "tracks": tracks}


def main():
    entries = json.loads(DATA.read_text(encoding="utf-8"))
    for e in entries:
        if not isinstance(e, dict) or not e.get("bandcamp"):
            continue
        info = parse(album_page(e["bandcamp"]))
        e.update({k: v for k, v in info.items() if v is not None})
        print(f'{e.get("title", e["bandcamp"])}: {len(info["tracks"])} tracks, released {info["released"]}', file=sys.stderr)
    DATA.write_text(dump(entries), encoding="utf-8")


def dump(entries):
    """Pretty JSON with one line per track, so the file stays easy to read and edit."""
    one = lambda v: json.dumps(v, ensure_ascii=False)
    out = []
    for e in entries:
        if not isinstance(e, dict):
            out.append("    " + one(e))
            continue
        lines = []
        for k, v in e.items():
            if k == "tracks":
                rows = ",\n".join("            " + one(t) for t in v)
                lines.append(f'        "tracks": [\n{rows}\n        ]')
            else:
                lines.append(f"        {one(k)}: {one(v)}")
        out.append("    {\n" + ",\n".join(lines) + "\n    }")
    return "[\n" + ",\n".join(out) + "\n]\n"


if __name__ == "__main__":
    main()
