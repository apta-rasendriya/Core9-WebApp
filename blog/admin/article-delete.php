<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

Auth::requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !verify_csrf($_POST['csrf_token'] ?? null)) {
    redirect('index.php');
}

$id = (int) ($_POST['id'] ?? 0);
if ($id > 0) {
    $articleRepo = new ArticleRepository();
    $articleRepo->delete($id);
    flash_set('Article deleted.');
}

redirect('index.php');
