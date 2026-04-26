// Post-build SEO helper for static deployment output.
// Adds localized entry pages, robots, sitemap, canonical, hreflang metadata, and JSON-LD.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const indexPath = path.join(distDir, "index.html");
const appName = "RawType";
const defaultSiteUrl = "https://rawtype.net";
const socialImagePath = "/web-app-manifest-512x512.png";
const socialImageAlt = "RawType logo";
const socialImageWidth = 512;
const socialImageHeight = 512;
const availableLanguages = ["en", "de"];

async function readEnvValue(fileName, key) {
  try {
    const content = await readFile(path.join(projectRoot, fileName), "utf8");
    const line = content
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${key}=`));

    return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "") : null;
  } catch {
    return null;
  }
}

const rawSiteUrl =
  process.env.VITE_SITE_URL ??
  process.env.SITE_URL ??
  (await readEnvValue(".env.production", "VITE_SITE_URL")) ??
  (await readEnvValue(".env", "VITE_SITE_URL")) ??
  defaultSiteUrl;

function normalizeSiteUrl(value) {
  try {
    const url = new URL(value);
    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Invalid VITE_SITE_URL/SITE_URL value: ${value}`);
  }
}

const siteUrl = normalizeSiteUrl(rawSiteUrl);
const now = new Date().toISOString().slice(0, 10);
const robotsLines = [
  "User-agent: *",
  "Allow: /",
  "Disallow: /account",
  "Disallow: /profile",
  "Disallow: /settings",
  "Disallow: /stats"
];

const sharedFeatureList = [
  "Typing test",
  "Typing practice",
  "WPM tracking",
  "CPM tracking",
  "Accuracy tracking",
  "Word drills",
  "Prose typing",
  "No Mistake Mode",
  "English typing practice",
  "German typing practice"
];

const commonEnglishFaq = [
  {
    question: "Is RawType free?",
    answer: "Yes. RawType is free to play and built for fast, repeatable typing practice."
  },
  {
    question: "What does RawType measure?",
    answer:
      "RawType measures typing speed, characters per minute, accuracy, mistakes, progress, duration, and completed words."
  },
  {
    question: "Can I track my progress?",
    answer:
      "Signed-in players can save typing runs, review stats, build daily streaks, and identify recurring mistake words."
  }
];

const commonGermanFaq = [
  {
    question: "Ist RawType kostenlos?",
    answer: "Ja. RawType ist kostenlos und fuer schnelle, wiederholbare Tippuebungen gebaut."
  },
  {
    question: "Was misst RawType?",
    answer:
      "RawType misst Tippgeschwindigkeit, Zeichen pro Minute, Genauigkeit, Fehler, Fortschritt, Dauer und abgeschlossene Woerter."
  },
  {
    question: "Kann ich meinen Fortschritt verfolgen?",
    answer:
      "Eingeloggte Spieler koennen Runs speichern, Statistiken ansehen, taegliche Serien aufbauen und wiederkehrende Fehlerwoerter erkennen."
  }
];

const pages = [
  {
    path: "/",
    alternateGroup: "home",
    lang: "en",
    locale: "en_US",
    title: "RawType - Free Typing Test and Practice Game",
    description:
      "RawType is a free typing test and practice game for improving WPM, accuracy, and consistency with prose and word drills.",
    socialDescription:
      "Practice typing with prose and word drills, track WPM and accuracy, and keep improving.",
    noscriptTitle: "RawType Typing Practice",
    noscriptDescription:
      "RawType is a free single-player typing test and practice game with prose and word drills for speed, accuracy, and consistency.",
    breadcrumbName: "Typing Practice",
    keywords: ["typing test", "typing practice", "typing game", "WPM test", "accuracy practice"],
    sitemapPriority: "1.0",
    faq: commonEnglishFaq,
    noscriptContent: `<section data-seo-noscript>
          <h2>Free typing practice for speed and accuracy</h2>
          <p>
            RawType helps you practice real typing skill with focused runs, clear feedback, and
            practical measurements such as WPM, CPM, accuracy, progress, mistakes, and completed
            words. It is designed for quick daily sessions as well as longer keyboard training.
          </p>
          <h2>Typing Classic</h2>
          <p>
            Typing Classic uses prose-like text so you can train rhythm, punctuation,
            capitalization, and sentence flow instead of only repeating isolated letters.
          </p>
          <h2>Word Mode</h2>
          <p>
            Word Mode creates short typing drills from random words. You can choose word count,
            difficulty, and no-mistake practice to focus on cleaner keystrokes.
          </p>
          <h2>English and German typing practice</h2>
          <p>
            RawType supports English and German practice. The main page is English, and the German
            entry page is available at /de/ for German typing training.
          </p>
          <h2>Typing Practice FAQ</h2>
          <h3>Is RawType free?</h3>
          <p>Yes. RawType is free to play and built for fast, repeatable typing practice.</p>
          <h3>What does RawType measure?</h3>
          <p>
            RawType measures typing speed, characters per minute, accuracy, mistakes, progress,
            duration, and completed words during a run.
          </p>
          <h3>Can I track my progress?</h3>
          <p>
            Signed-in players can save typing runs, review stats, build daily streaks, and identify
            recurring mistake words.
          </p>
        </section>`
  },
  {
    path: "/typing-test/",
    alternateGroup: "typing-test",
    lang: "en",
    locale: "en_US",
    title: "Free Typing Test - Check WPM and Accuracy | RawType",
    description:
      "Take a free typing test in RawType to check WPM, CPM, accuracy, mistakes, and typing consistency with prose or word drills.",
    socialDescription:
      "Check your WPM and accuracy with a fast free typing test built around prose and word drills.",
    noscriptTitle: "Free Typing Test",
    noscriptDescription:
      "RawType gives you a fast typing test for measuring WPM, CPM, accuracy, mistakes, and consistency.",
    breadcrumbName: "Typing Test",
    keywords: ["free typing test", "WPM test", "typing speed test", "typing accuracy test"],
    sitemapPriority: "0.95",
    faq: commonEnglishFaq,
    noscriptContent: `<section data-seo-noscript>
          <h2>Measure WPM, CPM, and accuracy</h2>
          <p>
            Use RawType as a free typing test to measure practical typing speed, characters per
            minute, accuracy, errors, and completed words in focused practice runs.
          </p>
          <h2>Practice with prose or word drills</h2>
          <p>
            Choose Typing Classic for sentence rhythm and punctuation, or Word Mode for quick
            random-word drills with selectable length and difficulty.
          </p>
          <h2>Improve consistency</h2>
          <p>
            Signed-in players can save runs, review progress, build streaks, and find recurring
            mistake words after practice.
          </p>
        </section>`
  },
  {
    path: "/typing-practice/",
    alternateGroup: "typing-practice",
    lang: "en",
    locale: "en_US",
    title: "Typing Practice for Speed and Accuracy | RawType",
    description:
      "Practice typing online with RawType using prose, random word drills, WPM tracking, accuracy feedback, and repeatable keyboard training.",
    socialDescription:
      "Build typing speed and accuracy with focused online practice, prose runs, word drills, and clear feedback.",
    noscriptTitle: "Typing Practice",
    noscriptDescription:
      "RawType provides focused online typing practice for speed, accuracy, rhythm, and consistency.",
    breadcrumbName: "Typing Practice",
    keywords: ["typing practice", "online typing practice", "keyboard practice", "typing trainer"],
    sitemapPriority: "0.9",
    faq: commonEnglishFaq,
    noscriptContent: `<section data-seo-noscript>
          <h2>Online typing practice</h2>
          <p>
            RawType gives you quick practice sessions for building keyboard rhythm, reducing typing
            mistakes, and improving consistency over time.
          </p>
          <h2>Practice sessions that stay focused</h2>
          <p>
            Start a prose run for natural sentence flow or switch to Word Mode for short drills.
            Results include WPM, CPM, accuracy, progress, errors, and completed words.
          </p>
          <h2>Daily typing improvement</h2>
          <p>
            Account stats can save runs, show recent performance, and reveal recurring mistake words
            so every session has a clear next target.
          </p>
        </section>`
  },
  {
    path: "/wpm-test/",
    alternateGroup: "wpm-test",
    lang: "en",
    locale: "en_US",
    title: "WPM Test - Measure Typing Speed Online | RawType",
    description:
      "Run a free WPM test in RawType to measure typing speed, CPM, accuracy, errors, and completed words in focused typing sessions.",
    socialDescription:
      "Measure WPM, CPM, accuracy, and errors with a free browser-based typing speed test.",
    noscriptTitle: "WPM Test",
    noscriptDescription:
      "RawType measures typing speed with WPM, CPM, accuracy, mistakes, and completed words.",
    breadcrumbName: "WPM Test",
    keywords: ["WPM test", "typing speed test", "words per minute", "CPM typing test"],
    sitemapPriority: "0.9",
    faq: commonEnglishFaq,
    noscriptContent: `<section data-seo-noscript>
          <h2>Measure words per minute</h2>
          <p>
            RawType calculates WPM during each typing run and pairs it with CPM, accuracy, progress,
            mistakes, and completed words for a fuller view of typing speed.
          </p>
          <h2>Speed with accuracy</h2>
          <p>
            The test is designed to reward clean, consistent typing instead of only short bursts of
            speed. Word drills and prose practice help train different keyboard habits.
          </p>
          <h2>Track typing progress</h2>
          <p>
            Signed-in players can save WPM results, compare recent runs, and build a daily practice
            streak.
          </p>
        </section>`
  },
  {
    path: "/word-mode/",
    alternateGroup: "word-mode",
    lang: "en",
    locale: "en_US",
    title: "Word Mode Typing Drills | RawType",
    description:
      "Use RawType Word Mode for random word typing drills with selectable word count, difficulty, no-mistake practice, WPM, and accuracy feedback.",
    socialDescription:
      "Practice random word drills with selectable length, difficulty, no-mistake mode, WPM, and accuracy feedback.",
    noscriptTitle: "Word Mode Typing Drills",
    noscriptDescription:
      "Word Mode creates random word typing drills for quick, repeatable keyboard practice.",
    breadcrumbName: "Word Mode",
    keywords: ["word typing test", "random word typing", "word drills", "typing drills"],
    sitemapPriority: "0.85",
    faq: commonEnglishFaq,
    noscriptContent: `<section data-seo-noscript>
          <h2>Random word typing drills</h2>
          <p>
            Word Mode creates short typing sessions from random words so you can practice clean
            keystrokes without waiting for a long passage.
          </p>
          <h2>Choose length and difficulty</h2>
          <p>
            Select 10, 25, 50, or 75 words, choose a difficulty, and use No Mistake Mode when you
            want a stricter accuracy challenge.
          </p>
          <h2>Measure each drill</h2>
          <p>
            RawType reports WPM, CPM, accuracy, errors, progress, duration, and completed words
            after practice.
          </p>
        </section>`
  },
  {
    path: "/no-mistake-mode/",
    alternateGroup: "no-mistake-mode",
    lang: "en",
    locale: "en_US",
    title: "No Mistake Mode Typing Practice | RawType",
    description:
      "Train cleaner keystrokes with RawType No Mistake Mode, a strict typing practice option that ends a word drill after the first mistake.",
    socialDescription:
      "Use No Mistake Mode to practice cleaner keystrokes and stricter typing accuracy.",
    noscriptTitle: "No Mistake Mode",
    noscriptDescription:
      "No Mistake Mode helps you focus on accuracy by ending a word drill after the first mistake.",
    breadcrumbName: "No Mistake Mode",
    keywords: ["no mistake typing", "typing accuracy practice", "mistake-free typing", "typing drill"],
    sitemapPriority: "0.8",
    faq: commonEnglishFaq,
    noscriptContent: `<section data-seo-noscript>
          <h2>Strict accuracy practice</h2>
          <p>
            No Mistake Mode turns a word drill into a focused accuracy challenge by ending the run
            after the first mistake.
          </p>
          <h2>Build cleaner typing habits</h2>
          <p>
            Short, repeatable drills make it easier to slow down, notice recurring errors, and
            improve key control before chasing higher WPM.
          </p>
          <h2>Use it with Word Mode</h2>
          <p>
            Combine No Mistake Mode with selectable word count and difficulty for tighter typing
            practice sessions.
          </p>
        </section>`
  },
  {
    path: "/de/",
    alternateGroup: "home",
    lang: "de",
    locale: "de_DE",
    title: "RawType - Kostenloser Tipptrainer",
    description:
      "RawType ist ein kostenloser Tipptrainer zum Verbessern von Tippgeschwindigkeit, Genauigkeit und Konstanz.",
    socialDescription:
      "Trainiere Tippen mit Prosa und Wortuebungen, verfolge Geschwindigkeit und Genauigkeit und verbessere dich Schritt fuer Schritt.",
    noscriptTitle: "RawType Tipptraining",
    noscriptDescription:
      "RawType ist ein kostenloses Einzelspieler-Tippspiel mit Prosa- und Wortuebungen fuer Geschwindigkeit, Genauigkeit und Konstanz.",
    breadcrumbName: "Tipptraining",
    keywords: ["Tipptrainer", "Tipptraining", "Tippen ueben", "Tippgeschwindigkeit verbessern"],
    sitemapPriority: "0.95",
    faq: commonGermanFaq,
    noscriptContent: `<section data-seo-noscript>
          <h2>Kostenloses Tipptraining fuer Geschwindigkeit und Genauigkeit</h2>
          <p>
            RawType hilft dir, echtes Tippen mit fokussierten Runs, klarer Rueckmeldung und
            praktischen Messwerten wie WPM, CPM, Genauigkeit, Fortschritt, Fehlern und
            abgeschlossenen Woertern zu trainieren.
          </p>
          <h2>Typing Classic</h2>
          <p>
            Typing Classic nutzt zusammenhaengende Texte, damit du Rhythmus, Satzzeichen,
            Grossschreibung und echten Schreibfluss trainierst statt nur einzelne Buchstaben zu
            wiederholen.
          </p>
          <h2>Wortmodus</h2>
          <p>
            Der Wortmodus erstellt kurze Tippuebungen aus zufaelligen Woertern. Du kannst Wortanzahl,
            Schwierigkeit und No-Mistake-Training waehlen, um sauberere Anschlaege zu ueben.
          </p>
          <h2>Englisches und deutsches Tipptraining</h2>
          <p>
            RawType unterstuetzt Englisch und Deutsch. Die Hauptseite ist Englisch, die deutsche
            Einstiegsseite liegt unter /de/.
          </p>
          <h2>FAQ zum Tipptraining</h2>
          <h3>Ist RawType kostenlos?</h3>
          <p>Ja. RawType ist kostenlos und fuer schnelle, wiederholbare Tippuebungen gebaut.</p>
          <h3>Was misst RawType?</h3>
          <p>
            RawType misst Tippgeschwindigkeit, Zeichen pro Minute, Genauigkeit, Fehler,
            Fortschritt, Dauer und abgeschlossene Woerter waehrend eines Runs.
          </p>
          <h3>Kann ich meinen Fortschritt verfolgen?</h3>
          <p>
            Eingeloggte Spieler koennen Runs speichern, Statistiken ansehen, taegliche Serien
            aufbauen und wiederkehrende Fehlerwoerter erkennen.
          </p>
        </section>`
  },
  {
    path: "/de/tipptraining/",
    alternateGroup: "typing-test",
    lang: "de",
    locale: "de_DE",
    title: "Kostenloses Tipptraining - Tippgeschwindigkeit verbessern | RawType",
    description:
      "Trainiere kostenlos Tippen mit RawType: Tippgeschwindigkeit, WPM, Genauigkeit, Fehler und Konstanz mit deutschen oder englischen Texten verbessern.",
    socialDescription:
      "Verbessere Tippgeschwindigkeit und Genauigkeit mit kostenlosen Tippuebungen in RawType.",
    noscriptTitle: "Kostenloses Tipptraining",
    noscriptDescription:
      "RawType hilft dir, Tippgeschwindigkeit, Genauigkeit und Konstanz mit fokussierten Tippuebungen zu verbessern.",
    breadcrumbName: "Tipptraining",
    keywords: ["kostenloses Tipptraining", "Tippgeschwindigkeit verbessern", "WPM Test", "Tippen trainieren"],
    sitemapPriority: "0.9",
    faq: commonGermanFaq,
    noscriptContent: `<section data-seo-noscript>
          <h2>Tippgeschwindigkeit verbessern</h2>
          <p>
            RawType misst WPM, CPM, Genauigkeit, Fehler und Fortschritt, damit du deine
            Tippgeschwindigkeit gezielt trainieren kannst.
          </p>
          <h2>Deutsche und englische Tippuebungen</h2>
          <p>
            Trainiere mit Prosa im Typing-Classic-Modus oder mit zufaelligen Woertern im
            Wortmodus. Beide Modi eignen sich fuer kurze taegliche Sessions.
          </p>
          <h2>Fortschritt speichern</h2>
          <p>
            Mit Konto kannst du Runs speichern, Statistiken ansehen, Serien aufbauen und
            wiederkehrende Fehlerwoerter erkennen.
          </p>
        </section>`
  },
  {
    path: "/de/tipptrainer/",
    alternateGroup: "typing-practice",
    lang: "de",
    locale: "de_DE",
    title: "Tipptrainer Online fuer Geschwindigkeit und Genauigkeit | RawType",
    description:
      "Nutze RawType als kostenlosen Online-Tipptrainer mit Prosa, Wortuebungen, WPM-Messung, Genauigkeit und wiederholbarem Training.",
    socialDescription:
      "Online-Tipptrainer fuer Geschwindigkeit, Genauigkeit, Prosa-Runs und kurze Wortuebungen.",
    noscriptTitle: "Online-Tipptrainer",
    noscriptDescription:
      "RawType ist ein Online-Tipptrainer fuer Geschwindigkeit, Genauigkeit, Rhythmus und Konstanz.",
    breadcrumbName: "Tipptrainer",
    keywords: ["Online Tipptrainer", "Tipptrainer kostenlos", "Tippen ueben", "Tipptraining"],
    sitemapPriority: "0.9",
    faq: commonGermanFaq,
    noscriptContent: `<section data-seo-noscript>
          <h2>Online-Tipptrainer</h2>
          <p>
            RawType bietet kurze Tipp-Sessions, um Tastaturrhythmus aufzubauen, Tippfehler zu
            reduzieren und Konstanz im Schreiben zu verbessern.
          </p>
          <h2>Fokussierte Uebungen</h2>
          <p>
            Starte Prosa fuer natuerlichen Schreibfluss oder nutze den Wortmodus fuer schnelle
            Wortuebungen. Ergebnisse zeigen WPM, CPM, Genauigkeit, Fortschritt und Fehler.
          </p>
          <h2>Fortschritt erkennen</h2>
          <p>
            Mit Konto kannst du Runs speichern, aktuelle Leistung vergleichen und wiederkehrende
            Fehlerwoerter finden.
          </p>
        </section>`
  },
  {
    path: "/de/tippgeschwindigkeit-test/",
    alternateGroup: "wpm-test",
    lang: "de",
    locale: "de_DE",
    title: "Tippgeschwindigkeit Test - WPM online messen | RawType",
    description:
      "Messe deine Tippgeschwindigkeit mit RawType: kostenloser WPM-Test mit CPM, Genauigkeit, Fehlern und abgeschlossenen Woertern.",
    socialDescription:
      "Messe WPM, CPM, Genauigkeit und Fehler mit einem kostenlosen Tippgeschwindigkeit-Test im Browser.",
    noscriptTitle: "Tippgeschwindigkeit Test",
    noscriptDescription:
      "RawType misst Tippgeschwindigkeit mit WPM, CPM, Genauigkeit, Fehlern und abgeschlossenen Woertern.",
    breadcrumbName: "Tippgeschwindigkeit Test",
    keywords: ["Tippgeschwindigkeit Test", "WPM messen", "Tippen Geschwindigkeit", "Anschlaege pro Minute"],
    sitemapPriority: "0.9",
    faq: commonGermanFaq,
    noscriptContent: `<section data-seo-noscript>
          <h2>Woerter pro Minute messen</h2>
          <p>
            RawType berechnet WPM waehrend jedes Runs und kombiniert den Wert mit CPM,
            Genauigkeit, Fortschritt, Fehlern und abgeschlossenen Woertern.
          </p>
          <h2>Geschwindigkeit mit Genauigkeit</h2>
          <p>
            Der Test belohnt sauberes und konstantes Tippen, nicht nur kurze Geschwindigkeitsspitzen.
            Wortuebungen und Prosa trainieren unterschiedliche Schreibgewohnheiten.
          </p>
          <h2>Fortschritt verfolgen</h2>
          <p>
            Eingeloggte Spieler koennen WPM-Ergebnisse speichern, letzte Runs vergleichen und eine
            taegliche Serie aufbauen.
          </p>
        </section>`
  },
  {
    path: "/de/wortmodus/",
    alternateGroup: "word-mode",
    lang: "de",
    locale: "de_DE",
    title: "Wortmodus fuer Tippuebungen | RawType",
    description:
      "Trainiere im RawType Wortmodus mit zufaelligen Woertern, waehle Wortanzahl, Schwierigkeit, No-Mistake-Modus, WPM und Genauigkeit.",
    socialDescription:
      "Kurze Wortuebungen mit Wortanzahl, Schwierigkeit, No-Mistake-Modus, WPM und Genauigkeit.",
    noscriptTitle: "Wortmodus Tippuebungen",
    noscriptDescription:
      "Der Wortmodus erstellt zufaellige Wortuebungen fuer schnelles, wiederholbares Tipptraining.",
    breadcrumbName: "Wortmodus",
    keywords: ["Wortmodus", "Wortuebungen", "zufaellige Woerter tippen", "Tippuebungen"],
    sitemapPriority: "0.85",
    faq: commonGermanFaq,
    noscriptContent: `<section data-seo-noscript>
          <h2>Zufaellige Wortuebungen</h2>
          <p>
            Der Wortmodus erstellt kurze Tipp-Sessions aus zufaelligen Woertern, damit du saubere
            Anschlaege ohne lange Textpassage trainieren kannst.
          </p>
          <h2>Laenge und Schwierigkeit waehlen</h2>
          <p>
            Waehle 10, 25, 50 oder 75 Woerter, stelle die Schwierigkeit ein und aktiviere
            No-Mistake-Training fuer strengere Genauigkeit.
          </p>
          <h2>Jede Uebung messen</h2>
          <p>
            RawType zeigt WPM, CPM, Genauigkeit, Fehler, Fortschritt, Dauer und abgeschlossene
            Woerter nach dem Training.
          </p>
        </section>`
  },
  {
    path: "/de/no-mistake-modus/",
    alternateGroup: "no-mistake-mode",
    lang: "de",
    locale: "de_DE",
    title: "No-Mistake-Modus fuer genaueres Tippen | RawType",
    description:
      "Trainiere Genauigkeit mit dem RawType No-Mistake-Modus: eine strenge Tippuebung, die nach dem ersten Fehler endet.",
    socialDescription:
      "Nutze den No-Mistake-Modus fuer sauberere Anschlaege und strengeres Genauigkeitstraining.",
    noscriptTitle: "No-Mistake-Modus",
    noscriptDescription:
      "Der No-Mistake-Modus hilft dir, Genauigkeit zu trainieren, indem eine Wortuebung nach dem ersten Fehler endet.",
    breadcrumbName: "No-Mistake-Modus",
    keywords: ["No-Mistake-Modus", "fehlerfrei tippen", "Tippgenauigkeit", "Genauigkeit trainieren"],
    sitemapPriority: "0.8",
    faq: commonGermanFaq,
    noscriptContent: `<section data-seo-noscript>
          <h2>Strenges Genauigkeitstraining</h2>
          <p>
            Der No-Mistake-Modus macht aus einer Wortuebung eine fokussierte Genauigkeits-Challenge,
            weil der Run nach dem ersten Fehler endet.
          </p>
          <h2>Saubere Tippgewohnheiten aufbauen</h2>
          <p>
            Kurze, wiederholbare Uebungen helfen dir, langsamer zu werden, Fehler zu erkennen und
            bessere Tasten-Kontrolle aufzubauen.
          </p>
          <h2>Mit dem Wortmodus kombinieren</h2>
          <p>
            Nutze No-Mistake-Training zusammen mit Wortanzahl und Schwierigkeit fuer gezielte
            Tipp-Sessions.
          </p>
        </section>`
  }
];

function absoluteUrl(pagePath) {
  return `${siteUrl}${pagePath}`;
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function replaceMetaContent(html, attributeName, attributeValue, content) {
  const pattern = new RegExp(
    `(<meta\\s+${attributeName}="${escapeRegExp(attributeValue)}"\\s+content=")[^"]*("\\s*\\/>)`
  );
  return html.replace(pattern, `$1${escapeHtmlAttribute(content)}$2`);
}

function getLocalizedAlternates(page) {
  return pages.filter((alternatePage) => alternatePage.alternateGroup === page.alternateGroup);
}

function getDefaultAlternate(page) {
  return getLocalizedAlternates(page).find((alternatePage) => alternatePage.lang === "en") ?? page;
}

function buildOrganizationSchema() {
  return {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: appName,
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      "@id": `${siteUrl}/#logo`,
      url: absoluteUrl(socialImagePath),
      width: socialImageWidth,
      height: socialImageHeight,
      caption: socialImageAlt
    }
  };
}

function buildWebsiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: appName,
    url: absoluteUrl("/"),
    inLanguage: availableLanguages,
    publisher: {
      "@id": `${siteUrl}/#organization`
    }
  };
}

function buildAppSchema() {
  return {
    "@type": "WebApplication",
    "@id": `${siteUrl}/#app`,
    name: appName,
    alternateName: "RawType typing test",
    url: absoluteUrl("/"),
    applicationCategory: "GameApplication",
    applicationSubCategory: "Typing trainer",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript and a modern web browser.",
    isAccessibleForFree: true,
    inLanguage: availableLanguages,
    description:
      "RawType is a free typing test and practice game for improving WPM, accuracy, and consistency with prose and word drills.",
    image: absoluteUrl(socialImagePath),
    featureList: sharedFeatureList,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    publisher: {
      "@id": `${siteUrl}/#organization`
    }
  };
}

function buildWebPageSchema(page) {
  return {
    "@type": "WebPage",
    "@id": `${absoluteUrl(page.path)}#webpage`,
    url: absoluteUrl(page.path),
    name: page.title,
    description: page.description,
    inLanguage: page.lang,
    isPartOf: {
      "@id": `${siteUrl}/#website`
    },
    about: {
      "@id": `${siteUrl}/#app`
    },
    primaryImageOfPage: {
      "@id": `${absoluteUrl(page.path)}#primaryimage`
    },
    breadcrumb: {
      "@id": `${absoluteUrl(page.path)}#breadcrumb`
    },
    keywords: page.keywords.join(", "),
    dateModified: now
  };
}

function buildPrimaryImageSchema(page) {
  return {
    "@type": "ImageObject",
    "@id": `${absoluteUrl(page.path)}#primaryimage`,
    url: absoluteUrl(socialImagePath),
    width: socialImageWidth,
    height: socialImageHeight,
    caption: socialImageAlt
  };
}

function buildBreadcrumbSchema(page) {
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: page.lang === "de" ? "RawType Startseite" : "RawType Home",
      item: page.lang === "de" ? absoluteUrl("/de/") : absoluteUrl("/")
    }
  ];

  if (page.path !== "/" && page.path !== "/de/") {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: page.breadcrumbName,
      item: absoluteUrl(page.path)
    });
  }

  return {
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(page.path)}#breadcrumb`,
    itemListElement: items
  };
}

function buildFaqSchema(page) {
  return {
    "@type": "FAQPage",
    "@id": `${absoluteUrl(page.path)}#faq`,
    mainEntity: page.faq.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer
      }
    }))
  };
}

function buildJsonLdGraph(page) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationSchema(),
      buildWebsiteSchema(),
      buildAppSchema(),
      buildWebPageSchema(page),
      buildPrimaryImageSchema(page),
      buildBreadcrumbSchema(page),
      buildFaqSchema(page)
    ]
  };
}

function stripGeneratedSeo(html) {
  return html
    .replace(/\n\s*<link rel="canonical" href="[^"]*" \/>/g, "")
    .replace(/\n\s*<link rel="alternate" hreflang="[^"]+" href="[^"]*" \/>/g, "")
    .replace(/\n\s*<meta property="og:url" content="[^"]*" \/>/g, "")
    .replace(/\n\s*<meta property="og:locale" content="[^"]*" \/>/g, "")
    .replace(/\n\s*<meta property="og:locale:alternate" content="[^"]*" \/>/g, "")
    .replace(/\n\s*<meta property="og:image[^"]*" content="[^"]*" \/>/g, "")
    .replace(/\n\s*<meta name="twitter:url" content="[^"]*" \/>/g, "")
    .replace(/\n\s*<meta name="twitter:image[^"]*" content="[^"]*" \/>/g, "")
    .replace(/\n\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
}

function applyLocalizedSeo(html, page) {
  let output = stripGeneratedSeo(html)
    .replace(/<html lang="[^"]+">/, `<html lang="${page.lang}">`)
    .replace(/<title>.*<\/title>/, `<title>${page.title}</title>`)
    .replace(
      /<h1>RawType Typing Practice<\/h1>\s*<p>[\s\S]*?<\/p>/,
      `<h1>${page.noscriptTitle}</h1>
        <p>
          ${page.noscriptDescription}
        </p>`
    )
    .replace(/<section data-seo-noscript>[\s\S]*?<\/section>/, page.noscriptContent);

  output = replaceMetaContent(output, "name", "description", page.description);
  output = replaceMetaContent(output, "name", "robots", "index, follow, max-image-preview:large, max-snippet:-1");
  output = replaceMetaContent(output, "name", "googlebot", "index, follow, max-image-preview:large, max-snippet:-1");
  output = replaceMetaContent(output, "property", "og:title", page.title);
  output = replaceMetaContent(output, "property", "og:description", page.socialDescription);
  output = replaceMetaContent(output, "name", "twitter:title", page.title);
  output = replaceMetaContent(output, "name", "twitter:description", page.socialDescription);

  output = output.replace(
    "    <title>",
    `    <script type="application/ld+json">${JSON.stringify(buildJsonLdGraph(page))}</script>
    <title>`
  );

  const localizedAlternates = getLocalizedAlternates(page);
  const alternateLinks = localizedAlternates.map(
    (alternatePage) =>
      `    <link rel="alternate" hreflang="${alternatePage.lang}" href="${absoluteUrl(alternatePage.path)}" />`
  );
  const alternateLocales = localizedAlternates
    .filter((alternatePage) => alternatePage.locale !== page.locale)
    .map((alternatePage) => `    <meta property="og:locale:alternate" content="${alternatePage.locale}" />`);

  output = output.replace(
    "    <meta property=\"og:type\" content=\"website\" />",
    [
      `    <link rel="canonical" href="${absoluteUrl(page.path)}" />`,
      ...alternateLinks,
      `    <link rel="alternate" hreflang="x-default" href="${absoluteUrl(getDefaultAlternate(page).path)}" />`,
      "    <meta property=\"og:type\" content=\"website\" />",
      `    <meta property="og:url" content="${absoluteUrl(page.path)}" />`,
      `    <meta property="og:locale" content="${page.locale}" />`,
      ...alternateLocales,
      `    <meta property="og:image" content="${absoluteUrl(socialImagePath)}" />`,
      `    <meta property="og:image:secure_url" content="${absoluteUrl(socialImagePath)}" />`,
      `    <meta property="og:image:type" content="image/png" />`,
      `    <meta property="og:image:width" content="${socialImageWidth}" />`,
      `    <meta property="og:image:height" content="${socialImageHeight}" />`,
      `    <meta property="og:image:alt" content="${socialImageAlt}" />`,
      `    <meta name="twitter:url" content="${absoluteUrl(page.path)}" />`,
      `    <meta name="twitter:image" content="${absoluteUrl(socialImagePath)}" />`,
      `    <meta name="twitter:image:alt" content="${socialImageAlt}" />`
    ].join("\n")
  );

  return output;
}

function buildSitemapEntry(page) {
  const localizedAlternates = getLocalizedAlternates(page);
  const alternateXml = [
    ...localizedAlternates.map(
      (alternatePage) =>
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(alternatePage.lang)}" href="${escapeXml(
          absoluteUrl(alternatePage.path)
        )}" />`
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(
      absoluteUrl(getDefaultAlternate(page).path)
    )}" />`
  ].join("\n");

  return `  <url>
    <loc>${escapeXml(absoluteUrl(page.path))}</loc>
${alternateXml}
    <image:image>
      <image:loc>${escapeXml(absoluteUrl(socialImagePath))}</image:loc>
      <image:title>${escapeXml(appName)}</image:title>
      <image:caption>${escapeXml(socialImageAlt)}</image:caption>
    </image:image>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.sitemapPriority}</priority>
  </url>`;
}

const sitemapUrls = pages.map(buildSitemapEntry).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${sitemapUrls}
</urlset>
`;

await mkdir(distDir, { recursive: true });
await writeFile(path.join(distDir, "sitemap.xml"), sitemap, "utf8");
robotsLines.push(`Sitemap: ${siteUrl}/sitemap.xml`);

const indexHtml = await readFile(indexPath, "utf8");

for (const page of pages) {
  const localizedHtml = applyLocalizedSeo(indexHtml, page);
  const outputPath =
    page.path === "/" ? indexPath : path.join(distDir, page.path.replace(/^\/|\/$/g, ""), "index.html");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, localizedHtml, "utf8");
}

await writeFile(path.join(distDir, "robots.txt"), `${robotsLines.join("\n")}\n`, "utf8");
