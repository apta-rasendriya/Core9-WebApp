<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if (Auth::adminCount() === 0) {
    redirect('setup.php');
}
Auth::requireLogin();

$leadRepo = new LeadRepository();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf($_POST['csrf_token'] ?? null)) {
        flash_set('Your session expired, please try again.', 'error');
    } elseif (($_POST['action'] ?? '') === 'delete' && (int) ($_POST['id'] ?? 0) > 0) {
        $leadRepo->delete((int) $_POST['id']);
        flash_set('Lead deleted.');
    }
    redirect('leads.php');
}

$leads = $leadRepo->all();

// CSV export, e.g. for importing into HubSpot
if (($_GET['export'] ?? '') === 'csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="core9-toolkit-leads-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF"); // so Excel reads UTF-8
    fputcsv($out, ['Date (UTC)', 'Email', 'First name', 'Last name', 'Company', 'Phone', 'Tool', 'Action', 'Results', 'Page']);
    foreach ($leads as $lead) {
        $row = [$lead['created_at'], $lead['email'], $lead['first_name'], $lead['last_name'], $lead['company'],
            $lead['phone'], $lead['tool'], $lead['action'], lead_details_text($lead['details']), $lead['page_url']];
        // stop spreadsheet apps from running visitor-typed text as formulas
        fputcsv($out, array_map(fn ($v) => is_string($v) && preg_match('/^[=+\-@\t\r]/', $v) ? "'" . $v : $v, $row));
    }
    exit;
}

$flash = flash_get();
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Leads — <?= e(SITE_NAME) ?> admin</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Spectral:ital,wght@0,500&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="assets/css/admin.css?v=<?= filemtime(__DIR__ . '/assets/css/admin.css') ?>" />
</head>
<body>
  <div class="admin-wrap">
    <nav class="admin-nav">
      <a class="brand" href="index.php">Core9 · Admin</a>
      <div class="right">
        <a href="index.php">Articles</a>
        <a href="categories.php">Categories</a>
        <span>Signed in as <?= e(Auth::username()) ?></span>
        <a href="logout.php">Log out</a>
      </div>
    </nav>

    <?php if ($flash): ?>
      <div class="flash flash-<?= e($flash['type']) ?>"><?= e($flash['message']) ?></div>
    <?php endif; ?>

    <h1 class="page-title">Leads</h1>
    <p class="page-sub">Emails left in the website's Toolkit calculators: people asking for their results or a pilot plan. These are self-serve leads, not demo requests (those go to HubSpot). Follow up by email, or export to import into HubSpot.</p>

    <?php if (empty($leads)): ?>
      <p class="empty">No leads yet.</p>
    <?php else: ?>
      <p style="margin-bottom:20px;"><a class="btn" href="leads.php?export=csv">Download CSV (<?= count($leads) ?>)</a></p>
      <table>
        <thead>
          <tr>
            <th>Date (UTC)</th>
            <th>Contact</th>
            <th>Tool</th>
            <th>Results</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($leads as $lead): $name = trim(($lead['first_name'] ?? '') . ' ' . ($lead['last_name'] ?? '')); ?>
            <tr>
              <td data-label="Date"><?= e(date('d M Y, H:i', strtotime($lead['created_at']))) ?></td>
              <td class="cell-title">
                <a href="mailto:<?= e($lead['email']) ?>"><?= e($lead['email']) ?></a>
                <?php if ($name !== '' || $lead['company'] || $lead['phone']): ?><br><small><?= e(implode(' · ', array_filter([$name, $lead['company'], $lead['phone']]))) ?></small><?php endif; ?>
              </td>
              <td data-label="Tool"><?= e($lead['tool']) ?><br><small><?= e($lead['action']) ?></small></td>
              <td data-label="Results"><?php if ($lead['details']): ?><details><summary>Show</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;margin:8px 0 0;max-width:420px;"><?= e(lead_details_text($lead['details'])) ?></pre></details><?php endif; ?></td>
              <td class="actions">
                <form method="post" data-confirm="Delete the lead from <?= e($lead['email']) ?>?">
                  <?= csrf_field() ?>
                  <input type="hidden" name="action" value="delete">
                  <input type="hidden" name="id" value="<?= (int) $lead['id'] ?>">
                  <button type="submit" class="danger">Delete</button>
                </form>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </div>
  <script src="assets/js/admin.js"></script>
</body>
</html>
