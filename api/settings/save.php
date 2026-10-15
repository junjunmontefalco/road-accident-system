<?php
/**
 * POST /settings/save.php   (Admin: system settings)
 * Body (JSON): any of { system_name, max_photos_per_report (1-10),
 *                       duplicate_window_minutes (5-720), duplicate_radius_km (0.05-5) }
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('POST');

$user = require_auth(['admin']);
$in = input();
$old = app_settings();
$new = [];
$errors = [];

if (array_key_exists('system_name', $in)) {
    $v = str_field($in, 'system_name');
    if ($v === null || mb_strlen($v) > 40) {
        $errors['system_name'] = 'Enter a name (up to 40 characters)';
    } else {
        $new['system_name'] = $v;
    }
}
$numbers = [
    'max_photos_per_report'    => [1, 10, 'int'],
    'duplicate_window_minutes' => [5, 720, 'int'],
    'duplicate_radius_km'      => [0.05, 5, 'float'],
];
foreach ($numbers as $k => [$min, $max, $type]) {
    if (!array_key_exists($k, $in)) {
        continue;
    }
    if (!is_numeric($in[$k]) || $in[$k] < $min || $in[$k] > $max) {
        $errors[$k] = "Enter a number from $min to $max";
    } else {
        $new[$k] = $type === 'int' ? (int)$in[$k] : round((float)$in[$k], 3);
    }
}
if ($errors) {
    json_error('Please fix the highlighted fields', 422, $errors);
}

$changed = [];
foreach ($new as $k => $v) {
    if ($old[$k] != $v) {
        $changed[$k] = ['from' => $old[$k], 'to' => $v];
    }
}
if ($changed) {
    fs_commit([
        fs_w_update('settings', 'system', $new + ['updated_at' => now(), 'updated_by' => $user['full_name']], false),
        audit_write($user, 'settings.save', 'settings', null, ['changed' => $changed]),
    ]);
}
json_ok(array_merge($old, $new), $changed ? 'Settings saved' : 'Nothing changed');
