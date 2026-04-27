<?php
/**
 * Creatrweb Data Art — User Logout Endpoint
 *
 * POST /api/auth/logout.php
 *
 * Success: { "success": true }
 * Error:   { "success": false, "error": "..." }
 */

require_once __DIR__ . '/../../config/bootstrap.php';

// ── HTTP Method Check ────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    header('Allow: POST');
    echo json_encode([
        'success' => false,
        'error'   => 'Method not allowed',
    ]);
    exit;
}

// ── Session is already started by bootstrap.php ────────────────────────

// ── Destroy Session ─────────────────────────────────────────
$_SESSION = [];

// Delete session cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Destroy the session
session_destroy();

// ── Return Success ───────────────────────────────────────────
http_response_code(200);
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
]);
exit;
