<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if (Auth::adminCount() === 0) {
    redirect('setup.php');
}
Auth::requireLogin();

$articleRepo = new ArticleRepository();
$categoryRepo = new CategoryRepository();
$categories = $categoryRepo->all();

$id = isset($_GET['id']) ? (int) $_GET['id'] : null;
$article = $id ? $articleRepo->findById($id) : null;

if ($id && $article === null) {
    flash_set('Article not found.', 'error');
    redirect('index.php');
}

$isEdit = $article !== null;

$values = [
    'title' => $article['title'] ?? '',
    'slug' => $article['slug'] ?? '',
    'category_id' => $article['category_id'] ?? '',
    'excerpt' => $article['excerpt'] ?? '',
    'content' => $article['content'] ?? '',
    'author_name' => $article['author_name'] ?? 'Core9 Team',
    'read_minutes' => $article['read_minutes'] ?? 5,
    'thumb_tone' => $article['thumb_tone'] ?? 'gold',
    'thumb_label' => $article['thumb_label'] ?? '',
    'thumb_image' => $article['thumb_image'] ?? null,
    'header_image' => $article['header_image'] ?? null,
    'stat_value' => $article['stat_value'] ?? '',
    'stat_label' => $article['stat_label'] ?? '',
    'quote_text' => $article['quote_text'] ?? '',
    'quote_citation' => $article['quote_citation'] ?? '',
    'is_featured' => (bool) ($article['is_featured'] ?? false),
    'status' => $article['status'] ?? 'draft',
];

$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf($_POST['csrf_token'] ?? null)) {
        $errors[] = 'Your session expired, please try again.';
    } else {
        $values['title'] = trim((string) ($_POST['title'] ?? ''));
        $values['slug'] = trim((string) ($_POST['slug'] ?? ''));
        $values['category_id'] = $_POST['category_id'] !== '' ? (int) $_POST['category_id'] : null;
        $values['excerpt'] = trim((string) ($_POST['excerpt'] ?? ''));
        $values['content'] = trim((string) ($_POST['content'] ?? ''));
        $values['author_name'] = trim((string) ($_POST['author_name'] ?? '')) ?: 'Core9 Team';
        $values['read_minutes'] = max(1, (int) ($_POST['read_minutes'] ?? 5));
        $values['thumb_tone'] = in_array($_POST['thumb_tone'] ?? '', THUMB_TONES, true) ? $_POST['thumb_tone'] : 'gold';
        $values['thumb_label'] = trim((string) ($_POST['thumb_label'] ?? ''));

        $values['thumb_image'] = $_POST['thumb_image_current'] !== '' ? $_POST['thumb_image_current'] : null;
        if (!empty($_POST['remove_thumb_image'])) {
            ImageUpload::delete($values['thumb_image']);
            $values['thumb_image'] = null;
        }
        $thumbUpload = ImageUpload::handle($_FILES['thumb_image'] ?? null, 'thumbnails');
        if ($thumbUpload['error']) {
            $errors[] = 'Thumbnail image: ' . $thumbUpload['error'];
        } elseif ($thumbUpload['path']) {
            ImageUpload::delete($values['thumb_image']);
            $values['thumb_image'] = $thumbUpload['path'];
        }

        $values['header_image'] = $_POST['header_image_current'] !== '' ? $_POST['header_image_current'] : null;
        if (!empty($_POST['remove_header_image'])) {
            ImageUpload::delete($values['header_image']);
            $values['header_image'] = null;
        }
        $headerUpload = ImageUpload::handle($_FILES['header_image'] ?? null, 'headers');
        if ($headerUpload['error']) {
            $errors[] = 'Header image: ' . $headerUpload['error'];
        } elseif ($headerUpload['path']) {
            ImageUpload::delete($values['header_image']);
            $values['header_image'] = $headerUpload['path'];
        }

        $values['stat_value'] = trim((string) ($_POST['stat_value'] ?? ''));
        $values['stat_label'] = trim((string) ($_POST['stat_label'] ?? ''));
        $values['quote_text'] = trim((string) ($_POST['quote_text'] ?? ''));
        $values['quote_citation'] = trim((string) ($_POST['quote_citation'] ?? ''));
        $values['is_featured'] = !empty($_POST['is_featured']);
        $values['status'] = ($_POST['status'] ?? 'draft') === 'published' ? 'published' : 'draft';

        if ($values['title'] === '') {
            $errors[] = 'Title is required.';
        }
        if ($values['excerpt'] === '') {
            $errors[] = 'Excerpt is required.';
        }
        if ($values['content'] === '') {
            $errors[] = 'Content is required.';
        }

        if (empty($errors)) {
            $slugSource = $values['slug'] !== '' ? $values['slug'] : $values['title'];
            $values['slug'] = $articleRepo->uniqueSlug($slugSource, $id);

            $toSave = $values;
            foreach (['stat_value', 'stat_label', 'quote_text', 'quote_citation', 'thumb_label'] as $optional) {
                $toSave[$optional] = $toSave[$optional] !== '' ? $toSave[$optional] : null;
            }

            if ($isEdit) {
                $articleRepo->update($id, $toSave);
                flash_set('Article updated.');
            } else {
                $articleRepo->create($toSave);
                flash_set('Article created.');
            }
            redirect('index.php');
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title><?= $isEdit ? 'Edit' : 'New' ?> article — <?= e(SITE_NAME) ?> admin</title>
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

    <h1 class="page-title"><?= $isEdit ? 'Edit article' : 'New article' ?></h1>
    <p class="page-sub"><?= $isEdit ? 'Update the content and republish.' : 'Fill in the details below and publish when ready.' ?></p>

    <?php foreach ($errors as $error): ?>
      <div class="flash flash-error"><?= e($error) ?></div>
    <?php endforeach; ?>

    <form method="post" class="form-grid" enctype="multipart/form-data">
      <?= csrf_field() ?>

      <div class="form-row">
        <label for="title">Title</label>
        <input type="text" id="title" name="title" value="<?= e($values['title']) ?>" data-slug-source required>
      </div>

      <div class="form-row">
        <label for="slug">Slug</label>
        <input type="text" id="slug" name="slug" value="<?= e($values['slug']) ?>" data-slug-target>
        <span class="hint">Used in the article URL. Leave blank to auto-generate from the title.</span>
      </div>

      <div class="form-row two">
        <div class="form-row">
          <label for="category_id">Category</label>
          <select id="category_id" name="category_id">
            <option value="">— None —</option>
            <?php foreach ($categories as $category): ?>
              <option value="<?= (int) $category['id'] ?>" <?= (string) $values['category_id'] === (string) $category['id'] ? 'selected' : '' ?>><?= e($category['name']) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="form-row">
          <label for="status">Status</label>
          <select id="status" name="status">
            <option value="draft" <?= $values['status'] === 'draft' ? 'selected' : '' ?>>Draft</option>
            <option value="published" <?= $values['status'] === 'published' ? 'selected' : '' ?>>Published</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <label for="excerpt">Excerpt</label>
        <textarea id="excerpt" name="excerpt" rows="3" required><?= e($values['excerpt']) ?></textarea>
        <span class="hint">Short summary shown on cards and the homepage.</span>
      </div>

      <div class="form-row">
        <label for="content">Content</label>
        <textarea id="content" name="content" rows="16" required><?= e($values['content']) ?></textarea>
        <span class="hint">Plain text. Leave a blank line between blocks. Start a line with "## " for a heading or "### " for a subheading; lines starting with "- " become a bullet list; wrap words in **double asterisks** for bold. A table is lines like "| Column | Column |" (first line is the header; a row whose first cell is **bold** is highlighted). A line starting with "> " becomes a small note.</span>
      </div>

      <div class="form-row two">
        <div class="form-row">
          <label for="author_name">Author</label>
          <input type="text" id="author_name" name="author_name" value="<?= e($values['author_name']) ?>">
        </div>
        <div class="form-row">
          <label for="read_minutes">Read time (minutes)</label>
          <input type="number" id="read_minutes" name="read_minutes" min="1" value="<?= (int) $values['read_minutes'] ?>">
        </div>
      </div>

      <div class="form-row two">
        <div class="form-row">
          <label for="thumb_tone">Thumbnail color</label>
          <select id="thumb_tone" name="thumb_tone">
            <?php foreach (THUMB_TONES as $tone): ?>
              <option value="<?= e($tone) ?>" <?= $values['thumb_tone'] === $tone ? 'selected' : '' ?>><?= e(ucfirst($tone)) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="form-row">
          <label for="thumb_label">Thumbnail label</label>
          <input type="text" id="thumb_label" name="thumb_label" value="<?= e($values['thumb_label']) ?>" placeholder="e.g. Fleet Economics · 16:11">
          <span class="hint">Optional. Falls back to the category name.</span>
        </div>
      </div>

      <div class="form-row two">
        <div class="form-row">
          <label for="thumb_image_file">Thumbnail image</label>
          <?php if ($values['thumb_image']): ?>
            <img src="../<?= e($values['thumb_image']) ?>" alt="" style="width:100%;max-width:220px;aspect-ratio:16/10;object-fit:cover;border-radius:8px;border:1px solid var(--line);margin-bottom:8px;">
            <div class="checkbox-row">
              <input type="checkbox" id="remove_thumb_image" name="remove_thumb_image" value="1">
              <label for="remove_thumb_image">Remove this image</label>
            </div>
          <?php endif; ?>
          <input type="hidden" name="thumb_image_current" value="<?= e($values['thumb_image'] ?? '') ?>">
          <input type="file" id="thumb_image_file" name="thumb_image" accept="image/jpeg,image/png,image/webp,image/gif">
          <span class="hint">Optional. Used on homepage and related-article cards — falls back to the color gradient above if not set. JPG/PNG/WEBP/GIF, max 5&nbsp;MB.</span>
        </div>
        <div class="form-row">
          <label for="header_image_file">Header image</label>
          <?php if ($values['header_image']): ?>
            <img src="../<?= e($values['header_image']) ?>" alt="" style="width:100%;max-width:220px;aspect-ratio:16/10;object-fit:cover;border-radius:8px;border:1px solid var(--line);margin-bottom:8px;">
            <div class="checkbox-row">
              <input type="checkbox" id="remove_header_image" name="remove_header_image" value="1">
              <label for="remove_header_image">Remove this image</label>
            </div>
          <?php endif; ?>
          <input type="hidden" name="header_image_current" value="<?= e($values['header_image'] ?? '') ?>">
          <input type="file" id="header_image_file" name="header_image" accept="image/jpeg,image/png,image/webp,image/gif">
          <span class="hint">Optional. Used as the full-bleed banner on the article page — falls back to the color gradient above if not set. JPG/PNG/WEBP/GIF, max 5&nbsp;MB.</span>
        </div>
      </div>

      <div class="form-row two">
        <div class="form-row">
          <label for="stat_value">Sidebar stat number</label>
          <input type="text" id="stat_value" name="stat_value" value="<?= e($values['stat_value']) ?>" placeholder="e.g. 12–18%">
        </div>
        <div class="form-row">
          <label for="stat_label">Sidebar stat caption</label>
          <input type="text" id="stat_label" name="stat_label" value="<?= e($values['stat_label']) ?>" placeholder="e.g. Typical fuel spend recoverable...">
        </div>
      </div>
      <span class="hint" style="margin-top:-12px;">Optional. Shows a stat callout box in the article sidebar — leave both blank to hide it.</span>

      <div class="form-row">
        <label for="quote_text">Sidebar pull-quote</label>
        <textarea id="quote_text" name="quote_text" rows="2"><?= e($values['quote_text']) ?></textarea>
      </div>
      <div class="form-row">
        <label for="quote_citation">Pull-quote citation</label>
        <input type="text" id="quote_citation" name="quote_citation" value="<?= e($values['quote_citation']) ?>" placeholder="e.g. Core9 Fleet Analytics Team">
        <span class="hint">Optional. Leave the quote blank to hide the pull-quote box.</span>
      </div>

      <div class="form-row">
        <div class="checkbox-row">
          <input type="checkbox" id="is_featured" name="is_featured" value="1" <?= $values['is_featured'] ? 'checked' : '' ?>>
          <label for="is_featured">Feature this article on the homepage</label>
        </div>
        <span class="hint">Only one article can be featured at a time — marking this one unfeatures any other.</span>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn"><?= $isEdit ? 'Save changes' : 'Create article' ?></button>
        <a href="index.php" class="btn btn-ghost">Cancel</a>
      </div>
    </form>
  </div>
  <script src="assets/js/admin.js"></script>
</body>
</html>
