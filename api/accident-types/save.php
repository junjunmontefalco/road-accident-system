<?php
/**
 * POST /accident-types/save.php   (Admin: manage accident categories)   OWNER: Juliana
 * Body (JSON): { id? (omit to create), name, description?, is_active? }
 *
 * TODO: require_auth(['admin']); unique name; INSERT or UPDATE; audit_log(... 'type.save' ...).
 * Do not delete types that reports use: set is_active = 0 instead.
 */
require __DIR__ . '/../core/bootstrap.php';
require_method('POST');
require_auth(['admin']);

not_implemented('Juliana', 'manage accident categories');
