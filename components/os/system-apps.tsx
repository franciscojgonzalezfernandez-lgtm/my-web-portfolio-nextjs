"use client";

import { architectures } from "@/data/architectures.data";
import { LIGHTHOUSE, METRICS_DATA } from "@/data/metrics.data";
import { technologies } from "@/data/technologies.data";
import { experiences } from "@/data/experiences.data";
import { projects } from "@/data/projects.data";
import { trackExternalClick } from "@/lib/analytics";
import { byLanguage, localized } from "@/lib/i18n";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { CustomImage } from "@/components/high-order-components/CustomImage";

const SITE_URL = "https://javier-gonzalez-portfolio.com";
const PAGESPEED_URL = `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(SITE_URL)}`;


const FACTS = [
  {
    value: "53%",
    text: METRICS_DATA.fact1,
    textGerman: METRICS_DATA.fact1German,
    textSpanish: METRICS_DATA.fact1Spanish,
  },
  {
    value: "2x",
    text: METRICS_DATA.fact2,
    textGerman: METRICS_DATA.fact2German,
    textSpanish: METRICS_DATA.fact2Spanish,
  },
  {
    value: "$2.6B",
    text: METRICS_DATA.fact3,
    textGerman: METRICS_DATA.fact3German,
    textSpanish: METRICS_DATA.fact3Spanish,
  },
] as const;

// METRICS_DATA.subtitle2 carries inline <strong> markup meant for the old page.
const stripTags = (value: string) => value.replace(/<[^>]+>/g, "");

// A deterministic, CPU-graph-looking sparkline for each fact card.
const sparkline = (seed: number) => {
  const points = Array.from({ length: 24 }, (_, index) => {
    const wave =
      Math.sin(index * 0.7 + seed) * 0.28 +
      Math.sin(index * 1.9 + seed * 2) * 0.16;
    const y = 30 - (0.55 + wave) * 26;
    return `${(index / 23) * 100},${y.toFixed(1)}`;
  });
  return `M0,30 L${points.join(" L")} L100,30 Z`;
};

export function ActivityMonitor() {
  const language = useLanguageStore((state) => state.language);
  const t = (english: string, german: string, spanish: string) =>
    byLanguage(language, { english, german, spanish });

  return (
    <div className="activity-monitor">
      <div className="am-toolbar">
        <div>
          <b>{localized(METRICS_DATA, "title", language)}</b>
          <small>
            {t(
              "Lighthouse · all processes",
              "Lighthouse · alle Prozesse",
              "Lighthouse · todos los procesos",
            )}
          </small>
        </div>
        <span className="am-tabs" aria-hidden="true">
          <span className="active">CPU</span>
          <span>{t("Memory", "Speicher", "Memoria")}</span>
          <span>{t("Energy", "Energie", "Energía")}</span>
          <span>{t("Disk", "Festplatte", "Disco")}</span>
          <span>{t("Network", "Netzwerk", "Red")}</span>
        </span>
      </div>
      <div className="am-table" role="table" aria-label="Lighthouse scores">
        <div className="am-row am-head" role="row">
          <span role="columnheader">
            {t("Process Name", "Prozessname", "Nombre del proceso")}
          </span>
          <span role="columnheader">% Score</span>
          <span role="columnheader">PID</span>
          <span role="columnheader">{t("User", "Benutzer", "Usuario")}</span>
        </div>
        {LIGHTHOUSE.map((metric) => (
          <div key={metric.name} className="am-row" role="row">
            <span role="cell">
              <i className="am-dot" aria-hidden="true" />
              {localized(metric, "name", language)}
            </span>
            <span role="cell" className="am-score">
              <span className="am-bar" style={{ width: `${metric.score}%` }} />
              {metric.score.toFixed(1)}
            </span>
            <span role="cell">{metric.pid}</span>
            <span role="cell">javi</span>
          </div>
        ))}
      </div>
      <p className="am-note">{localized(METRICS_DATA, "subtitle", language)}</p>
      <div className="am-cards">
        {FACTS.map((fact, index) => (
          <div key={fact.value} className="am-card">
            <svg
              viewBox="0 0 100 30"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d={sparkline(index + 1)} />
            </svg>
            <b>{fact.value}</b>
            <small>{localized(fact, "text", language)}</small>
          </div>
        ))}
      </div>
      <div className="am-footer">
        <div>
          <b>{localized(METRICS_DATA, "title2", language)}</b>
          <p>{stripTags(localized(METRICS_DATA, "subtitle2", language))}</p>
        </div>
        <a
          href={PAGESPEED_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackExternalClick("PageSpeed Insights", "activity-monitor")
          }
        >
          {localized(METRICS_DATA, "tryYourselfTitle", language)} ↗
        </a>
      </div>
    </div>
  );
}

const TILTS = [-3, 2, -1.5, 3, -2.5, 1.5];

export function FreeformBoard() {
  const language = useLanguageStore((state) => state.language);

  return (
    <div className="freeform-board">
      <div className="ff-sticky" style={{ rotate: "-2deg" }}>
        <b>
          {byLanguage(language, {
            english: "Featured Achievements and Activities",
            german: "Ausgewählte Erfolge und Aktivitäten",
            spanish: "Logros y actividades destacados",
          })}
        </b>
        <p>
          {byLanguage(language, {
            english:
              "Architectural designs, technical solutions, and impactful activities I've created and I'm proud of.",
            german:
              "Architekturdesigns, technische Lösungen und einflussreiche Aktivitäten, auf die ich stolz bin.",
            spanish:
              "Diseños de arquitectura, soluciones técnicas y actividades de impacto que he creado y de las que estoy orgulloso.",
          })}
        </p>
      </div>
      {architectures.map((item, index) => (
        <figure
          key={item.image}
          className="ff-card"
          style={{ rotate: `${TILTS[index % TILTS.length]}deg` }}
        >
          <CustomImage src={item.image} alt="" loading="lazy" />
          <figcaption>{localized(item, "title", language)}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function AboutThisMac() {
  const language = useLanguageStore((state) => state.language);
  const years = new Date().getFullYear() - 2018;
  const specs: Array<[string, string]> = byLanguage(language, {
    german: [
      ["Chip", "TypeScript · Java · React · Next.js"],
      ["Speicher", `${years}+ Jahre Erfahrung`],
      ["Startvolume", `${projects.length} Projekte`],
      ["Seriennummer", `${experiences.length} Stationen`],
      ["Sprachen", "Englisch, Deutsch, Spanisch"],
      ["macOS", "JaviOS 26"],
    ],
    english: [
      ["Chip", "TypeScript · Java · React · Next.js"],
      ["Memory", `${years}+ years of experience`],
      ["Startup disk", `${projects.length} projects`],
      ["Serial number", `${experiences.length} roles`],
      ["Languages", "English, German, Spanish"],
      ["macOS", "JaviOS 26"],
    ],
    spanish: [
      ["Chip", "TypeScript · Java · React · Next.js"],
      ["Memoria", `${years}+ años de experiencia`],
      ["Disco de arranque", `${projects.length} proyectos`],
      ["Número de serie", `${experiences.length} puestos`],
      ["Idiomas", "Inglés, alemán, español"],
      ["macOS", "JaviOS 26"],
    ],
  });

  return (
    <div className="about-mac">
      <CustomImage className="about-mac-avatar" src="/smiling.webp" alt="" />
      <h2>Javi</h2>
      <p className="about-mac-sub">
        {byLanguage(language, {
          english: "Full-Stack Engineer · Switzerland",
          german: "Full-Stack-Engineer · Schweiz",
          spanish: "Ingeniero full-stack · Suiza",
        })}
      </p>
      <dl>
        {specs.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div
        className="about-mac-stack"
        aria-label={byLanguage(language, {
          english: "Technologies",
          german: "Technologien",
          spanish: "Tecnologías",
        })}
      >
        {technologies.map((technology) => (
          <span key={technology.name}>{technology.name}</span>
        ))}
      </div>
      <small>
        ™ and © 2018–{new Date().getFullYear()} Javi. All rights reserved.
      </small>
    </div>
  );
}
