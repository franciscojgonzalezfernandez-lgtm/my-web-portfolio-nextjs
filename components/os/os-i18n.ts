"use client";

import { useSyncExternalStore } from "react";
import { DATE_LOCALE } from "@/lib/i18n";
import { useLanguageStore, type Language } from "@/stores/useLanguageStore";

export type OsLanguage = Language;

// The language switchers (menu bar, Settings, Control Center, Terminal) list these.
export const LANGUAGE_OPTIONS: ReadonlyArray<{
  id: Language;
  code: string;
  native: string;
  // "Language" written in that language, for titles while it is active.
  title: string;
}> = [
  { id: "english", code: "EN", native: "English", title: "Language" },
  { id: "german", code: "DE", native: "Deutsch", title: "Sprache" },
  { id: "spanish", code: "ES", native: "Español", title: "Idioma" },
];

export const languageOption = (language: Language) =>
  LANGUAGE_OPTIONS.find((option) => option.id === language) ?? LANGUAGE_OPTIONS[0];

const subscribeNever = () => () => {};

// The store reads sessionStorage, which the static HTML cannot know about. Until
// hydration finishes, render the store's default so server and client markup match.
export const useOsLanguage = (): OsLanguage => {
  const stored = useLanguageStore((state) => state.language);
  const isHydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  return isHydrated ? stored : "german";
};

// App names as macOS shows them in each language. Brand names stay as they are.
const APP_NAMES: Record<Exclude<OsLanguage, "english">, Record<string, string>> = {
  german: {
    notes: "Notizen",
    photos: "Fotos",
    "activity-monitor": "Aktivitätsanzeige",
    settings: "Systemeinstellungen",
    weather: "Wetter",
    trash: "Papierkorb",
  },
  spanish: {
    notes: "Notas",
    photos: "Fotos",
    "activity-monitor": "Monitor de Actividad",
    settings: "Ajustes del Sistema",
    weather: "Tiempo",
    trash: "Papelera",
    mail: "Mail",
  },
};

export const appName = (id: string, name: string, language: OsLanguage) =>
  language === "english" ? name : (APP_NAMES[language][id] ?? name);

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
    references: "References",
    aboutMe: "About me",
    watchFirst: "Watch this first",
    introInSecret: "The video you should see",
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
    references: "Referenzen",
    aboutMe: "Über mich",
    watchFirst: "Zuerst ansehen",
    introInSecret: "Das Video, das du sehen solltest",
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
  spanish: {
    file: "Archivo",
    edit: "Edición",
    view: "Visualización",
    window: "Ventana",
    help: "Ayuda",
    projects: "Proyectos",
    certifications: "Mis certificaciones",
    certificationsShort: "Certificaciones",
    references: "Referencias",
    aboutMe: "Sobre mí",
    watchFirst: "Míralo primero",
    introInSecret: "El vídeo que deberías ver",
    secret: "No abrir",
    newMessage: "Nuevo mensaje",
    trash: "Papelera",
    trashEmpty: "La Papelera está vacía",
    trashHint: "Aquí no hay nada que ver.",
    aboutThisMac: "Acerca de este Mac",
    systemSettings: "Ajustes del Sistema",
    items: (count: number) => `${count} ${count === 1 ? "elemento" : "elementos"}`,
    close: "Cerrar",
  },
} as const;

export type OsChrome = (typeof CHROME)[OsLanguage];

export const useOsChrome = (): OsChrome => CHROME[useOsLanguage()];
export const osChrome = (language: OsLanguage): OsChrome => CHROME[language];

const PROJECT_TYPES: Record<Exclude<OsLanguage, "english">, Record<string, string>> = {
  german: { Professional: "Beruflich", "Side Project": "Nebenprojekt", Didactic: "Lernprojekt" },
  spanish: { Professional: "Profesional", "Side Project": "Proyecto personal", Didactic: "Didáctico" },
};

export const projectTypeLabel = (type: string, language: OsLanguage) =>
  language === "english" ? type : (PROJECT_TYPES[language][type] ?? type);

// data/projects stores dates as DD-MM-YYYY.
export const formatProjectDate = (value: string, language: OsLanguage) => {
  const [day, month, year] = value.split("-").map(Number);
  if (!day || !month || !year) return value;
  return new Date(year, month - 1, day).toLocaleDateString(
    DATE_LOCALE[language],
    { day: "numeric", month: "long", year: "numeric" },
  );
};
