<?php
/**
 * Audit trail (FR-14). Call after every important admin/officer action and
 * every status change, e.g.:
 *     audit_log($user['id'], 'report.status', 'report', $id, ['from' => 'submitted', 'to' => 'under_review']);
 */

function audit_log(?int $userId, string $action, ?string $entityType = null, ?int $entityId = null, array $details = []): void
{
    db_exec(
        'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
        [$userId, $action, $entityType, $entityId, $details ? json_encode($details, JSON_UNESCAPED_UNICODE) : null, client_ip()]
    );
}
