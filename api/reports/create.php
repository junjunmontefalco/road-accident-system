<?php
/**
 * POST /reports/create.php   (FR-03, FR-04, FR-05, FR-08 duplicate flag, FR-09)  Owner: Juliana
 *
 * Send as multipart/form-data (so photos can be attached):
 *   accident_date      YYYY-MM-DD           required, not in the future
 *   accident_time      HH:MM                required
 *   accident_type_id   int                  required (GET /accident-types/list.php)
 *   location_text      road/street/landmark required
 *   barangay, municipality                  optional text
 *   latitude, longitude                     optional numbers (GPS or map pin)
 *   injury_status      none|injuries|fatalities|unknown   required
 *   description        text, 10+ characters required
 *   vehicles           JSON text, e.g. [{"type":"Car","quantity":2}]  optional
 *   source             web|mobile
 *   photos[]           up to 5 images (jpg, png, webp)   optional, shrunk and saved in Firestore
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('POST');

$user = require_auth(['reporter', 'admin']);
$in = input();

[$v, $errors] = validate_report_fields($in, true);
[$photos, $photoError] = read_uploaded_photos('photos');
if ($photoError) {
    $errors['photos'] = $photoError;
}
if ($errors) {
    json_error('Please fix the highlighted fields', 422, $errors);
}

$duplicateOf = find_possible_duplicate($v);
$id = fs_next_id('reports');
$code = sprintf('RA-%s-%06d', date('Y'), $id);
$source = ($in['source'] ?? 'web') === 'mobile' ? 'mobile' : 'web';

try {
    [$photoWrites, $photoInfo] = photo_writes($id, $photos, $user['id']);
} catch (RuntimeException $e) {
    json_error($e->getMessage(), 422, ['photos' => $e->getMessage()]);
}

$report = $v + [
    'id'                    => $id,
    'report_code'           => $code,
    'reporter_id'           => $user['id'],
    'reporter_name'         => $user['full_name'],
    'contact_info'          => $user['phone'] ?: $user['email'],
    'status'                => 'submitted',
    'rejection_reason'      => null,
    'verified_by'           => null,
    'verified_by_name'      => null,
    'verified_at'           => null,
    'assigned_officer_id'   => null,
    'assigned_officer_name' => null,
    'is_flagged'            => $duplicateOf !== null,
    'flag_reason'           => $duplicateOf ? 'Possible duplicate of an earlier report' : null,
    'duplicate_of'          => $duplicateOf,
    'source'                => $source,
    'photos'                => $photoInfo,
    'history'               => [history_entry(null, 'submitted', $user, 'Report submitted')],
    'remarks'               => [],
    'created_at'            => now(),
    'updated_at'            => now(),
];

$writes = array_merge(
    [fs_w_create('reports', $id, $report)],
    $photoWrites,
    [audit_write($user, 'report.create', 'report', $id, ['report_code' => $code, 'source' => $source, 'photos' => count($photoInfo)])],
    notification_writes([$user['id']], 'Report submitted', "Your report $code was received. Keep this ID to track it.", $report),
    notification_writes(admin_ids(), 'New accident report', "$code at {$v['location_text']}" . ($duplicateOf ? ' (possible duplicate)' : ''), $report)
);
fs_commit($writes); // all or nothing: the report, its photos, the log and the notifications
send_queued_emails();

json_ok(format_report($report, $user, true), 'Report submitted', 201);
