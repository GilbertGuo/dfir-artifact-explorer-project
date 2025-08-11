# DFIR Artifact Explorer

A Next.js + Tailwind app to document and search forensic artifacts across Windows, Linux, and Cloud (M365/GWS).

## Quick Start

```bash
# 1) Create folder and paste files
pnpm dlx create-next-app@latest dfir-artifact-explorer --ts --eslint --tailwind --src-dir=false --app --import-alias @/*
cd dfir-artifact-explorer
# Replace generated files with the ones in this scaffold (package.json, configs, etc.)

# 2) Install deps
npm i

# 3) Run
npm run dev
```

Open http://localhost:3000

### Add Artifacts
Edit `data/seed.json`. The UI will reflect new entries instantly during dev.

### Roadmap
- Persist data in JSON/MDX files
- Add Compare view and print-friendly pages
- Introduce search indexing (FlexSearch/Meilisearch)
```

---

## File Tree (reference)
```
.
├─ app/
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  └─ ArtifactExplorer.tsx
├─ data/
│  └─ seed.json
├─ next.config.mjs
├─ next-env.d.ts
├─ package.json
├─ postcss.config.js
├─ tailwind.config.ts
├─ tsconfig.json
└─ README.md
