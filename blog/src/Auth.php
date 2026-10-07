<?php
declare(strict_types=1);

final class Auth
{
    public static function adminCount(): int
    {
        $stmt = Database::connection()->query('SELECT COUNT(*) FROM admin_users');
        return (int) $stmt->fetchColumn();
    }

    public static function attempt(string $username, string $password): bool
    {
        $stmt = Database::connection()->prepare('SELECT * FROM admin_users WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            return false;
        }

        self::login($user);
        return true;
    }

    public static function login(array $user): void
    {
        start_session_once();
        session_regenerate_id(true);
        $_SESSION['admin_id'] = $user['id'];
        $_SESSION['admin_username'] = $user['username'];
    }

    public static function logout(): void
    {
        start_session_once();
        $_SESSION = [];
        session_destroy();
    }

    public static function check(): bool
    {
        start_session_once();
        return !empty($_SESSION['admin_id']);
    }

    public static function username(): ?string
    {
        start_session_once();
        return $_SESSION['admin_username'] ?? null;
    }

    public static function requireLogin(): void
    {
        if (!self::check()) {
            redirect('login.php');
        }
    }

    public static function createAdmin(string $username, string $password): int
    {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = Database::connection()->prepare(
            'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)'
        );
        $stmt->execute([$username, $hash]);
        return (int) Database::connection()->lastInsertId();
    }
}
