<?php
/**
 * POST /reports/edit.php   (FR-07 edit reports)   OWNER: Juliana
 * Body (JSON): { id, ...any report field to correct (location_text, barangay, accident_type_id, injury_status, description...) }
 *
 * TODO:
 *  1. require_auth(['admin'])  (reporters may edit only while status is "info_required" - optional)
 *  2. Validate only the fields that were sent (reuse the rules in reports/create.php)
 *  3. UPDATE reports SET ... WHERE id = ?
 *  4. audit_log(... 'report.edit', ['changed' => old vs new values])
 *  5. json_ok(format_report(find_report($id), $user), 'Report updated')
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('POST');
require_auth(['admin']);

not_implemented('Juliana', 'edit report details');
