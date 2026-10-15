<?php
/**
 * Photo evidence (FR-05). Photos are stored inside Firestore (collection report_photos),
 * because Firebase Storage needs the paid plan. A Firestore document can hold at most 1 MB,
 * so every photo is turned into a JPEG of at most 1280 px and about 900 KB.
 */

/**
 * Read the uploaded files in $_FILES[$field]. Returns [photos, error message or null].
 * Each photo: ['tmp' => path, 'name' => original name, 'mime' => type]
 */
function read_uploaded_photos(string $field = 'photos', int $alreadyAttached = 0): array
{
    if (empty($_FILES[$field])) {
        return [[], null];
    }
    $f = $_FILES[$field];
    $count = is_array($f['name']) ? count($f['name']) : 1;
    $maxFiles = (int)app_setting('max_photos_per_report');
    $maxBytes = (int)config('uploads.max_mb', 10) * 1024 * 1024;
    $allowed = config('uploads.allowed_mime');
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $photos = [];
    for ($i = 0; $i < $count; $i++) {
        $err  = is_array($f['error']) ? $f['error'][$i] : $f['error'];
        $tmp  = is_array($f['tmp_name']) ? $f['tmp_name'][$i] : $f['tmp_name'];
        $name = (string)(is_array($f['name']) ? $f['name'][$i] : $f['name']);
        $size = (int)(is_array($f['size']) ? $f['size'][$i] : $f['size']);
        if ($err === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE) {
            return [[], "$name is too large for the server"];
        }
        if ($err !== UPLOAD_ERR_OK) {
            return [[], "Upload failed for $name"];
        }
        $mime = $finfo->file($tmp) ?: '';
        if (!isset($allowed[$mime])) {
            return [[], "$name is not a JPG, PNG or WEBP image"];
        }
        if ($size > $maxBytes) {
            return [[], "$name is larger than " . config('uploads.max_mb') . ' MB'];
        }
        $photos[] = ['tmp' => $tmp, 'name' => mb_substr($name, 0, 120), 'mime' => $mime];
    }
    if (count($photos) + $alreadyAttached > $maxFiles) {
        return [[], "Attach at most $maxFiles photos per report"];
    }
    return [$photos, null];
}

/**
 * Shrink one photo to a JPEG that fits in a Firestore document.
 * @return array{data:string, mime:string, width:int, height:int}
 */
function compress_photo(string $path, string $mime): array
{
    $limit = (int)config('uploads.max_store_kb', 900) * 1024;

    if (!function_exists('imagecreatetruecolor')) {
        // No GD extension: keep the original if it is already small enough
        $data = (string)file_get_contents($path);
        if (strlen($data) > $limit) {
            throw new RuntimeException('The GD extension is off, so large photos cannot be shrunk. Enable extension=gd in php.ini.');
        }
        return ['data' => $data, 'mime' => $mime, 'width' => 0, 'height' => 0];
    }

    $src = match ($mime) {
        'image/jpeg' => @imagecreatefromjpeg($path),
        'image/png'  => @imagecreatefrompng($path),
        'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false,
        default      => false,
    };
    if (!$src) {
        throw new RuntimeException('One of the photos could not be read. Try another photo.');
    }

    // Phones save the camera rotation in EXIF; apply it so photos are upright
    if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
        $exif = @exif_read_data($path);
        $angle = [3 => 180, 6 => -90, 8 => 90][(int)($exif['Orientation'] ?? 1)] ?? 0;
        if ($angle !== 0) {
            $rotated = imagerotate($src, $angle, 0);
            if ($rotated) {
                imagedestroy($src);
                $src = $rotated;
            }
        }
    }

    $w = imagesx($src);
    $h = imagesy($src);
    $maxSide = (int)config('uploads.max_side_px', 1280);
    $quality = (int)config('uploads.jpeg_quality', 72);

    for ($attempt = 0; $attempt < 6; $attempt++) {
        $scale = min(1, $maxSide / max($w, $h));
        $nw = max(1, (int)round($w * $scale));
        $nh = max(1, (int)round($h * $scale));
        $dst = imagecreatetruecolor($nw, $nh);
        // White background for transparent PNG/WEBP
        imagefill($dst, 0, 0, imagecolorallocate($dst, 255, 255, 255));
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
        ob_start();
        imagejpeg($dst, null, $quality);
        $data = (string)ob_get_clean();
        imagedestroy($dst);
        if (strlen($data) <= $limit) {
            imagedestroy($src);
            return ['data' => $data, 'mime' => 'image/jpeg', 'width' => $nw, 'height' => $nh];
        }
        // Still too big: smaller and a little lower quality, then try again
        $maxSide = (int)($maxSide * 0.8);
        $quality = max(45, $quality - 8);
    }
    imagedestroy($src);
    throw new RuntimeException('A photo is too detailed to store. Try a smaller photo.');
}

/**
 * Compress and prepare Firestore writes for new photos of a report.
 * @return array{0: array, 1: array} [list of writes, list of photo info for the report document]
 */
function photo_writes(int $reportId, array $photos, int $uploadedBy): array
{
    $writes = [];
    $info = [];
    $images = array_map(fn($p) => compress_photo($p['tmp'], $p['mime']), $photos);
    $ids = fs_next_ids('report_photos', count($photos));
    foreach ($photos as $i => $p) {
        $img = $images[$i];
        $pid = $ids[$i];
        $writes[] = fs_w_set('report_photos', $pid, [
            'id'          => $pid,
            'report_id'   => $reportId,
            'name'        => $p['name'],
            'mime_type'   => $img['mime'],
            'size_bytes'  => strlen($img['data']),
            'width'       => $img['width'],
            'height'      => $img['height'],
            'uploaded_by' => $uploadedBy,
            'uploaded_at' => now(),
            'data'        => new FsBytes($img['data']),
        ]);
        $info[] = ['id' => $pid, 'name' => $p['name']];
    }
    return [$writes, $info];
}
