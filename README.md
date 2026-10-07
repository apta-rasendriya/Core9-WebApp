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
├─ assets/                          images/, logos/, videos/
└─ static/                          copied into build/ as-is: .htaccess (compression + caching), og/ link-preview images
blog/                               PHP blog; shared look is copied in from src/ by scripts/sync-blog.js
scripts/sync-blog.js                copies styles, scripts, logos and nav/footer/demo partials into blog/
scripts/copy-static.js              copies src/static/ into build/
docker/, compose.yaml               local preview of the full site
patches/                            patch-package fix for parcel-namer-custom
```

Each page passes `base` (path back to `src/`) to the partials, e.g.
`<include src="./partials/nav.html">{"base":"../"}</include>`. Links between
pages are root-absolute (`/drivesense/`), and links into the blog use
`/insights/` and `/insights/?article=<slug>`.

Every "Book a Demo" button links to `#book-demo`, which `js/site.js` turns into
the demo popup (`?demo=1` on any page opens it too): our own form, styled
like the site, sent to the HubSpot demo form through HubSpot's form API.

## Commands

```
npm install
npm run s          dev server at http://localhost:1234 (main site only)
npm run b          production build into build/, copy src/static/, then sync the blog
npm run sync-blog  copy the shared look into blog/ only
docker compose up -d --build   full site + blog at http://localhost:8090 (run `npm run b` first)
```

## Build config

Parcel reads `.parcelrc`, `.posthtmlrc` (partials resolve from `src/`) and the
`htmlnano` block in `package.json`. There is no PostCSS step: the CSS is
written in final units.

## Performance

- Photos are WebP; logos and icons are SVG. Hero photos are plain <img>
  files that js/hero-gl.js also uses as its WebGL texture.
- `src/static/.htaccess` (copied to `build/`) gzips text files and lets
  browsers cache hashed assets for a year; pages are re-checked each visit.
  `blog/.htaccess` does the same for the blog.
- Blog uploads are resized and re-saved as WebP/JPEG on upload
  (`blog/src/ImageUpload.php`, needs PHP GD).

## Link previews

Each page's <head> has canonical, Open Graph and Twitter tags pointing at
https://core9.ai. Preview images are 1200×630 files in `src/static/og/`
(`core9.png` by default; the product pages have their own). The blog builds
its tags in `blog/partials/head.php`, using `SITE_URL` from its config.

## Toolkit leads

The calculators' "email me my results" boxes and the Pilot Planner post to
`/insights/lead.php` (see `window.C9SubmitLead` in `src/js/site.js`). Leads
are stored in the blog database and listed under **Leads** in the blog admin,
with CSV export for HubSpot. Set `LEAD_NOTIFY_EMAIL` in `blog/.env` to get an
email per lead. Book a Demo requests still go straight to HubSpot.
