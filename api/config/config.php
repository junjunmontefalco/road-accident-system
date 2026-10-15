<?php
/**
 * App settings.
 *
 * The database is Firebase (Cloud Firestore). The API connects with a service account key:
 *   Firebase console > Project settings > Service accounts > Generate new private key
 *   Save the downloaded file as:  api/config/firebase-service-account.json
 * NEVER commit that file to GitHub (it is in .gitignore). Share it with the group privately.
 */
return [
    'firebase' => [
        // Leave empty to read it from the service account file
        'project_id'           => getenv('FIREBASE_PROJECT_ID') ?: '',
        'service_account_file' => getenv('FIREBASE_KEY_FILE') ?: __DIR__ . '/firebase-service-account.json',
        'database_id'          => '(default)',
        // Google login tokens are cached here for up to 1 hour (folder is blocked from the web)
        'cache_dir'            => __DIR__ . '/../cache',
        // Root certificates for HTTPS; XAMPP on Windows needs this file to reach Google
        'ca_bundle'            => __DIR__ . '/cacert.pem',
        // Only change these for testing with a local emulator
        'api_url'              => getenv('FIRESTORE_API_URL') ?: 'https://firestore.googleapis.com/v1',
        'token_url'            => getenv('FIREBASE_TOKEN_URL') ?: '',
    ],

    // Login tokens last this many days
    'token_days' => 7,

    // Photo evidence rules (FR-05). Photos are shrunk and stored inside Firestore
    // (Firebase Storage needs the paid Blaze plan). Each stored photo stays under ~900 KB.
    'uploads' => [
        'max_files'    => 5,
        'max_mb'       => 10,     // largest file accepted before shrinking
        'max_side_px'  => 1280,   // longest side after shrinking
        'jpeg_quality' => 72,
        'max_store_kb' => 900,    // Firestore documents can be at most 1 MB
        'allowed_mime' => ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'],
    ],

    // Duplicate detection defaults (FR-08). The admin can change them on the Settings page.
    'duplicates' => [
        'window_minutes' => 60,
        'radius_km'      => 0.3,
    ],

    // Which websites may call this API from a browser. '*' is fine because we use
    // Bearer tokens, not cookies.
    'cors_origin' => '*',

    // Optional email notifications (FR-09). In-app notifications always work.
    // For Gmail: turn on 2-Step Verification, create an App Password, put it below.
    // InfinityFree's free plan may block SMTP; Hostinger allows it.
    'mail' => [
        'enabled'   => false,
        'host'      => 'smtp.gmail.com',
        'port'      => 587,
        'username'  => getenv('MAIL_USER') ?: '',
        'password'  => getenv('MAIL_PASS') ?: '',
        'from_name' => 'RoadReport',
    ],

    // Needed to run api/tools/seed.php from a browser: seed.php?key=THIS_VALUE
    // Change it, and keep it secret. From the command line no key is needed.
    'setup_key' => getenv('SETUP_KEY') ?: 'change-this-setup-key',

    // Set to false before the final demo so error details are not shown
    'debug' => true,
];
