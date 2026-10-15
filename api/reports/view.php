<?php
/**
 * GET /reports/view.php?id=12   (FR-06, FR-07)  Owner: Juliana
 * One report with vehicles, photos, status history and (staff only) remarks.
 * Also works with ?code=RA-2026-000012
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('GET');

$user = require_auth();
$id = int_query('id');
if (!$id && !empty($_GET['code'])) {
    $row = db_one('SELECT id FROM reports WHERE report_code = ?', [trim((string)$_GET['code'])]);
    $id = $row ? (int)$row['id'] : null;
}
$r = $id ? find_report($id) : null;
if (!$r || !can_view_report($user, $r)) {
    json_error('Report not found', 404);
}
$isStaff = in_array($user['role'], ['admin', 'officer'], true);

$report = format_report($r, $user);

$report['vehicles'] = array_map(fn($v) => [
    'type' => $v['vehicle_type'], 'quantity' => (int)$v['quantity'],
], db_all('SELECT vehicle_type, quantity FROM report_vehicles WHERE report_id = ? ORDER BY id', [$id]));

$report['photos'] = array_map(fn($p) => [
    'id' => (int)$p['id'], 'url' => photo_url((int)$p['id']), 'name' => $p['original_name'],
], db_all('SELECT id, original_name FROM report_photos WHERE report_id = ? ORDER BY id', [$id]));

$report['history'] = array_map(fn($h) => [
    'from_status'  => $h['from_status'],
    'status'       => $h['to_status'],
    'status_label' => status_label($h['to_status']),
    'note'         => $h['note'],
    'changed_by'   => $isStaff ? $h['changed_by_name'] : null,
    'date'         => $h['created_at'],
], db_all(
    'SELECT h.*, u.full_name AS changed_by_name FROM report_status_history h
       LEFT JOIN users u ON u.id = h.changed_by WHERE h.report_id = ? ORDER BY h.created_at, h.id',
    [$id]
));

// Officer remarks: staff see all, the reporter sees only non-internal ones
$remarkSql = 'SELECT m.*, u.full_name AS officer_name FROM officer_remarks m
                LEFT JOIN users u ON u.id = m.officer_id WHERE m.report_id = ?'
           . ($isStaff ? '' : ' AND m.is_internal = 0') . ' ORDER BY m.created_at';
$report['remarks'] = array_map(fn($m) => [
    'id'          => (int)$m['id'],
    'type'        => $m['remark_type'],
    'content'     => $m['content'],
    'officer'     => $m['officer_name'],
    'is_internal' => (bool)$m['is_internal'],
    'date'        => $m['created_at'],
], db_all($remarkSql, [$id]));

if ($isStaff) {
    $report['allowed_next_statuses'] = array_values(array_filter(
        STATUS_TRANSITIONS[$r['status']] ?? [],
        fn($s) => can_change_status($user, $r, $s)
    ));
}

json_ok($report);
