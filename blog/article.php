<?php
declare(strict_types=1);

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/helpers.php';
require_once __DIR__ . '/src/ArticleRepository.php';
require_once __DIR__ . '/partials/card.php';

$articleRepo = new ArticleRepository();
$slug = (string) ($_GET['slug'] ?? '');
$article = $slug !== '' ? $articleRepo->findBySlugPublished($slug) : null;

if ($article === null) {
    http_response_code(404);
}

$related = $article ? $articleRepo->related($article, 3) : [];
$toc = $article ? article_toc($article['content']) : [];
[$toolUrl, $toolName] = article_tool($article['category_slug'] ?? null);

$pageTitle = $article ? $article['title'] . ' | ' . SITE_NAME : 'Article not found | ' . SITE_NAME;
$pageDescription = $article['excerpt'] ?? 'This article does not exist or has not been published yet.';
$canonical = $article ? 'article.php?slug=' . urlencode($article['slug']) : null;
$isArticle = $article !== null;
$shareImage = $article && $article['header_image'] ? BLOG_URL . $article['header_image'] : null;
require __DIR__ . '/partials/head.php';
?>
<main>
<?php if ($article === null): ?>
<section class="hero tkhero ahero" id="hero" aria-label="Article not found">
  <div class="tkhero__bg" aria-hidden="true"></div>
  <div class="wrap tkhero__inner">
    <nav class="crumbs" aria-label="Breadcrumb" data-hero-in><a href="/">Home</a><i></i><a href="index.php">Insights</a><i></i><b>Not found</b></nav>
    <h1 id="heroTitle" data-shiny="">Article not found.</h1>
    <p class="hero__sub">This article doesn't exist or hasn't been published yet. <a class="link-arrow" href="index.php">All insights <svg class="arr"><use href="#i-arrow"/></svg></a></p>
  </div>
</section>
<?php else: $category = $article['category_name'] ?? 'Insights'; ?>
<div class="aprog" aria-hidden="true"><i></i></div>
<section class="hero tkhero ahero" id="hero" aria-label="Article">
  <div class="tkhero__bg" aria-hidden="true"></div>
  <div class="wrap tkhero__inner">
    <nav class="crumbs" aria-label="Breadcrumb" data-hero-in><a href="/">Home</a><i></i><a href="index.php">Insights</a><i></i><?php if ($article['category_slug']): ?><a href="index.php?category=<?= urlencode($article['category_slug']) ?>"><?= e($category) ?></a><?php else: ?><b><?= e($category) ?></b><?php endif; ?></nav>
    <div class="ameta" data-hero-in><span class="ameta__cat"><?= e($category) ?></span><span><?= (int) $article['read_minutes'] ?> min read</span><span><?= e(format_date($article['published_at'])) ?></span></div>
    <h1 id="heroTitle" data-shiny=""><?= e($article['title']) ?></h1>
    <p class="hero__sub"><?= e($article['excerpt']) ?></p>
    <div class="ahero__by" data-hero-in><img src="assets/logos/core9-icon.svg" alt=""><span><b><?= e($article['author_name']) ?></b> · Published <?= e(format_date($article['published_at'])) ?></span></div>
  </div>
</section>

<?php if ($article['header_image']): ?>
<div class="wrap"><div class="ahero__img" data-hero-in><div class="acard__img"><img src="<?= e($article['header_image']) ?>" alt="" onerror="this.remove()"></div></div></div>
<?php endif; ?>

<section class="abody" aria-label="Article">
  <div class="wrap abody__grid">
    <aside class="atoc" aria-label="In this article">
      <?php if ($toc): ?>
      <details class="atoc__box" open><summary>In this article</summary><ol>
        <?php foreach ($toc as $item): ?>
          <li><a href="#<?= e($item['id']) ?>"><?= e($item['text']) ?></a><?php if ($item['children']): ?><ol><?php foreach ($item['children'] as $child): ?><li><a href="#<?= e($child['id']) ?>"><?= e($child['text']) ?></a></li><?php endforeach; ?></ol><?php endif; ?></li>
        <?php endforeach; ?>
      </ol></details>
      <?php endif; ?>
    </aside>
    <article class="aprose">
      <?= render_article_content($article['content']) ?>
      <div class="acta"><div><span>Core9 in your operation</span><p>See this against your own company’s data.</p></div><a class="btn btn--gold magnet" href="#book-demo">Book a Demo <svg class="arr"><use href="#i-arrow"/></svg></a></div>
    </article>
    <aside class="aside">
      <?php if ($article['stat_value'] || $article['stat_label']): ?>
        <div class="aside__stat"><?php if ($article['stat_value']): ?><b><?= e($article['stat_value']) ?></b><?php endif; ?><?php if ($article['stat_label']): ?><p><?= e($article['stat_label']) ?></p><?php endif; ?></div>
      <?php endif; ?>
      <?php if ($article['quote_text']): ?>
        <blockquote class="aside__quote">“<?= e($article['quote_text']) ?>”<?php if ($article['quote_citation']): ?><cite>— <?= e($article['quote_citation']) ?></cite><?php endif; ?></blockquote>
      <?php endif; ?>
      <a class="aside__tool spot" href="<?= e($toolUrl) ?>"><span class="kicker">Toolkit</span><b><?= e($toolName) ?></b><span class="link-arrow">Try it with your numbers <svg class="arr"><use href="#i-arrow"/></svg></span></a>
    </aside>
  </div>
</section>

<?php if ($related): ?>
<section class="section amore" aria-label="More insights">
  <div class="wrap">
    <div class="ins-head"><h2 class="split">More insights.</h2><a class="link-arrow" href="index.php">All insights <svg class="arr"><use href="#i-arrow"/></svg></a></div>
    <div class="agrid"><?php foreach ($related as $item): ?><?= article_card($item) ?><?php endforeach; ?></div>
  </div>
</section>
<?php endif; ?>
<?php endif; ?>
<?php require __DIR__ . '/partials/foot.php'; ?>
