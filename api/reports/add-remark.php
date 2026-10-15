<?php
/**
 * POST /reports/add-remark.php   (Officer: remarks, findings, actions taken)   OWNER: Juliana
 * Body (JSON): { id, type: "remark"|"finding"|"action", content, is_internal: true|false }
 * Used by Jan Russel's officer portal and Vince's admin report details.
 *
 * TODO:
 *  1. $user = require_auth(['admin', 'officer']); report must pass can_view_report()
 *  2. Validate type and content (not empty)
 *  3. INSERT INTO officer_remarks (report_id, officer_id, remark_type, content, is_internal)
 *  4. audit_log(... 'report.remark' ...)
 *  5. If is_internal is false, notify_user() the reporter
 *  6. json_ok(the new remark, 'Remark added', 201)
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('POST');
require_auth(['admin', 'officer']);

not_implemented('Juliana', 'add officer remark');
