<?php
/** POST /auth/logout.php   (FR-02)  Deletes the token that was sent. */
require __DIR__ . '/../core/bootstrap.php';
require_method('POST');

$user = require_auth();
db_exec('DELETE FROM api_tokens WHERE token_hash = ?', [hash('sha256', bearer_token())]);
json_ok(null, 'Logged out');
