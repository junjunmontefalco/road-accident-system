<?php
/**
 * POST /reports/assign.php   (FR-07)   OWNER: Juliana
 * Body (JSON): { id, officer_id, note? }
 *
 * TODO:
 *  1. require_auth(['admin'])
 *  2. Load the report with find_report(); it must be in status "verified"
 *     (check with can_change_status($user, $report, 'assigned'))
 *  3. Check officer_id is an active user with role "officer"
 *  4. In a transaction: UPDATE reports SET status='assigned', assigned_officer_id=?
 *     record_status_change(...), audit_log(... 'report.assign' ...)
 *  5. notify_user() the officer ("New report assigned to you") and the reporter
 *  6. json_ok(format_report(find_report($id), $user), 'Officer assigned')
 * Look at reports/update-status.php: it follows the same pattern.
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('POST');
require_auth(['admin']);

not_implemented('Juliana', 'assign report to officer');
