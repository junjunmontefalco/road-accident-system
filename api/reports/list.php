<?php
/**
 * GET /reports/list.php   (FR-07, FR-11)  Owner: Juliana (API), Vince (admin page)
 * All reports for staff. Officers only get reports assigned to them.
 *
 * Filters (all optional):
 *   status, accident_type_id, municipality, barangay,
 *   date_from, date_to (YYYY-MM-DD, accident date),
 *   q (search report code, location, description),
 *   flagged=1, official=1 (verified records only),
 *   page (default 1), per_page (default 20, max 100)
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('GET');

$user = require_auth(['admin', 'officer']);

$where = [];
$params = [];
if ($user['role'] === 'officer') {
    $where[] = 'r.assigned_officer_id = ?';
    $params[] = $user['id'];
}
if (!empty($_GET['status']) && isset(REPORT_STATUSES[$_GET['status']])) {
    $where[] = 'r.status = ?';
    $params[] = $_GET['status'];
}
if ($type = int_query('accident_type_id')) {
    $where[] = 'r.accident_type_id = ?';
    $params[] = $type;
}
foreach (['municipality', 'barangay'] as $col) {
    if ($v = str_field($_GET, $col)) {
        $where[] = "r.$col = ?";
        $params[] = $v;
    }
}
if (($v = str_field($_GET, 'date_from')) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) {
    $where[] = 'r.accident_date >= ?';
    $params[] = $v;
}
if (($v = str_field($_GET, 'date_to')) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) {
    $where[] = 'r.accident_date <= ?';
    $params[] = $v;
}
if ($q = str_field($_GET, 'q')) {
    $where[] = '(r.report_code LIKE ? OR r.location_text LIKE ? OR r.barangay LIKE ? OR r.description LIKE ?)';
    $like = '%' . $q . '%';
    array_push($params, $like, $like, $like, $like);
}
if (($_GET['flagged'] ?? '') === '1') {
    $where[] = 'r.is_flagged = 1';
}
if (($_GET['official'] ?? '') === '1') {
    $where[] = "r.verified_at IS NOT NULL AND r.status IN ('" . implode("','", OFFICIAL_STATUSES) . "')";
}

$whereSql = $where ? ' WHERE ' . implode(' AND ', $where) : '';
$page = max(1, int_query('page', 1));
$perPage = min(100, max(1, int_query('per_page', 20)));

$total = (int)db_one('SELECT COUNT(*) AS n FROM reports r' . $whereSql, $params)['n'];
$rows = db_all(
    REPORT_SELECT . $whereSql . ' ORDER BY r.created_at DESC, r.id DESC LIMIT ' . $perPage . ' OFFSET ' . (($page - 1) * $perPage),
    $params
);

json_ok([
    'items'      => array_map(fn($r) => format_report($r, $user), $rows),
    'page'       => $page,
    'per_page'   => $perPage,
    'total'      => $total,
    'total_pages'=> (int)ceil($total / $perPage),
]);
