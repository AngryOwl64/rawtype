#!/usr/bin/env python3

import sys
import os

def main():
    # Dateiname abfragen
    filename = input("Dateiname (z.B. words.txt): ").strip()

    if not os.path.isfile(filename):
        print(f"Fehler: Datei '{filename}' nicht gefunden.")
        sys.exit(1)

    # Sprache abfragen
    language = input("Sprache (z.B. de, en, fr): ").strip()

    if not language:
        print("Fehler: Sprache darf nicht leer sein.")
        sys.exit(1)

    # Wörter einlesen
    with open(filename, "r", encoding="utf-8") as f:
        words = [line.strip() for line in f if line.strip()]

    if not words:
        print("Keine Wörter in der Datei gefunden.")
        sys.exit(1)

    # Output-Dateiname ableiten
    base = os.path.splitext(filename)[0]
    output_file = f"sql/{language}_insert.sql"

    # SQL generieren
    with open(output_file, "w", encoding="utf-8") as f:
        for word in words:
            # Single quotes escapen
            escaped = word.replace("'", "''")
            line = f"INSERT INTO words (word, language, created_at) VALUES ('{escaped}', '{language}', NOW()) ON CONFLICT DO NOTHING;\n"
            f.write(line)

    print(f"\n{len(words)} INSERT-Statements geschrieben nach: {output_file}")

if __name__ == "__main__":
    main()