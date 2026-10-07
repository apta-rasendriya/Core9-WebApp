<?php
declare(strict_types=1);

final class ArticleRepository
{
    private const PUBLIC_SELECT = "SELECT a.*, c.name AS category_name, c.slug AS category_slug
                                    FROM articles a
                                    LEFT JOIN categories c ON c.id = a.category_id";

    public function featured(): ?array
    {
        $sql = self::PUBLIC_SELECT . " WHERE a.status = 'published' AND a.is_featured = 1
                ORDER BY a.published_at DESC LIMIT 1";
        $row = Database::connection()->query($sql)->fetch();

        if ($row) {
            return $row;
        }

        $sql = self::PUBLIC_SELECT . " WHERE a.status = 'published'
                ORDER BY a.published_at DESC LIMIT 1";
        $row = Database::connection()->query($sql)->fetch();
        return $row ?: null;
    }

    public function allPublished(?string $categorySlug, int $page, int $perPage, ?int $excludeId = null): array
    {
        $where = ["a.status = 'published'"];
        $params = [];

        if ($categorySlug !== null && $categorySlug !== '') {
            $where[] = 'c.slug = ?';
            $params[] = $categorySlug;
        }

        if ($excludeId !== null) {
            $where[] = 'a.id != ?';
            $params[] = $excludeId;
        }

        $whereSql = 'WHERE ' . implode(' AND ', $where);

        $countSql = "SELECT COUNT(*) FROM articles a LEFT JOIN categories c ON c.id = a.category_id {$whereSql}";
        $countStmt = Database::connection()->prepare($countSql);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $perPage = max(1, $perPage);
        $page = max(1, $page);
        $offset = ($page - 1) * $perPage;

        $sql = self::PUBLIC_SELECT . " {$whereSql} ORDER BY a.published_at DESC LIMIT {$perPage} OFFSET {$offset}";
        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($params);

        return [
            'items' => $stmt->fetchAll(),
            'total' => $total,
        ];
    }

    public function findBySlugPublished(string $slug): ?array
    {
        $sql = self::PUBLIC_SELECT . " WHERE a.slug = ? AND a.status = 'published' LIMIT 1";
        $stmt = Database::connection()->prepare($sql);
        $stmt->execute([$slug]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function related(array $article, int $limit = 3): array
    {
        $found = [];

        if ($article['category_id'] !== null) {
            $sql = self::PUBLIC_SELECT . " WHERE a.status = 'published' AND a.id != ? AND a.category_id = ?
                    ORDER BY a.published_at DESC LIMIT {$limit}";
            $stmt = Database::connection()->prepare($sql);
            $stmt->execute([$article['id'], $article['category_id']]);
            $found = $stmt->fetchAll();
        }

        $remaining = $limit - count($found);
        if ($remaining > 0) {
            $excludeIds = array_merge([(int) $article['id']], array_column($found, 'id'));
            $placeholders = implode(',', array_fill(0, count($excludeIds), '?'));
            $sql = self::PUBLIC_SELECT . " WHERE a.status = 'published' AND a.id NOT IN ({$placeholders})
                    ORDER BY a.published_at DESC LIMIT {$remaining}";
            $stmt = Database::connection()->prepare($sql);
            $stmt->execute($excludeIds);
            $found = array_merge($found, $stmt->fetchAll());
        }

        return $found;
    }

    public function findById(int $id): ?array
    {
        $sql = self::PUBLIC_SELECT . ' WHERE a.id = ? LIMIT 1';
        $stmt = Database::connection()->prepare($sql);
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function allForAdmin(): array
    {
        $sql = self::PUBLIC_SELECT . ' ORDER BY a.created_at DESC';
        return Database::connection()->query($sql)->fetchAll();
    }

    public function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $baseSlug = slugify($title);
        $slug = $baseSlug;
        $suffix = 2;

        while ($this->slugTaken($slug, $ignoreId)) {
            $slug = $baseSlug . '-' . $suffix;
            $suffix++;
        }

        return $slug;
    }

    private function slugTaken(string $slug, ?int $ignoreId): bool
    {
        if ($ignoreId !== null) {
            $stmt = Database::connection()->prepare('SELECT id FROM articles WHERE slug = ? AND id != ? LIMIT 1');
            $stmt->execute([$slug, $ignoreId]);
        } else {
            $stmt = Database::connection()->prepare('SELECT id FROM articles WHERE slug = ? LIMIT 1');
            $stmt->execute([$slug]);
        }
        return (bool) $stmt->fetch();
    }

    public function create(array $data): int
    {
        $publishedAt = $data['status'] === 'published' ? date('Y-m-d H:i:s') : null;

        $stmt = Database::connection()->prepare(
            'INSERT INTO articles
                (category_id, title, slug, excerpt, content, author_name, read_minutes,
                 thumb_tone, thumb_label, thumb_image, header_image,
                 stat_value, stat_label, quote_text, quote_citation,
                 is_featured, status, published_at)
             VALUES
                (:category_id, :title, :slug, :excerpt, :content, :author_name, :read_minutes,
                 :thumb_tone, :thumb_label, :thumb_image, :header_image,
                 :stat_value, :stat_label, :quote_text, :quote_citation,
                 :is_featured, :status, :published_at)'
        );

        $stmt->execute([
            'category_id' => $data['category_id'],
            'title' => $data['title'],
            'slug' => $data['slug'],
            'excerpt' => $data['excerpt'],
            'content' => $data['content'],
            'author_name' => $data['author_name'],
            'read_minutes' => $data['read_minutes'],
            'thumb_tone' => $data['thumb_tone'],
            'thumb_label' => $data['thumb_label'],
            'thumb_image' => $data['thumb_image'],
            'header_image' => $data['header_image'],
            'stat_value' => $data['stat_value'],
            'stat_label' => $data['stat_label'],
            'quote_text' => $data['quote_text'],
            'quote_citation' => $data['quote_citation'],
            'is_featured' => $data['is_featured'] ? 1 : 0,
            'status' => $data['status'],
            'published_at' => $publishedAt,
        ]);

        $id = (int) Database::connection()->lastInsertId();

        if ($data['is_featured']) {
            $this->unsetFeaturedExcept($id);
        }

        return $id;
    }

    public function update(int $id, array $data): void
    {
        $existing = $this->findById($id);
        $publishedAt = $existing['published_at'] ?? null;
        if ($data['status'] === 'published' && $publishedAt === null) {
            $publishedAt = date('Y-m-d H:i:s');
        }
        if ($data['status'] === 'draft') {
            $publishedAt = null;
        }

        $stmt = Database::connection()->prepare(
            'UPDATE articles SET
                category_id = :category_id,
                title = :title,
                slug = :slug,
                excerpt = :excerpt,
                content = :content,
                author_name = :author_name,
                read_minutes = :read_minutes,
                thumb_tone = :thumb_tone,
                thumb_label = :thumb_label,
                thumb_image = :thumb_image,
                header_image = :header_image,
                stat_value = :stat_value,
                stat_label = :stat_label,
                quote_text = :quote_text,
                quote_citation = :quote_citation,
                is_featured = :is_featured,
                status = :status,
                published_at = :published_at
             WHERE id = :id'
        );

        $stmt->execute([
            'category_id' => $data['category_id'],
            'title' => $data['title'],
            'slug' => $data['slug'],
            'excerpt' => $data['excerpt'],
            'content' => $data['content'],
            'author_name' => $data['author_name'],
            'read_minutes' => $data['read_minutes'],
            'thumb_tone' => $data['thumb_tone'],
            'thumb_label' => $data['thumb_label'],
            'thumb_image' => $data['thumb_image'],
            'header_image' => $data['header_image'],
            'stat_value' => $data['stat_value'],
            'stat_label' => $data['stat_label'],
            'quote_text' => $data['quote_text'],
            'quote_citation' => $data['quote_citation'],
            'is_featured' => $data['is_featured'] ? 1 : 0,
            'status' => $data['status'],
            'published_at' => $publishedAt,
            'id' => $id,
        ]);

        if ($data['is_featured']) {
            $this->unsetFeaturedExcept($id);
        }
    }

    public function unsetFeaturedExcept(int $id): void
    {
        $stmt = Database::connection()->prepare('UPDATE articles SET is_featured = 0 WHERE id != ?');
        $stmt->execute([$id]);
    }

    public function delete(int $id): void
    {
        $article = $this->findById($id);

        $stmt = Database::connection()->prepare('DELETE FROM articles WHERE id = ?');
        $stmt->execute([$id]);

        if ($article) {
            ImageUpload::delete($article['thumb_image']);
            ImageUpload::delete($article['header_image']);
        }
    }
}
