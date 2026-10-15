<?php
/**
 * GET /export/reports.php?format=csv|pdf&token=...&(same filters as reports/list.php)
 * (FR-15 data export)   OWNER: John
 *
 * CSV (no library needed):
 *   header('Content-Type: text/csv'); header('Content-Disposition: attachment; filename="reports.csv"');
 *   $out = fopen('php://output', 'w'); fputcsv($out, [...headers]); foreach rows: fputcsv(...)
 *
 * PDF: easiest options
 *   - Dompdf (download the release zip from GitHub, no Composer needed), render an HTML table
 *   - or make the React page printable and use the browser's "Save as PDF"
 *
 * Reporter contact details: include only for admins.
 * Pass ?token=... because a download link cannot send the Authorization header.
 * audit_log(... 'report.export', ['format' => ..., 'filters' => ...])
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('GET');
require_auth(['admin']);

not_implemented('John', 'export reports to CSV/PDF');
