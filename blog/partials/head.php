<?php
declare(strict_types=1);
// Opening markup shared by index.php and article.php, up to and including the
// site nav. Expects $pageTitle and $pageDescription; $canonical is optional.
// Styles and scripts come from the main site via scripts/sync-blog.js.
$asset = fn (string $path): string => $path . '?v=' . filemtime(__DIR__ . '/../' . $path);
?>
<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($pageTitle) ?></title>
<meta name="description" content="<?= e($pageDescription) ?>">
<?php if (!empty($canonical)): ?><link rel="canonical" href="<?= e($canonical) ?>">
<?php endif; ?>
<meta name="theme-color" content="#08050e">
<link rel="icon" href="assets/img/favicon.png">
<link rel="stylesheet" href="<?= $asset('assets/css/fonts.css') ?>">
<link rel="stylesheet" href="<?= $asset('assets/css/main.css') ?>">
<link rel="stylesheet" href="<?= $asset('assets/css/site.css') ?>">
<link rel="stylesheet" href="<?= $asset('assets/css/insights.css') ?>">
<link rel="stylesheet" href="<?= $asset('assets/css/demo.css') ?>">
<link rel="stylesheet" href="<?= $asset('assets/css/blog.css') ?>">
<script>document.documentElement.className='js';</script>
</head>
<body id="top" class="page-ins">
<?php require __DIR__ . '/sprite.php'; ?>
<?php require __DIR__ . '/nav.php'; ?>
