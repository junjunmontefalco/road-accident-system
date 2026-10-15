<?php
/**
 * App settings. Each member may keep a local copy of this file with their own
 * database password; do NOT commit real passwords to GitHub.
 */
return [
    // XAMPP defaults: user "root", empty password
    'db' => [
        'host'     => getenv('DB_HOST') ?: '127.0.0.1',
        'port'     => getenv('DB_PORT') ?: '3306',
        'name'     => getenv('DB_NAME') ?: 'road_accident_db',
        'user'     => getenv('DB_USER') ?: 'root',
        'password' => getenv('DB_PASS') !== false ? getenv('DB_PASS') : '',
    ],

    // Login tokens last this many days
    'token_days' => 7,

    // Photo evidence rules (FR-05)
    'uploads' => [
        'dir'          => __DIR__ . '/../uploads',
        'max_files'    => 5,
        'max_mb'       => 5,
        'allowed_mime' => ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'],
    ],

    // Duplicate detection (FR-08)
    'duplicates' => [
        'window_minutes' => 60,
        'radius_km'      => 0.3,
    ],

    // Which websites may call this API from a browser. '*' is fine for
    // development because we use Bearer tokens, not cookies.
    'cors_origin' => '*',

    // Set to false before the final demo so PHP errors are not shown
    'debug' => true,
];
