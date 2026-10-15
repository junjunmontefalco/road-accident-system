<?php
/**
 * POST /users/save.php   (FR-13)   OWNER: Juliana
 * Body (JSON): { id? (omit to create), full_name, email, phone, role, badge_no?, password? (required when creating), status? }
 *
 * TODO:
 *  1. require_auth(['admin'])
 *  2. Validate like auth/register.php; role must be reporter|admin|officer
 *  3. Create (password_hash) or update; never return password_hash
 *  4. An admin must not deactivate or demote their own account
 *  5. audit_log(... 'user.create' / 'user.update' ...)
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('POST');
require_auth(['admin']);

not_implemented('Juliana', 'create/update user and role');
