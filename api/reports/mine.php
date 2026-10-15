<?php
/**
 * GET /reports/mine.php   (FR-06 report history)  Owner: Juliana
 * The logged-in reporter's own reports, newest first.
 * Optional: ?status=submitted
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('GET');

$user = require_auth();
$sql = REPORT_SELECT . ' WHERE r.reporter_id = ?';
$params = [$user['id']];
if (!empty($_GET['status']) && isset(REPORT_STATUSES[$_GET['status']])) {
    $sql .= ' AND r.status = ?';
    $params[] = $_GET['status'];
}
$rows = db_all($sql . ' ORDER BY r.created_at DESC, r.id DESC', $params);
json_ok(array_map(fn($r) => format_report($r, $user), $rows));
