<?php
declare(strict_types=1);

require __DIR__ . '/config/config.php';
require __DIR__ . '/src/Database.php';
require __DIR__ . '/src/helpers.php';
require __DIR__ . '/src/ArticleRepository.php';
require __DIR__ . '/src/CategoryRepository.php';

$categoryRepo = new CategoryRepository();
$articleRepo = new ArticleRepository();

$activeCategorySlug = isset($_GET['category']) ? (string) $_GET['category'] : null;
$activeCategory = $activeCategorySlug ? $categoryRepo->findBySlug($activeCategorySlug) : null;
if ($activeCategorySlug !== null && $activeCategory === null) {
    $activeCategorySlug = null;
}

$page = max(1, (int) ($_GET['page'] ?? 1));

$categories = $categoryRepo->all();
$featured = $articleRepo->featured();
$showFeatured = $featured !== null && $page === 1 && $activeCategorySlug === null;

$result = $articleRepo->allPublished($activeCategorySlug, $page, ARTICLES_PER_PAGE, $featured['id'] ?? null);
$articles = $result['items'];
$totalPages = max(1, (int) ceil($result['total'] / ARTICLES_PER_PAGE));

function page_url(int $page, ?string $category): string
{
    $params = ['page' => $page];
    if ($category) {
        $params['category'] = $category;
    }
    return '?' . http_build_query($params);
}

function category_url(?string $slug): string
{
    return $slug ? '?' . http_build_query(['category' => $slug]) : '?';
}

if (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest') {
    ob_start();
    require __DIR__ . '/partials/results.php';
    $html = ob_get_clean();

    header('Content-Type: application/json');
    echo json_encode([
        'html' => $html,
        'total' => $result['total'],
        'page' => $page,
        'totalPages' => $totalPages,
        'category' => $activeCategorySlug,
    ]);
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title><?= e(SITE_NAME) ?></title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&family=Poppins:wght@300;400;500;600;700&family=Spectral:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="assets/css/style.css?v=<?= filemtime(__DIR__ . '/assets/css/style.css') ?>" />
</head>
<body>
  <?php require __DIR__ . '/partials/site-nav.php'; ?>
  <div class="hub">
    <div class="hub-wrap">


      <header class="hub-head">
        <p class="hub-kicker">Core9 Insights</p>
        <h1 class="hub-h1">Field notes on fleet safety, <em>telematics</em>, and supply-chain visibility.</h1>
        <p class="hub-lede">Practical perspective from the team deploying AI monitoring across enterprise fleets, warehouses, and cold chains — what actually moves cost, risk, and uptime.</p>
        <div class="hub-chips" id="chips">
          <a class="chip <?= $activeCategorySlug === null ? 'active' : '' ?>" data-category="" href="<?= e(category_url(null)) ?>">All</a>
          <?php foreach ($categories as $category): ?>
            <a class="chip <?= $activeCategorySlug === $category['slug'] ? 'active' : '' ?>" data-category="<?= e($category['slug']) ?>" href="<?= e(category_url($category['slug'])) ?>"><?= e($category['name']) ?></a>
          <?php endforeach; ?>
        </div>
      </header>

      <div id="results" class="results">
        <?php require __DIR__ . '/partials/results.php'; ?>
      </div>

      <footer class="hub-foot">
        <div class="fl"><span>&copy; <?= date('Y') ?> Core9. All Rights Reserved.</span></div>
        <div class="fr"><a href="/?scrollTo=section_3&amp;type=id">Products</a><a href="/?scrollTo=client_section&amp;type=class">Clients</a><a href="mailto:info@core9.ai">Contact</a></div>
      </footer>

    </div>
  </div>
  <script src="assets/js/main.js"></script>
</body>
</html>
