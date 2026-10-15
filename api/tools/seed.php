<?php
/**
 * Load the starting data into Firestore. Owner: Vince (database)
 *
 * Run ONCE for the whole group (everyone shares the same Firebase database).
 *
 * From the command line (XAMPP: open the Shell from the Control Panel):
 *     php api/tools/seed.php                 sample data: 5 test accounts, 40 reports around Bulacan
 *     php api/tools/seed.php --reset         delete everything first, then load the sample data again
 *     php api/tools/seed.php --clean --admin-email=you@example.com --admin-password=Secret123
 *                                            real deployment: categories, contacts, settings and ONE admin
 *
 * From a browser (when you have no command line, e.g. on InfinityFree):
 *     .../api/tools/seed.php?key=YOUR_SETUP_KEY
 *     .../api/tools/seed.php?key=YOUR_SETUP_KEY&reset=1
 *     .../api/tools/seed.php?key=YOUR_SETUP_KEY&clean=1&admin_email=...&admin_password=...
 *   The setup key is in api/config/config.php ('setup_key').
 */
require __DIR__ . '/../core/bootstrap.php';

$cli = PHP_SAPI === 'cli';
$args = $cli ? ($_SERVER['argv'] ?? []) : [];
$opt = function (string $name) use ($cli, $args) {
    if ($cli) {
        foreach (array_slice($args, 1) as $a) {
            if ($a === "--$name") return '1';
            if (str_starts_with($a, "--$name=")) return substr($a, strlen($name) + 3);
        }
        return null;
    }
    $v = $_GET[str_replace('-', '_', $name)] ?? null;
    return is_string($v) ? $v : null;
};
$say = function (string $line) use ($cli) {
    echo $cli ? $line . "\n" : htmlspecialchars($line) . "<br>\n";
    if (!$cli) {
        @ob_flush();
        flush();
    }
};

if (!$cli) {
    header('Content-Type: text/html; charset=utf-8');
    $key = (string)config('setup_key');
    if ($key === '' || $key === 'change-this-setup-key' || !hash_equals($key, (string)($opt('key') ?? ''))) {
        http_response_code(403);
        exit('Forbidden. Set a real setup_key in api/config/config.php and open this page with ?key=that-value');
    }
    set_time_limit(300);
}

$reset = $opt('reset') === '1';
$clean = $opt('clean') === '1';
$collections = ['users', 'user_emails', 'sessions', 'accident_types', 'emergency_contacts', 'reports', 'report_photos',
    'notifications', 'audit_logs', 'settings', 'counters'];

$say('Firebase project: ' . fs_project_id());

if (!$reset && fs_query('accident_types', [], [], 1)) {
    $say('The database already has data. Nothing was changed.');
    $say($cli ? 'To start over, run:  php api/tools/seed.php --reset' : 'To start over, add &reset=1 to the address.');
    exit;
}

if ($reset) {
    foreach ($collections as $c) {
        $deleted = 0;
        while ($docs = fs_query($c, [], [], 400, [])) {
            fs_commit(array_map(fn($d) => fs_w_delete($c, $d['_id']), $docs));
            $deleted += count($docs);
        }
        $say("Deleted $deleted from $c");
    }
}

$data = json_decode((string)file_get_contents(__DIR__ . '/../../database/seed-data.json'), true);
if (!is_array($data)) {
    $say('Cannot read database/seed-data.json');
    exit(1);
}

$writes = [];
$counters = [];
$add = function (string $collection, array $doc) use (&$writes, &$counters) {
    $id = $doc['_id'] ?? $doc['id'];
    unset($doc['_id']);
    $writes[] = fs_w_set($collection, $id, $doc);
    if (isset($doc['id']) && is_int($doc['id'])) {
        $counters[$collection] = max($counters[$collection] ?? 0, $doc['id']);
    }
};

foreach (['accident_types', 'emergency_contacts', 'settings'] as $c) {
    foreach ($data[$c] as $doc) {
        $add($c, $doc);
    }
}

if ($clean) {
    $email = strtolower(trim((string)$opt('admin-email')));
    $pass = (string)$opt('admin-password');
    $errors = validate_user_fields(['email' => $email, 'password' => $pass], true);
    if ($errors) {
        $say('Give the first admin account: --admin-email=... --admin-password=... (' . implode(' ', $errors) . ')');
        exit(1);
    }
    $user = ['id' => 1, 'full_name' => 'System Administrator', 'email' => $email, 'phone' => null,
        'password_hash' => password_hash($pass, PASSWORD_BCRYPT), 'role' => 'admin', 'badge_no' => null,
        'status' => 'active', 'created_at' => now(), 'updated_at' => now()];
    $add('users', $user);
    $writes[] = fs_w_set('user_emails', email_key($email), ['user_id' => 1]);
} else {
    foreach ($data['users'] as $u) {
        $add('users', $u);
        $writes[] = fs_w_set('user_emails', email_key($u['email']), ['user_id' => $u['id']]);
    }
    foreach (['reports', 'notifications'] as $c) {
        foreach ($data[$c] as $doc) {
            $add($c, $doc);
        }
    }
    foreach ($data['audit_logs'] as $doc) {
        $writes[] = fs_w_set('audit_logs', fs_random_id(), $doc);
    }
}

foreach (['users', 'accident_types', 'emergency_contacts', 'reports', 'notifications', 'report_photos'] as $c) {
    $writes[] = fs_w_set('counters', $c, ['value' => $counters[$c] ?? 0]);
}

fs_commit($writes);
$say('Saved ' . count($writes) . ' documents.');
$say($clean
    ? "Done. Log in as $email."
    : 'Done. Test accounts: admin@roadreport.test / Admin@123, officer@roadreport.test / Officer@123, reporter@roadreport.test / Reporter@123');
