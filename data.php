<?php
/**
 * Creatrweb 3D Art — DEPRECATED Page
 *
 * This page is deprecated as part of the Creatrweb 3D Art retrofit.
 * Data upload and dataset management functionality has been removed.
 * All artwork is now created through direct figure configuration in studio.php
 * with library selection (aframe, three, p5, c2).
 *
 * Redirects to studio.php
 */

require_once __DIR__ . '/config/bootstrap.php';
require_once __DIR__ . '/api/auth/session.php';

// DEPRECATED: Redirect to studio.php
header('Location: /studio.php');
exit;
