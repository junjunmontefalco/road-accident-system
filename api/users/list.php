<?php
/**
 * GET /users/list.php?role=officer&q=   (FR-13 user management)   OWNER: Juliana
 *
 * Starter: already lists users so Vince's user page and the "assign officer"
 * dropdown can be built right away (?role=officer).
 * TODO (Juliana): pagination, search by name/email (?q=)
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('GET');
require_auth(['admin']);

$sql = 'SELECT id, full_name, email, phone, role, badge_no, status, created_at FROM users';
$params = [];
if (!empty($_GET['role']) && in_array($_GET['role'], ['reporter', 'admin', 'officer'], true)) {
    $sql .= ' WHERE role = ?';
    $params[] = $_GET['role'];
}
json_ok(db_all($sql . ' ORDER BY role, full_name', $params));
