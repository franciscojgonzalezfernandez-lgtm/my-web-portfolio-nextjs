import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// eslint-config-next/core-web-vitals already bundles the "next",
// "next/typescript" and "next/core-web-vitals" configs, so it is the only
// import needed. Next 16 dropped `next lint`, so the npm script calls eslint
// directly and this flat config is what it picks up.
const config = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      "next-env.d.ts",
      // Generated shadcn/ui primitives. CLAUDE.md says to regenerate rather
      // than hand-edit them, so linting them only produces findings we are not
      // allowed to fix in place.
      "components/ui/**",
      // Same origin: shadcn emits this hook next to components/ui, and its only
      // consumer is components/ui/sidebar.tsx, which nothing mounts.
      "hooks/use-mobile.ts",
    ],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // next/image is not usable here: next.config.mjs sets output: "export"
      // with images.unoptimized, and public assets have to go through the
      // CustomImage / CustomVideo HOCs to pick up NEXT_PUBLIC_BASE_PATH. Raw
      // <img> is the intended pattern in this repo, so the rule would only ever
      // report false positives.
      "@next/next/no-img-element": "off",
    },
  },
  {
    // Ported from asierbayon/asierbayonOS (WTFPL) for the macOS/iOS redesign
    // (f-013). That code reads refs in render helpers and syncs state in
    // effects on purpose (pointer/drag bookkeeping, media handshakes); it is
    // runtime-verified. These React Compiler rules are relaxed only here, and
    // new first-party files under components/os keep them on.
    files: [
      "components/os/desktop.tsx",
      "components/os/youtube.tsx",
    ],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
