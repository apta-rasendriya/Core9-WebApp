# Core9 website

Two parts, deployed together:

- **Main site** (`src/`): static HTML/CSS/JS built with Parcel into `build/`, served at `/`.
- **Insights blog** (`blog/`): plain PHP + MySQL with an admin panel, served at `/insights/`.
  See [blog/README.md](blog/README.md).

```
src/
├─ index.html                       home
├─ drivesense/ camcore/ illytical/  product pages
├─ compliance/                      compliance & data governance
├─ industries/<name>/               fleet-logistics, warehousing-distribution, manufacturing, retail-fmcg
├─ toolkit/  toolkit/<tool>/        self-serve calculators and checkers
├─ partials/                        nav, footer, Book a Demo popup — pulled in with <include> (posthtml-include)
├─ styles/                          main.css + site.css (shared), product/drivesense/toolkit.css (per page type)
├─ js/                              main.js (shared motion), site.js (current-page nav + demo popup),
│                                   per-page scripts, hero-*.js (hero images), vendor/ (GSAP, Lenis, three.js)
└─ assets/                          images/, logos/, videos/
blog/                               PHP blog; shared look is copied in from src/ by scripts/sync-blog.js
scripts/sync-blog.js                copies styles, scripts, logos and nav/footer/demo partials into blog/
docker/, compose.yaml               local preview of the full site
patches/                            patch-package fix for parcel-namer-custom
```

Each page passes `base` (path back to `src/`) to the partials, e.g.
`<include src="./partials/nav.html">{"base":"../"}</include>`. Links between
pages are root-absolute (`/drivesense/`), and links into the blog use
`/insights/` and `/insights/?article=<slug>`.

Every "Book a Demo" button links to `#book-demo`, which `js/site.js` turns into
the HubSpot demo form popup (`?demo=1` on any page opens it too).

## Commands

```
npm install
npm run s          dev server at http://localhost:1234 (main site only)
npm run b          production build into build/, then sync the blog
npm run sync-blog  copy the shared look into blog/ only
docker compose up -d --build   full site + blog at http://localhost:8090 (run `npm run b` first)
```

## Build config

Parcel reads `.parcelrc`, `.posthtmlrc` (partials resolve from `src/`) and the
`htmlnano` block in `package.json`. There is no PostCSS step: the CSS is
written in final units.

## Placeholders still in the design

The toolkit calculators' "email me the results" boxes run on the page but
don't send anywhere yet (look for `TODO(client)` and "Placeholder" in
`src/js/home-calc.js` and `src/js/tk-runtime.js`). Wire them to a HubSpot
form when one exists for calculator leads.
