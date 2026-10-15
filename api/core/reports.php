<?php
/** Shared report helpers: one JSON shape for a report everywhere. */

const REPORT_SELECT = "
    SELECT r.*, t.name AS accident_type,
           o.full_name AS assigned_officer_name,
           v.full_name AS verified_by_name,
           (SELECT COUNT(*) FROM report_photos p WHERE p.report_id = r.id) AS photo_count
      FROM reports r
      JOIN accident_types t ON t.id = r.accident_type_id
      LEFT JOIN users o ON o.id = r.assigned_officer_id
      LEFT JOIN users v ON v.id = r.verified_by
";

function find_report(int $id): ?array
{
    return db_one(REPORT_SELECT . ' WHERE r.id = ?', [$id]);
}

/**
 * Turn a database row into the JSON the apps receive.
 * Reporter contact details are only included for staff (access restriction).
 */
function format_report(array $r, array $viewer): array
{
    $isStaff = in_array($viewer['role'], ['admin', 'officer'], true);
    $out = [
        'id'                => (int)$r['id'],
        'report_code'       => $r['report_code'],
        'accident_date'     => $r['accident_date'],
        'accident_time'     => substr((string)$r['accident_time'], 0, 5),
        'location_text'     => $r['location_text'],
        'barangay'          => $r['barangay'],
        'municipality'      => $r['municipality'],
        'latitude'          => $r['latitude'] !== null ? (float)$r['latitude'] : null,
        'longitude'         => $r['longitude'] !== null ? (float)$r['longitude'] : null,
        'accident_type_id'  => (int)$r['accident_type_id'],
        'accident_type'     => $r['accident_type'],
        'injury_status'     => $r['injury_status'],
        'injury_label'      => INJURY_OPTIONS[$r['injury_status']] ?? $r['injury_status'],
        'description'       => $r['description'],
        'status'            => $r['status'],
        'status_label'      => status_label($r['status']),
        'is_official_record'=> $r['verified_at'] !== null && in_array($r['status'], OFFICIAL_STATUSES, true),
        'rejection_reason'  => $r['rejection_reason'],
        'assigned_officer'  => $r['assigned_officer_id'] ? ['id' => (int)$r['assigned_officer_id'], 'name' => $r['assigned_officer_name']] : null,
        'photo_count'       => (int)($r['photo_count'] ?? 0),
        'source'            => $r['source'],
        'date_submitted'    => $r['created_at'],
        'updated_at'        => $r['updated_at'],
    ];
    if ($isStaff) {
        $out['reporter'] = [
            'id'      => $r['reporter_id'] !== null ? (int)$r['reporter_id'] : null,
            'name'    => $r['reporter_name'],
            'contact' => $r['contact_info'],
        ];
        $out['verified_by'] = $r['verified_by'] ? $r['verified_by_name'] : null;
        $out['verified_at'] = $r['verified_at'];
        $out['is_flagged']  = (bool)$r['is_flagged'];
        $out['flag_reason'] = $r['flag_reason'];
        $out['duplicate_of'] = $r['duplicate_of'] !== null ? (int)$r['duplicate_of'] : null;
    }
    return $out;
}

/** Link the apps use to show a photo. Includes the token because <img> cannot send headers. */
function photo_url(int $photoId): string
{
    $url = api_base_url() . '/photos/view.php?id=' . $photoId;
    $token = bearer_token();
    return $token ? $url . '&token=' . $token : $url;
}

/**
 * FR-08 duplicate check: same accident type, same day, within the time window,
 * and (with GPS) within the radius, or (without GPS) the same barangay + municipality.
 * Returns the id of the earlier report it looks like, or null.
 */
function find_possible_duplicate(array $r, ?int $excludeId = null): ?int
{
    $window = (int)config('duplicates.window_minutes', 60);
    $params = [$r['accident_type_id'], $r['accident_date'], $r['accident_time'], $window * 60, $excludeId ?? 0];
    $sql = "SELECT id FROM reports
             WHERE accident_type_id = ? AND accident_date = ?
               AND ABS(TIME_TO_SEC(TIMEDIFF(accident_time, ?))) <= ?
               AND id <> ? AND status <> 'rejected'";
    if ($r['latitude'] !== null && $r['longitude'] !== null) {
        // Haversine distance in km
        $sql .= " AND latitude IS NOT NULL AND
                  6371 * 2 * ASIN(SQRT(POWER(SIN(RADIANS(latitude - ?) / 2), 2) +
                  COS(RADIANS(?)) * COS(RADIANS(latitude)) * POWER(SIN(RADIANS(longitude - ?) / 2), 2))) <= ?";
        array_push($params, $r['latitude'], $r['latitude'], $r['longitude'], (float)config('duplicates.radius_km', 0.3));
    } else {
        $sql .= ' AND barangay <=> ? AND municipality <=> ?';
        array_push($params, $r['barangay'], $r['municipality']);
    }
    $row = db_one($sql . ' ORDER BY id LIMIT 1', $params);
    return $row ? (int)$row['id'] : null;
}
