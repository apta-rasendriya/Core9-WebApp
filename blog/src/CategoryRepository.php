<?php
declare(strict_types=1);

final class CategoryRepository
{
    public function all(): array
    {
        $stmt = Database::connection()->query('SELECT * FROM categories ORDER BY name ASC');
        return $stmt->fetchAll();
    }

    public function withPublishedCounts(): array
    {
        $sql = "SELECT c.*, COUNT(a.id) AS article_count
                FROM categories c
                LEFT JOIN articles a ON a.category_id = c.id AND a.status = 'published'
                GROUP BY c.id
                ORDER BY c.name ASC";
        $stmt = Database::connection()->query($sql);
        return $stmt->fetchAll();
    }

    public function findBySlug(string $slug): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM categories WHERE slug = ? LIMIT 1');
        $stmt->execute([$slug]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM categories WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(string $name): int
    {
        $baseSlug = slugify($name);
        $slug = $baseSlug;
        $suffix = 2;
        while ($this->findBySlug($slug) !== null) {
            $slug = $baseSlug . '-' . $suffix;
            $suffix++;
        }

        $stmt = Database::connection()->prepare('INSERT INTO categories (name, slug) VALUES (?, ?)');
        $stmt->execute([$name, $slug]);
        return (int) Database::connection()->lastInsertId();
    }

    public function delete(int $id): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM categories WHERE id = ?');
        $stmt->execute([$id]);
    }
}
