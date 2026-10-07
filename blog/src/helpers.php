<?php
declare(strict_types=1);

function e(?string $value): string
{
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

function slugify(string $text): string
{
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    $text = trim($text, '-');
    return $text === '' ? 'item' : $text;
}

function format_date(?string $datetime): string
{
    if (!$datetime) {
        return '';
    }
    return date('M Y', strtotime($datetime));
}

/**
 * Escapes a line of article text and turns **bold** into <strong>.
 */
function render_inline(string $text): string
{
    return preg_replace('/\*\*(.+?)\*\*/', '<strong>$1</strong>', e($text));
}

/**
 * Anchor id for an article heading, used by the table of contents.
 */
function heading_id(string $heading): string
{
    return substr(slugify($heading), 0, 60);
}

/**
 * Renders plain-text article content to HTML, supporting a small
 * markdown-lite syntax on top of blank-line-separated paragraphs:
 *   "## Heading"     -> <h2 id="heading">Heading</h2>
 *   "### Subheading" -> <h3 id="subheading">Subheading</h3>
 *   "- item" lines   -> <ul><li>item</li>...</ul>
 *   "| a | b |" lines -> a table; the first row is the header, a "| --- |"
 *                       row after it is optional, and a row whose first cell
 *                       is **bold** is highlighted
 *   "> text"         -> a small note (e.g. under a table)
 *   "**bold**"       -> <strong> anywhere in a line
 * Everything else is escaped, so there's no HTML/script injection risk.
 */
function render_article_content(string $text): string
{
    $blocks = preg_split('/\r\n\r\n|\n\n|\r\r/', trim($text));
    $html = '';

    foreach ($blocks as $block) {
        $block = trim($block);
        if ($block === '') {
            continue;
        }

        $lines = preg_split('/\r\n|\n|\r/', $block);

        if (preg_match('/^(#{2,3}) (.+)$/', $lines[0], $m)) {
            $tag = strlen($m[1]) === 2 ? 'h2' : 'h3';
            $html .= '<' . $tag . ' id="' . e(heading_id($m[2])) . '">' . render_inline(trim($m[2])) . '</' . $tag . ">\n";
            $rest = trim(implode("\n", array_slice($lines, 1)));
            if ($rest !== '') {
                $html .= '<p>' . nl2br(render_inline($rest)) . "</p>\n";
            }
            continue;
        }

        if (str_starts_with($lines[0], '|')) {
            $html .= render_table($lines);
            continue;
        }

        if (str_starts_with($lines[0], '> ')) {
            $note = implode("\n", array_map(fn ($l) => preg_replace('/^>\s?/', '', $l), $lines));
            $html .= '<p class="note">' . nl2br(render_inline($note)) . "</p>\n";
            continue;
        }

        $isList = true;
        foreach ($lines as $line) {
            if (!str_starts_with(trim($line), '- ')) {
                $isList = false;
                break;
            }
        }

        if ($isList) {
            $html .= "<ul>\n";
            foreach ($lines as $line) {
                $html .= '<li>' . render_inline(trim(substr(trim($line), 2))) . "</li>\n";
            }
            $html .= "</ul>\n";
            continue;
        }

        $html .= '<p>' . nl2br(render_inline($block)) . "</p>\n";
    }

    return $html;
}

/**
 * Renders "| a | b |" lines (see render_article_content) as a table.
 */
function render_table(array $lines): string
{
    $rows = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if (preg_match('/^\|[\s:|-]+\|?$/', $line)) {
            continue; // "| --- | --- |" separator
        }
        $rows[] = array_map('trim', explode('|', trim($line, '|')));
    }
    if (!$rows) {
        return '';
    }

    $html = "<div class=\"atable\"><table>\n<thead><tr>";
    foreach (array_shift($rows) as $cell) {
        $html .= '<th>' . render_inline($cell) . '</th>';
    }
    $html .= "</tr></thead>\n<tbody>\n";
    foreach ($rows as $cells) {
        $first = array_shift($cells) ?? '';
        $highlight = (bool) preg_match('/^\*\*(.+)\*\*$/', $first, $m);
        $html .= '<tr' . ($highlight ? ' class="hl"' : '') . '><th scope="row">' . e($highlight ? $m[1] : $first) . '</th>';
        foreach ($cells as $cell) {
            $html .= '<td>' . render_inline($cell) . '</td>';
        }
        $html .= "</tr>\n";
    }
    return $html . "</tbody>\n</table></div>\n";
}

/**
 * Table of contents for an article: its ## headings, each with the ###
 * headings under it. Returns [['id', 'text', 'children' => [...]], ...].
 */
function article_toc(string $text): array
{
    $toc = [];
    preg_match_all('/^(#{2,3}) (.+)$/m', $text, $matches, PREG_SET_ORDER);
    foreach ($matches as [, $hashes, $heading]) {
        $heading = trim(str_replace('**', '', $heading));
        $item = ['id' => heading_id($heading), 'text' => $heading, 'children' => []];
        if ($hashes === '##' || !$toc) {
            $toc[] = $item;
        } else {
            $toc[count($toc) - 1]['children'][] = $item;
        }
    }
    return $toc;
}

/**
 * Toolkit calculator to suggest beside an article, picked from its category.
 */
function article_tool(?string $categorySlug): array
{
    $slug = $categorySlug ?? '';
    if (str_contains($slug, 'fleet')) {
        return ['/toolkit/fleet-risk-savings/', 'Fleet Risk & Savings Calculator'];
    }
    if (str_contains($slug, 'retail')) {
        return ['/toolkit/shelf-audit-roi/', 'Shelf Audit ROI Calculator'];
    }
    if (str_contains($slug, 'safety') || str_contains($slug, 'warehouse')) {
        return ['/toolkit/safety-efficiency-roi/', 'Safety & Efficiency ROI Calculator'];
    }
    return ['/toolkit/pilot-planner/', 'Pilot Planner'];
}

function redirect(string $path): never
{
    header('Location: ' . $path);
    exit;
}

function start_session_once(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_name(SESSION_NAME);
        session_start();
    }
}

function csrf_token(): string
{
    start_session_once();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf_token" value="' . e(csrf_token()) . '">';
}

function verify_csrf(?string $token): bool
{
    start_session_once();
    return is_string($token) && !empty($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

function flash_set(string $message, string $type = 'success'): void
{
    start_session_once();
    $_SESSION['flash'] = ['message' => $message, 'type' => $type];
}

function flash_get(): ?array
{
    start_session_once();
    if (empty($_SESSION['flash'])) {
        return null;
    }
    $flash = $_SESSION['flash'];
    unset($_SESSION['flash']);
    return $flash;
}

const THUMB_TONES = ['gold', 'purple', 'teal', 'rose', 'sage', 'steel', 'ember'];
