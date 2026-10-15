<?php
/**
 * Token login (works the same for web and mobile).
 *
 *   Login returns a token. The app saves it and sends it on every request:
 *       Authorization: Bearer <token>
 *
 *   In an endpoint:
 *       $user = require_auth();                    // any logged-in user
 *       $user = require_auth(['admin']);           // admins only
 *       $user = require_auth(['admin', 'officer']);
 */

function issue_token(int $userId, ?string $device = null): string
{
    $token = bin2hex(random_bytes(32));
    $days = (int)config('token_days', 7);
    db_exec(
        'INSERT INTO api_tokens (user_id, token_hash, device, expires_at) VALUES (?, ?, ?, ?)',
        [$userId, hash('sha256', $token), $device, date('Y-m-d H:i:s', strtotime("+$days days"))]
    );
    return $token;
}

function bearer_token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($header === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $name => $value) {
            if (strcasecmp($name, 'Authorization') === 0) {
                $header = $value;
            }
        }
    }
    if (preg_match('/Bearer\s+([a-f0-9]{64})/i', $header, $m)) {
        return $m[1];
    }
    // <img> tags cannot send headers, so photo links may pass ?token=...
    if (isset($_GET['token']) && preg_match('/^[a-f0-9]{64}$/i', $_GET['token'])) {
        return $_GET['token'];
    }
    return null;
}

/** The logged-in user, or null. */
function current_user(): ?array
{
    static $user = false;
    if ($user !== false) {
        return $user;
    }
    $user = null;
    $token = bearer_token();
    if ($token === null) {
        return null;
    }
    $row = db_one(
        'SELECT u.id, u.full_name, u.email, u.phone, u.role, u.badge_no, u.status, t.id AS token_id
           FROM api_tokens t JOIN users u ON u.id = t.user_id
          WHERE t.token_hash = ? AND t.expires_at > NOW()',
        [hash('sha256', $token)]
    );
    if ($row && $row['status'] === 'active') {
        db_exec('UPDATE api_tokens SET last_used_at = NOW() WHERE id = ?', [$row['token_id']]);
        $user = $row;
    }
    return $user;
}

function require_auth(array $roles = []): array
{
    $user = current_user();
    if ($user === null) {
        json_error('Please log in first', 401);
    }
    if ($roles && !in_array($user['role'], $roles, true)) {
        json_error('You do not have permission to do this', 403);
    }
    return $user;
}

/** Fields that are safe to send to the app (never the password hash). */
function public_user(array $u): array
{
    return [
        'id'        => (int)$u['id'],
        'full_name' => $u['full_name'],
        'email'     => $u['email'],
        'phone'     => $u['phone'],
        'role'      => $u['role'],
        'badge_no'  => $u['badge_no'] ?? null,
    ];
}

/**
 * Can this user see this report?
 * Reporter: own reports. Officer: reports assigned to them. Admin: all.
 */
function can_view_report(array $user, array $report): bool
{
    return match ($user['role']) {
        'admin'    => true,
        'officer'  => (int)$report['assigned_officer_id'] === (int)$user['id'],
        'reporter' => (int)$report['reporter_id'] === (int)$user['id'],
        default    => false,
    };
}
