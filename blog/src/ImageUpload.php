<?php
declare(strict_types=1);

final class ImageUpload
{
    private const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

    private const ALLOWED_MIME_TO_EXT = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    /**
     * Validates and stores an uploaded image from $_FILES['field'].
     * Returns ['path' => 'uploads/subdir/xxxx.ext', 'error' => null] on success,
     * ['path' => null, 'error' => null] when no file was submitted, or
     * ['path' => null, 'error' => 'message'] on a validation/IO failure.
     */
    public static function handle(?array $file, string $subdir): array
    {
        if ($file === null || $file['error'] === UPLOAD_ERR_NO_FILE) {
            return ['path' => null, 'error' => null];
        }

        if ($file['error'] !== UPLOAD_ERR_OK) {
            return ['path' => null, 'error' => self::errorMessage($file['error'])];
        }

        if ($file['size'] > self::MAX_BYTES) {
            return ['path' => null, 'error' => 'Image is too large (max 5 MB).'];
        }

        if (!is_uploaded_file($file['tmp_name'])) {
            return ['path' => null, 'error' => 'Upload failed, please try again.'];
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!isset(self::ALLOWED_MIME_TO_EXT[$mime])) {
            return ['path' => null, 'error' => 'Unsupported image type. Use JPG, PNG, WEBP, or GIF.'];
        }

        $ext = self::ALLOWED_MIME_TO_EXT[$mime];
        $filename = bin2hex(random_bytes(12)) . '.' . $ext;

        $dir = self::uploadsRoot() . '/' . $subdir;
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            return ['path' => null, 'error' => 'Could not create upload directory.'];
        }

        $destination = $dir . '/' . $filename;
        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            return ['path' => null, 'error' => 'Could not save the uploaded image.'];
        }

        return ['path' => "uploads/{$subdir}/{$filename}", 'error' => null];
    }

    public static function delete(?string $relativePath): void
    {
        if (!$relativePath) {
            return;
        }

        // Only ever delete files inside our own uploads/ tree.
        if (!str_starts_with($relativePath, 'uploads/')) {
            return;
        }

        $fullPath = dirname(self::uploadsRoot()) . '/' . $relativePath;
        if (is_file($fullPath)) {
            unlink($fullPath);
        }
    }

    private static function uploadsRoot(): string
    {
        return dirname(__DIR__) . '/uploads';
    }

    private static function errorMessage(int $code): string
    {
        return match ($code) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Image is too large.',
            UPLOAD_ERR_PARTIAL => 'Image upload was interrupted, please try again.',
            default => 'Image upload failed, please try again.',
        };
    }
}
