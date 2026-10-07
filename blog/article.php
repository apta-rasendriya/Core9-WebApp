<?php
declare(strict_types=1);

require __DIR__ . '/config/config.php';
require __DIR__ . '/src/Database.php';
require __DIR__ . '/src/helpers.php';
require __DIR__ . '/src/ArticleRepository.php';

$articleRepo = new ArticleRepository();
$slug = (string) ($_GET['slug'] ?? '');
$article = $slug !== '' ? $articleRepo->findBySlugPublished($slug) : null;

if ($article === null) {
    http_response_code(404);
}

$related = $article ? $articleRepo->related($article, 3) : [];
$hasStat = $article && ($article['stat_value'] || $article['stat_label']);
$hasQuote = $article && $article['quote_text'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title><?= $article ? e($article['title']) . ' — ' . e(SITE_NAME) : 'Article not found — ' . e(SITE_NAME) ?></title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&family=Poppins:wght@300;400;500;600;700&family=Spectral:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="assets/css/style.css?v=<?= filemtime(__DIR__ . '/assets/css/style.css') ?>" />
</head>
<body>
  <?php require __DIR__ . '/partials/site-nav.php'; ?>
  <div class="hub">
    <div class="hub-wrap">

      <?php if ($article === null): ?>
        <div class="c-body-wrap" style="grid-template-columns:1fr; margin-top:60px;">
          <div class="c-main">
            <p class="crumb"><a href="index.php">Insights</a> <span class="sep">/</span> <span class="cur">Not found</span></p>
            <h1 class="hub-h1">Article not found</h1>
            <p class="hub-lede">This article doesn't exist or hasn't been published yet.</p>
          </div>
        </div>
      <?php else: ?>

        <p class="crumb">
          <a href="index.php">Insights</a>
          <?php if ($article['category_name']): ?>
            <span class="sep">/</span>
            <a href="index.php?category=<?= urlencode($article['category_slug']) ?>"><?= e($article['category_name']) ?></a>
          <?php endif; ?>
          <span class="sep">/</span>
          <span class="cur">Article</span>
        </p>

        <div class="c-hero-shell">
          <div class="c-hero" data-tone="<?= e($article['thumb_tone']) ?>">
            <?php if ($article['header_image']): ?><img src="<?= e($article['header_image']) ?>" alt=""><?php endif; ?>
            <span class="c-tag"><?= e($article['thumb_label'] ?: $article['category_name']) ?></span>
            <div class="c-hero-cap">
              <div class="meta-row">
                <span class="meta-cat"><?= e($article['category_name'] ?? 'Insights') ?></span>
                <span class="meta-dot"></span>
                <span class="meta-time"><?= (int) $article['read_minutes'] ?> min read</span>
                <span class="meta-dot"></span>
                <span class="meta-time"><?= e(format_date($article['published_at'])) ?></span>
              </div>
              <h1 class="art-h1"><?= e($article['title']) ?></h1>
            </div>
          </div>
        </div>

        <div class="c-body-wrap">
          <div class="c-main">
            <p class="art-dek"><?= e($article['excerpt']) ?></p>

            <div class="art-body">
              <?= render_article_content($article['content']) ?>
            </div>

            <div class="byline">
              <span class="av"></span>
              <div class="who">
                <b><?= e($article['author_name']) ?></b>
                <span>Published <?= e(format_date($article['published_at'])) ?></span>
              </div>
              <div class="share">
                <span>in</span><span>x</span><span>&#8599;</span>
              </div>
            </div>
          </div>

          <aside class="c-aside">
            <?php if ($hasStat): ?>
              <div class="c-stat">
                <?php if ($article['stat_value']): ?><b><?= e($article['stat_value']) ?></b><?php endif; ?>
                <?php if ($article['stat_label']): ?><span><?= e($article['stat_label']) ?></span><?php endif; ?>
              </div>
            <?php endif; ?>

            <?php if ($hasQuote): ?>
              <div class="c-pull">
                <p>&ldquo;<?= e($article['quote_text']) ?>&rdquo;</p>
                <?php if ($article['quote_citation']): ?><cite>&mdash; <?= e($article['quote_citation']) ?></cite><?php endif; ?>
              </div>
            <?php endif; ?>

            <div class="c-cta">
              <p>See this against your own fleet's data.</p>
              <a href="/?demo=1">Book a Demo</a>
            </div>
          </aside>
        </div>

        <?php if (!empty($related)): ?>
          <p class="section-label">More insights <span class="count">&middot; <?= count($related) ?></span></p>
          <div class="related-grid">
            <?php foreach ($related as $item): ?>
              <a class="rcard" href="article.php?slug=<?= urlencode($item['slug']) ?>">
                <div class="thumb<?= $item['thumb_image'] ? ' has-image' : '' ?>" data-tone="<?= e($item['thumb_tone']) ?>">
                  <?php if ($item['thumb_image']): ?><img src="<?= e($item['thumb_image']) ?>" alt=""><?php endif; ?>
                  <span><?= e($item['thumb_label'] ?: $item['category_name']) ?></span>
                </div>
                <div class="meta-row">
                  <span class="meta-cat"><?= e($item['category_name'] ?? 'Insights') ?></span>
                  <span class="meta-dot"></span>
                  <span class="meta-time"><?= (int) $item['read_minutes'] ?> min read</span>
                </div>
                <h3><?= e($item['title']) ?></h3>
              </a>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>

      <?php endif; ?>

      <footer class="hub-foot">
        <div class="fl"><span>&copy; <?= date('Y') ?> Core9. All Rights Reserved.</span></div>
        <div class="fr"><a href="/?scrollTo=section_3&amp;type=id">Products</a><a href="/?scrollTo=client_section&amp;type=class">Clients</a><a href="mailto:info@core9.ai">Contact</a></div>
      </footer>

    </div>
  </div>
  <script src="assets/js/main.js"></script>
</body>
</html>
