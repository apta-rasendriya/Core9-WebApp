<?php
declare(strict_types=1);
// Opening markup shared by index.php and article.php, up to and including the
// site nav. Expects $pageTitle and $pageDescription; $canonical (a path
// relative to the blog) and $shareImage (an absolute URL) are optional.
// Styles and scripts come from the main site via scripts/sync-blog.js.
$asset = fn (string $path): string => $path . '?v=' . filemtime(__DIR__ . '/../' . $path);
$pageUrl = BLOG_URL . ($canonical ?? '');
$shareImage = $shareImage ?? SITE_URL . '/og/core9.png';
?>
<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($pageTitle) ?></title>
<meta name="description" content="<?= e($pageDescription) ?>">
<link rel="canonical" href="<?= e($pageUrl) ?>">
<meta property="og:type" content="<?= empty($isArticle) ? 'website' : 'article' ?>">
<meta property="og:site_name" content="Core9">
<meta property="og:title" content="<?= e($pageTitle) ?>">
<meta property="og:description" content="<?= e($pageDescription) ?>">
<meta property="og:url" content="<?= e($pageUrl) ?>">
<meta property="og:image" content="<?= e($shareImage) ?>">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="<?= e($shareImage) ?>">
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
