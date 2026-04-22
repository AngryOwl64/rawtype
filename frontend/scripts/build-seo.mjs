// Post-build SEO helper for static deployment output.
// Adds localized entry pages, robots, sitemap, canonical, and hreflang metadata.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const indexPath = path.join(distDir, "index.html");

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
  (await readEnvValue(".env", "VITE_SITE_URL"));

function normalizeSiteUrl(value) {
  if (!value) {
    return null;
  }

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

const pages = [
  {
    path: "/",
    lang: "en",
    locale: "en_US",
    title: "RawType - Free Typing Practice Game",
    description:
      "RawType is a free typing practice game for improving speed and accuracy with prose and word drills.",
    socialDescription:
      "Practice typing with prose and word drills, track your speed and accuracy, and keep improving.",
    noscriptTitle: "RawType Typing Practice",
    noscriptDescription:
      "RawType is a free single-player typing game with prose and word drills for practicing speed, accuracy, and consistency.",
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
    path: "/de/",
    lang: "de",
    locale: "de_DE",
    title: "RawType - Kostenloses Tipptraining",
    description:
      "RawType ist ein kostenloses Tipptraining zum Verbessern von Tippgeschwindigkeit, Genauigkeit und Konstanz.",
    socialDescription:
      "Trainiere Tippen mit Prosa und Wortübungen, verfolge Geschwindigkeit und Genauigkeit und verbessere dich Schritt für Schritt.",
    noscriptTitle: "RawType Tipptraining",
    noscriptDescription:
      "RawType ist ein kostenloses Einzelspieler-Tippspiel mit Prosa- und Wortübungen für Geschwindigkeit, Genauigkeit und Konstanz.",
    noscriptContent: `<section data-seo-noscript>
          <h2>Kostenloses Tipptraining für Geschwindigkeit und Genauigkeit</h2>
          <p>
            RawType hilft dir, echtes Tippen mit fokussierten Runs, klarer Rückmeldung und
            praktischen Messwerten wie WPM, CPM, Genauigkeit, Fortschritt, Fehlern und
            abgeschlossenen Wörtern zu trainieren.
          </p>
          <h2>Typing Classic</h2>
          <p>
            Typing Classic nutzt zusammenhängende Texte, damit du Rhythmus, Satzzeichen,
            Großschreibung und echten Schreibfluss trainierst statt nur einzelne Buchstaben zu
            wiederholen.
          </p>
          <h2>Wortmodus</h2>
          <p>
            Der Wortmodus erstellt kurze Tippübungen aus zufälligen Wörtern. Du kannst Wortanzahl,
            Schwierigkeit und No-Mistake-Training wählen, um sauberere Anschläge zu üben.
          </p>
          <h2>Englisches und deutsches Tipptraining</h2>
          <p>
            RawType unterstützt Englisch und Deutsch. Die Hauptseite ist Englisch, die deutsche
            Einstiegsseite liegt unter /de/.
          </p>
          <h2>FAQ zum Tipptraining</h2>
          <h3>Ist RawType kostenlos?</h3>
          <p>Ja. RawType ist kostenlos und für schnelle, wiederholbare Tippübungen gebaut.</p>
          <h3>Was misst RawType?</h3>
          <p>
            RawType misst Tippgeschwindigkeit, Zeichen pro Minute, Genauigkeit, Fehler,
            Fortschritt, Dauer und abgeschlossene Wörter während eines Runs.
          </p>
          <h3>Kann ich meinen Fortschritt verfolgen?</h3>
          <p>
            Eingeloggte Spieler können Runs speichern, Statistiken ansehen, tägliche Serien
            aufbauen und wiederkehrende Fehlerwörter erkennen.
          </p>
        </section>`
  }
];

function absoluteUrl(pagePath) {
  return `${siteUrl}${pagePath}`;
}

function replaceMetaContent(html, attributeName, attributeValue, content) {
  const escapedAttributeValue = attributeValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(<meta\\s+${attributeName}="${escapedAttributeValue}"\\s+content=")[^"]*("\\s*\\/>)`);
  return html.replace(pattern, `$1${content}$2`);
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
    .replace(
      /<section data-seo-noscript>[\s\S]*?<\/section>/,
      page.noscriptContent
    );

  output = replaceMetaContent(output, "name", "description", page.description);
  output = replaceMetaContent(output, "property", "og:title", page.title);
  output = replaceMetaContent(output, "property", "og:description", page.socialDescription);
  output = replaceMetaContent(output, "name", "twitter:title", page.title);
  output = replaceMetaContent(output, "name", "twitter:description", page.socialDescription);

  output = output.replace(
    /"description": "[^"]*"/,
    `"description": "${page.description}"`
  );

  const alternateLinks = pages.map(
    (alternatePage) =>
      `    <link rel="alternate" hreflang="${alternatePage.lang}" href="${absoluteUrl(alternatePage.path)}" />`
  );

  output = output.replace(
    "    <meta property=\"og:type\" content=\"website\" />",
    [
      `    <link rel="canonical" href="${absoluteUrl(page.path)}" />`,
      ...alternateLinks,
      `    <link rel="alternate" hreflang="x-default" href="${absoluteUrl("/")}" />`,
      "    <meta property=\"og:type\" content=\"website\" />",
      `    <meta property="og:url" content="${absoluteUrl(page.path)}" />`,
      `    <meta property="og:locale" content="${page.locale}" />`
    ].join("\n")
  );

  return output;
}

if (siteUrl) {
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
} else {
  console.warn("Skipping sitemap.xml because VITE_SITE_URL or SITE_URL is not set.");
}

await mkdir(distDir, { recursive: true });
await writeFile(path.join(distDir, "robots.txt"), `${robotsLines.join("\n")}\n`, "utf8");
