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
 *   photos[]           up to 5 images (jpg, png, webp), 5 MB each   optional
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('POST');

$user = require_auth(['reporter', 'admin']);
$in = input();
$errors = [];

// ---- Validate fields ----
$date = str_field($in, 'accident_date');
$d = $date ? DateTime::createFromFormat('Y-m-d', $date) : false;
if (!$d || $d->format('Y-m-d') !== $date) {
    $errors['accident_date'] = 'Enter the date of the accident';
} elseif ($date > date('Y-m-d')) {
    $errors['accident_date'] = 'The date cannot be in the future';
}

$time = str_field($in, 'accident_time');
if (!$time || !preg_match('/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/', $time)) {
    $errors['accident_time'] = 'Enter the time (HH:MM)';
}

$typeId = filter_var($in['accident_type_id'] ?? null, FILTER_VALIDATE_INT);
if (!$typeId || !db_one('SELECT id FROM accident_types WHERE id = ? AND is_active = 1', [$typeId])) {
    $errors['accident_type_id'] = 'Choose the accident type';
}

$location = str_field($in, 'location_text');
if ($location === null || mb_strlen($location) < 3) {
    $errors['location_text'] = 'Enter the road, street or landmark';
}

$lat = str_field($in, 'latitude');
$lng = str_field($in, 'longitude');
if (($lat === null) !== ($lng === null)) {
    $errors['latitude'] = 'Send both latitude and longitude, or neither';
} elseif ($lat !== null) {
    if (!is_numeric($lat) || !is_numeric($lng) || abs((float)$lat) > 90 || abs((float)$lng) > 180) {
        $errors['latitude'] = 'Invalid GPS coordinates';
    }
}

$injury = str_field($in, 'injury_status') ?? 'unknown';
if (!array_key_exists($injury, INJURY_OPTIONS)) {
    $errors['injury_status'] = 'Choose an injury option';
}

$description = str_field($in, 'description');
if ($description === null || mb_strlen($description) < 10) {
    $errors['description'] = 'Describe what happened (at least 10 characters)';
}

$vehicles = [];
if (!empty($in['vehicles'])) {
    $decoded = is_array($in['vehicles']) ? $in['vehicles'] : json_decode((string)$in['vehicles'], true);
    if (!is_array($decoded)) {
        $errors['vehicles'] = 'Invalid vehicles list';
    } else {
        foreach ($decoded as $v) {
            $type = trim((string)($v['type'] ?? ''));
            $qty = (int)($v['quantity'] ?? 1);
            if ($type !== '' && $qty > 0 && $qty < 100) {
                $vehicles[] = ['type' => mb_substr($type, 0, 40), 'quantity' => $qty];
            }
        }
    }
}

$source = ($in['source'] ?? 'web') === 'mobile' ? 'mobile' : 'web';

// ---- Validate photos ----
$photos = [];
if (!empty($_FILES['photos'])) {
    $f = $_FILES['photos'];
    $count = is_array($f['name']) ? count($f['name']) : 1;
    $maxFiles = (int)config('uploads.max_files', 5);
    $maxBytes = (int)config('uploads.max_mb', 5) * 1024 * 1024;
    $allowed = config('uploads.allowed_mime');
    if ($count > $maxFiles) {
        $errors['photos'] = "Attach at most $maxFiles photos";
    } else {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        for ($i = 0; $i < $count; $i++) {
            $err  = is_array($f['error']) ? $f['error'][$i] : $f['error'];
            $tmp  = is_array($f['tmp_name']) ? $f['tmp_name'][$i] : $f['tmp_name'];
            $name = is_array($f['name']) ? $f['name'][$i] : $f['name'];
            $size = is_array($f['size']) ? $f['size'][$i] : $f['size'];
            if ($err === UPLOAD_ERR_NO_FILE) {
                continue;
            }
            if ($err !== UPLOAD_ERR_OK) {
                $errors['photos'] = "Upload failed for $name";
                break;
            }
            $mime = $finfo->file($tmp) ?: '';
            if (!isset($allowed[$mime])) {
                $errors['photos'] = "$name is not a JPG, PNG or WEBP image";
                break;
            }
            if ($size > $maxBytes) {
                $errors['photos'] = "$name is larger than " . config('uploads.max_mb') . ' MB';
                break;
            }
            $photos[] = ['tmp' => $tmp, 'name' => $name, 'mime' => $mime, 'size' => (int)$size, 'ext' => $allowed[$mime]];
        }
    }
}

if ($errors) {
    json_error('Please fix the highlighted fields', 422, $errors);
}

// ---- Save ----
$report = [
    'accident_type_id' => (int)$typeId,
    'accident_date'    => $date,
    'accident_time'    => strlen($time) === 5 ? "$time:00" : $time,
    'latitude'         => $lat !== null ? (float)$lat : null,
    'longitude'        => $lng !== null ? (float)$lng : null,
    'barangay'         => str_field($in, 'barangay'),
    'municipality'     => str_field($in, 'municipality'),
];
$duplicateOf = find_possible_duplicate($report);

$pdo = db();
$saved = [];
$pdo->beginTransaction();
try {
    db_exec(
        'INSERT INTO reports (reporter_id, reporter_name, contact_info, accident_date, accident_time, location_text,
                              barangay, municipality, latitude, longitude, accident_type_id, injury_status, description,
                              is_flagged, flag_reason, duplicate_of, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            $user['id'], $user['full_name'], $user['phone'] ?: $user['email'],
            $report['accident_date'], $report['accident_time'], $location,
            $report['barangay'], $report['municipality'], $report['latitude'], $report['longitude'],
            $report['accident_type_id'], $injury, $description,
            $duplicateOf ? 1 : 0, $duplicateOf ? 'Possible duplicate of an earlier report' : null, $duplicateOf,
            $source,
        ]
    );
    $id = (int)$pdo->lastInsertId();
    $code = sprintf('RA-%s-%06d', date('Y'), $id);
    db_exec('UPDATE reports SET report_code = ? WHERE id = ?', [$code, $id]);

    foreach ($vehicles as $v) {
        db_exec('INSERT INTO report_vehicles (report_id, vehicle_type, quantity) VALUES (?, ?, ?)', [$id, $v['type'], $v['quantity']]);
    }

    if ($photos) {
        $dir = config('uploads.dir') . "/reports/$id";
        if (!is_dir($dir) && !mkdir($dir, 0775, true)) {
            throw new RuntimeException('Cannot create the uploads folder');
        }
        foreach ($photos as $p) {
            $file = bin2hex(random_bytes(12)) . '.' . $p['ext'];
            if (!move_uploaded_file($p['tmp'], "$dir/$file")) {
                throw new RuntimeException('Cannot save photo ' . $p['name']);
            }
            $saved[] = "$dir/$file";
            db_exec(
                'INSERT INTO report_photos (report_id, file_path, original_name, mime_type, size_bytes) VALUES (?, ?, ?, ?, ?)',
                [$id, "reports/$id/$file", mb_substr($p['name'], 0, 255), $p['mime'], $p['size']]
            );
        }
    }

    record_status_change($id, null, 'submitted', (int)$user['id'], 'Report submitted');
    audit_log((int)$user['id'], 'report.create', 'report', $id, ['report_code' => $code, 'source' => $source]);
    notify_user((int)$user['id'], 'Report submitted', "Your report $code was received. Keep this ID to track it.", $id);
    notify_admins('New accident report', "$code at $location" . ($duplicateOf ? ' (possible duplicate)' : ''), $id);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    foreach ($saved as $path) {
        @unlink($path);
    }
    throw $e;
}

json_ok(format_report(find_report($id), $user), 'Report submitted', 201);
