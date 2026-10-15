<?php
/**
 * POST /notifications/read.php   Body (JSON): { id } to mark one as read, or { all: true }
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('POST');

$user = require_auth();
$in = input();
if (!empty($in['all'])) {
    db_exec('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [$user['id']]);
} else {
    $id = filter_var($in['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id) {
        json_error('Send the notification id', 422);
    }
    db_exec('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [$id, $user['id']]);
}
json_ok(null, 'Marked as read');
