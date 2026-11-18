"use client";

import { architectures } from "@/data/architectures.data";
import { METRICS_DATA } from "@/data/metrics.data";
import { technologies } from "@/data/technologies.data";
import { experiences } from "@/data/experiences.data";
import { projects } from "@/data/projects.data";
import { trackExternalClick } from "@/lib/analytics";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { CustomImage } from "@/components/high-order-components/CustomImage";

const SITE_URL = "https://javier-gonzalez-portfolio.com";
const PAGESPEED_URL = `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(SITE_URL)}`;

const LIGHTHOUSE = [
  { name: "Performance", nameGerman: "Leistung", score: 100, pid: 101 },
  { name: "Accessibility", nameGerman: "Barrierefreiheit", score: 100, pid: 102 },
  { name: "Best Practices", nameGerman: "Best Practices", score: 100, pid: 103 },
  { name: "SEO", nameGerman: "SEO", score: 100, pid: 104 },
] as const;

const FACTS = [
  { value: "53%", text: METRICS_DATA.fact1, textGerman: METRICS_DATA.fact1German },
  { value: "2x", text: METRICS_DATA.fact2, textGerman: METRICS_DATA.fact2German },
  { value: "$2.6B", text: METRICS_DATA.fact3, textGerman: METRICS_DATA.fact3German },
] as const;

// METRICS_DATA.subtitle2 carries inline <strong> markup meant for the old page.
const stripTags = (value: string) => value.replace(/<[^>]+>/g, "");

// A deterministic, CPU-graph-looking sparkline for each fact card.
const sparkline = (seed: number) => {
  const points = Array.from({ length: 24 }, (_, index) => {
    const wave = Math.sin(index * 0.7 + seed) * 0.28 + Math.sin(index * 1.9 + seed * 2) * 0.16;
    const y = 30 - (0.55 + wave) * 26;
    return `${(index / 23) * 100},${y.toFixed(1)}`;
  });
  return `M0,30 L${points.join(" L")} L100,30 Z`;
};

export function ActivityMonitor() {
  const language = useLanguageStore((state) => state.language);
  const isGerman = language === "german";

  return (
    <div className="activity-monitor">
      <div className="am-toolbar">
        <div>
          <b>{isGerman ? METRICS_DATA.titleGerman : METRICS_DATA.title}</b>
          <small>{isGerman ? "Lighthouse · alle Prozesse" : "Lighthouse · all processes"}</small>
        </div>
        <span className="am-tabs" aria-hidden="true">
          <span className="active">CPU</span>
          <span>{isGerman ? "Speicher" : "Memory"}</span>
          <span>{isGerman ? "Energie" : "Energy"}</span>
          <span>{isGerman ? "Festplatte" : "Disk"}</span>
          <span>{isGerman ? "Netzwerk" : "Network"}</span>
        </span>
      </div>
      <div className="am-table" role="table" aria-label="Lighthouse scores">
        <div className="am-row am-head" role="row">
          <span role="columnheader">{isGerman ? "Prozessname" : "Process Name"}</span>
          <span role="columnheader">% Score</span>
          <span role="columnheader">PID</span>
          <span role="columnheader">{isGerman ? "Benutzer" : "User"}</span>
        </div>
        {LIGHTHOUSE.map((metric) => (
          <div key={metric.name} className="am-row" role="row">
            <span role="cell">
              <i className="am-dot" aria-hidden="true" />
              {isGerman ? metric.nameGerman : metric.name}
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
      <p className="am-note">{isGerman ? METRICS_DATA.subtitleGerman : METRICS_DATA.subtitle}</p>
      <div className="am-cards">
        {FACTS.map((fact, index) => (
          <div key={fact.value} className="am-card">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
              <path d={sparkline(index + 1)} />
            </svg>
            <b>{fact.value}</b>
            <small>{isGerman ? fact.textGerman : fact.text}</small>
          </div>
        ))}
      </div>
      <div className="am-footer">
        <div>
          <b>{isGerman ? METRICS_DATA.title2German : METRICS_DATA.title2}</b>
          <p>{stripTags(isGerman ? METRICS_DATA.subtitle2German : METRICS_DATA.subtitle2)}</p>
        </div>
        <a
          href={PAGESPEED_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackExternalClick("PageSpeed Insights", "activity-monitor")}
        >
          {isGerman ? METRICS_DATA.tryYourselfTitleGerman : METRICS_DATA.tryYourselfTitle} ↗
        </a>
      </div>
    </div>
  );
}

const TILTS = [-3, 2, -1.5, 3, -2.5, 1.5];

export function FreeformBoard() {
  const language = useLanguageStore((state) => state.language);
  const isGerman = language === "german";

  return (
    <div className="freeform-board">
      <div className="ff-sticky" style={{ rotate: "-2deg" }}>
        <b>{isGerman ? "Ausgewählte Erfolge und Aktivitäten" : "Featured Achievements and Activities"}</b>
        <p>
          {isGerman
            ? "Architekturdesigns, technische Lösungen und einflussreiche Aktivitäten, auf die ich stolz bin."
            : "Architectural designs, technical solutions, and impactful activities I've created and I'm proud of."}
        </p>
      </div>
      {architectures.map((item, index) => (
        <figure key={item.image} className="ff-card" style={{ rotate: `${TILTS[index % TILTS.length]}deg` }}>
          <CustomImage src={item.image} alt="" loading="lazy" />
          <figcaption>{isGerman ? item.titleGerman : item.title}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function AboutThisMac() {
  const language = useLanguageStore((state) => state.language);
  const isGerman = language === "german";
  const years = new Date().getFullYear() - 2018;
  const specs: Array<[string, string]> = isGerman
    ? [
        ["Chip", "TypeScript · Java · React · Next.js"],
        ["Speicher", `${years}+ Jahre Erfahrung`],
        ["Startvolume", `${projects.length} Projekte`],
        ["Seriennummer", `${experiences.length} Stationen`],
        ["Sprachen", "Englisch, Deutsch, Spanisch"],
        ["macOS", "JaviOS 26"],
      ]
    : [
        ["Chip", "TypeScript · Java · React · Next.js"],
        ["Memory", `${years}+ years of experience`],
        ["Startup disk", `${projects.length} projects`],
        ["Serial number", `${experiences.length} roles`],
        ["Languages", "English, German, Spanish"],
        ["macOS", "JaviOS 26"],
      ];

  return (
    <div className="about-mac">
      <CustomImage className="about-mac-avatar" src="/smiling.webp" alt="" />
      <h2>Javi</h2>
      <p className="about-mac-sub">
        {isGerman ? "Full-Stack-Engineer · Schweiz" : "Full-Stack Engineer · Switzerland"}
      </p>
      <dl>
        {specs.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="about-mac-stack" aria-label={isGerman ? "Technologien" : "Technologies"}>
        {technologies.map((technology) => (
          <span key={technology.name}>{technology.name}</span>
        ))}
      </div>
      <small>™ and © 2018–{new Date().getFullYear()} Javi. All rights reserved.</small>
    </div>
  );
}
