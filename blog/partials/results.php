<?php
declare(strict_types=1);
// Included by index.php (both the full-page render and the AJAX partial
// response) with $showFeatured, $featured, $result, $articles, $totalPages,
// $page, $activeCategorySlug already in scope.
?>
<?php if ($showFeatured): ?>
  <a class="pcard a-feature" href="article.php?slug=<?= urlencode($featured['slug']) ?>">
    <div class="thumb<?= $featured['thumb_image'] ? ' has-image' : '' ?>" data-tone="<?= e($featured['thumb_tone']) ?>">
      <?php if ($featured['thumb_image']): ?><img src="<?= e($featured['thumb_image']) ?>" alt=""><?php endif; ?>
      <span><?= e($featured['thumb_label'] ?: $featured['category_name']) ?></span>
    </div>
    <div>
      <div class="meta-row">
        <span class="meta-cat"><?= e($featured['category_name'] ?? 'Insights') ?></span>
        <span class="meta-dot"></span>
        <span class="meta-time"><?= (int) $featured['read_minutes'] ?> min read</span>
      </div>
      <h3><?= e($featured['title']) ?></h3>
      <p class="excerpt"><?= e($featured['excerpt']) ?></p>
      <span class="read-more">Read the feature <span class="arr">&rarr;</span></span>
      <div class="byline"><span class="av"></span><span><?= e($featured['author_name']) ?> &middot; <?= e(format_date($featured['published_at'])) ?></span></div>
    </div>
  </a>
<?php endif; ?>

<p class="section-label">Latest insights <span class="count">&middot; <?= (int) $result['total'] ?></span></p>

<?php if (empty($articles)): ?>
  <p class="empty-state">No articles here yet.</p>
<?php else: ?>
  <div class="a-grid">
    <?php foreach ($articles as $article): ?>
      <a class="pcard" href="article.php?slug=<?= urlencode($article['slug']) ?>">
        <div class="thumb<?= $article['thumb_image'] ? ' has-image' : '' ?>" data-tone="<?= e($article['thumb_tone']) ?>">
          <?php if ($article['thumb_image']): ?><img src="<?= e($article['thumb_image']) ?>" alt=""><?php endif; ?>
          <span><?= e($article['thumb_label'] ?: $article['category_name']) ?></span>
        </div>
        <div class="meta-row">
          <span class="meta-cat"><?= e($article['category_name'] ?? 'Insights') ?></span>
          <span class="meta-dot"></span>
          <span class="meta-time"><?= (int) $article['read_minutes'] ?> min read</span>
        </div>
        <h3><?= e($article['title']) ?></h3>
        <p class="excerpt"><?= e($article['excerpt']) ?></p>
        <span class="read-more">Read article <span class="arr">&rarr;</span></span>
      </a>
    <?php endforeach; ?>
  </div>
<?php endif; ?>

<?php if ($totalPages > 1): ?>
  <div class="pager">
    <a class="pg-arr <?= $page <= 1 ? 'pg-disabled' : '' ?>" href="<?= e(page_url(max(1, $page - 1), $activeCategorySlug)) ?>">&larr;</a>
    <?php for ($i = 1; $i <= $totalPages; $i++): ?>
      <a class="<?= $i === $page ? 'pg-on' : '' ?>" href="<?= e(page_url($i, $activeCategorySlug)) ?>"><?= $i ?></a>
    <?php endfor; ?>
    <a class="pg-arr <?= $page >= $totalPages ? 'pg-disabled' : '' ?>" href="<?= e(page_url(min($totalPages, $page + 1), $activeCategorySlug)) ?>">&rarr;</a>
  </div>
<?php endif; ?>
