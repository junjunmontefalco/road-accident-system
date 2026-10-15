<?php
/**
 * POST /reports/update-status.php   (FR-07, FR-08, FR-09, FR-14)  Owner: Juliana
 * Body (JSON): { id, status, note?, reason? }
 *   - Only moves listed in core/status.php are allowed.
 *   - "rejected" needs a reason.
 *   - "verified" turns the report into an official accident record.
 *   - "assigned" is NOT done here: use reports/assign.php (needs an officer).
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('POST');

$user = require_auth(['admin', 'officer']);
$in = input();
$id = filter_var($in['id'] ?? null, FILTER_VALIDATE_INT);
$to = str_field($in, 'status');
$note = str_field($in, 'note');
$reason = str_field($in, 'reason');

$r = $id ? find_report((int)$id) : null;
if (!$r || !can_view_report($user, $r)) {
    json_error('Report not found', 404);
}
if (!$to || !isset(REPORT_STATUSES[$to])) {
    json_error('Unknown status', 422, ['status' => 'Unknown status']);
}
if ($to === 'assigned') {
    json_error('Use reports/assign.php to assign an officer', 422);
}
if (!can_change_status($user, $r, $to)) {
    json_error('Cannot change status from "' . status_label($r['status']) . '" to "' . status_label($to) . '"', 422);
}
if ($to === 'rejected' && $reason === null) {
    json_error('A reason is required to reject a report', 422, ['reason' => 'Enter the reason']);
}

$pdo = db();
$pdo->beginTransaction();
try {
    $sets = ['status = ?'];
    $vals = [$to];
    if ($to === 'verified') {
        $sets[] = 'verified_by = ?';
        $sets[] = 'verified_at = NOW()';
        $vals[] = $user['id'];
    }
    if ($to === 'rejected') {
        $sets[] = 'rejection_reason = ?';
        $vals[] = mb_substr($reason, 0, 255);
    }
    $vals[] = $r['id'];
    db_exec('UPDATE reports SET ' . implode(', ', $sets) . ' WHERE id = ?', $vals);

    $historyNote = $to === 'rejected' ? "Rejected: $reason" : $note;
    record_status_change((int)$r['id'], $r['status'], $to, (int)$user['id'], $historyNote);
    audit_log((int)$user['id'], 'report.status', 'report', (int)$r['id'], ['from' => $r['status'], 'to' => $to, 'note' => $historyNote]);

    if ($r['reporter_id'] && in_array($to, REPORTER_NOTIFY_STATUSES, true)) {
        $msg = 'Status is now: ' . status_label($to) . ($to === 'rejected' ? " ($reason)" : ($note && $to === 'info_required' ? " - $note" : ''));
        notify_user((int)$r['reporter_id'], "Report {$r['report_code']} updated", mb_substr($msg, 0, 255), (int)$r['id']);
    }
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
}

json_ok(format_report(find_report((int)$r['id']), $user), 'Status updated');
