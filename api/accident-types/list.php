<?php
/**
 * GET /accident-types/list.php   Dropdown options for the report form (no login needed).
 * Admins add ?all=1 to include inactive types.
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('GET');

$all = ($_GET['all'] ?? '') === '1' && (current_user()['role'] ?? '') === 'admin';
$rows = db_all('SELECT id, name, description, is_active FROM accident_types'
    . ($all ? '' : ' WHERE is_active = 1') . ' ORDER BY name');

json_ok([
    'accident_types' => array_map(fn($t) => [
        'id' => (int)$t['id'], 'name' => $t['name'], 'description' => $t['description'], 'is_active' => (bool)$t['is_active'],
    ], $rows),
    'injury_options' => array_map(fn($k, $v) => ['value' => $k, 'label' => $v], array_keys(INJURY_OPTIONS), INJURY_OPTIONS),
    'vehicle_types'  => ['Car', 'Motorcycle', 'Jeepney', 'Tricycle', 'Truck', 'Bus', 'Bicycle', 'Other'],
    'statuses'       => array_map(fn($k, $v) => ['value' => $k, 'label' => $v], array_keys(REPORT_STATUSES), REPORT_STATUSES),
]);
