# Core9 Insights — Blog

A plain PHP + MySQL blog/article hub, built to live as a subfolder of a
larger site. On core9.ai it is served at `/insights/`. No framework — just PDO and
sessions for the admin area, with query-string URLs (no rewrite rules
required).

## Structure

Everything needed to serve the site sits flat in this folder, so it can be
dropped into another site's docroot as-is (on core9.ai it is deployed as
`/insights/`) and just works there.

```
index.php           Listing (featured article + paginated, filterable grid);
                    also serves ?article=<slug>, the link format the main site uses
article.php          Article detail page (?slug=...)
partials/            head/foot, article card, icon sprite, and nav/footer/demo popup
                    (nav.php, footer.php, demo.php are generated, see Look & feel)
assets/css, assets/js, assets/logos, assets/img
admin/                Password-protected admin panel
  setup.php           One-time first-run wizard to create the admin account
  login.php / logout.php
  index.php           Article dashboard (list, edit, delete)
  article-form.php    Create/edit article
  categories.php      Manage categories
  assets/css, assets/js

uploads/thumbnails/    Uploaded thumbnail images (card/hero fallback images)
uploads/headers/       Uploaded article header images

config/config.php     DB credentials, loaded from .env  (not web-accessible)
src/                   PHP classes: Database, Auth, ArticleRepository, CategoryRepository, ImageUpload, helpers  (not web-accessible)
database/              schema.sql (tables) + seed.sql (the six launch articles)  (not web-accessible)
```

`config/`, `src/`, and `database/` stay inside this folder (so the whole
thing can be copied as one unit) but are locked down with `.htaccess`
(`Require all denied`) so Apache never serves them directly. A root-level
`.htaccess` also blocks dotfiles like `.env`. These `.htaccess` rules only
apply on Apache — see the **Security note** below if you're deploying on
something else.

## Requirements

- PHP 8+ with the `pdo_mysql` and `fileinfo` extensions
- MySQL or MariaDB
- Apache (for the `.htaccess` protections) — see the note below if using Nginx or another server
- The web server needs write access to `uploads/thumbnails/` and `uploads/headers/` for article image uploads to work

## Setup

1. **Database**: create it and load the schema + sample content.

   ```
   mysql -u root -p --default-character-set=utf8mb4 < database/schema.sql
   mysql -u root -p --default-character-set=utf8mb4 < database/seed.sql
   ```

   > On Windows, always pass `--default-character-set=utf8mb4` when importing —
   > the `mysql.exe` CLI otherwise defaults to `cp850` and mangles special
   > characters (em dashes, etc.) in the sample content.

2. **Config**: copy `.env.example` to `.env` and fill in your DB credentials.

   ```
   cp .env.example .env
   ```

3. **Drop it in.** Place this whole folder inside your main site's docroot,
   named `insights` — the main site links to `/insights/`, so `htdocs/insights/` gives you
   `yoursite.com/insights/`.

   For local testing without a full Apache setup, PHP's built-in server
   works too — run it *from this folder*:

   ```
   php -S localhost:8000
   ```

4. Visit `http://localhost:8000/` (or `yoursite.com/insights/`) for the public site.

5. Visit `.../admin/` — since no admin account exists yet, you'll land on
   the setup wizard. Create a username and password there, then log in.

### Alternative: run locally with Docker

This blog lives inside the Core9-web project, so the Docker setup is at the
project root (`../compose.yaml`). It serves the main site at `/` and this
blog at `/insights/`, the same way they're deployed. It doesn't use or modify
`.env`. From the Core9-web folder:

```
npm install
npm run b
docker compose up -d --build
```

- Site: http://localhost:8090/
- Blog: http://localhost:8090/insights/
- Admin: http://localhost:8090/insights/admin/
- phpMyAdmin: http://localhost:8091/

On first start the database is created from `database/schema.sql` +
`database/seed.sql`. Blog edits show up on refresh; main-site edits need
`npm run b` again. `docker compose down` stops it; `docker compose down -v`
also wipes the database so it re-seeds on the next start.

### Look & feel

The blog uses the main site's design. Its shared pieces are copied from
`../src` by `npm run sync-blog` (also run by `npm run b`):

- `assets/css/{fonts,main,site,demo}.css`, `assets/js/{main,site}.js`,
  `assets/js/vendor/`, `assets/logos/*.svg`
- `partials/nav.php`, `partials/footer.php`, `partials/demo.php`, generated
  from `../src/partials/`

Edit the originals in `../src` and re-run the sync; don't edit those copies.
Blog-only styles live in `assets/css/insights.css` (the design's Insights
styles) and `assets/css/blog.css` (placeholder images, pager, small fixes).
Every "Book a Demo" button opens the HubSpot demo form in a popup.

## Notes

- **Featured article**: only one article can be featured at a time (shown as
  the large banner on the homepage). Marking a new one as featured
  automatically un-features the previous one. If none is marked, the most
  recently published article is used.
- **Categories & filtering**: the homepage chips are generated from the
  `categories` table and link to `?category=slug`. Manage categories from
  the admin panel.
- **Pagination**: 6 articles per page (excluding the featured one), controlled
  by `ARTICLES_PER_PAGE` in `config/config.php`.
- **Article page**: header image, breadcrumb, contents list, a sidebar with an
  optional stat callout and pull-quote plus a Toolkit calculator picked from
  the category (leave those fields blank in the admin
  form to hide them), a CTA box, and a "More insights" grid of related
  articles (same category first, backfilled with the most recent otherwise).
- **Content format**: the article body is plain text in the admin form —
  leave a blank line between blocks. A lightweight markdown-lite syntax is
  supported: `## ` and `### ` start a heading or subheading (these also build
  the article's "In this article" contents), lines starting with `- ` become
  a bullet list, `**bold**` works anywhere, lines like `| a | b |` become a
  table (first line is the header; a row whose first cell is `**bold**` is
  highlighted), and a line starting with `> ` becomes a small note. Everything is
  escaped before rendering, so there's no HTML/script injection risk from the
  admin form.
- **Images**: uploads are resized (thumbnails to 1200 px wide, headers to
  2000 px) and re-saved as WebP (thumbnails) or JPEG (headers, which are also
  the article's link-preview image) by `src/ImageUpload.php`, using PHP's GD
  extension. Without GD, files are stored as uploaded. Images uploaded before
  this existed can be shrunk once with `php tools/optimize-images.php` (run it
  from this folder, e.g. in cPanel → Terminal; back up first).
- **Leads**: see the main README. `lead.php` stores calculator leads; they
  are listed in admin → Leads.
- **Auth security**: passwords are hashed with `password_hash()`, admin forms
  are CSRF-protected, and all DB queries use PDO prepared statements.
- **Article images**: each article can have a **thumbnail image** (used on
  homepage/related cards) and a **header image** (used as the article's hero
  banner), uploaded from the admin form. Both are optional — an article with
  no image just shows the color-gradient thumbnail/hero it already had.
  Uploads are validated by actual file content (not just the extension),
  limited to JPG/PNG/WEBP/GIF, capped at 5 MB, and saved under `uploads/`
  with a randomly generated filename. Replacing or removing an image (or
  deleting the article) deletes the old file from disk. `uploads/.htaccess`
  blocks any file in that folder from ever being executed as PHP, even
  though only image files are ever written there.
- **Upgrading an existing database**: if you set up this project before the
  sidebar stat/quote fields or article images existed, run the SQL files in
  `database/migrations/` in order — a fresh install via `schema.sql` already
  has everything.

## Security note: `.htaccess` only protects Apache

Because `config/`, `src/`, `database/`, and `.env` live inside this folder
rather than outside the webroot, they rely on the included `.htaccess` files
to stay hidden. That only works if the site is served by **Apache with
`AllowOverride` enabled** for this path (true for most shared hosting and a
default XAMPP/WAMP install).

If you deploy behind **Nginx** or another server that ignores `.htaccess`,
add explicit rules to deny those paths instead — for Nginx, something like:

```nginx
location ~ ^/insights/(config|src|database)/ { deny all; }
location ~ /insights/\.env$ { deny all; }
```

When in doubt, you can always move `config/`, `src/`, and `database/` fully
outside the webroot and update the `require` paths in `index.php`,
`article.php`, and `admin/bootstrap.php` to point at the new location —
that's the most robust option regardless of web server.
