# FEATURES — Web Portfolio

Backlog vivo. **Fuente de verdad del scope por ticket.** Sin ticket aquí, no se delega a un subagente.

Formato en [`WORKFLOW.md`](./WORKFLOW.md) §"Formato de ticket". Estados: `backlog | in-progress | review | done | blocked`.

---

## f-001 — Ocultar el proyecto Full Stack Calendar

- Estado: done · Prioridad: P1
- AC:
  - [x] `FULL_STACK_CALENDAR` fuera del array `projects`
  - [x] Sin card en `/portfolio` y sin página `/portfolio/full-stack-calendar` en `out/`
  - [x] Sin links muertos: fuera de `relatedProjects` en `data/experiences.data.ts`
  - [x] Fuera de `public/sitemap.xml`
  - [x] `data/projects/FullStackCalendar.data.ts` y los assets `/public/calendar-*` intactos, para poder restaurarlo
- Notas: PR #2, mergeada. Restaurar = volver a añadir la entrada al array de `data/projects.data.ts`.

## f-002 — Documentación de proyecto + workflow con agentes

- Estado: done · Prioridad: P1
- AC:
  - [x] `CLAUDE.md` describe las constraints reales del export estático
  - [x] Ritual de git (worktrees, commits `Qué/Por qué/Cómo verificar/Refs`, PRs) documentado
  - [x] Loop de subagentes documentado en `docs/WORKFLOW.md`
  - [x] `AGENTS.md` como puntero fino, sin convenciones propias
- Notas: PR #3, mergeada. Portado de `snowboard-booking-platform`.

## f-003 — `public/sitemap.xml` se mantiene a mano y ya está desincronizado

- Estado: done · Prioridad: P2
- AC:
  - [x] `better-auth-boilerplate-and-tradeoffs` presente en el sitemap servido
  - [x] El sitemap se deriva de `data/projects.data.ts`, no se edita a mano
  - [x] Un proyecto nuevo aparece en el sitemap sin tocar ningún fichero extra
- Notas: `app/sitemap.xml.tsx` no se emitía porque no es ninguna convención de Next: un route handler necesita `app/sitemap.xml/route.ts`, y la convención de metadata es `app/sitemap.ts`. Sustituido por `app/sitemap.ts` (`MetadataRoute.Sitemap`), que sí se prerenderiza a `out/sitemap.xml` bajo `output: "export"`. `public/sitemap.xml` borrado — si volviera, ganaría él (los ficheros de `public/` se copian sobre el output). Las rutas estáticas siguen listadas a mano en `STATIC_PATHS`; solo los proyectos son automáticos. Detectado en f-001.
- Pendiente (ticket propio): `STATIC_PATHS` puede desincronizarse en silencio. Ver f-008.
- PR #5, mergeada. Verificado en producción: `sitemap.xml` sirve 15 `<loc>` y 0 de `full-stack-calendar`.

## f-008 — `STATIC_PATHS` del sitemap se puede desincronizar en silencio

- Estado: backlog · Prioridad: P2
- Depende de: f-003
- AC:
  - [ ] Añadir una ruta estática nueva bajo `app/` la mete en el sitemap sin editar `app/sitemap.ts`, **o** el build falla si `STATIC_PATHS` no cuadra con el árbol de rutas
- Notas: f-003 automatizó las rutas de proyecto pero dejó las estáticas (`""`, `about`, `portfolio`, `experience`, `contact`, `metrics`) a mano. Hoy cuadran una a una con los `page.tsx` de `app/`, pero nada lo comprueba: una página nueva (`/privacy`, `/terms`) se quedaría fuera del sitemap sin aviso. Salió en el review de f-003. Ojo al derivarlo del filesystem: hay que ignorar route groups, segmentos dinámicos y carpetas privadas, y `app/portfolio/[slug]` ya lo cubren los proyectos.

## f-004 — El dark mode no está enchufado

- Estado: done · Prioridad: P2
- AC:
  - [x] Decidir: montar `ThemeProvider` en `app/layout.tsx` o borrar `components/theme-provider.tsx` y las variables `.dark` — **decisión del owner: borrar, el sitio es light-only**
  - [x] Si se monta: revisar contraste con la skill `impeccable`, incluido el botón scroll-to-top del footer (`bg-accent` es casi invisible en light) — N/A, no se monta
- Notas: borrados `components/theme-provider.tsx` y el bloque `.dark` de `app/globals.css`. **`@custom-variant dark (&:is(.dark *))` se queda a propósito**: los 43 `dark:` de los primitivos generados de `components/ui/` dependen de él, y sin él Tailwind v4 cae a su variante `dark` nativa por `prefers-color-scheme` y los encendería para visitantes con el SO en oscuro, contra tokens light-only. Verificado en el CSS emitido: 0 `prefers-color-scheme`, 0 `.dark{`, 35 selectores `:is(.dark *)` inertes. `next-themes` **sigue en dependencias** porque `components/ui/sonner.tsx` importa `useTheme`; ese primitivo no está montado en ninguna parte, así que borrarlo + quitar la dep es su propio ticket de limpieza de `components/ui/`. El botón scroll-to-top del footer sigue con `bg-accent` casi invisible en light — sigue abierto, ahora sin relación con el dark mode.
- PR #6, mergeada. El review verificó el claim del `@custom-variant` construyendo sin él: aparece `@media (prefers-color-scheme:dark)` y se encenderían 35 utilidades.

## f-005 — `npm run lint` está roto

- Estado: done · Prioridad: P2
- AC:
  - [x] O se instala eslint + config y el script pasa, o se borra el script — **decisión del owner: instalar**. `npm run lint` sale con 0 errores y 0 warnings
  - [x] `typescript.ignoreBuildErrors` revisado: hoy el build pasa con errores de tipos — **borrado**, el build ya falla con un type error (verificado metiendo uno a propósito)
- Notas: eslint 9 + `eslint-config-next` 16.0.7 en flat config (`eslint.config.mjs`). Next 16 eliminó `next lint`, así que el script sigue siendo `eslint .`. El baseline eran 13 findings; los de código propio están arreglados de verdad, no silenciados:
  - `components/metrics.tsx` llamaba a `Math.random()` en el render para 20 estrellas → posiciones distintas en el prerender y en el cliente, o sea hydration mismatch. Ahora es un PRNG mulberry32 con semilla fija a nivel de módulo: determinista y visualmente igual.
  - `CustomImage` recibía `alt` por el spread de props, lo que ocultaba el `<img>` a `jsx-a11y/alt-text`. Ahora `alt` es obligatorio en la interfaz y se pasa explícito; los 5 callers ya lo pasaban.
  - `exhaustive-deps` en `architecture.tsx` (`[architectures.length]`) y `language-switch.tsx` (`[setLanguage]`).
  - Silenciado con motivo: `components/ui/**` y `hooks/use-mobile.ts` (generado por shadcn, `CLAUDE.md` dice regenerar en vez de editar; `ui/sidebar.tsx`, único consumidor del hook, no está montado), y la regla `@next/next/no-img-element` (bajo `output: "export"` + `images.unoptimized` el patrón del repo son los HOCs `CustomImage`/`CustomVideo`, así que solo daría falsos positivos).
  - `tsconfig.tsbuildinfo` añadido a `.gitignore`: lo genera `tsc --noEmit` y ensuciaba `git status` en cada worktree.
- Pendiente (ticket propio): el workflow de deploy no ejecuta `npm run lint`, así que la puerta es local. Ver f-007.
- PR #7, mergeada. Rebasada sobre f-003 antes del merge: `app/sitemap.ts` entra en el scope del lint y pasa.

## f-006 — El deploy usa acciones sobre Node 20, ya deprecado

- Estado: done · Prioridad: P1
- AC:
  - [x] `.github/workflows/deploy.yml` sin acciones que targeteen Node 20
  - [x] `node-version` alineado con el Node local de desarrollo (24)
  - [x] El run de deploy en `main` termina sin el warning `Node.js 20 is deprecated`
- Notas: el run 31673603328 avisa `The following actions target Node.js 20 but are being forced to run on Node.js 24: actions/checkout@v4, actions/setup-node@v4, actions/upload-artifact@v4, actions/deploy-pages@v4`. El runtime ya era Node 24 de facto; el bump solo lo hace explícito. Ver [deprecación de Node 20](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/).

## f-007 — El deploy no ejecuta lint

- Estado: backlog · Prioridad: P2
- Depende de: f-005, f-006
- AC:
  - [ ] `.github/workflows/deploy.yml` ejecuta `npm run lint` antes del build
  - [ ] Un error de lint tumba el deploy
- Notas: desde f-005 `npm run lint` pasa limpio, así que enchufarlo a CI ya no arrastra deuda. No se metió en f-005 para no chocar con las PRs que ya tocaban ese fichero (f-006 y f-009).

## f-009 — Un re-run del workflow puede republicar un commit viejo sobre producción

- Estado: review · Prioridad: P0
- Depende de: f-006
- AC:
  - [x] Dos merges seguidos no cancelan ningún deploy
  - [x] Un re-run de un run cuyo commit ya no es el tip de `main` falla en vez de publicar
  - [x] El mensaje de error dice cuál es la alternativa correcta (`workflow_dispatch` sobre `main`)
- Notas: **incidente real, no hipotético.** f-001 escondió Full Stack Calendar y aun así el proyecto seguía en producción. Secuencia, sacada de la API de Actions y Deployments:
  1. `06:22:16` se mergea la PR #3 → push de `65be17f`, arranca el run `31673580686`.
  2. `06:22:38` se mergea la PR #2 (f-001) → push de `5c06af5`; con `cancel-in-progress: true` el run de `65be17f` se **cancela**.
  3. `06:24:45` `5c06af5` despliega bien: el calendario desaparece de producción.
  4. `~06:27:52` se hace **re-run** del run cancelado (`run_attempt=2`).
  5. `06:28:15` ese intento despliega **`65be17f`**, que es anterior a f-001 y todavía lleva `FULL_STACK_CALENDAR` en el array. `06:28:17` el deployment correcto pasa a `inactive`.
  → producción rueda hacia atrás en silencio. Confirmado: `git merge-base --is-ancestor 5cfb03a 65be17f` es falso.
  
  La clave es que **"Re-run jobs" reejecuta el commit al que estaba fijado el run, no el tip de `main`**. Un run cancelado parece algo que hay que reintentar, y reintentarlo es justo lo que rompe producción. `cancel-in-progress: false` quita el motivo para reintentar (los runs se encolan en orden de push, así que el último que publica es el más nuevo) y el step guarda la puerta para el caso manual. El guard solo corre si `github.run_attempt != '1'`: en el intento 1 el commit pusheado es el tip por definición.
  
  Probado en local contra el commit real del incidente: con `65be17f` sale `exit 1`; con el tip actual continúa.

## f-010 — Las imágenes webp no tienen fallback raster real

- Estado: backlog · Prioridad: P3
- AC:
  - [ ] `CustomImage` (`components/high-order-components/CustomImage.tsx:28-34`) emite `<source type="image/webp" srcSet={webp}>` + `<img src={jpgFallback}>`, donde `jpgFallback` deriva del webp cambiando la extensión (`.webp`→`.jpg`) con el mismo prefijado de `BASE_PATH`. Hoy el `<source>` y el `<img>` apuntan **ambos** al webp, así que un navegador sin webp no cae a ningún lado.
  - [ ] Existe un `.jpg` para **cada webp servido vía `CustomImage`** — no solo los ~35 de `data/**`, también los srcs a nivel de componente (p.ej. el default `/manager.webp` en `components/hero.tsx:40`). El set = todo webp que llega a `CustomImage`, hay que enumerar los call sites, no solo `data`.
  - [ ] Los 2 hermanos que hoy son `.png` (`call-tracking-cover.png`, `next-ecosystem.png`) se regeneran como `.jpg` para que el swap `.webp`→`.jpg` sea uniforme; `seated.jpg` y `smiling.jpg` ya valen tal cual.
  - [ ] Los jpg de fallback van **comprimidos y a las mismas dimensiones** que su webp (mozjpeg q~80): un navegador sin webp no debe descargar un jpg gigante — el objetivo del audit de rendimiento no se puede deshacer por fallbacks obesos.
  - [ ] `out/**` inspeccionado: cada `<picture>` lleva `<source type="image/webp">` + `<img src="....jpg">`; con webp se sirve webp, sin webp el jpg.
  - [ ] `tsc --noEmit` limpio, `npm run lint` 0/0, `npm run build` verde.
- Notas: **decisión del owner: generar jpg para todos** (cobertura 100%), frente a una prop `fallbackSrc` opcional o cablear solo los 4 pares que ya existen. Situación de partida: de los ~35 webp referenciados en `data/**`, solo 4 tienen raster hermano en disco (`seated.jpg`, `smiling.jpg`, `next-ecosystem.png`, `call-tracking-cover.png`); los otros ~31 no tienen ninguna fuente a la que caer, así que "activar fallback" no es solo tocar `CustomImage`, hay que **generar** el raster. Contexto: webp tiene soporte ~97%+ global (universal desde 2020: Chrome/Edge/Firefox siempre, Safari 14 / iOS 14 en adelante); este ticket es robustez para IE11 y Safari<14, audiencia mínima. Constraint del export estático (`images.unoptimized`): los jpg se copian de `public/` tal cual, sin optimización de Next → de ahí el AC de compresión. Fuera de scope: el `<source>` mobile comentado (`generateMobileRoute`, TODO en `CustomImage.tsx:29-32`) y los `og:image` webp de los metadatos (`app/**`), que van a scrapers sociales y no pasan por `<picture>`. Detectado en el audit de rendimiento de producción (agosto 2026).

## f-011 — Vídeos muertos pesando en el artefacto de producción

- Estado: backlog · Prioridad: P2
- AC:
  - [ ] Borrados `public/portfolio-intro.mp4` (71MB) y `public/portfolio-intro_old.webm` (52MB).
  - [ ] `npm run build` verde; el vídeo intro sigue reproduciéndose (usa `/portfolio-intro.webm`); sitio visualmente idéntico.
  - [ ] Ningún `out/**` referencia los ficheros borrados.
- Notas: 0 refs confirmado por grep en `data/ components/ app/`. El intro usa `/portfolio-intro.webm` (`data/aboutMe.personal.data.ts:50`, `data/aboutMe.professional.data.ts:53`; `components/about.tsx:108` alimenta ese webm a un `<source>`). El `.mp4` y el `_old.webm` no los referencia nada ni ningún patrón de fallback los toca. ~123MB fuera del artefacto. Detectado en el audit de rendimiento de producción (agosto 2026): `public/` pesa 518MB, de los que 494MB son vídeo.
- Pendiente (ticket propio):
  - Los vídeos **vivos** siguen brutales para lo que son (capturas de pantalla de demo): `e-commerce.webm` 83MB, `demo-better-auth.webm` 56MB, `next-ecosystem.webm` 48MB, `aem-demo.webm` 40MB, `portfolio-intro.webm` 36MB, etc. — cientos de MB entre todos. Re-encode (VP9/AV1, escalado al ancho real de reproducción, CRF~32) los baja 90%+. Además `CustomVideo` (`CustomVideo.tsx:155`) no pone `preload="none"` ni `poster`, así que cada página de proyecto se traga su vídeo entero al hacer scroll (el `IntersectionObserver` a 0.25 lanza `.play()`).
  - Rasters originales huérfanos (0 refs): `developer.{png,webp}`, `developer2.{png,webp}`, `minimalist-portfolio.png` y `manager.png` — **ojo:** `manager.webp` **sí** se usa (og:image en `app/**` y default de `hero.tsx`), solo sobra el `.png`. Limpiarlos encaja después de f-010, que decide qué rasters se quedan como fallback.

---

# Épica macOS / iOS (f-012 → f-024)

Rediseño total: el portfolio pasa a ser un escritorio macOS (desktop) que se convierte en home screen de iOS (mobile). Referencia: [asierbayon/asierbayonOS](https://github.com/asierbayon/asierbayonOS) (licencia WTFPL, copia permitida), publicado en <https://www.asierbayon.com/>.

Decisiones del owner (noviembre 2026), aplican a todos los tickets de la épica:

- **Port, no reescritura desde cero.** El código de Asier es 100% cliente (el worker de Cloudflare solo hace hosting), así que se porta a `components/os/` y se parte en módulos por app. Su `page.tsx` es un monolito de 7.330 líneas: cada ticket extrae y adapta solo la app que toca.
- **Contenido de Javi, no de Asier.** Todos los textos personales, proyectos, nombre, redes y CV son de Javi. Excepciones temporales pedidas por el owner: wallpaper, memes, playlist de Spotify y lista de YouTube se copian de Asier (con el nombre de Javi) hasta que haya sustitutos propios.
- **Logo de Apple en el boot** (decisión del owner: realismo).
- **Light only** (f-004 se mantiene). Las ventanas siguen el estilo claro de macOS.
- **Deep links.** `/about`, `/experience`, `/portfolio/[slug]`, etc. siguen existiendo como páginas estáticas con su metadata, y cargan el escritorio con esa ventana abierta.
- **Idioma EN/DE** vía `useLanguageStore`: System Settings › Language & Region + item visible en la menu bar (🌐 EN/DE). iOS: app Settings.
- **Mobile = iOS completo:** grid + dock, apps a pantalla completa con zoom desde el icono, home indicator para cerrar, carpetas como overlay iOS.
- **Coexistencia hasta el cutover.** Hasta f-024 el escritorio vive en `/desktop` con su propio root layout (route group `app/(os)`), aislado del CSS del sitio actual (`app/(site)`). Así cada PR se puede mergear a `main` sin romper producción. f-024 lo pasa a `/`.
- **Flujo:** desarrollar y abrir PRs encadenadas sin parar, una por ticket, cada una verificada (`tsc`, `lint`, `build`, navegador).

Mapa de contenido actual → OS:

| Contenido actual | macOS | iOS |
|---|---|---|
| Hero / intro | Boot screen (logo Apple) → escritorio | Boot → home screen |
| `portfolio-intro.webm` | `Intro.mov` en el escritorio → reproductor QuickTime | Icono en home |
| Portfolio (proyectos) | Carpeta `Projects` (Finder) → ventana por proyecto | Overlay de carpeta → app |
| Experience | Notes, una nota por trabajo | Notes |
| About personal / profesional | Notes, secciones "Personal" y "Professional" | Notes |
| Hobbies | Nota en Notes (snowboard en Flumserberg, fuerza, lectura, vídeo, podcast; fotos y links a YouTube) | Notes |
| Galería de fotos | Photos | Photos |
| Certificaciones | Carpeta `My certifications` → Preview con iframe de Drive (`/preview`) + botón "Open in Drive" | Igual |
| CV | `CV.pdf` en el escritorio → Preview con pdf.js + Download | Igual |
| Contact | Mail: compose prellenado → `mailto:`, CV adjunto | Mail |
| Metrics | Activity Monitor | Igual |
| Architectures | Freeform | Igual |
| Tech carousel | About This Mac | Settings › About |
| GitHub activity | Terminal (`git log`, `whoami`, `ls projects`, `open cv`, `lang de`) | — |
| LinkedIn / GitHub / YouTube | Un icono por red | Iconos en home |
| YouTube | App con lista curada + vídeos demo de proyectos como si fueran uploads | Igual |
| Extras de Asier | Spotify, Weather (España), Paint/editor de imagen, ChatGPT, Instagram, Facebook, Control Center, Trash, matrix rain, console art | Igual |
| Memes | Imágenes en el escritorio | Álbum en Photos |
| Analytics | Mismos helpers de `lib/analytics.ts`, más `window_open` | Igual |

Dock: Finder, Notes, Photos, Mail, YouTube, Spotify, Terminal, Activity Monitor, Settings, LinkedIn, GitHub, Trash.

## f-012 — Tickets de la épica macOS/iOS

- Estado: review · Prioridad: P1
- AC:
  - [x] Épica y tickets f-013..f-024 escritos en este fichero con AC binarios
  - [x] Decisiones del owner registradas arriba para no perderlas entre sesiones
- Notas: solo documentación. Incluye también f-010 y f-011, que estaban sin commitear en el worktree principal.

## f-013 — Shell del OS: boot, menu bar, ventanas, dock, home iOS

- Estado: review · Prioridad: P1
- Depende de: f-012
- AC:
  - [x] Route groups: el sitio actual se mueve a `app/(site)/` sin cambios visibles; el escritorio vive en `app/(os)/desktop/` con root layout y CSS propios (`components/os/os.css`), sin contaminar al sitio actual
  - [x] Boot screen con logo Apple y barra de progreso; se salta en visitas repetidas dentro de la misma sesión (`sessionStorage`)
  - [x] Menu bar: logo Apple, nombre de la app activa, reloj, iconos de estado, item visible de idioma (🌐 EN/DE) que cambia `useLanguageStore`
  - [x] Wallpaper de Asier (temporal)
  - [x] Window manager portado: arrastrar, foco/z-index, cerrar/minimizar/maximizar con semáforos, minimizar al dock
  - [x] Dock con magnificación, indicador de app abierta, orden del épico
  - [x] Iconos de escritorio (seleccionar, doble clic abre)
  - [x] iOS (<768px): home screen con grid, dock de 4, apps a pantalla completa, home indicator cierra
  - [x] Registro de apps tipado (array `apps` en `components/os/desktop.tsx`): cada ticket posterior añade una entrada + su componente
  - [x] `tsc --noEmit` limpio, `npm run lint` 0 errores, `npm run build` verde, sitio actual idéntico en `/`
- Notas: el port vive en `components/os/desktop.tsx` (monolito de Asier adaptado); la extracción a módulos por app ocurre en cada ticket que toca esa app, y el registro de apps es el array `apps` de ese fichero. CitizenX, X, Instagram y Facebook salen del dock hasta f-023 (sus imágenes de Asier no se publican). `eslint.config.mjs` relaja `react-hooks/refs` y `react-hooks/set-state-in-effect` solo en `desktop.tsx` y `youtube.tsx` portados. `/desktop` lleva `noindex` hasta f-024. Apps del épico aún sin portar (Finder real, Terminal, Activity Monitor, Settings…) llegan en sus tickets.

## f-014 — Finder + carpeta Projects + deep links de proyecto

- Estado: review · Prioridad: P1
- Depende de: f-013
- AC:
  - [x] Finder portado (sidebar Favorites/iCloud, vista de iconos)
  - [x] Carpeta `Projects` en el escritorio con un icono por entrada de `data/projects.data.ts` (mismo orden)
  - [x] Abrir un proyecto muestra una ventana con su contenido (título, descripción, tecnologías, imágenes, vídeo vía `CustomVideo`) en EN/DE
  - [x] `trackProjectClick` se dispara al abrir un proyecto
  - [x] `/desktop?open=project:<slug>` abre el escritorio con ese proyecto abierto (mecanismo de deep link reutilizado por f-024)
  - [x] iOS: carpeta como overlay; proyecto a pantalla completa
  - [x] Gates de f-013
- Notas: `FolderWindow` en `desktop.tsx` pasa a ser genérico (`folder: "secret" | "projects"`); el documento de proyecto vive en `components/os/project-window.tsx` + `.css`. En iOS la carpeta abre la app Files (patrón de Asier) en vez de un overlay de carpeta. `readDeepLink()` exportado para f-024. La carpeta "Projects" de Notes se mantiene hasta que f-015 reorganice Notes.

## f-015 — Notes: About, Experience, Hobbies

- Estado: review · Prioridad: P1
- Depende de: f-013
- AC:
  - [x] Notes portado (sidebar de carpetas, lista, cuerpo)
  - [x] Notas: "About — Professional", "About — Personal" (de `data/aboutMe.*`), una nota por trabajo de `data/experiences.data.ts` con logros, "Hobbies" (snowboard en Flumserberg, fuerza, lectura, vídeo, podcast; fotos y links a YouTube)
  - [x] Todo el texto cambia con el idioma (EN/DE)
  - [x] Gates de f-013
- Notas: datos en `components/os/notes-data.ts` (`buildNoteFolders(language)`), carpetas About me / Experience / Hobbies / Projects. Los proyectos relacionados de cada experiencia abren la ventana del proyecto (f-014). La nota "About Javi" provisional de f-013 desaparece. También corrige el breakpoint móvil de `project-window.css` a 700px (el de Asier).

## f-016 — Preview: CV.pdf, My certifications, memes

- Estado: review · Prioridad: P1
- Depende de: f-013
- AC:
  - [x] `CV.pdf` en el escritorio abre Preview con el PDF renderizado (pdf.js) y botón Download (`trackCvDownload`)
  - [x] Carpeta `My certifications` en el escritorio; cada certificación de `data/certifications.data.ts` abre Preview con iframe de Drive (`/file/d/ID/preview`) y botón "Open in Drive"
  - [x] Memes de Asier en el escritorio, abren en Preview
  - [x] Funciona en iOS (lanzadores CV.pdf y Certifications en la home; ventana a pantalla completa)
  - [x] Gates de f-013
- Notas: `components/os/preview-document.tsx` (pdf.js `pdfjs-dist@4.10.38`, worker emitido por el bundler en `_next/static/media/*.mjs`, GitHub Pages lo sirve como JS). Los memes de Asier ya se abrían en Preview con su editor de marcas desde f-013. Verificado en `out/` servido en local; el render se pausa si la pestaña no es visible (pdf.js pinta con `requestAnimationFrame`), comportamiento esperado. Requisito del owner: los ficheros de Drive deben seguir compartidos como "cualquiera con el enlace".

## f-017 — QuickTime (Intro.mov) + Photos

- Estado: review · Prioridad: P2
- Depende de: f-013
- AC:
  - [x] `Intro.mov` en el escritorio reproduce `portfolio-intro.webm` en un reproductor estilo QuickTime (eventos de `trackVideoEvent`)
  - [x] Photos portado con la galería de Javi (`CustomPhotoGallery` / datos de about) + álbum Memes
  - [x] Gates de f-013
- Notas: `components/os/movie-window.tsx` (QuickTime) usa `CustomVideo`, así que los eventos de vídeo salen solos; al darle a play pausa Spotify. Photos ahora lee `components/os/photo-library.ts` (álbumes Me, Work, Projects, Memes); en f-013 Photos apuntaba a las fotos de Instagram de Asier, que ya no se publican. **Pendiente owner:** pies de foto y fechas de las fotos personales son aproximados, revisarlos en `photo-library.ts`.

## f-018 — Mail (contacto) + apps de redes

- Estado: review · Prioridad: P2
- Depende de: f-013
- AC:
  - [x] Mail portado: compose con To de Javi, asunto/cuerpo editables, Send abre `mailto:`; CV adjunto descargable
  - [x] Iconos LinkedIn y GitHub abren el perfil en pestaña nueva con `trackExternalClick`
  - [x] Gates de f-013
- Notas: Mail traducido EN/DE; Send dispara `contact_email` (vía `trackEvent`) antes de abrir `mailto:`; el adjunto CV dispara `trackCvDownload`. Todos los iconos con `href` (LinkedIn, GitHub) disparan `trackExternalClick(name, "desktop")`, también desde la home de iOS.

## f-019 — YouTube + Spotify

- Estado: review · Prioridad: P2
- Depende de: f-013
- AC:
  - [x] YouTube portado con la lista curada de Asier (temporal) + los vídeos demo de proyectos en `public/*.webm` como si fueran uploads del canal de Javi; enlace al canal `@javi-tricker`
  - [x] Spotify portado con la playlist de Asier (temporal), nombre de Javi
  - [x] Solo una fuente de audio a la vez (lógica de `media.ts`)
  - [x] Gates de f-013
- Notas: los "uploads" de Javi (intro + playlist "Project demos" con cada `videoUrl` de `data/projects`) van primero en el feed y se reproducen con `CustomVideo` (analytics de vídeo incluidos) en vez del iframe; ids `local:<slug>`. Reclaman el audio igual que YouTube, así que pausan Spotify. Spotify ya se llamaba "Javi's Mix" desde f-013. Lista curada y playlist siguen siendo las de Asier hasta que el owner pase las suyas.

## f-020 — Terminal + GitHub activity

- Estado: review · Prioridad: P2
- Depende de: f-013
- AC:
  - [x] Terminal con prompt `javi@macbook ~ %`, comandos `help`, `whoami`, `ls`, `ls projects`, `open <app|proyecto>`, `open cv`, `lang en|de`, `git log` (actividad de GitHub de `GitHubActivity`), `clear`, easter eggs (`sudo`, `matrix`)
  - [x] Gates de f-013
- Notas: `components/os/terminal.tsx`. `git log` lee la API pública de eventos de GitHub en el cliente (60 req/h por IP, sin token). Desde 2025 GitHub ya no incluye commits en los `PushEvent` públicos, así que se muestran push/PR/review/create por repo. Extras: `neofetch`, `github` (gráfico de actividad), historial con ↑/↓, Ctrl+L, `matrix` usa el `MatrixRain` de Asier.

## f-021 — Activity Monitor, Freeform, About This Mac

- Estado: review · Prioridad: P2
- Depende de: f-013
- AC:
  - [x] Activity Monitor muestra `METRICS_DATA` (scores, facts, "Try it yourself") con estilo de gráficas de Activity Monitor
  - [x] Freeform muestra `architectures.data.ts` en un tablero
  - [x] About This Mac (menú Apple) lista el stack de `technologies.data.ts`
  - [x] Gates de f-013
- Notas: `components/os/system-apps.tsx`. Activity Monitor y Freeform van al Dock tras Terminal. About This Mac se abre al pulsar el logo de Apple de la menu bar. "Try it yourself" abre PageSpeed Insights con la URL del sitio (`trackExternalClick`). Los años de experiencia se cuentan desde 2018 ("8 years" del intro), también en el `neofetch` de f-020.

## f-022 — System Settings + Control Center

- Estado: review · Prioridad: P2
- Depende de: f-013
- AC:
  - [x] System Settings: Language & Region (EN/DE, etiquetado claramente como cambio de idioma), Wallpaper, About
  - [x] Control Center portado (Wi-Fi, Bluetooth, idioma, volumen)
  - [x] iOS: app Settings en home
  - [x] Gates de f-013
- Notas: `components/os/settings-app.tsx` (Language & Region, Wallpaper con 3 opciones —la de Asier + 2 degradados CSS propios—, About reutiliza About This Mac). El wallpaper elegido se guarda en `localStorage` (`javi-os-wallpaper`) y se aplica vía la variable CSS `--wallpaper`. Control Center: la tile de idioma sustituye a Stage Manager (desktop) y a Screen Mirroring (iOS). Cuando el owner suba su foto con su novia, basta con añadirla a `WALLPAPERS` y hacerla `default`.

## f-023 — Extras de Asier: Weather, Paint, ChatGPT, Instagram, Facebook, Trash

- Estado: review · Prioridad: P3
- Depende de: f-013
- AC:
  - [x] Weather portado con ubicación en España (widget: Madrid; app: Madrid, Granada, Sierra Nevada, Flumserberg, Zurich)
  - [x] Editor tipo Paint portado (lápiz, rotulador, texto): es el markup de Preview de Asier; además de los memes hay un lienzo en blanco `Sketch.png` en el escritorio
  - [x] ChatGPT portado (respuestas por intents locales, sin backend), adaptado a Javi
  - [x] Instagram y Facebook portados con contenido placeholder de Javi (sin fotos ni datos de Asier)
  - [x] Trash, matrix rain, console art
  - [x] Gates de f-013
- Notas: Instagram usa la librería de fotos de Javi (f-017) con el handle `javi-tricker` y solo el contador de posts, sin seguidores inventados; Javi no tiene Instagram, así que "Message" lleva a YouTube. Facebook mantiene el feed humorístico genérico de Asier (sin datos personales) con el perfil de Javi; se recuperan sus dos imágenes genéricas. ChatGPT: saludo adaptado a Javi. Console art: banner "JAVI" en la consola. CitizenX y X no se portan: son la empresa y la cuenta de Asier.

## f-024 — Cutover: el escritorio pasa a `/`

- Estado: review · Prioridad: P1
- Depende de: f-014..f-023
- AC:
  - [x] `/` sirve el escritorio; `/about`, `/experience`, `/metrics`, `/contact`, `/portfolio`, `/portfolio/[slug]` sirven el escritorio con la ventana correspondiente abierta y mantienen su metadata
  - [x] Sitemap incluye las mismas URLs; `out/` inspeccionado
  - [x] Componentes del sitio antiguo sin uso eliminados; `app/(site)` desaparece
  - [x] GA sigue enchufado
  - [ ] Gates de f-013 + review `impeccable` en EN y DE, desktop y mobile (gates sí: tsc, lint, build y navegador; la review `impeccable` queda pendiente para el owner antes de mergear)
- Notas: el root layout es el del OS (metadata SEO del sitio antiguo, sin `noindex`). Cada ruta antigua renderiza `<Desktop open={…} />` con su metadata: `/about` → nota Professional, `/experience` → primera nota de Experience, `/metrics` → Activity Monitor, `/contact` → Mail, `/portfolio` → carpeta Projects, `/portfolio/<slug>` → ventana del proyecto. También `?open=<kind>:<value>` en cualquier URL. `not-found` muestra el escritorio. Se corrige el canonical de `/experience`, que apuntaba a `/metrics`. Borrados los componentes, datos e i18n del sitio antiguo sin uso (`lib/intl.ts`, `i18n/`, header/footer/hero/…). `out/` revisado: 9 proyectos, `sitemap.xml` con 15 URLs, canonicals y GA presentes.

## f-025 — Actualizar CLAUDE.md y WORKFLOW.md a la arquitectura OS

- Estado: backlog · Prioridad: P2
- Depende de: f-024
- AC:
  - [ ] `CLAUDE.md` describe `components/os/` (desktop.tsx monolito portado + módulos por app), el registro `apps`, las window kinds y los deep links (`open` prop / `?open=`)
  - [ ] Sección i18n: desaparece el sistema 2 (`lib/intl.ts`, `i18n/`), queda solo `useLanguageStore`, con la guarda de hidratación (`useSyncExternalStore`) para leerlo en render
  - [ ] Documentado el override de ESLint para `desktop.tsx`/`youtube.tsx` portados y por qué
  - [ ] Notas de estilo: `os.css` (de Asier) + `project-window.css` (propio); los tokens shadcn/`globals.css` ya no existen; el wallpaper va por `--wallpaper`
  - [ ] Revisar si `components/ui/` (shadcn) y sus dependencias siguen haciendo falta; si no, ticket aparte para quitarlas
- Notas: convenciones = ticket propio (regla de CLAUDE.md), por eso no va dentro de f-024.

## f-026 — Fixes de la review impeccable del escritorio

- Estado: review · Prioridad: P1
- Depende de: f-024
- AC:
  - [x] iOS: los widgets 2×2 no tapan los iconos (filas con alto mínimo = medio ancho de página); las apps se reparten en 2 páginas con las relevantes para recruiters primero; puntos de página de 24px
  - [x] Alemán completo en el chrome del OS: menu bar (Ablage, Bearbeiten…), Dock y home (Notizen, Fotos, Aktivitätsanzeige, Systemeinstellungen, Wetter, Papierkorb), títulos de ventana y carpetas (Projekte, Meine Zertifikate, Nicht öffnen), Neue E-Mail, Papierkorb vacío, contadores de objetos, tipo de proyecto y fecha `de-CH`; `<html lang>` sigue al idioma
  - [x] Los iconos del escritorio y de Finder se abren con un clic (Enter también)
  - [x] La URL sigue a la ventana en primer plano (`/portfolio/<slug>`, `/portfolio`, `/about`, `/experience`, `/contact`, `/metrics`, si no `/`), con `replaceState`
  - [x] Botón de cerrar visible en iOS para las apps propias (proyecto, Preview, QuickTime, Terminal, Activity Monitor, Freeform, Settings, About)
  - [x] En escritorio las ventanas no bajan por debajo del Dock (máx. `100vh - 150px`)
  - [x] Widget del tiempo rota entre Madrid, Flumserberg y Zurich (decisión del owner: "todas")
  - [x] `tsc`, `lint`, `build` y navegador (375×812 y 1280×800, DE)
- Notas: el owner decidió mantener todo el contenido de Asier (memes, Facebook…). El hallazgo de "duplicados en el árbol de accesibilidad" era un falso positivo: la capa oculta usa `display: none`. Strings en `components/os/os-i18n.ts`. La review queda en `.impeccable/critique/` (sin commitear).

## f-027 — Contenido del owner: Java, B1, References, CV nuevo, Intro destacado

- Estado: review · Prioridad: P1
- Depende de: f-026
- AC:
  - [x] About This Mac: "Chip" incluye Java (`TypeScript · Java · React · Next.js`)
  - [x] "Dont play this video.mov" vuelve a reproducirse: el `VideoWindow` reclama el audio al montarse (Strict Mode soltaba el claim y el player se quedaba en negro, pausado)
  - [x] Nuevo certificado telc Deutsch B1 en "Meine Zertifikate"
  - [x] Nueva carpeta "References" / "Referenzen" (escritorio, home iOS, deep link `?open=folder:references`, `open references` en Terminal) con la carta de recomendación y la Arbeitsbestätigung; salen de Certifications
  - [x] Intro.mov destacado: arriba a la derecha con un globo "About me · Watch this first" (respeta `prefers-reduced-motion`; el hueco a su izquierda queda libre); en iOS se llama "About me" con punto rojo y va primero
  - [x] "Don't Open" contiene también el intro como "The video you should see.mov"
  - [x] `public/CV-Javi.pdf` sustituido por el CV nuevo (Lead Software Engineer AI)
  - [x] `tsc`, `lint`, `build` y navegador (1280×800 y 375×812, DE)
- Notas: fecha y emisor de la Arbeitsbestätigung pendientes del owner (`data/certifications.data.ts`). Clave de posiciones del escritorio subida a `v3` para que todos vean el nuevo orden.

## f-028 — Español como tercer idioma

- Estado: review · Prioridad: P1
- Depende de: f-027
- AC:
  - [x] `Language = "english" | "german" | "spanish"` en `stores/useLanguageStore.ts` (default sigue siendo alemán)
  - [x] `lib/i18n.ts`: `localized(item, key, language)` lee `key` / `keyGerman` / `keySpanish`; `byLanguage()` para copy inline; `HTML_LANG` y `DATE_LOCALE` (`es-ES`)
  - [x] Campos `*Spanish` en interfaces y en todo `data/` (proyectos, experiencias, about, métricas, arquitecturas, certificaciones)
  - [x] Chrome del OS en español (`os-i18n.ts`): menu bar, Dock, carpetas, nombres de apps, tipos de proyecto, fechas
  - [x] Selectores: menu bar 🌐 (EN/DE/ES), Ajustes del Sistema, tile de Control Center (cicla EN→DE→ES), Terminal `lang en|de|es`
  - [x] Apps propias traducidas: Notas (incl. Aficiones), proyecto, Preview, Mail, Monitor de Actividad, Freeform, Acerca de este Mac, Ajustes
  - [x] Corregida la comilla suelta al inicio de la descripción de Trading Algorithm (EN/DE)
  - [x] `tsc`, `lint`, `build` y navegador (1280×800 y 375×812, ES)
- Notas: las apps de Asier (Weather, ChatGPT, Instagram, Facebook, Paint, YouTube, Spotify) siguen en inglés en los tres idiomas, como antes en alemán.
