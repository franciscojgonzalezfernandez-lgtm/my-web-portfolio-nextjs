# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Project docs:**
- [`AGENTS.md`](AGENTS.md) — thin pointer to this file for Codex/other agents (never define conventions there).
- [`docs/FEATURES.md`](docs/FEATURES.md) — living backlog, source of truth for ticket scope.
- [`docs/WORKFLOW.md`](docs/WORKFLOW.md) — subagent loop + per-feature verification.

## What the site is

The portfolio is a fake operating system: a **macOS desktop** on wide screens and an **iOS home screen** on phones (epic f-012..f-028). Projects, CV, certificates, experience and contact all live inside windows and apps. The shell is ported from [asierbayon/asierbayonOS](https://github.com/asierbayon/asierbayonOS) (WTFPL); Javi's content and apps are layered on top.

## Commands

```bash
npm run dev      # dev server on :3000
npm run build    # static export -> ./out (also type-checks: a type error fails the build)
npm run lint     # eslint . with eslint.config.mjs (flat config, eslint-config-next)
npx tsc --noEmit # fastest type check
npm run deploy   # gh-pages -d out (manual; CI normally handles deploy)
```

- There is no test framework. Verification is `tsc` + `lint` + `build` + a browser check (see `docs/WORKFLOW.md`).
- `npx serve out -p 4000` after a build shows exactly what GitHub Pages will serve.

## Static export constraints

`next.config.mjs` sets `output: "export"` and `images.unoptimized: true`. Everything ships as static HTML to GitHub Pages (`.github/workflows/deploy.yml`, triggered on push to `main`, publishes `out/` with the official Pages actions, so `_next/` needs no `.nojekyll`).

Consequences that shape the whole codebase:
- **No server runtime, ever.** No route handlers at request time, no server actions, no middleware/proxy, no ISR, no `cookies()`/`headers()`. Anything dynamic (weather, GitHub activity, YouTube, Drive previews) is fetched by the visitor's browser.
- `app/sitemap.ts` is `force-static`: it runs once at build time and emits `out/sitemap.xml`. Its `STATIC_PATHS` list is kept by hand; project URLs come from `data/projects.data.ts`.
- Dynamic routes must enumerate params: `app/portfolio/[slug]/page.tsx` uses `generateStaticParams()` over `data/projects.data.ts`. A new project needs no route work, only a data entry.
- `next/image` is not used. Public assets go through the HOCs below so they get the base-path prefix.

## OS architecture (`components/os/`)

Every route renders the same client component, `<Desktop />` from `components/os/desktop.tsx`. Routes only differ in which window opens on load and in their `metadata`:

| Route | Opens |
|---|---|
| `/` | nothing (desktop / home screen) |
| `/about` | Notes → "Professional" |
| `/experience` | Notes → first experience |
| `/portfolio` | Finder → Projects folder |
| `/portfolio/[slug]` | the project window |
| `/metrics` | Activity Monitor |
| `/contact` | Mail |
| `not-found` | desktop |

- **Deep links.** `Desktop` takes `open?: DeepLinkTarget` from the route, and also reads `?open=<kind>:<value>` on any URL (`project:<slug>`, `folder:projects|certifications|references`, `notes:<noteId>`, `app:mail|activity-monitor|freeform|photos`). After load the address bar follows the window in front via `history.replaceState` (`routeForWindow`); Back still leaves the site.
- **`desktop.tsx` is a ported monolith** (~7.6k lines): boot screen, menu bar, Dock, windows (drag, minimize, z-order), Control Center, the iOS home with pages, app switcher and gestures, plus the `apps` registry. Window content is a `WindowState` union keyed by `kind`: `notes`, `app`, `folder` (`secret` | `projects` | `certifications` | `references`), `project`, `preview`, `movie`, `video`, `image`, `terminal`, `about-mac`, `settings`, `spotify`, `youtube`, `weather`. Add new behaviour in a separate module and wire it in, rather than growing the monolith.
- **First-party modules** (Javi's apps and content): `project-window.tsx` (project document), `notes-data.ts` (Notes folders built from `data/`), `preview-document.tsx` (CV via pdf.js, certificates via Google Drive `/preview` iframes), `movie-window.tsx` (Intro.mov), `terminal.tsx`, `system-apps.tsx` (Activity Monitor = metrics, Freeform = architectures, About This Mac), `settings-app.tsx`, `language-menu.tsx`, `photo-library.ts`, `console-art.tsx`, `os-i18n.ts`.
- **Ported modules** (Asier's, adapted): `youtube.tsx`, `media.ts`, `weather.tsx` / `weather-app.tsx` (Open-Meteo, Madrid / Flumserberg / Zurich), `photos.tsx`, `instagram.tsx`, `facebook.tsx`, `chatgpt.tsx`, `startup-screen.tsx`, `offline-playback.tsx`, `use-youtube-connection.tsx`, `matrix-rain.tsx`, `dither-background.tsx`. Their copy stays English in every language.
- **Audio is exclusive.** Spotify, the YouTube app and the "Dont play this video" window share one `PlaybackGate` (`media.ts`). A window that plays must claim it on mount, not only when opened: React Strict Mode runs the unmount cleanup once in dev and would release the claim (f-027).
- **Persistence.** Language → `sessionStorage` (`portfolio-language`). Boot screen "already booted" flag → `sessionStorage` (clear it to replay the boot). Desktop icon positions (`javi-os-desktop-icon-positions-v3`), wallpaper (`javi-os-wallpaper`) and meme markup → `localStorage`. Bump the positions key when the default icon layout changes.
- The desktop is laid out from `FIXED_DESKTOP_ICON_IDS` (Intro.mov first, top right, with the slot to its left kept free for its "About me" callout) followed by the memes. The iOS home splits apps across two pages with `MOBILE_FIRST_PAGE_APPS`; check 375×812 after adding a launcher.

## Asset handling — always use the HOCs

`components/high-order-components/CustomImage.tsx` and `CustomVideo.tsx` prefix `src` with `process.env.NEXT_PUBLIC_BASE_PATH` (needed for GitHub Pages subpath hosting) unless the src is absolute `http`. Use them instead of raw `<img>` / `<video>` for anything under `public/` in first-party code. (Ported files use raw `<img>` with `/os/...` paths; the site is served from the domain root, so that works today.)

`CustomVideo` also owns video analytics (play/pause/progress at 25/50/75/complete/unmute) and autoplays muted via IntersectionObserver at 0.25 threshold. Passing your own `onPlay`/`onPause`/etc. is fine — they're called after tracking.

OS assets live in `public/os/` (wallpaper, memes, `doc-icons/`). The CV is `public/CV-Javi.pdf`; replace the file to update it.

## i18n — three languages, one store

`stores/useLanguageStore.ts` holds `Language = "english" | "german" | "spanish"`, **defaults to German**, persisted in `sessionStorage` under `portfolio-language`. There is no translation lookup or i18n library; content is stored per language and picked at render time.

- **Content fields.** Translatable data uses sibling fields: `title` (English) / `titleGerman` / `titleSpanish`, `achievements` / `achievementsGerman` / `achievementsSpanish`, etc. The interfaces in `interfaces/` require all three, so `tsc` catches a missing translation. Read them with `localized(item, "title", language)` from `lib/i18n.ts`.
- **Inline copy.** Component strings use a `{ english, german, spanish }` object indexed by language (`COPY[language]`, `LABELS[language]`) or `byLanguage(language, {...})`. Typing those objects with all three keys is what makes `tsc` flag a missing language.
- **OS chrome** (menu bar, Dock and app names, folder names, item counts, project types, dates) lives in `components/os/os-i18n.ts`: `useOsChrome()`, `appName()`, `projectTypeLabel()`, `formatProjectDate()` (`DATE_LOCALE`: `en-GB`, `de-CH`, `es-ES`). `LANGUAGE_OPTIONS` is the single list every switcher renders.
- **Hydration.** The static HTML cannot know `sessionStorage`. Read the language in render through `useOsLanguage()` (or `useSyncExternalStore` like it), which returns German until hydration finishes, so server and client markup match.
- **Switchers.** Menu bar 🌐 item, System Settings → Language & Region, the Control Center tile (cycles EN → DE → ES) and Terminal `lang en|de|es`. `<html lang>` follows the language (`HTML_LANG`).
- Adding a language: extend `Language` and `LANGUAGES`, `HTML_LANG`, `DATE_LOCALE`, `LANGUAGE_OPTIONS`, every `*Spanish`-style field in `interfaces/` + `data/`, and every inline copy object; `tsc` lists what is left.

## Data layer

`data/*.data.ts` are typed by `interfaces/*.interface.ts`. Project files live in `data/projects/*.project.data.ts`, each exporting one `Project` const, aggregated (order = display order) in `data/projects.data.ts`. That array feeds the Projects folder, Notes → Projects, `/portfolio/[slug]` static params, per-project metadata and the sitemap.

- `data/experiences.data.ts` → Notes → Experience. `data/aboutMe.*.data.ts` → Notes → About me. Hobbies copy is inline in `notes-data.ts`.
- `data/certifications.data.ts` → Google Drive documents. Each entry has `folder: "certifications" | "references"`, which decides the Finder folder it appears in.
- `data/metrics.data.ts` → Activity Monitor; `data/architectures.data.ts` → Freeform; `data/technologies.data.ts` → About This Mac.

## Analytics

GA via `@next/third-parties/google`, id from `NEXT_PUBLIC_GA_ID` (`.env.local` is committed; the id is public by design). Both `<GoogleAnalytics>` and `<AnalyticsWrapper>` in `app/layout.tsx` are gated on that env var being present.

- Fire events through the typed helpers in `lib/analytics.ts` (`trackProjectClick`, `trackExternalClick`, `trackCvDownload`, `trackVideoEvent`), not raw `sendGAEvent`.
- `components/analytics-tracker.tsx` sends `page_view` manually on pathname/search change. It uses `useSearchParams`, so it **must** stay wrapped in `<Suspense>` — that's the sole reason `Analytics-wrapper.tsx` exists. Static export fails the build otherwise.
- `lib/analytics.ts` has a stray `import { url } from "inspector/promises"` (unused Node builtin in client code). Remove it if touching the file.

## Styling

- Plain CSS, imported once in `app/layout.tsx`: `components/os/os.css` (ported; starts with `@import "tailwindcss"`), `startup-screen.css`, and `project-window.css` (first-party: Javi's apps, the References/About-me additions, window clamps, the iOS close button). Put new first-party styles in `project-window.css` or a new file next to the module, not in `os.css`.
- Tailwind CSS v4 is still loaded by `os.css` because the ported Instagram/ChatGPT/Facebook apps use utility classes. There is no `tailwind.config.ts`.
- The wallpaper is a CSS variable, `--wallpaper`, set from Settings (`WALLPAPERS` in `settings-app.tsx`).
- **Light-only (f-004).** `:root` sets `color-scheme: light`; there is no dark theme. Don't add `dark:` variants or `prefers-color-scheme` rules.
- Mimic macOS/iOS faithfully (SF-style system font stack, glass blur, Dock shadow); that is the design, not a generic UI.
- `components/ui/` (shadcn), `hooks/`, `styles/globals.css`, `components.json` and their Radix/`next-themes` dependencies are leftovers of the pre-OS site: nothing renders them. Don't build on them (ticket f-029 removes them). They are still scanned by Tailwind, which is why one inert `prefers-color-scheme` rule appears in the emitted CSS.

## Animation

Use `motion/react` (package `motion` v12). **Never import `framer-motion`.** The OS animations (window open/close, minimize, iOS app launch and home gestures) live in `desktop.tsx` and follow macOS/iOS timing; match what is there. For CSS keyframes in first-party styles use the project easing `cubic-bezier(0.16, 1, 0.3, 1)` and always add a `prefers-reduced-motion: reduce` override.

## Language of authored content

The site copy is English, German and Spanish (Spain). Code comments are mostly English, with some Spanish in older files. Tickets in `docs/FEATURES.md` are written in Spanish.

---

## Git workflow

**Merge to `main` deploys to production.** `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`. There is no staging environment and no preview deploy — the diff and the local `out/` are the only review surface. Never push straight to `main`.

**Worktree per ticket.** Each ticket lives in its own sibling worktree cut from `origin/main`:

```
git fetch origin
git worktree add -b f-XXX-kebab-slug ../my-web-portfolio-nextjs.f-XXX origin/main
cd ../my-web-portfolio-nextjs.f-XXX && npm install
```

`.env.local` is committed here, so unlike the booking platform there is nothing gitignored to seed — but `node_modules` is per-worktree and `npm install` is required before `tsc`/`build` will run. Don't `checkout` a branch in the primary worktree except for trivial meta-doc edits.

After merge: `git worktree remove ../my-web-portfolio-nextjs.f-XXX && git branch -d f-XXX-kebab-slug` (`-D` if the PR was squash-merged). At session start, run `git worktree list` and drop any worktree whose branch is merged and whose status is clean.

**Descriptive commits.** Every commit must read on its own. No `wip`, no `update X`, no `fixes`.

**Subject (≤72 chars):** `tipo(f-XXX): verb + concrete object + short motivation`
- Good: `chore(f-001): hide Full Stack Calendar project from the public site`
- Bad: `update projects`, `f-001 changes`

**Body (mandatory):**
```
Qué:
- <files/modules touched and what changed>

Por qué:
- <business or technical motivation>

Cómo verificar:
- <manual steps / command / "N/A: refactor">

Refs: f-XXX
```

Trivial commits (typo, mechanical rename) may carry a one-line body, but the `Refs:` footer with the ticket is always mandatory. Stage explicitly per file or folder — **never `git add -A`** (`.claude/` and `tsconfig.tsbuildinfo` are untracked and not gitignored; a blind `add -A` commits them).

**Before every PR to `main`:**

- [ ] Branch is `f-XXX-kebab-slug` cut from an up-to-date `main` — no piggybacking on a previous ticket's branch.
- [ ] PR opened against `main`, titled `feat(f-XXX): …` / `chore(f-XXX): …` / `docs(f-XXX): …`.
- [ ] `npx tsc --noEmit` clean and `npm run build` green — the build alone proves nothing, it ignores type errors.
- [ ] If the ticket touched routes or `data/projects.data.ts`: inspected `out/` directly, not just the route list `next build` prints (it truncates with `[+N more paths]`).
- [ ] If it touched UI: checked at 1280×800 and 375×812, in all three languages (EN/DE/ES), and reviewed with the `impeccable` skill for visual changes.
- [ ] Ticket in `docs/FEATURES.md` moved to `review` (or `done`).

## Agent workflow

Full spec in [`docs/WORKFLOW.md`](docs/WORKFLOW.md). In short: `caveman:cavecrew-investigator` to locate, `Plan` to design (never edits), `caveman:cavecrew-builder` for 1-2 file edits, `caveman:cavecrew-reviewer` on the diff before any PR. No ticket in `FEATURES.md` → no delegation; the ticket is the scope.

Two rules that matter most here:
- Changes to conventions (this file) are their own ticket, never a side effect of a feature.
- Give the reviewer the static-export context explicitly (no server runtime, `out/` is what ships, every route renders `<Desktop />`). Without it, it suggests server-side fixes that cannot exist here.
