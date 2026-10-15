<?php
/**
 * POST /auth/register.php   (FR-01)  Owner: Juliana
 * Body (JSON): { full_name, email, phone, password, password_confirmation, device? }
 * Public sign-up always creates a "reporter". Admins create officers/admins in user management.
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('POST');

$in = input();
$name  = str_field($in, 'full_name');
$email = strtolower((string)str_field($in, 'email'));
$phone = str_field($in, 'phone');
$pass  = (string)($in['password'] ?? '');
$pass2 = (string)($in['password_confirmation'] ?? '');

$errors = [];
if ($name === null || mb_strlen($name) < 2) {
    $errors['full_name'] = 'Enter your full name';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Enter a valid email';
} elseif (db_one('SELECT id FROM users WHERE email = ?', [$email])) {
    $errors['email'] = 'This email is already registered';
}
if ($phone !== null && !preg_match('/^(09\d{9}|\+639\d{9})$/', $phone)) {
    $errors['phone'] = 'Use 09XXXXXXXXX or +639XXXXXXXXX';
}
if (strlen($pass) < 8 || !preg_match('/[A-Za-z]/', $pass) || !preg_match('/\d/', $pass)) {
    $errors['password'] = 'At least 8 characters with letters and numbers';
} elseif ($pass !== $pass2) {
    $errors['password_confirmation'] = 'Passwords do not match';
}
if ($errors) {
    json_error('Please fix the highlighted fields', 422, $errors);
}

db_exec(
    "INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'reporter')",
    [$name, $email, $phone, password_hash($pass, PASSWORD_BCRYPT)]
);
$id = (int)db()->lastInsertId();
audit_log($id, 'user.register', 'user', $id);

$user = db_one('SELECT * FROM users WHERE id = ?', [$id]);
$token = issue_token($id, str_field($in, 'device'));
json_ok(['token' => $token, 'user' => public_user($user)], 'Account created', 201);
