<?php
/**
 * System settings the admin can change (Admin > Categories and settings).
 * Stored in Firestore as one document: settings/system
 */

const SETTING_DEFAULTS = [
    'system_name'              => 'RoadReport',
    'max_photos_per_report'    => 5,
    'duplicate_window_minutes' => 60,
    'duplicate_radius_km'      => 0.3,
];

function app_settings(): array
{
    static $settings = null;
    if ($settings === null) {
        $saved = fs_get('settings', 'system') ?? [];
        unset($saved['_id']);
        $defaults = SETTING_DEFAULTS;
        $defaults['max_photos_per_report'] = (int)config('uploads.max_files', 5);
        $defaults['duplicate_window_minutes'] = (int)config('duplicates.window_minutes', 60);
        $defaults['duplicate_radius_km'] = (float)config('duplicates.radius_km', 0.3);
        $settings = array_merge($defaults, array_intersect_key($saved, SETTING_DEFAULTS));
    }
    return $settings;
}

function app_setting(string $key)
{
    return app_settings()[$key] ?? SETTING_DEFAULTS[$key] ?? null;
}
