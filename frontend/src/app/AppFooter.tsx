import type { TypingLanguage } from "../games/typing/types";

type FooterLink = {
  href: string;
  label: string;
  hrefLang?: string;
  lang?: string;
  rel?: string;
};

type FooterSection = {
  title: string;
  links: FooterLink[];
};

type AppFooterProps = {
  language: TypingLanguage;
  pathname: string;
  alternateLanguagePath: string | null;
  onNavigate: (path: string) => void;
};

const footerContent: Record<
  TypingLanguage,
  {
    description: string;
    sections: FooterSection[];
    languageSectionTitle: string;
    alternateLanguageLabel: string;
    bottomLine: string;
  }
> = {
  en: {
    description: "Typing tests, focused practice, and quick drills for English and German.",
    sections: [
      {
        title: "Practice",
        links: [
          { href: "/", label: "Home" },
          { href: "/typing-test", label: "Typing Test" },
          { href: "/typing-practice", label: "Practice" },
          { href: "/wpm-test", label: "Speed Test" }
        ]
      },
      {
        title: "Modes",
        links: [
          { href: "/word-mode", label: "Word Mode" },
          { href: "/no-mistake-mode", label: "No-Mistake" }
        ]
      }
    ],
    languageSectionTitle: "Language",
    alternateLanguageLabel: "Switch to German",
    bottomLine: "Built for fast daily typing practice."
  },
  de: {
    description: "Tipptests, lockeres Training und schnelle Wortdrills auf Deutsch und Englisch.",
    sections: [
      {
        title: "Loslegen",
        links: [
          { href: "/de", label: "Start" },
          { href: "/de/tipptraining", label: "Tipptest" },
          { href: "/de/tipptrainer", label: "Tippen üben" },
          { href: "/de/tippgeschwindigkeit-test", label: "Speedtest" }
        ]
      },
      {
        title: "Modi",
        links: [
          { href: "/de/wortmodus", label: "Wortmodus" },
          { href: "/de/no-mistake-modus", label: "No-Mistake" }
        ]
      }
    ],
    languageSectionTitle: "Sprache",
    alternateLanguageLabel: "English version",
    bottomLine: "Gemacht für kurze Sessions und konstantes Besserwerden."
  }
};

function FooterAnchor({
  href,
  label,
  hrefLang,
  lang,
  rel,
  active,
  onNavigate
}: FooterLink & { active: boolean; onNavigate: (path: string) => void }) {
  return (
    <a
      href={href}
      hrefLang={hrefLang}
      lang={lang}
      rel={rel}
      aria-current={active ? "page" : undefined}
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.defaultPrevented
        ) {
          return;
        }

        event.preventDefault();
        onNavigate(href);
      }}
      style={{
        color: active ? "var(--text)" : "var(--muted-strong)",
        textDecoration: "none",
        fontWeight: active ? 800 : 600,
        lineHeight: 1.5
      }}
    >
      {label}
    </a>
  );
}

export default function AppFooter({ language, pathname, alternateLanguagePath, onNavigate }: AppFooterProps) {
  const content = footerContent[language];

  return (
    <footer
      style={{
        marginTop: "40px",
        borderTop: "1px solid var(--border)",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--surface) 88%, transparent), color-mix(in srgb, var(--page-bg) 92%, black 8%))"
      }}
    >
      <div
        style={{
          maxWidth: "980px",
          margin: "0 auto",
          padding: "28px 24px 36px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "22px"
        }}
      >
        <section style={{ display: "grid", gap: "10px" }}>
          <div
            style={{
              fontFamily: "var(--brand-font)",
              fontSize: "30px",
              lineHeight: 1,
              color: "var(--text)"
            }}
          >
            RawType
          </div>
          <p style={{ margin: 0, color: "var(--muted)", maxWidth: "34ch", lineHeight: 1.6 }}>
            {content.description}
          </p>
        </section>

        {content.sections.map((section) => (
          <section key={section.title} style={{ display: "grid", alignContent: "start", gap: "10px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--muted)"
              }}
            >
              {section.title}
            </h2>
            <div style={{ display: "grid", gap: "8px" }}>
              {section.links.map((link) => (
              <FooterAnchor
                key={link.href}
                href={link.href}
                label={link.label}
                hrefLang={link.hrefLang}
                lang={link.lang}
                rel={link.rel}
                active={pathname === link.href}
                onNavigate={onNavigate}
              />
              ))}
            </div>
          </section>
        ))}

        <section style={{ display: "grid", alignContent: "start", gap: "10px" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--muted)"
            }}
          >
            {content.languageSectionTitle}
          </h2>
          <div style={{ display: "grid", gap: "8px" }}>
            {alternateLanguagePath && (
              <FooterAnchor
                href={alternateLanguagePath}
                label={content.alternateLanguageLabel}
                hrefLang={language === "de" ? "en" : "de"}
                lang={language === "de" ? "en" : "de"}
                rel="alternate"
                active={false}
                onNavigate={onNavigate}
              />
            )}
          </div>
        </section>
      </div>

      <div
        style={{
          maxWidth: "980px",
          margin: "0 auto",
          padding: "0 24px 24px",
          color: "var(--muted)",
          fontSize: "13px"
        }}
      >
        {content.bottomLine}
      </div>
    </footer>
  );
}
