<?php
/**
 * Notifications (FR-09). Saves an in-app notification that web and mobile show.
 *
 * TODO (Juliana): also send an email here, e.g. with PHPMailer + a Gmail app
 * password. Keep the in-app row even if the email fails.
 */

function notify_user(int $userId, string $title, string $message, ?int $reportId = null): void
{
    db_exec(
        'INSERT INTO notifications (user_id, report_id, title, message) VALUES (?, ?, ?, ?)',
        [$userId, $reportId, $title, $message]
    );
}

function notify_admins(string $title, string $message, ?int $reportId = null): void
{
    foreach (db_all("SELECT id FROM users WHERE role = 'admin' AND status = 'active'") as $admin) {
        notify_user((int)$admin['id'], $title, $message, $reportId);
    }
}
