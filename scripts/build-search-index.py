#!/usr/bin/env python3
"""
build-search-index.py

Walks blog/*/index.html and top-notes/*/index.html, pulls <title>,
meta description, and canonical URL out of each page, and writes a
combined search index to data/search-index.json.

Run this after publishing a new blog post or top-notes page so the
site search picks it up. No arguments needed — run from anywhere,
it locates the repo root relative to this script's location
(repo/scripts/build-search-index.py -> repo/).

Usage:
    python3 build-search-index.py
"""

import json
import re
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
OUTPUT_PATH = REPO_ROOT / "data" / "search-index.json"

TITLE_RE = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)
DESC_RE = re.compile(r'name="description"\s+content="(.*?)"', re.IGNORECASE | re.DOTALL)
CANONICAL_RE = re.compile(r'rel="canonical"\s+href="(.*?)"', re.IGNORECASE | re.DOTALL)

TITLE_SUFFIX_PATTERNS = [
    re.compile(r"\s*—\s*VibeFrag\s*$", re.IGNORECASE),
    re.compile(r"\s*\|\s*VibeFrag\s*$", re.IGNORECASE),
]


def clean_title(raw_title):
    title = raw_title.strip()
    for pattern in TITLE_SUFFIX_PATTERNS:
        title = pattern.sub("", title).strip()
    return title


def extract_page(html_path, entry_type):
    html = html_path.read_text(encoding="utf-8")

    title_match = TITLE_RE.search(html)
    desc_match = DESC_RE.search(html)
    canonical_match = CANONICAL_RE.search(html)

    if not (title_match and desc_match and canonical_match):
        return None, [
            field
            for field, match in (
                ("title", title_match),
                ("description", desc_match),
                ("canonical", canonical_match),
            )
            if not match
        ]

    entry = {
        "type": entry_type,
        "title": clean_title(title_match.group(1)),
        "excerpt": desc_match.group(1).strip(),
        "url": canonical_match.group(1).strip(),
    }
    return entry, []


def collect(section_dir, entry_type):
    entries = []
    errors = []
    if not section_dir.is_dir():
        return entries, errors

    for index_file in sorted(section_dir.glob("*/index.html")):
        entry, missing = extract_page(index_file, entry_type)
        if entry:
            entries.append(entry)
        else:
            errors.append((index_file, missing))

    return entries, errors


def main():
    all_entries = []
    all_errors = []

    blog_entries, blog_errors = collect(REPO_ROOT / "blog", "article")
    all_entries.extend(blog_entries)
    all_errors.extend(blog_errors)

    top_notes_dir = REPO_ROOT / "top-notes"
    guide_entries, guide_errors = collect(top_notes_dir, "guide")
    all_entries.extend(guide_entries)
    all_errors.extend(guide_errors)

    top_notes_index = top_notes_dir / "index.html"
    if top_notes_index.is_file():
        entry, missing = extract_page(top_notes_index, "guide")
        if entry:
            all_entries.append(entry)
        else:
            all_errors.append((top_notes_index, missing))

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(all_entries, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Wrote {len(all_entries)} entries to {OUTPUT_PATH}")
    print(f"  articles: {sum(1 for e in all_entries if e['type'] == 'article')}")
    print(f"  guides:   {sum(1 for e in all_entries if e['type'] == 'guide')}")

    if all_errors:
        print(f"\n{len(all_errors)} page(s) skipped due to missing fields:")
        for path, missing in all_errors:
            print(f"  {path} — missing: {', '.join(missing)}")


if __name__ == "__main__":
    main()
