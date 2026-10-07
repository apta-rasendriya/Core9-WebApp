<?php
declare(strict_types=1);

/**
 * Article card for the listing and "More insights". $big is the featured card.
 */
function article_card(array $article, bool $big = false): string
{
    $image = $article['thumb_image'] ?: $article['header_image'];
    $media = $image
        ? '<img src="' . e($image) . '" alt="" loading="lazy" onerror="this.remove()">'
        : '<span class="acard__ph" data-tone="' . e($article['thumb_tone']) . '">' . e($article['thumb_label'] ?: ($article['category_name'] ?? 'Insights')) . '</span>';

    return '<a class="acard' . ($big ? ' acard--big' : '') . ' spot" href="article.php?slug=' . urlencode($article['slug']) . '" data-reveal>'
        . '<div class="acard__img">' . $media . '</div>'
        . '<div class="acard__body">'
        . '<div class="ameta"><span class="ameta__cat">' . e($article['category_name'] ?? 'Insights') . '</span>'
        . '<span>' . (int) $article['read_minutes'] . ' min read</span>'
        . '<span>' . e(format_date($article['published_at'])) . '</span></div>'
        . '<h3>' . e($article['title']) . '</h3>'
        . '<p>' . e($article['excerpt']) . '</p>'
        . '<span class="link-arrow">' . ($big ? 'Read the feature' : 'Read article') . ' <svg class="arr"><use href="#i-arrow"/></svg></span>'
        . '</div></a>';
}
