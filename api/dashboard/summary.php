<?php
/**
 * GET /dashboard/summary.php   (FR-10 dashboard)   Owner: Vince
 * Optional: ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD (applies to charts and the map)
 *
 * {
 *   "cards":    { "total", "pending", "verified", "closed", "flagged", "rejected", "today" },
 *   "by_status":[ { "status", "label", "count" } ],                    all reports
 *   "by_type":  [ { "type", "count" } ],                               official records only
 *   "by_month": [ { "month": "2026-05", "label": "May 2026", "count" } ] last 12 months, official
 *   "by_municipality": [ { "municipality", "count" } ],               accident-prone areas, official
 *   "hotspots": [ { "barangay", "municipality", "count" } ],          top 10 places, official
 *   "by_hour":  [ 24 numbers ],                                       official, by accident time
 *   "by_injury":[ { "value", "label", "count" } ],                    official
 *   "map_points": [ { id, report_code, latitude, longitude, status, status_label, accident_type, accident_date, is_official_record } ],
 *   "recent":   [ 5 newest reports ]
 * }
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('GET');

$user = require_auth(['admin']);
$all = load_reports($user);
$f = report_filters_from_query();
$ranged = filter_reports($all, array_intersect_key($f, ['date_from' => 1, 'date_to' => 1]));
$official = array_values(array_filter($ranged, 'is_official_record'));
$types = accident_types_map();

$cards = [
    'total'    => count($all),
    'pending'  => count(array_filter($all, fn($r) => in_array($r['status'], ['submitted', 'under_review', 'info_required'], true))),
    'verified' => count(array_filter($all, 'is_official_record')),
    'closed'   => count(array_filter($all, fn($r) => $r['status'] === 'resolved')),
    'flagged'  => count(array_filter($all, fn($r) => !empty($r['is_flagged']) && !in_array($r['status'], ['resolved', 'rejected'], true))),
    'rejected' => count(array_filter($all, fn($r) => $r['status'] === 'rejected')),
    'today'    => count(array_filter($all, fn($r) => str_starts_with($r['created_at'], date('Y-m-d')))),
];

$byStatus = count_by($ranged, fn($r) => $r['status']);
$months = [];
for ($i = 11; $i >= 0; $i--) {
    $m = date('Y-m', strtotime("first day of -$i months"));
    $months[$m] = 0;
}
foreach ($official as $r) {
    $m = substr($r['accident_date'], 0, 7);
    if (isset($months[$m])) {
        $months[$m]++;
    }
}
$hours = array_fill(0, 24, 0);
foreach ($official as $r) {
    $hours[(int)substr($r['accident_time'], 0, 2)]++;
}
$injury = count_by($official, fn($r) => $r['injury_status']);

json_ok([
    'cards'     => $cards,
    'by_status' => array_map(fn($s) => ['status' => $s, 'label' => status_label($s), 'count' => $byStatus[$s] ?? 0], array_keys(REPORT_STATUSES)),
    'by_type'   => array_map(fn($id, $n) => ['type' => $types[$id]['name'] ?? 'Unknown', 'count' => $n],
        array_keys($c = count_by($official, fn($r) => (int)$r['accident_type_id'])), $c),
    'by_month'  => array_map(fn($m, $n) => ['month' => $m, 'label' => date('M Y', strtotime("$m-01")), 'count' => $n], array_keys($months), $months),
    'by_municipality' => array_map(fn($m, $n) => ['municipality' => $m, 'count' => $n],
        array_keys($c = count_by($official, fn($r) => $r['municipality'] ?? null, 10)), $c),
    'hotspots'  => array_map(function ($k, $n) {
        [$b, $m] = explode('|', $k);
        return ['barangay' => $b ?: null, 'municipality' => $m ?: null, 'count' => $n];
    }, array_keys($c = count_by($official, fn($r) => ($r['barangay'] ?? '') . '|' . ($r['municipality'] ?? ''), 10)), $c),
    'by_hour'   => $hours,
    'by_injury' => array_map(fn($k, $label) => ['value' => $k, 'label' => $label, 'count' => $injury[$k] ?? 0], array_keys(INJURY_OPTIONS), INJURY_OPTIONS),
    'map_points'=> array_values(array_map(fn($r) => [
        'id' => (int)$r['id'], 'report_code' => $r['report_code'],
        'latitude' => (float)$r['latitude'], 'longitude' => (float)$r['longitude'],
        'status' => $r['status'], 'status_label' => status_label($r['status']),
        'accident_type' => $types[(int)$r['accident_type_id']]['name'] ?? ($r['accident_type'] ?? ''),
        'accident_date' => $r['accident_date'], 'location_text' => $r['location_text'],
        'is_official_record' => is_official_record($r),
    ], array_filter($ranged, fn($r) => isset($r['latitude'], $r['longitude'])))),
    'recent'    => array_map(fn($r) => format_report($r, $user), array_slice($all, 0, 5)),
    'official_count' => count($official),
]);
