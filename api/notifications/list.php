<?php
/**
 * GET /notifications/list.php   (FR-09)  The logged-in user's notifications, newest first.
 * Optional: ?unread=1
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('GET');

$user = require_auth();
$rows = db_all(
    'SELECT n.*, r.report_code FROM notifications n LEFT JOIN reports r ON r.id = n.report_id
      WHERE n.user_id = ?' . (($_GET['unread'] ?? '') === '1' ? ' AND n.is_read = 0' : '') .
    ' ORDER BY n.created_at DESC, n.id DESC LIMIT 100',
    [$user['id']]
);
$unread = (int)db_one('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0', [$user['id']])['n'];

json_ok([
    'unread_count' => $unread,
    'items' => array_map(fn($n) => [
        'id'          => (int)$n['id'],
        'title'       => $n['title'],
        'message'     => $n['message'],
        'report_id'   => $n['report_id'] !== null ? (int)$n['report_id'] : null,
        'report_code' => $n['report_code'],
        'is_read'     => (bool)$n['is_read'],
        'date'        => $n['created_at'],
    ], $rows),
]);
