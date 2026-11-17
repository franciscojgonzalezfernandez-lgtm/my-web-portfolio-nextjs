"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLanguageStore } from "@/stores/useLanguageStore";

type Language = "english" | "german";

const LANGUAGES: ReadonlyArray<{ id: Language; code: string; label: string; native: string }> = [
  { id: "english", code: "EN", label: "English", native: "English" },
  { id: "german", code: "DE", label: "German", native: "Deutsch" },
];

const subscribeNever = () => () => {};

// Menu bar input-source item. Shows the globe and the active code so visitors
// can tell at a glance that it switches the site language.
export default function LanguageMenu() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [isOpen, setIsOpen] = useState(false);
  // The store reads sessionStorage, which the static HTML cannot know about.
  const isHydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const active = LANGUAGES.find((entry) => entry.id === (isHydrated ? language : "german")) ?? LANGUAGES[1];
  const title = active.id === "german" ? "Sprache" : "Language";

  return (
    <div className="language-menu" ref={rootRef}>
      <button
        type="button"
        className={`language-menu-button ${isOpen ? "active" : ""}`}
        aria-label={`${title}: ${active.native}. Change language`}
        title={title}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
        </svg>
        <span>{active.code}</span>
      </button>
      {isOpen && (
        <div className="language-menu-panel" role="menu" aria-label={title}>
          <small>{title}</small>
          {LANGUAGES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="menuitemradio"
              aria-checked={entry.id === active.id}
              onClick={() => {
                setLanguage(entry.id);
                setIsOpen(false);
              }}
            >
              <span className="language-menu-check" aria-hidden="true">
                {entry.id === active.id ? "✓" : ""}
              </span>
              <span className="language-menu-code">{entry.code}</span>
              {entry.native}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
