#!/usr/bin/env python3
"""
wiki_to_words.py
Scrapet eine Wikipedia-Seite und generiert INSERT-Statements für eine Typing-Game-Wörterdatenbank.
"""

import re
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from html.parser import HTMLParser


# ---------------------------------------------------------------------------
# HTML → Plaintext
# ---------------------------------------------------------------------------

class WikiTextExtractor(HTMLParser):
    """Zieht nur den Fließtext aus dem Wikipedia-Artikel-Body."""

    SKIP_TAGS = {"script", "style", "sup", "table", "th", "td", "figure",
                 "figcaption", "nav", "footer", "header", "aside"}

    def __init__(self):
        super().__init__()
        self._skip_depth = 0
        self._skip_tag = None
        self.chunks: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP_TAGS:
            self._skip_depth += 1

    def handle_endtag(self, tag):
        if tag in self.SKIP_TAGS and self._skip_depth > 0:
            self._skip_depth -= 1

    def handle_data(self, data):
        if self._skip_depth == 0:
            self.chunks.append(data)

    def get_text(self) -> str:
        return " ".join(self.chunks)


def fetch_wikipedia_text(url: str) -> str:
    """Lädt die Wikipedia-Seite und gibt den Rohtext zurück."""
    # Mobile-Version liefert saubereres HTML
    url = url.replace("//de.wikipedia.org", "//de.m.wikipedia.org") \
             .replace("//en.wikipedia.org", "//en.m.wikipedia.org")

    req = urllib.request.Request(url, headers={"User-Agent": "wiki_to_words/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode("utf-8", errors="replace")

    parser = WikiTextExtractor()
    parser.feed(html)
    return parser.get_text()


# ---------------------------------------------------------------------------
# Text → Wörter
# ---------------------------------------------------------------------------

def extract_words(text: str, min_len: int = 4, max_len: int = 20) -> list[str]:
    """
    Extrahiert bereinigte, eindeutige Wörter aus dem Text.
    - Nur Buchstaben (inkl. Umlaute, Bindestriche innerhalb von Wörtern)
    - Länge zwischen min_len und max_len
    - Keine reinen Zahlen, keine Wörter mit Ziffern
    - Kleingeschrieben
    - Alphabetisch sortiert, dedupliziert
    """
    # Wörter mit optionalem Bindestrich mittendrin
    raw = re.findall(r"[A-Za-zÄÖÜäöüÀ-ÿ]+(?:-[A-Za-zÄÖÜäöüÀ-ÿ]+)*", text)

    seen: set[str] = set()
    words: list[str] = []

    for w in raw:
        w = w.lower().strip("-")
        if len(w) < min_len or len(w) > max_len:
            continue
        if w in seen:
            continue
        seen.add(w)
        words.append(w)

    return sorted(words)


# ---------------------------------------------------------------------------
# SQL-Generierung
# ---------------------------------------------------------------------------

def generate_sql(words: list[str], lang: str, ts: str) -> str:
    lines = []
    for word in words:
        escaped = word.replace("'", "''")
        lines.append(
            f"INSERT INTO words (word, lang, created_at) VALUES ('{escaped}', '{lang}', '{ts}');"
        )
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=== wiki_to_words ===\n")

    # Eingaben
    url = input("Wikipedia-URL: ").strip()
    if not url.startswith("http"):
        url = "https://" + url

    lang = ""
    while len(lang) != 2 or not lang.isalpha():
        lang = input("Sprachcode (2 Buchstaben, z.B. de / en): ").strip().lower()
        if len(lang) != 2 or not lang.isalpha():
            print("  → Bitte genau 2 Buchstaben eingeben.")

    # Scrapen
    print("\nLade Wikipedia-Seite …")
    try:
        text = fetch_wikipedia_text(url)
    except urllib.error.URLError as e:
        print(f"Fehler beim Laden: {e}")
        sys.exit(1)

    # Wörter extrahieren
    words = extract_words(text)
    if not words:
        print("Keine passenden Wörter gefunden.")
        sys.exit(1)

    print(f"{len(words)} eindeutige Wörter gefunden.\n")

    # SQL erzeugen
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    sql = generate_sql(words, lang, ts)

    # Ausgabe-Dateiname
    slug = re.sub(r"[^a-z0-9]+", "_", url.split("/")[-1].lower())[:40]
    out_file = f"sql/words_{lang}_{slug}.sql"

    with open(out_file, "w", encoding="utf-8") as f:
        f.write(sql)

    print(f"SQL gespeichert in: {out_file}")
    print(f"Statements:         {len(words)}")
    print("\nVorschau (erste 10):")
    for line in sql.splitlines()[:10]:
        print(" ", line)


if __name__ == "__main__":
    main()