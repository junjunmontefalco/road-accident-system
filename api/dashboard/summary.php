<?php
/**
 * GET /dashboard/summary.php   (FR-10 dashboard)   OWNER: Vince
 *
 * Should return something like:
 * {
 *   "cards":    { "total": 40, "pending": 15, "verified": 24, "closed": 17, "flagged": 2 },
 *   "by_type":  [ { "type": "Collision", "count": 9 }, ... ],          // pie/donut chart
 *   "by_month": [ { "month": "2026-05", "count": 6 }, ... ],            // trend line
 *   "by_municipality": [ { "municipality": "Malolos", "count": 7 } ],   // accident-prone areas
 *   "map_points": [ { "id": 1, "report_code": "...", "latitude": 14.8, "longitude": 120.8, "status": "resolved" } ],
 *   "recent":   [ ...5 newest reports, use format_report() ... ]
 * }
 *
 * Hints:
 *  - "pending" = status IN ('submitted','under_review','info_required')
 *  - Official statistics (by_type, by_month, by_municipality) should use the view
 *    official_accident_records, so unverified public reports are not counted as accidents.
 *  - Monthly: SELECT DATE_FORMAT(accident_date, '%Y-%m') AS month, COUNT(*) ... GROUP BY month
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('GET');
require_auth(['admin']);

// Starter: summary cards already work so the dashboard page has real numbers on day 1.
$cards = db_one("
    SELECT COUNT(*) AS total,
           SUM(status IN ('submitted','under_review','info_required')) AS pending,
           SUM(verified_at IS NOT NULL AND status IN ('verified','assigned','in_progress','resolved')) AS verified,
           SUM(status = 'resolved') AS closed,
           SUM(is_flagged = 1) AS flagged
      FROM reports");

json_ok([
    'cards' => array_map('intval', $cards),
    // TODO (Vince): by_type, by_month, by_municipality, map_points, recent
]);
