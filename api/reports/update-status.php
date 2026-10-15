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
$id = (int)filter_var($in['id'] ?? null, FILTER_VALIDATE_INT);
$to = str_field($in, 'status');
$note = str_field($in, 'note');
$reason = str_field($in, 'reason');

$r = find_report($id);
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
if ($to === 'info_required' && $note === null) {
    json_error('Tell the reporter what information is missing', 422, ['note' => 'Enter what is missing']);
}

$changes = ['status' => $to, 'updated_at' => now()];
if ($to === 'verified') {
    $changes['verified_by'] = $user['id'];
    $changes['verified_by_name'] = $user['full_name'];
    $changes['verified_at'] = now();
}
if ($to === 'rejected') {
    $changes['rejection_reason'] = mb_substr($reason, 0, 255);
}
$historyNote = $to === 'rejected' ? "Rejected: $reason" : $note;

$writes = [
    fs_w_update('reports', $id, $changes, true, ['history' => [history_entry($r['status'], $to, $user, $historyNote)]]),
    audit_write($user, 'report.status', 'report', $id, ['from' => $r['status'], 'to' => $to, 'note' => $historyNote]),
];
if (!empty($r['reporter_id']) && in_array($to, REPORTER_NOTIFY_STATUSES, true)) {
    $msg = 'Status is now: ' . status_label($to)
        . ($to === 'rejected' ? " ($reason)" : ($note && $to === 'info_required' ? " - $note" : ''));
    $writes = array_merge($writes, notification_writes([$r['reporter_id']], "Report {$r['report_code']} updated", $msg, $r));
}
// Officers' updates go to the admins too
if ($user['role'] === 'officer') {
    $writes = array_merge($writes, notification_writes(admin_ids(), "Report {$r['report_code']} updated",
        "{$user['full_name']} set the status to " . status_label($to), $r));
}
fs_commit($writes);
send_queued_emails();

report_response($id, $user, 'Status updated');
