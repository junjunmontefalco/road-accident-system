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

$user = filter_var($email, FILTER_VALIDATE_EMAIL) ? find_user_by_email($email) : null;
if (!$user || !password_verify($pass, (string)($user['password_hash'] ?? ''))) {
    json_error('Wrong email or password', 401);
}
if ($user['status'] !== 'active') {
    json_error('This account is deactivated. Contact the administrator.', 403);
}

$token = issue_token($user['id'], str_field($in, 'device'));
audit_log($user, 'user.login', 'user', $user['id'], ['device' => str_field($in, 'device') ?? 'web']);
json_ok(['token' => $token, 'user' => public_user($user)], 'Logged in');
