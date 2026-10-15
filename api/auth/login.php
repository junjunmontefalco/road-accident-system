<?php
/**
 * POST /auth/login.php   (FR-02)  Owner: Juliana
 * Body (JSON): { email, password, device? ("web" or "mobile") }
 * Returns: { token, user }
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('POST');

$in = input();
$email = strtolower((string)str_field($in, 'email'));
$pass  = (string)($in['password'] ?? '');

if ($email === '' || $pass === '') {
    json_error('Enter your email and password', 422);
}

$user = db_one('SELECT * FROM users WHERE email = ?', [$email]);
if (!$user || !password_verify($pass, $user['password_hash'])) {
    json_error('Wrong email or password', 401);
}
if ($user['status'] !== 'active') {
    json_error('This account is deactivated. Contact the administrator.', 403);
}

$token = issue_token((int)$user['id'], str_field($in, 'device'));
audit_log((int)$user['id'], 'user.login', 'user', (int)$user['id']);
json_ok(['token' => $token, 'user' => public_user($user)], 'Logged in');
