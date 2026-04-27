<?php
/**
 * Creatrweb Data Art — User Registration Endpoint (DISABLED)
 *
 * POST /api/auth/register.php
 *
 * Registration is disabled for this single-owner app.
 * Always returns: { "success": false, "error": "Registration is disabled." }
 */

header('Content-Type: application/json');

echo json_encode([
    'success' => false,
    'error'   => 'Registration is disabled.',
]);
exit;
