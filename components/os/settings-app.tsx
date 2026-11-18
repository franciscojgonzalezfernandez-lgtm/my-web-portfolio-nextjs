"use client";

import { useState } from "react";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { AboutThisMac } from "./system-apps";

export type WallpaperId = "default" | "sequoia" | "graphite";

export const WALLPAPERS: ReadonlyArray<{ id: WallpaperId; label: string; css: string }> = [
  { id: "default", label: "Liftoff", css: 'url("/os/wallpaper.jpg")' },
  {
    id: "sequoia",
    label: "Sequoia",
    css: "radial-gradient(120% 90% at 20% 110%, #ff7a3d 0%, transparent 55%), radial-gradient(100% 80% at 90% -10%, #3b5bdb 0%, transparent 60%), linear-gradient(160deg, #1a1446 0%, #4a1c6b 45%, #c2410c 100%)",
  },
  {
    id: "graphite",
    label: "Graphite",
    css: "radial-gradient(90% 70% at 80% 10%, #6b7280 0%, transparent 60%), radial-gradient(80% 80% at 10% 100%, #374151 0%, transparent 60%), linear-gradient(180deg, #1f2937 0%, #111827 100%)",
  },
];

export const WALLPAPER_STORAGE_KEY = "javi-os-wallpaper";

export const isWallpaperId = (value: unknown): value is WallpaperId =>
  WALLPAPERS.some((wallpaper) => wallpaper.id === value);

type Pane = "language" | "wallpaper" | "about";

const COPY = {
  english: {
    search: "Search",
    language: "Language & Region",
    wallpaper: "Wallpaper",
    about: "About",
    languageLead: "Choose the language of this website. Every window, note and project switches instantly.",
    preferred: "Preferred language",
    current: "Current",
    wallpaperLead: "Pick a desktop picture.",
    account: "Apple Account",
  },
  german: {
    search: "Suchen",
    language: "Sprache & Region",
    wallpaper: "Hintergrundbild",
    about: "Info",
    languageLead: "Wähle die Sprache dieser Website. Alle Fenster, Notizen und Projekte wechseln sofort.",
    preferred: "Bevorzugte Sprache",
    current: "Aktuell",
    wallpaperLead: "Wähle ein Schreibtischbild.",
    account: "Apple Account",
  },
} as const;

const PANE_ICONS: Record<Pane, { color: string; glyph: string }> = {
  language: { color: "#0a84ff", glyph: "🌐" },
  wallpaper: { color: "#32ade6", glyph: "🖼" },
  about: { color: "#8e8e93", glyph: "ⓘ" },
};

export default function SettingsApp({
  wallpaper,
  onWallpaperChange,
}: {
  wallpaper: WallpaperId;
  onWallpaperChange: (id: WallpaperId) => void;
}) {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const copy = COPY[language];
  const [pane, setPane] = useState<Pane>("language");
  const [mobileShowsPane, setMobileShowsPane] = useState(false);

  const openPane = (next: Pane) => {
    setPane(next);
    setMobileShowsPane(true);
  };

  return (
    <div className="settings-app" data-mobile-pane={mobileShowsPane}>
      <aside className="settings-sidebar">
        <div className="settings-search" aria-hidden="true">
          {copy.search}
        </div>
        <button type="button" className="settings-account" onClick={() => openPane("about")}>
          <img src="/smiling.webp" alt="" />
          <span>
            <b>Javi</b>
            <small>{copy.account}</small>
          </span>
        </button>
        <nav aria-label="Settings">
          {(["language", "wallpaper", "about"] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={pane === id ? "active" : undefined}
              aria-current={pane === id ? "page" : undefined}
              onClick={() => openPane(id)}
            >
              <span className="settings-icon" style={{ background: PANE_ICONS[id].color }} aria-hidden="true">
                {PANE_ICONS[id].glyph}
              </span>
              {copy[id]}
            </button>
          ))}
        </nav>
      </aside>
      <section className="settings-pane">
        <button type="button" className="settings-back" onClick={() => setMobileShowsPane(false)}>
          ‹ Settings
        </button>
        {pane === "language" && (
          <>
            <h2>{copy.language}</h2>
            <p className="settings-lead">{copy.languageLead}</p>
            <div className="settings-group" role="radiogroup" aria-label={copy.preferred}>
              <small>{copy.preferred}</small>
              {(
                [
                  ["english", "English", "EN"],
                  ["german", "Deutsch", "DE"],
                ] as const
              ).map(([id, label, code]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={language === id}
                  className="settings-option"
                  onClick={() => setLanguage(id)}
                >
                  <span className="settings-code">{code}</span>
                  <span className="settings-option-label">{label}</span>
                  {language === id ? <span className="settings-check">✓ {copy.current}</span> : null}
                </button>
              ))}
            </div>
          </>
        )}
        {pane === "wallpaper" && (
          <>
            <h2>{copy.wallpaper}</h2>
            <p className="settings-lead">{copy.wallpaperLead}</p>
            <div className="settings-wallpapers" role="radiogroup" aria-label={copy.wallpaper}>
              {WALLPAPERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={wallpaper === option.id}
                  onClick={() => onWallpaperChange(option.id)}
                >
                  <span style={{ backgroundImage: option.css }} />
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
        {pane === "about" && <AboutThisMac />}
      </section>
    </div>
  );
}
