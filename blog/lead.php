<?php
declare(strict_types=1);

// Saves a lead from the website's toolkit calculators (the "email me my
// results" boxes and the Pilot Planner form). The main site is static, so its
// js/site.js posts here: POST JSON
//   { email, firstName?, lastName?, company?, phone?, tool, action, details }
// Answers { "ok": true } or { "ok": false, "error": "..." }. Leads are listed
// in admin/leads.php; LEAD_NOTIFY_EMAIL (in .env) also gets an email per lead.

require __DIR__ . '/config/config.php';
require __DIR__ . '/src/Database.php';
require __DIR__ . '/src/helpers.php';
require __DIR__ . '/src/LeadRepository.php';

header('Content-Type: application/json');
header('Cache-Control: no-store');

function lead_reply(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    lead_reply(405, ['ok' => false, 'error' => 'POST only']);
}

$input = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($input)) {
    lead_reply(400, ['ok' => false, 'error' => 'Invalid request']);
}

// a hidden field real visitors never fill in
if (!empty($input['website'])) {
    lead_reply(200, ['ok' => true]);
}

$field = function (string $key, int $max) use ($input): ?string {
    $value = isset($input[$key]) && is_scalar($input[$key]) ? trim((string) $input[$key]) : '';
    return $value === '' ? null : mb_substr($value, 0, $max);
};

$email = $field('email', 190);
if ($email === null || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    lead_reply(422, ['ok' => false, 'error' => 'Please enter a valid email.']);
}

$ipHash = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . DB_NAME);
$leads = new LeadRepository();
if ($leads->recentCountForIp($ipHash) >= 20) {
    lead_reply(429, ['ok' => false, 'error' => 'Too many requests. Please email info@core9.ai.']);
}

$details = $input['details'] ?? null;
$lead = [
    'email' => $email,
    'first_name' => $field('firstName', 80),
    'last_name' => $field('lastName', 80),
    'company' => $field('company', 160),
    'phone' => $field('phone', 40),
    'tool' => $field('tool', 80) ?? 'unknown',
    'action' => $field('action', 80) ?? 'unknown',
    'details' => $details === null ? null : mb_substr(is_string($details) ? $details : (string) json_encode($details, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), 0, 8000),
    'page_url' => isset($_SERVER['HTTP_REFERER']) ? mb_substr((string) $_SERVER['HTTP_REFERER'], 0, 255) : null,
    'ip_hash' => $ipHash,
];

try {
    $id = $leads->create($lead);
} catch (Throwable $e) {
    error_log('lead.php: ' . $e->getMessage());
    lead_reply(500, ['ok' => false, 'error' => 'Could not save. Please email info@core9.ai.']);
}

if (LEAD_NOTIFY_EMAIL !== '') {
    $name = trim(($lead['first_name'] ?? '') . ' ' . ($lead['last_name'] ?? ''));
    $body = "New toolkit lead #{$id} (self-serve, not a demo request)\n\n"
        . "Email:   {$lead['email']}\n"
        . ($name !== '' ? "Name:    {$name}\n" : '')
        . ($lead['company'] ? "Company: {$lead['company']}\n" : '')
        . ($lead['phone'] ? "Phone:   {$lead['phone']}\n" : '')
        . "Tool:    {$lead['tool']} ({$lead['action']})\n"
        . ($lead['page_url'] ? "Page:    {$lead['page_url']}\n" : '')
        . ($lead['details'] ? "\nResults:\n" . lead_details_text($lead['details']) . "\n" : '');
    $subject = 'Core9 toolkit lead: ' . str_replace(["\r", "\n"], '', $lead['tool']);
    $replyTo = str_replace(["\r", "\n"], '', $lead['email']);
    @mail(LEAD_NOTIFY_EMAIL, $subject, $body, 'Reply-To: ' . $replyTo);
}

lead_reply(200, ['ok' => true]);
