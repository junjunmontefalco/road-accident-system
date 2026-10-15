<?php
/** GET /emergency-contacts/list.php   Shown on the mobile home screen (no login needed). */
require __DIR__ . '/../core/bootstrap.php';
require_method('GET');

json_ok(db_all('SELECT id, name, phone, category FROM emergency_contacts WHERE is_active = 1 ORDER BY sort_order, name'));
