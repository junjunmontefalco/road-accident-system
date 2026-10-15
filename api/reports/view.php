<?php
/**
 * GET /reports/view.php?id=12   (FR-06, FR-07)  Owner: Juliana
 * One report with vehicles, photos, status history and remarks
 * (the reporter does not see internal remarks). Also works with ?code=RA-2026-000012
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('GET');

$user = require_auth();
$id = int_query('id');
$r = $id ? find_report($id) : (!empty($_GET['code']) ? find_report_by_code((string)$_GET['code']) : null);
if (!$r || !can_view_report($user, $r)) {
    json_error('Report not found', 404);
}
json_ok(format_report($r, $user, true));
