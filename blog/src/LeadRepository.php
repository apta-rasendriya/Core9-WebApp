<?php
declare(strict_types=1);

/**
 * Leads left in the website's toolkit calculators (see lead.php).
 */
final class LeadRepository
{
    public function create(array $lead): int
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO leads (email, first_name, last_name, company, phone, tool, action, details, page_url, ip_hash)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $lead['email'], $lead['first_name'], $lead['last_name'], $lead['company'], $lead['phone'],
            $lead['tool'], $lead['action'], $lead['details'], $lead['page_url'], $lead['ip_hash'],
        ]);
        return (int) Database::connection()->lastInsertId();
    }

    /** Leads from one (hashed) IP in the last hour, for simple rate limiting. */
    public function recentCountForIp(string $ipHash): int
    {
        $stmt = Database::connection()->prepare(
            'SELECT COUNT(*) FROM leads WHERE ip_hash = ? AND created_at > (NOW() - INTERVAL 1 HOUR)'
        );
        $stmt->execute([$ipHash]);
        return (int) $stmt->fetchColumn();
    }

    public function all(): array
    {
        return Database::connection()->query('SELECT * FROM leads ORDER BY created_at DESC, id DESC')->fetchAll();
    }

    public function delete(int $id): void
    {
        Database::connection()->prepare('DELETE FROM leads WHERE id = ?')->execute([$id]);
    }
}
