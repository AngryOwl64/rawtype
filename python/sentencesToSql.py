import requests
import re
import random
import hashlib
from typing import List

# =========================
# CONFIG
# =========================
OUTPUT_FILE = "gutenberg_insert.sql"

TARGET_MIN_WORDS = 40
TARGET_MAX_WORDS = 60
FINAL_COUNT = 50

CATEGORY = "prose"
DIFFICULTY = "medium"
LANGUAGE = "en"

# =========================
# INPUT
# =========================
def ask_input(prompt):
    while True:
        value = input(prompt).strip()
        if value:
            return value
        print("Eingabe darf nicht leer sein.")

# =========================
# FETCH
# =========================
def fetch_text(url: str) -> str:
    r = requests.get(url, timeout=20)
    r.raise_for_status()
    return r.text

# =========================
# CLEANING
# =========================
def strip_gutenberg_header(text: str) -> str:
    start = re.search(r"\*\*\* START OF.*?\*\*\*", text, re.IGNORECASE | re.DOTALL)
    end = re.search(r"\*\*\* END OF.*?\*\*\*", text, re.IGNORECASE | re.DOTALL)

    if start and end:
        return text[start.end():end.start()]
    return text

def normalize_text(text: str) -> str:
    text = text.replace("\r", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{2,}", "\n\n", text)
    return text.strip()

def is_noise_line(line: str) -> bool:
    line = line.strip()

    if not line:
        return True
    if re.match(r"^(chapter|chap|book|part)\b", line, re.IGNORECASE):
        return True
    if line.isupper() and len(line) < 100:
        return True
    if re.match(r"^\d+$", line):
        return True

    return False

def extract_valid_paragraphs(text: str) -> List[str]:
    paragraphs = text.split("\n\n")
    result = []

    for p in paragraphs:
        lines = [l for l in p.split("\n") if not is_noise_line(l)]
        cleaned = " ".join(lines).strip()

        if len(cleaned) > 200:
            result.append(cleaned)

    return result

# =========================
# SENTENCE + CHUNKS
# =========================
def split_into_sentences(text: str) -> List[str]:
    sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z"])', text)
    return [s.strip() for s in sentences if len(s.strip()) > 20]

def build_chunks(sentences: List[str]) -> List[str]:
    chunks = []

    for i in range(len(sentences)):
        current = []
        count = 0

        for j in range(i, len(sentences)):
            words = sentences[j].split()
            current.append(sentences[j])
            count += len(words)

            if TARGET_MIN_WORDS <= count <= TARGET_MAX_WORDS:
                chunk = " ".join(current).strip()
                chunks.append(chunk)
                break

            if count > TARGET_MAX_WORDS:
                break

    return chunks

# =========================
# DEDUP
# =========================
def deduplicate(chunks: List[str]) -> List[str]:
    seen = set()
    unique = []

    for c in chunks:
        normalized = c.lower().strip()
        h = hashlib.sha256(normalized.encode()).hexdigest()

        if h not in seen:
            seen.add(h)
            unique.append(c)

    return unique

# =========================
# SQL
# =========================
def escape_sql(text: str) -> str:
    return text.replace("'", "''")

def build_sql(chunks: List[str], source: str, author: str) -> str:
    values = []

    for c in chunks:
        esc = escape_sql(c)
        src = escape_sql(source)
        auth = escape_sql(author)

        values.append(
            f"(gen_random_uuid(), '{esc}', '{CATEGORY}', '{DIFFICULTY}', '{LANGUAGE}', '{src}', '{auth}', NOW())"
        )

    return (
        "INSERT INTO texts (id, content, category, difficulty, language, source, author, created_at)\nVALUES\n"
        + ",\n".join(values)
        + ";\n"
    )

# =========================
# MAIN
# =========================
def main():
    url = ask_input("Gutenberg URL: ")
    source = ask_input("Buchtitel: ")
    author = ask_input("Autor: ")

    print("Fetching...")
    text = fetch_text(url)

    print("Cleaning...")
    text = strip_gutenberg_header(text)
    text = normalize_text(text)

    print("Extracting paragraphs...")
    paragraphs = extract_valid_paragraphs(text)

    print(f"Paragraphs: {len(paragraphs)}")

    print("Generating chunks...")
    all_chunks = []

    for p in paragraphs:
        sentences = split_into_sentences(p)
        chunks = build_chunks(sentences)
        all_chunks.extend(chunks)

    print(f"Raw chunks: {len(all_chunks)}")

    print("Deduplicating...")
    unique_chunks = deduplicate(all_chunks)

    print(f"Unique chunks: {len(unique_chunks)}")

    if len(unique_chunks) < FINAL_COUNT:
        print("WARN: Weniger als 50 Chunks verfügbar!")
        selected = unique_chunks
    else:
        selected = random.sample(unique_chunks, FINAL_COUNT)

    print(f"Selected: {len(selected)}")

    print("Generating SQL...")
    sql = build_sql(selected, source, author)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(sql)

    print(f"Done → {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
