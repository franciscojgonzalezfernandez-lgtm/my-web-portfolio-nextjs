# WORKFLOW — Web Portfolio

Workflow operativo para implementar features con subagentes. Léelo al inicio de cada sesión.

Adaptado del flujo de `snowboard-booking-platform`. Las convenciones de código y el ritual de git viven en [`../CLAUDE.md`](../CLAUDE.md) — no duplicarlas aquí para evitar drift. Este archivo solo cubre: cómo orquestar subagentes y qué hay que verificar antes de una PR.

**Fuente de verdad del scope:** [`FEATURES.md`](./FEATURES.md). Sin ticket, no se delega.

---

## Loop por feature: Locate → Plan → Build → Review

| Fase | Herramienta | Cuándo |
|---|---|---|
| A. Locate | `caveman:cavecrew-investigator` | Solo si el feature toca código existente ("¿dónde vive X?", "¿quién referencia Y?"). En este repo casi siempre aplica: los datos están centralizados y un cambio en `data/` se propaga a ventanas, Notes, rutas, metadata y sitemap. `components/os/desktop.tsx` tiene ~7.7k líneas: localizar antes de leer. |
| B. Plan | Subagente `Plan` (no edita) | Default para features ≥3 archivos o lógica no trivial. Skip en typo/rename/cambio de una función. |
| C. Build | `caveman:cavecrew-builder` (1-2 archivos) o main thread directo (multi-archivo) | Nunca delegar edits de código a `general-purpose` — pierde contexto. Excepción: traducciones de `data/` en paralelo (un agente por grupo de archivos disjunto), como en f-028; el main thread revisa con `tsc` y una muestra. |
| D. Review | `caveman:cavecrew-reviewer` sobre el diff + skill `impeccable` si toca UI | Obligatorio antes de `done`. |

### Reglas duras

- Sin ticket en `FEATURES.md` → sin subagente. El ticket = scope.
- `Plan` **no edita**. Builder **no crea archivos** no listados en el ticket. Reviewer **no propone refactors** fuera de scope, pero sí reporta leftovers dentro de scope.
- Cambios al stack o a las convenciones (`CLAUDE.md`) son su propio ticket — nunca side-effect de otro feature.
- Al reviewer hay que darle el contexto de export estático explícitamente: no hay runtime de servidor, lo que se publica es `out/` y todas las rutas renderizan `<Desktop />`. Sin él propone arreglos de servidor imposibles aquí.

---

## Ritual de git

Worktree por ticket, commits descriptivos con body `Qué / Por qué / Cómo verificar / Refs`, push + `gh pr create` antes de marcar `done`. Spec completa en [`../CLAUDE.md`](../CLAUDE.md) §"Git workflow".

Sin PR abierta, el ticket **no está done**, aunque el código funcione localmente.

---

## Verificación per-feature

No hay Vitest ni Playwright instalados en este repo. La puerta de calidad es:

```bash
npx tsc --noEmit    # obligatorio: además detecta traducciones que faltan (campos *German / *Spanish)
npm run lint        # obligatorio: eslint.config.mjs (override solo para desktop.tsx/youtube.tsx portados)
npm run build       # obligatorio: es el export estático real; también falla con errores de tipos
```

Además, según lo que toque el ticket:

- **Rutas o `data/projects.data.ts`** → comprobar `out/` de verdad: `ls out/portfolio/` y `grep` en `out/sitemap.xml`. El listado de rutas que imprime `next build` trunca a partir de 3 (`[+N more paths]`), así que no basta con leerlo.
- **UI** → `npm run dev` y navegador a 1280×800 (macOS) y 375×812 (iOS): nada tapado por el Dock ni por los widgets, la home cabe en sus páginas. Review con la skill `impeccable` si el cambio es visual. Solo light: no hay dark mode que comprobar.
- **Textos** → verificar en inglés, alemán y español; el store arranca en alemán. `sessionStorage.clear()` + recarga repite el arranque.
- **Audio/vídeo** → abrir con clic real (no `element.click()` por JS: sin gesto de usuario el autoplay se bloquea) y comprobar que suena en `npm run dev` (Strict Mode) y en `out/`.
- **Deep links** → `/?open=...` y la ruta equivalente abren la ventana correcta; la URL sigue a la ventana en primer plano.
- **Analytics** → los eventos no se pueden verificar en local sin GA; describir en el ticket qué evento debería dispararse y dónde.

---

## Deploy

`main` está conectado a GitHub Pages vía `.github/workflows/deploy.yml`. **Merge a `main` = deploy a producción**, sin staging intermedio. No hay entorno de preview: lo que se revisa es el diff y el `out/` local.

---

## Formato de ticket

```md
## f-XXX — Título
- Estado: backlog | in-progress | review | done | blocked · Prioridad: P0 | P1 | P2
- Depende de: f-AAA
- AC:
  - [ ] Criterio binario 1
- Notas: ...
```

---

## Skills relevantes

- `impeccable` — review visual de UI. Obligatorio si el ticket toca componentes.
- `nextjs-app-router-patterns`, `vercel-react-best-practices` — patrones de App Router y perf.
- `mastering-typescript` — cambios de tipos en `interfaces/`.
- `security-review` — poco aplicable (sitio estático, sin auth ni backend), pero exigible si algún día entra un formulario o un endpoint externo.
- `playwright-skill` / `webapp-testing` — verificación en navegador contra `npm run dev`.

Instalados global pero **no** auto-activos aquí: `huashu-design`, `ui-ux-pro-max`, `design-taste-frontend`, `high-end-visual-design`, `imagegen-frontend-*`. Invocar explícitamente.

---

## Memoria

- `docs/FEATURES.md` (versionado): backlog vivo, tickets con AC binarios.
- Auto-memoria del agente (`~/.claude/projects/.../memory/`): solo lo *no derivable* del repo — decisiones del owner, preferencias confirmadas, blockers externos con fecha. NUNCA duplicar el backlog ahí.
