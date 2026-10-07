<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if (Auth::adminCount() > 0) {
    redirect('login.php');
}

$errors = [];
$username = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf($_POST['csrf_token'] ?? null)) {
        $errors[] = 'Your session expired, please try again.';
    } else {
        $username = trim((string) ($_POST['username'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');
        $passwordConfirm = (string) ($_POST['password_confirm'] ?? '');

        if ($username === '' || strlen($username) < 3) {
            $errors[] = 'Username must be at least 3 characters.';
        }
        if (strlen($password) < 8) {
            $errors[] = 'Password must be at least 8 characters.';
        }
        if ($password !== $passwordConfirm) {
            $errors[] = 'Passwords do not match.';
        }

        if (empty($errors)) {
            Auth::createAdmin($username, $password);
            flash_set('Admin account created. Please log in.');
            redirect('login.php');
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Set up admin account — <?= e(SITE_NAME) ?></title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Spectral:ital,wght@0,500&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="assets/css/admin.css?v=<?= filemtime(__DIR__ . '/assets/css/admin.css') ?>" />
</head>
<body>
  <div class="admin-wrap">
    <div class="card">
      <div class="card-box">
        <h1 class="page-title">Create admin account</h1>
        <p class="page-sub">This runs once, the first time the site starts. Set the username and password you'll use to manage articles.</p>

        <?php foreach ($errors as $error): ?>
          <div class="flash flash-error"><?= e($error) ?></div>
        <?php endforeach; ?>

        <form method="post" class="form-grid">
          <?= csrf_field() ?>
          <div class="form-row">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" value="<?= e($username) ?>" required minlength="3" autofocus>
          </div>
          <div class="form-row">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required minlength="8">
            <span class="hint">At least 8 characters.</span>
          </div>
          <div class="form-row">
            <label for="password_confirm">Confirm password</label>
            <input type="password" id="password_confirm" name="password_confirm" required minlength="8">
          </div>
          <div class="form-actions">
            <button type="submit" class="btn">Create account</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</body>
</html>
