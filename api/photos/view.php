<?php
/**
 * GET /photos/view.php?id=5&token=...   (FR-05 evidence viewer)
 * Sends the image only to people allowed to see the report.
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('GET');

$user = require_auth();
$id = int_query('id');
$photo = $id ? db_one('SELECT * FROM report_photos WHERE id = ?', [$id]) : null;
$report = $photo ? find_report((int)$photo['report_id']) : null;
if (!$photo || !$report || !can_view_report($user, $report)) {
    json_error('Photo not found', 404);
}

$base = realpath(config('uploads.dir'));
$path = realpath(config('uploads.dir') . '/' . $photo['file_path']);
if ($base === false || $path === false || !str_starts_with($path, $base) || !is_file($path)) {
    json_error('Photo file is missing', 404);
}

header('Content-Type: ' . $photo['mime_type']);
header('Content-Length: ' . filesize($path));
header('Cache-Control: private, max-age=3600');
readfile($path);
