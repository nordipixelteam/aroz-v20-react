# AROZ v20 — React migration of V19

This repository converts **all 37 HTML pages from AROZ V19** into a React 19 + Vite application. V19 page markup is translated to React elements at runtime, preserving the exact original HTML structure, copy, inline styles, imported stylesheets, image/font assets, navigation, and animations.

## Run

```bash
npm install
npm run dev
```

Open the address printed by Vite (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

The deployable production output is `dist/`. Deploy the **React project** to Vercel or Netlify with `npm run build` and output `dist`.

## Architecture

- `src/main.jsx`: React app, route resolver, page DOM-to-React conversion and legacy interaction loader.
- `src/content/*.json`: original V19 page HTML content, metadata, CSS link lists, and JS references; 37 pages.
- `public/assets/` and nested public asset folders: original V19 images, CSS, fonts and JavaScript.
- Full-page links still trigger normal navigation. This is intentional: original page-specific V19 scripts assume one initialization per page, so it avoids duplicate event listeners and preserves behavior.

## Migration limitations and next steps

This is a **React-powered compatibility migration**, not a rewrite of every section into idiomatic JSX components. The original V19 animations and UI behavior still run using the existing vanilla JS files. Before adding stateful React behavior to individual sections, move their legacy event handlers into React hooks or isolate them to avoid DOM ownership collisions. The contact form and booking availability remain **preview-only**, exactly as in V19. Adding a CMS, live form backend, and real booking provider is separate work.

Most importantly, do not mistake the runtime-to-React conversion for content editing: a CMS is still required if the client must edit text and images through a dashboard.
