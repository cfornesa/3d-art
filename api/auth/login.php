<?php
/**
 * Creatrweb Data Art — User Login Endpoint
 *
 * POST /api/auth/login.php
 * Body (JSON): { "email": "...", "password": "..." }
 *
 * Success: { "success": true, "username": "johndoe" }
 * Error:   { "success": false, "error": "..." }
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../config/database.php';

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

// ── Parse JSON Input ─────────────────────────────────────────
$rawInput = file_get_contents('php://input');
$input    = json_decode($rawInput, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($input)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error'   => 'Invalid JSON input',
    ]);
    exit;
}

// ── Extract Fields ───────────────────────────────────────────
$email    = isset($input['email'])    ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password']    : '';

// ── Generic Credential Validation ────────────────────────────
// All failures below return the same message to prevent user enumeration.
$invalidCredentials = function () {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error'   => 'Invalid credentials',
    ]);
    exit;
};

// ── Check Fields Are Present ─────────────────────────────────
if ($email === '' || $password === '') {
    $invalidCredentials();
}

// ── Fetch User by Email ──────────────────────────────────────
try {
    $stmt = $pdo->prepare(
        'SELECT id, username, password_hash, is_active
         FROM users
         WHERE email = :email
         LIMIT 1'
    );
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error'   => APP_DEBUG
            ? 'Login query failed: ' . $e->getMessage()
            : 'Login failed. Please try again later.',
    ]);
    exit;
}

// ── Verify User Exists and Is Active ─────────────────────────
if (!$user || (int) $user['is_active'] !== 1) {
    $invalidCredentials();
}

// ── Verify Password ──────────────────────────────────────────
if (!password_verify($password, $user['password_hash'])) {
    $invalidCredentials();
}

// ── Configure and Start Session ──────────────────────────────
// Session is already started by bootstrap.php, but regenerate ID for security
session_regenerate_id(true);

// ── Store Session Data ───────────────────────────────────────
$_SESSION['user_id']    = (int) $user['id'];
$_SESSION['username']   = (string) $user['username'];
$_SESSION['created_at'] = time();

// ── Return Success ───────────────────────────────────────────
http_response_code(200);
header('Content-Type: application/json');
echo json_encode([
    'success'  => true,
    'username' => $user['username'],
]);
exit;
