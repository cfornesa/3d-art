<?php
/**
 * Creatrweb Data Art — Database Connection
 *
 * Returns a configured PDO instance connected to the MySQL database.
 * Usage: $pdo = require __DIR__ . '/../config/database.php';
 */

require_once __DIR__ . '/env.php';

try {
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        DB_HOST,
        DB_PORT,
        DB_NAME
    );

    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    return $pdo;

} catch (PDOException $e) {
    // In debug mode, include the error detail. In production, generic message.
    $message = APP_DEBUG
        ? 'Database connection failed: ' . $e->getMessage()
        : 'Database connection failed. Please try again later.';

    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error'   => $message,
    ]);
    exit;
}
