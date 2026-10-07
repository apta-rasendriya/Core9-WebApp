<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if (Auth::adminCount() === 0) {
    redirect('setup.php');
}
Auth::requireLogin();

$articleRepo = new ArticleRepository();
$articles = $articleRepo->allForAdmin();
$flash = flash_get();
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Articles — <?= e(SITE_NAME) ?> admin</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Spectral:ital,wght@0,500&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="assets/css/admin.css?v=<?= filemtime(__DIR__ . '/assets/css/admin.css') ?>" />
</head>
<body>
  <div class="admin-wrap">
    <nav class="admin-nav">
      <a class="brand" href="index.php">Core9 · Admin</a>
      <div class="right">
        <a href="categories.php">Categories</a>
        <a href="leads.php">Leads</a>
        <span>Signed in as <?= e(Auth::username()) ?></span>
        <a href="logout.php">Log out</a>
      </div>
    </nav>

    <?php if ($flash): ?>
      <div class="flash flash-<?= e($flash['type']) ?>"><?= e($flash['message']) ?></div>
    <?php endif; ?>

    <div class="bar">
      <div>
        <h1 class="page-title">Articles</h1>
        <p class="page-sub">Create, edit and publish content for the public site.</p>
      </div>
      <a class="btn" href="article-form.php">+ New article</a>
    </div>

    <?php if (empty($articles)): ?>
      <p class="empty">No articles yet. Create your first one.</p>
    <?php else: ?>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>Published</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($articles as $article): ?>
            <tr>
              <td class="cell-title">
                <?= e($article['title']) ?>
                <?php if ($article['is_featured']): ?><span class="badge badge-featured">Featured</span><?php endif; ?>
              </td>
              <td data-label="Category"><?= e($article['category_name'] ?? '—') ?></td>
              <td data-label="Status"><span class="badge badge-<?= e($article['status']) ?>"><?= e($article['status']) ?></span></td>
              <td data-label="Published"><?= $article['published_at'] ? e(format_date($article['published_at'])) : '—' ?></td>
              <td class="actions">
                <a href="../article.php?slug=<?= urlencode($article['slug']) ?>" target="_blank">View</a>
                <a href="article-form.php?id=<?= (int) $article['id'] ?>">Edit</a>
                <form method="post" action="article-delete.php" data-confirm="Delete &quot;<?= e($article['title']) ?>&quot;? This can't be undone.">
                  <?= csrf_field() ?>
                  <input type="hidden" name="id" value="<?= (int) $article['id'] ?>">
                  <button type="submit" class="danger">Delete</button>
                </form>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </div>
  <script src="assets/js/admin.js"></script>
</body>
</html>
