// Post-build SEO helper for static deployment output.
// Adds robots and sitemap files when a site URL is configured.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const indexPath = path.join(distDir, "index.html");
const rawSiteUrl = process.env.VITE_SITE_URL ?? process.env.SITE_URL;

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

if (siteUrl) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

  await mkdir(distDir, { recursive: true });
  await writeFile(path.join(distDir, "sitemap.xml"), sitemap, "utf8");
  robotsLines.push(`Sitemap: ${siteUrl}/sitemap.xml`);

  const indexHtml = await readFile(indexPath, "utf8");
  const absoluteHomeUrl = `${siteUrl}/`;
  const htmlWithUrls = indexHtml.replace(
    "    <meta property=\"og:type\" content=\"website\" />",
    [
      `    <link rel="canonical" href="${absoluteHomeUrl}" />`,
      `    <link rel="alternate" hreflang="en" href="${absoluteHomeUrl}" />`,
      "    <meta property=\"og:type\" content=\"website\" />",
      `    <meta property="og:url" content="${absoluteHomeUrl}" />`
    ].join("\n")
  );

  await writeFile(indexPath, htmlWithUrls, "utf8");
} else {
  console.warn("Skipping sitemap.xml because VITE_SITE_URL or SITE_URL is not set.");
}

await mkdir(distDir, { recursive: true });
await writeFile(path.join(distDir, "robots.txt"), `${robotsLines.join("\n")}\n`, "utf8");
