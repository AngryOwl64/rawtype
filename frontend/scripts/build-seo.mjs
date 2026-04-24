// Post-build SEO helper for static deployment output.
// Adds localized entry pages, robots, sitemap, canonical, hreflang metadata, and JSON-LD.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const indexPath = path.join(distDir, "index.html");
const defaultSiteUrl = "https://rawtype.net";
const socialImagePath = "/web-app-manifest-512x512.png";

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
const robotsLines = ["User-agent: *", "Allow: /"];

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
  }
];

function absoluteUrl(pagePath) {
  return `${siteUrl}${pagePath}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceMetaContent(html, attributeName, attributeValue, content) {
  const pattern = new RegExp(
    `(<meta\\s+${attributeName}="${escapeRegExp(attributeValue)}"\\s+content=")[^"]*("\\s*\\/>)`
  );
  return html.replace(pattern, `$1${content}$2`);
}

function getLocalizedAlternates(page) {
  return pages.filter((alternatePage) => alternatePage.alternateGroup === page.alternateGroup);
}

function buildAppSchema(page) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "RawType",
    url: absoluteUrl(page.path),
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    inLanguage: page.lang,
    description: page.description,
    image: absoluteUrl(socialImagePath),
    featureList: [
      "Typing test",
      "Typing practice",
      "WPM tracking",
      "CPM tracking",
      "Accuracy tracking",
      "Word drills",
      "Prose typing"
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    }
  };
}

function buildFaqSchema(page) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
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

function applyLocalizedSeo(html, page) {
  let output = html
    .replace("<html lang=\"en\">", `<html lang="${page.lang}">`)
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
  output = replaceMetaContent(output, "property", "og:title", page.title);
  output = replaceMetaContent(output, "property", "og:description", page.socialDescription);
  output = replaceMetaContent(output, "name", "twitter:title", page.title);
  output = replaceMetaContent(output, "name", "twitter:description", page.socialDescription);
  output = output
    .replace(/\n\s*<meta property="og:image[^"]*" content="[^"]*" \/>/g, "")
    .replace(/\n\s*<meta name="twitter:image[^"]*" content="[^"]*" \/>/g, "");

  output = output.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">${JSON.stringify(buildAppSchema(page))}</script>
    <script type="application/ld+json">${JSON.stringify(buildFaqSchema(page))}</script>`
  );

  const alternateLinks = getLocalizedAlternates(page).map(
    (alternatePage) =>
      `    <link rel="alternate" hreflang="${alternatePage.lang}" href="${absoluteUrl(alternatePage.path)}" />`
  );

  output = output.replace(
    "    <meta property=\"og:type\" content=\"website\" />",
    [
      `    <link rel="canonical" href="${absoluteUrl(page.path)}" />`,
      ...alternateLinks,
      `    <link rel="alternate" hreflang="x-default" href="${absoluteUrl(getLocalizedAlternates(page)[0].path)}" />`,
      "    <meta property=\"og:type\" content=\"website\" />",
      `    <meta property="og:url" content="${absoluteUrl(page.path)}" />`,
      `    <meta property="og:locale" content="${page.locale}" />`,
      `    <meta property="og:image" content="${absoluteUrl(socialImagePath)}" />`,
      `    <meta property="og:image:width" content="512" />`,
      `    <meta property="og:image:height" content="512" />`,
      `    <meta property="og:image:alt" content="RawType logo" />`,
      `    <meta name="twitter:image" content="${absoluteUrl(socialImagePath)}" />`,
      `    <meta name="twitter:image:alt" content="RawType logo" />`
    ].join("\n")
  );

  return output;
}

const sitemapUrls = pages
  .map(
    (page) => `  <url>
    <loc>${absoluteUrl(page.path)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.path === "/" ? "1.0" : "0.9"}</priority>
  </url>`
  )
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
