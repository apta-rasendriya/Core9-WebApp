<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if (Auth::adminCount() === 0) {
    redirect('setup.php');
}

if (Auth::check()) {
    redirect('index.php');
}

$error = null;
$flash = flash_get();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf($_POST['csrf_token'] ?? null)) {
        $error = 'Your session expired, please try again.';
    } else {
        $username = trim((string) ($_POST['username'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');

        if (Auth::attempt($username, $password)) {
            redirect('index.php');
        }
        $error = 'Invalid username or password.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Admin login — <?= e(SITE_NAME) ?></title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Spectral:ital,wght@0,500&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="assets/css/admin.css?v=<?= filemtime(__DIR__ . '/assets/css/admin.css') ?>" />
</head>
<body>
  <div class="admin-wrap">
    <div class="card">
      <div class="card-box">
        <h1 class="page-title">Admin login</h1>
        <p class="page-sub"><?= e(SITE_NAME) ?> content management.</p>

        <?php if ($flash): ?>
          <div class="flash flash-<?= e($flash['type']) ?>"><?= e($flash['message']) ?></div>
        <?php endif; ?>
        <?php if ($error): ?>
          <div class="flash flash-error"><?= e($error) ?></div>
        <?php endif; ?>

        <form method="post" class="form-grid">
          <?= csrf_field() ?>
          <div class="form-row">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" required autofocus>
          </div>
          <div class="form-row">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn">Log in</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</body>
</html>
