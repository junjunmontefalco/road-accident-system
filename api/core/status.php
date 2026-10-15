<?php
/**
 * Report statuses and the allowed workflow (section 6 of the brief).
 * Web and mobile must use these exact codes.
 */

const REPORT_STATUSES = [
    'submitted'     => 'Submitted',
    'under_review'  => 'Under Review',
    'info_required' => 'Additional Information Required',
    'verified'      => 'Verified',
    'assigned'      => 'Assigned',
    'in_progress'   => 'In Progress',
    'resolved'      => 'Resolved / Closed',
    'rejected'      => 'Rejected',
];

/** From status => statuses it may move to. */
const STATUS_TRANSITIONS = [
    'submitted'     => ['under_review', 'rejected'],
    'under_review'  => ['info_required', 'verified', 'rejected'],
    'info_required' => ['under_review', 'rejected'],
    'verified'      => ['assigned', 'resolved'],
    'assigned'      => ['in_progress'],
    'in_progress'   => ['resolved'],
    'resolved'      => [],
    'rejected'      => [],
];

/** Moves an officer may make on a report assigned to them. Admins may make every move. */
const OFFICER_TRANSITIONS = [
    'assigned'    => ['in_progress'],
    'in_progress' => ['resolved'],
];

/** Status changes the reporter is notified about. */
const REPORTER_NOTIFY_STATUSES = ['under_review', 'info_required', 'verified', 'assigned', 'in_progress', 'resolved', 'rejected'];

/** Statuses that mean "officially verified accident record". */
const OFFICIAL_STATUSES = ['verified', 'assigned', 'in_progress', 'resolved'];

const INJURY_OPTIONS = [
    'none'       => 'No injuries',
    'injuries'   => 'Injuries reported',
    'fatalities' => 'Fatalities reported',
    'unknown'    => 'Unknown',
];

function status_label(string $code): string
{
    return REPORT_STATUSES[$code] ?? $code;
}

function can_change_status(array $user, array $report, string $to): bool
{
    $from = $report['status'];
    if ($user['role'] === 'admin') {
        return in_array($to, STATUS_TRANSITIONS[$from] ?? [], true);
    }
    if ($user['role'] === 'officer' && (int)$report['assigned_officer_id'] === (int)$user['id']) {
        return in_array($to, OFFICER_TRANSITIONS[$from] ?? [], true);
    }
    return false;
}

/** Save a status change + history row. Call inside a transaction. */
function record_status_change(int $reportId, ?string $from, string $to, ?int $byUserId, ?string $note): void
{
    db_exec(
        'INSERT INTO report_status_history (report_id, from_status, to_status, changed_by, note) VALUES (?, ?, ?, ?, ?)',
        [$reportId, $from, $to, $byUserId, $note]
    );
}
