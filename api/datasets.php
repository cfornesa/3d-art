<?php
/**
 * Creatrweb 3D Art — DEPRECATED Endpoint
 *
 * This endpoint is deprecated as part of the Creatrweb 3D Art retrofit.
 * Data upload and dataset management functionality has been removed.
 * All artwork is now created through direct figure configuration.
 *
 * Returns 410 Gone for all requests to indicate permanent deprecation.
 */

header('Content-Type: application/json');

// DEPRECATED: Creatrweb 3D Art no longer supports data upload/datasets
// Return 410 Gone to indicate permanent removal
http_response_code(410);
echo json_encode([
    'success' => false,
    'error' => 'This endpoint is deprecated. Creatrweb 3D Art no longer supports data upload or dataset management. All artwork is created through direct figure configuration with library selection (aframe, three, p5, c2).',
    'deprecated' => true,
    'replacement' => null,
]);
exit;
