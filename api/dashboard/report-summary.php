<?php
/**
 * GET /dashboard/report-summary.php?period=daily|weekly|monthly|annual&date_from=&date_to=
 * (FR-12 report generation)   OWNER: Vince
 *
 * Return one row per period with counts, e.g. for monthly:
 *   [ { "period": "2026-09", "total": 8, "with_injuries": 3, "fatalities": 1, "top_type": "Collision" }, ... ]
 *
 * Grouping hints (MySQL):
 *   daily   -> accident_date
 *   weekly  -> YEARWEEK(accident_date, 1)
 *   monthly -> DATE_FORMAT(accident_date, '%Y-%m')
 *   annual  -> YEAR(accident_date)
 * Use official_accident_records for official numbers.
 * John's export (export/reports.php) can reuse this query for the PDF/CSV.
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('GET');
require_auth(['admin']);

not_implemented('Vince', 'daily/weekly/monthly/annual report summary');
