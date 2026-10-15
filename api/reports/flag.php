<?php
/**
 * POST /reports/flag.php   (FR-08 flag incomplete or duplicate)   OWNER: Juliana
 * Body (JSON): { id, flagged: true|false, reason?, duplicate_of? }
 *
 * New reports are already auto-flagged as possible duplicates in reports/create.php
 * (see find_possible_duplicate() in core/reports.php). This endpoint lets the admin
 * flag or un-flag a report by hand.
 *
 * TODO: require_auth(['admin']); UPDATE reports SET is_flagged, flag_reason, duplicate_of;
 *       audit_log(... 'report.flag' ...); json_ok(format_report(...))
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('POST');
require_auth(['admin']);

not_implemented('Juliana', 'flag or unflag a report');
