<?php
/**
 * Creatrweb Data Art — Session Bootstrap
 * 
 * Shared include for all pages that need session management.
 * usage: require_once __DIR__ . '/../config/bootstrap.php';
 * 
 * This file:
 * - Requires env.php for configuration constants
 * - Configures session security parameters
 * - Starts the PHP session safely
 * - Sets error display based on APP_ENV and APP_DEBUG
 */

require_once __DIR__ . '/env.php';

// ── Session Security Configuration ────────────────────────────────────
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.gc_maxlifetime', SESSION_LIFETIME);
session_name(SESSION_NAME);

// ── Start Session ──────────────────────────────────────────────────────
// Only start if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ── Error Display Based on Environment ─────────────────────────────────
if (APP_DEBUG) {
    // Development: show all errors
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    // Production: hide errors from output
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
}

// ── Authentication Helper Function ────────────────────────────────────
/**
 * Check if a user is authenticated.
 * Returns true if $_SESSION['user_id'] is set and valid.
 */
function is_authenticated() {
    return isset($_SESSION['user_id']) 
        && is_numeric($_SESSION['user_id']) 
        && $_SESSION['user_id'] > 0;
}

/**
 * Get the current user ID if authenticated, null otherwise.
 */
function get_current_user_id() {
    return is_authenticated() ? (int)$_SESSION['user_id'] : null;
}

/**
 * Get the current username if authenticated, null otherwise.
 */
function get_current_username() {
    return is_authenticated() && isset($_SESSION['username']) 
        ? (string)$_SESSION['username'] 
        : null;
}
