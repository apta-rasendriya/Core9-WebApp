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

        $path = self::optimize("uploads/{$subdir}/{$filename}", self::maxWidthFor($subdir), self::formatFor($subdir));
        return ['path' => $path, 'error' => null];
    }

    /** Widest an image needs to be: cards show thumbnails ~600px wide, headers span the page. */
    public static function maxWidthFor(string $subdir): int
    {
        return $subdir === 'headers' ? 2000 : 1200;
    }

    /**
     * Format to save in. Header images double as the article's link-preview
     * image, and not every app shows WebP previews, so they are saved as JPEG.
     */
    public static function formatFor(string $subdir): string
    {
        return $subdir === 'headers' ? 'jpg' : 'webp';
    }

    /**
     * Shrinks an uploaded image for the web: scales it down to $maxWidth and
     * re-saves it as $format ('webp' or 'jpg'; JPEG when the server's GD has no WebP), keeping
     * whichever file is smaller. GIFs (possibly animated) and servers without
     * GD are left untouched. Returns the image's (possibly new) relative path.
     */
    public static function optimize(string $relativePath, int $maxWidth, string $format = 'webp'): string
    {
        $fullPath = dirname(self::uploadsRoot()) . '/' . $relativePath;
        if (!function_exists('imagecreatefromstring') || !is_file($fullPath) || str_ends_with($relativePath, '.gif')) {
            return $relativePath;
        }

        $source = @imagecreatefromstring((string) file_get_contents($fullPath));
        if ($source === false) {
            return $relativePath;
        }

        // palette (8-bit) PNGs/GIFs: WebP and resampling need full colour
        if (!imageistruecolor($source)) {
            imagepalettetotruecolor($source);
        }
        $width = imagesx($source);
        $height = imagesy($source);
        $image = $source;
        $resized = $width > $maxWidth;
        if ($resized) {
            $newHeight = (int) round($height * $maxWidth / $width);
            $image = imagecreatetruecolor($maxWidth, $newHeight);
            imagealphablending($image, false);
            imagesavealpha($image, true);
            imagecopyresampled($image, $source, 0, 0, 0, 0, $maxWidth, $newHeight, $width, $height);
        }

        if ($format === 'webp' && function_exists('imagewebp')) {
            $ext = 'webp';
        } elseif ($format === 'webp' && str_ends_with($relativePath, '.png')) {
            $ext = 'png'; // no WebP on this server: a PNG may have transparency, which JPEG would lose
        } else {
            $ext = 'jpg';
        }

        if ($ext === 'jpg') {
            // JPEG has no transparency: flatten onto the site's background colour
            $flat = imagecreatetruecolor(imagesx($image), imagesy($image));
            imagefill($flat, 0, 0, imagecolorallocate($flat, 8, 5, 14));
            imagealphablending($flat, true);
            imagecopy($flat, $image, 0, 0, 0, 0, imagesx($image), imagesy($image));
            $image = $flat;
        }

        $newRelative = preg_replace('/\.[a-z]+$/', '', $relativePath) . '.' . $ext;
        $newFull = dirname(self::uploadsRoot()) . '/' . $newRelative;
        $tmp = $newFull . '.tmp';
        $ok = match ($ext) {
            'webp' => imagewebp($image, $tmp, 80),
            'jpg' => imagejpeg($image, $tmp, 82),
            default => imagepng($image, $tmp, 9),
        };

        // keep the new file if it was resized, changed format, or is simply smaller
        $sameFormat = str_ends_with($relativePath, '.' . $ext) || ($ext === 'jpg' && str_ends_with($relativePath, '.jpeg'));
        clearstatcache();
        if (!$ok || !is_file($tmp) || filesize($tmp) === 0 || (!$resized && $sameFormat && filesize($tmp) >= filesize($fullPath))) {
            @unlink($tmp);
            return $relativePath;
        }
        rename($tmp, $newFull);
        if ($newFull !== $fullPath) {
            unlink($fullPath);
        }
        return $newRelative;
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
