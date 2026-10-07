<?php
declare(strict_types=1);

// The main site links to articles as /insights/?article=<slug>, because its
// bundler can't link to .php files; serve those from article.php.
if (isset($_GET['article'])) {
    $_GET['slug'] = (string) $_GET['article'];
    require __DIR__ . '/article.php';
    exit;
}

require __DIR__ . '/config/config.php';
require __DIR__ . '/src/Database.php';
require __DIR__ . '/src/helpers.php';
require __DIR__ . '/src/ArticleRepository.php';
require __DIR__ . '/src/CategoryRepository.php';
require __DIR__ . '/partials/card.php';

$categoryRepo = new CategoryRepository();
$articleRepo = new ArticleRepository();

$activeCategorySlug = isset($_GET['category']) ? (string) $_GET['category'] : null;
$activeCategory = $activeCategorySlug ? $categoryRepo->findBySlug($activeCategorySlug) : null;
if ($activeCategory === null) {
    $activeCategorySlug = null;
}

$page = max(1, (int) ($_GET['page'] ?? 1));

$categories = array_filter($categoryRepo->withPublishedCounts(), fn ($c) => (int) $c['article_count'] > 0);
$totalPublished = array_sum(array_map(fn ($c) => (int) $c['article_count'], $categories));
$featured = $articleRepo->featured();
$showFeatured = $featured !== null && $page === 1 && $activeCategorySlug === null;

// the featured article only leaves the grid when it is shown above it
$result = $articleRepo->allPublished($activeCategorySlug, $page, ARTICLES_PER_PAGE, $showFeatured ? $featured['id'] : null);
$articles = $result['items'];
$totalPages = max(1, (int) ceil($result['total'] / ARTICLES_PER_PAGE));

function listing_url(?string $category, int $page = 1): string
{
    $params = array_filter(['category' => $category, 'page' => $page > 1 ? $page : null]);
    return $params ? '?' . http_build_query($params) : 'index.php';
}

$pageTitle = $activeCategory ? $activeCategory['name'] . ' | ' . SITE_NAME : SITE_NAME;
$pageDescription = 'Practical perspective from the team deploying AI monitoring across enterprise fleets, warehouses and stores: what actually moves cost, risk and uptime.';
require __DIR__ . '/partials/head.php';
?>
<main>
<section class="hero tkhero ins-hero" id="hero" aria-label="Insights">
  <div class="tkhero__bg" aria-hidden="true"></div>
  <div class="wrap tkhero__inner">
    <nav class="crumbs" aria-label="Breadcrumb" data-hero-in><a href="/">Home</a><i></i><b>Insights</b></nav>
    <span class="ihero__eyebrow" data-hero-in>Core9 Insights</span>
    <h1 id="heroTitle" data-shiny="road,|floor|shelf.">Field notes from the road, the floor and the shelf.</h1>
    <p class="hero__sub">Practical perspective from the team deploying AI monitoring across enterprise fleets, warehouses and stores: what actually moves cost, risk and uptime.</p>
  </div>
</section>

<section class="ifeed" id="articles" aria-label="Articles">
  <div class="wrap">
    <nav class="ifilters" aria-label="Filter by topic" data-reveal>
      <a class="ifilter<?= $activeCategorySlug === null ? ' is-on' : '' ?>" href="<?= e(listing_url(null)) ?>#articles"<?= $activeCategorySlug === null ? ' aria-current="page"' : '' ?>>All<i><?= $totalPublished ?></i></a>
      <?php foreach ($categories as $category): $on = $activeCategorySlug === $category['slug']; ?>
        <a class="ifilter<?= $on ? ' is-on' : '' ?>" href="<?= e(listing_url($category['slug'])) ?>#articles"<?= $on ? ' aria-current="page"' : '' ?>><?= e($category['name']) ?><i><?= (int) $category['article_count'] ?></i></a>
      <?php endforeach; ?>
    </nav>

    <?php if ($showFeatured): ?>
      <div class="ifeed__feat"><?= article_card($featured, true) ?></div>
    <?php endif; ?>

    <div class="ifeed__head" data-reveal><span><?= $activeCategory ? e($activeCategory['name']) : 'Latest insights' ?></span><b><?= (int) $result['total'] ?></b></div>

    <?php if (empty($articles)): ?>
      <p class="ifeed__empty">No articles here yet.</p>
    <?php else: ?>
      <div class="agrid">
        <?php foreach ($articles as $article): ?><?= article_card($article) ?><?php endforeach; ?>
      </div>
    <?php endif; ?>

    <?php if ($totalPages > 1): ?>
      <nav class="pager" aria-label="Pages">
        <a class="pager__arr<?= $page <= 1 ? ' is-off' : '' ?>" href="<?= e(listing_url($activeCategorySlug, $page - 1)) ?>#articles" aria-label="Previous page"><svg class="arr"><use href="#i-arrow"/></svg></a>
        <?php for ($i = 1; $i <= $totalPages; $i++): ?>
          <a class="<?= $i === $page ? 'is-on' : '' ?>" href="<?= e(listing_url($activeCategorySlug, $i)) ?>#articles"<?= $i === $page ? ' aria-current="page"' : '' ?>><?= $i ?></a>
        <?php endfor; ?>
        <a class="pager__arr<?= $page >= $totalPages ? ' is-off' : '' ?>" href="<?= e(listing_url($activeCategorySlug, $page + 1)) ?>#articles" aria-label="Next page"><svg class="arr"><use href="#i-arrow"/></svg></a>
      </nav>
    <?php endif; ?>
  </div>
</section>
<?php require __DIR__ . '/partials/foot.php'; ?>
