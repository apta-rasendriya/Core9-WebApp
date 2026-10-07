<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if (Auth::adminCount() === 0) {
    redirect('setup.php');
}
Auth::requireLogin();

$categoryRepo = new CategoryRepository();
$errors = [];
$newName = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf($_POST['csrf_token'] ?? null)) {
        $errors[] = 'Your session expired, please try again.';
    } else {
        $action = (string) ($_POST['action'] ?? '');

        if ($action === 'create') {
            $newName = trim((string) ($_POST['name'] ?? ''));
            if ($newName === '') {
                $errors[] = 'Category name is required.';
            } else {
                $categoryRepo->create($newName);
                flash_set('Category added.');
                redirect('categories.php');
            }
        } elseif ($action === 'delete') {
            $id = (int) ($_POST['id'] ?? 0);
            if ($id > 0) {
                $categoryRepo->delete($id);
                flash_set('Category deleted. Articles in it are now uncategorized.');
            }
            redirect('categories.php');
        }
    }
}

$categories = $categoryRepo->withPublishedCounts();
$flash = flash_get();
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Categories — <?= e(SITE_NAME) ?> admin</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Spectral:ital,wght@0,500&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="assets/css/admin.css?v=<?= filemtime(__DIR__ . '/assets/css/admin.css') ?>" />
</head>
<body>
  <div class="admin-wrap">
    <nav class="admin-nav">
      <a class="brand" href="index.php">Core9 · Admin</a>
      <div class="right">
        <a href="index.php">Articles</a>
        <span>Signed in as <?= e(Auth::username()) ?></span>
        <a href="logout.php">Log out</a>
      </div>
    </nav>

    <?php if ($flash): ?>
      <div class="flash flash-<?= e($flash['type']) ?>"><?= e($flash['message']) ?></div>
    <?php endif; ?>
    <?php foreach ($errors as $error): ?>
      <div class="flash flash-error"><?= e($error) ?></div>
    <?php endforeach; ?>

    <h1 class="page-title">Categories</h1>
    <p class="page-sub">Used for the homepage filter chips. Published article counts shown alongside each.</p>

    <form method="post" class="form-grid" style="max-width:420px; margin-bottom:36px;">
      <?= csrf_field() ?>
      <input type="hidden" name="action" value="create">
      <div class="form-row">
        <label for="name">New category name</label>
        <input type="text" id="name" name="name" value="<?= e($newName) ?>" required>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn">+ Add category</button>
      </div>
    </form>

    <?php if (empty($categories)): ?>
      <p class="empty">No categories yet.</p>
    <?php else: ?>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Published articles</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($categories as $category): ?>
            <tr>
              <td class="cell-title"><?= e($category['name']) ?></td>
              <td data-label="Slug"><?= e($category['slug']) ?></td>
              <td data-label="Published articles"><?= (int) $category['article_count'] ?></td>
              <td class="actions">
                <form method="post" data-confirm="Delete &quot;<?= e($category['name']) ?>&quot;? Articles in it will become uncategorized.">
                  <?= csrf_field() ?>
                  <input type="hidden" name="action" value="delete">
                  <input type="hidden" name="id" value="<?= (int) $category['id'] ?>">
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
