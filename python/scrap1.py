from playwright.sync_api import sync_playwright
import time
import re

OUTPUT_FILE = "words.txt"

def clean_word(word: str) -> str:
    # Klammern entfernen: (sich), (ein), etc.
    word = re.sub(r"\(.*?\)", "", word)

    # Artikel entfernen: ", der", ", die", ", das"
    word = re.sub(r",\s*(der|die|das)$", "", word)

    # Zahlen am Ende entfernen: " -100"
    word = re.sub(r"\s*-\d+$", "", word)

    # Mehrere Varianten → erste nehmen
    word = word.split(",")[0]

    return word.strip()

def main():
    words = set()

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)
            page = browser.new_page()
            page.goto("https://vocabeo.com/browse")

            page.wait_for_timeout(3000)
            print("→ Manuell scrollen. STRG+C zum Beenden.\n")

            while True:
                new_words = page.evaluate("""
                () => Array.from(
                    document.querySelectorAll('[data-testid="virtual-list-row"] .cell.word')
                ).map(el => el.innerText.trim())
                """)

                for w in new_words:
                    cleaned = clean_word(w)
                    if cleaned:
                        words.add(cleaned)

                print(f"Aktuell gesammelt: {len(words)}", end="\r")
                time.sleep(0.3)

    except KeyboardInterrupt:
        print("\nBeendet durch Benutzer.")

    finally:
        # WIRD IMMER AUSGEFÜHRT
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            for w in sorted(words):
                f.write(w + "\n")

        print(f"{len(words)} Wörter gespeichert in '{OUTPUT_FILE}'")


if __name__ == "__main__":
    main()