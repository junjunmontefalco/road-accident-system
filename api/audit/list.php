<?php
/**
 * GET /audit/list.php?action=&user_id=&date_from=&date_to=&page=   (FR-14 audit trail viewer)
 * OWNER: Juliana (API), Vince (admin page)
 *
 * Logging already happens everywhere through audit_log() in core/audit.php.
 * TODO: filters + pagination like reports/list.php; join users for the name.
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('GET');
require_auth(['admin']);

// Starter: the latest 100 entries
json_ok(db_all(
    'SELECT a.id, a.action, a.entity_type, a.entity_id, a.details, a.ip_address, a.created_at, u.full_name AS user_name
       FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC, a.id DESC LIMIT 100'
));
