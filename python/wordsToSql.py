import argparse
from pathlib import Path

def sql_escape(value: str) -> str:
    # einfache, korrekte Escape-Regel für SQL-Strings
    return value.replace("'", "''")

def load_words(file_path: Path):
    words = []
    with file_path.open("r", encoding="utf-8") as f:
        for line in f:
            w = line.strip()
            if w:
                words.append(w)
    return words

def deduplicate(words):
    seen = set()
    result = []
    for w in words:
        if w not in seen:
            seen.add(w)
            result.append(w)
    return result

def chunked(iterable, size):
    for i in range(0, len(iterable), size):
        yield iterable[i:i+size]

def generate_sql(words, table, language, difficulty, batch_size):
    statements = []
    for chunk in chunked(words, batch_size):
        values = []
        for w in chunk:
            w_esc = sql_escape(w)
            values.append(f"('{w_esc}','{language}','{difficulty}')")
        stmt = f"insert into {table} (word, language, difficulty)\nvalues\n  " + ",\n  ".join(values) + ";"
        statements.append(stmt)
    return "\n\n".join(statements)

def main():
    parser = argparse.ArgumentParser(description="Generate SQL INSERTs from a word list (one word per line).")
    parser.add_argument("input", type=Path, help="Pfad zur .txt Datei (ein Wort pro Zeile)")
    parser.add_argument("-o", "--output", type=Path, default=Path("inserts.sql"), help="Output SQL Datei")
    parser.add_argument("-t", "--table", default="words", help="Tabellenname (default: words)")
    parser.add_argument("-l", "--language", default="en", help="Language (default: en)")
    parser.add_argument("-d", "--difficulty", default="easy", help="Difficulty (default: easy)")
    parser.add_argument("-b", "--batch-size", type=int, default=500, help="Zeilen pro INSERT (default: 500)")
    parser.add_argument("--no-dedupe", action="store_true", help="Keine Deduplizierung")
    args = parser.parse_args()

    words = load_words(args.input)
    if not args.no_dedupe:
        words = deduplicate(words)

    sql = generate_sql(
        words=words,
        table=args.table,
        language=args.language,
        difficulty=args.difficulty,
        batch_size=args.batch_size
    )

    args.output.write_text(sql, encoding="utf-8")
    print(f"OK: {len(words)} Wörter → {args.output}")

if __name__ == "__main__":
    main()