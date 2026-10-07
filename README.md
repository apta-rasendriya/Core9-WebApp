# Core9 website

Two parts, deployed together:

- **Main site** (`src/`): static HTML/CSS/JS built with Parcel into `build/`, served at `/`.
- **Insights blog** (`blog/`): plain PHP + MySQL, served at `/blog/`. See [blog/README.md](blog/README.md).

```
src/
├─ index.html                 home page
├─ drivesense/ camcore/ illytical/   product pages (index.html each)
├─ partials/                  HTML pieces pulled in with <include> (posthtml-include)
├─ styles/
│  ├─ desktop.css             desktop layout; px are converted to vw at build time
│  └─ mobile.css              phones + tablets (≤900px); kept in px
├─ js/
│  ├─ home.js                 home page scroll animations, menu, birds
│  ├─ product.js              product page scroll animations, menu
│  └─ jquery.js
└─ assets/
   ├─ images/                 brand/ clients/ backgrounds/ how-it-works/ products/{drivesense,camcore,illytical}/
   ├─ videos/  lottie/  fonts/
blog/                         PHP blog (repository classes in blog/src/)
docker/, compose.yaml         local preview of the full site
patches/                      patch-package fix for parcel-namer-custom
```

## Commands

```
npm install
npm run s          dev server at http://localhost:1234 (main site only)
npm run b          production build into build/
docker compose up -d --build   full site + blog at http://localhost:8090 (run `npm run b` first)
```

## Build config

Parcel reads `.parcelrc`, `.postcssrc` (px→vw at a 1920px design width; a file
opts out with `/* pxtoviewport?disable=true */`, as `styles/mobile.css` does),
`.posthtmlrc` (partials resolve from `src/`), and the `htmlnano` block in
`package.json`.
