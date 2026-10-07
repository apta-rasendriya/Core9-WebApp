<?php
declare(strict_types=1);

// One-off: shrink article images that were uploaded before uploads were
// optimized automatically (see ImageUpload::optimize). Run once from the blog
// folder, e.g. in cPanel → Terminal:
//
//   php tools/optimize-images.php
//
// It resizes every article's thumbnail and header image, saves them as WebP,
// and updates the articles to point at the new files. Back up uploads/ and
// the database first. Safe to run again: already-small images are skipped.

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../config/config.php';
require __DIR__ . '/../src/Database.php';
require __DIR__ . '/../src/ImageUpload.php';

if (!function_exists('imagecreatefromstring')) {
    fwrite(STDERR, "PHP's GD extension is not available, so images can't be resized here.\n");
    exit(1);
}

$db = Database::connection();
$rows = $db->query('SELECT id, slug, thumb_image, header_image FROM articles')->fetchAll();
$root = dirname(__DIR__) . '/';
$saved = 0;

foreach ($rows as $row) {
    foreach (['thumb_image' => 'thumbnails', 'header_image' => 'headers'] as $column => $subdir) {
        $path = $row[$column];
        if (!$path || !is_file($root . $path)) {
            continue;
        }
        // the same file can be shared by several articles; only convert it once
        $before = filesize($root . $path);
        $newPath = ImageUpload::optimize($path, ImageUpload::maxWidthFor($subdir), ImageUpload::formatFor($subdir));
        if ($newPath === $path) {
            echo "  kept      {$path}\n";
            continue;
        }
        $after = filesize($root . $newPath);
        $saved += $before - $after;
        $db->prepare("UPDATE articles SET {$column} = ? WHERE {$column} = ?")->execute([$newPath, $path]);
        printf("  %-9s %s -> %s (%d KB -> %d KB)\n", $column === 'thumb_image' ? 'thumbnail' : 'header', $path, $newPath, $before / 1024, $after / 1024);
    }
}

printf("Done. Saved %.1f MB.\n", $saved / 1048576);
