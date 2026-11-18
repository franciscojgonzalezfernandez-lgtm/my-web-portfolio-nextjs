import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Every language the site ships. Content is stored as sibling fields per language
// (`title` / `titleGerman` / `titleSpanish`); read them with `localized()` in lib/i18n.ts.
export type Language = "english" | "german" | "spanish";

export const LANGUAGES: readonly Language[] = ["english", "german", "spanish"];

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "german",
      setLanguage: (newLanguage) => set({ language: newLanguage }),
    }),
    {
      name: "portfolio-language",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
