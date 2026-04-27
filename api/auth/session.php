<?php
/**
 * Creatrweb Data Art — Session Validation Utility
 *
 * NOT a standalone endpoint. Include at the top of any protected API endpoint:
 *
 *   require_once __DIR__ . '/auth/session.php';
 *
 * On success: exposes $currentUserId (int) and $currentUsername (string).
 * On failure: outputs JSON error with HTTP 401 and exits.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

// ── Validate Session ─────────────────────────────────────────
if (
    empty($_SESSION['user_id']) ||
    !is_int($_SESSION['user_id']) && !ctype_digit((string) $_SESSION['user_id']) ||
    empty($_SESSION['username']) ||
    !is_string($_SESSION['username'])
) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error'   => 'Authentication required',
    ]);
    exit;
}

// ── Expose Authenticated User Variables ──────────────────────
$currentUserId   = (int) $_SESSION['user_id'];
$currentUsername = (string) $_SESSION['username'];
