"use client";

import { useSyncExternalStore } from "react";
import { useLanguageStore } from "@/stores/useLanguageStore";

export type OsLanguage = "english" | "german";

const subscribeNever = () => () => {};

// The store reads sessionStorage, which the static HTML cannot know about. Until
// hydration finishes, render the store's default so server and client markup match.
export const useOsLanguage = (): OsLanguage => {
  const stored = useLanguageStore((state) => state.language);
  const isHydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  return isHydrated ? stored : "german";
};

// App names as macOS shows them in each language. Brand names stay as they are.
const APP_NAMES_DE: Record<string, string> = {
  notes: "Notizen",
  photos: "Fotos",
  "activity-monitor": "Aktivitätsanzeige",
  settings: "Systemeinstellungen",
  weather: "Wetter",
  trash: "Papierkorb",
};

export const appName = (id: string, name: string, language: OsLanguage) =>
  language === "german" ? (APP_NAMES_DE[id] ?? name) : name;

const CHROME = {
  english: {
    file: "File",
    edit: "Edit",
    view: "View",
    window: "Window",
    help: "Help",
    projects: "Projects",
    certifications: "My certifications",
    certificationsShort: "Certifications",
    secret: "Don't Open",
    newMessage: "New Message",
    trash: "Trash",
    trashEmpty: "Trash is Empty",
    trashHint: "Nothing to see here.",
    aboutThisMac: "About This Mac",
    systemSettings: "System Settings",
    items: (count: number) => `${count} ${count === 1 ? "item" : "items"}`,
    close: "Close",
  },
  german: {
    file: "Ablage",
    edit: "Bearbeiten",
    view: "Darstellung",
    window: "Fenster",
    help: "Hilfe",
    projects: "Projekte",
    certifications: "Meine Zertifikate",
    certificationsShort: "Zertifikate",
    secret: "Nicht öffnen",
    newMessage: "Neue E-Mail",
    trash: "Papierkorb",
    trashEmpty: "Der Papierkorb ist leer",
    trashHint: "Hier gibt es nichts zu sehen.",
    aboutThisMac: "Über diesen Mac",
    systemSettings: "Systemeinstellungen",
    items: (count: number) => `${count} ${count === 1 ? "Objekt" : "Objekte"}`,
    close: "Schließen",
  },
} as const;

export type OsChrome = (typeof CHROME)[OsLanguage];

export const useOsChrome = (): OsChrome => CHROME[useOsLanguage()];
export const osChrome = (language: OsLanguage): OsChrome => CHROME[language];

const PROJECT_TYPES_DE: Record<string, string> = {
  Professional: "Beruflich",
  "Side Project": "Nebenprojekt",
  Didactic: "Lernprojekt",
};

export const projectTypeLabel = (type: string, language: OsLanguage) =>
  language === "german" ? (PROJECT_TYPES_DE[type] ?? type) : type;

// data/projects stores dates as DD-MM-YYYY.
export const formatProjectDate = (value: string, language: OsLanguage) => {
  const [day, month, year] = value.split("-").map(Number);
  if (!day || !month || !year) return value;
  return new Date(year, month - 1, day).toLocaleDateString(
    language === "german" ? "de-CH" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  );
};
