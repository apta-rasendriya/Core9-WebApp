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
 * Renders plain-text article content to HTML, supporting a small
 * markdown-lite syntax on top of blank-line-separated paragraphs:
 *   "## Heading"   -> <h2>Heading</h2>
 *   "- item" lines -> <ul><li>item</li>...</ul>
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

        if (str_starts_with($lines[0], '## ')) {
            $html .= '<h2>' . e(trim(substr($lines[0], 3))) . "</h2>\n";
            $rest = trim(implode("\n", array_slice($lines, 1)));
            if ($rest !== '') {
                $html .= '<p>' . nl2br(e($rest)) . "</p>\n";
            }
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
                $html .= '<li>' . e(trim(substr(trim($line), 2))) . "</li>\n";
            }
            $html .= "</ul>\n";
            continue;
        }

        $html .= '<p>' . nl2br(e($block)) . "</p>\n";
    }

    return $html;
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
