<?php
/**
 * Creatrweb 3D Art — Artworks Listing Endpoint
 *
 * GET /api/artworks.php?filter=featured&limit=N    List featured public artworks (for homepage)
 * GET /api/artworks.php?filter=public             List all public artworks (for portfolio)
 * GET /api/artworks.php                          List all public artworks (default)
 *
 * All endpoints are public (no authentication required).
 * Only returns artworks where is_public = 1.
 * Featured filter also requires is_featured = 1.
 *
 * Libraries supported: aframe, three, p5, c2
 */

header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/env.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── Only GET is supported ───────────────────────────────────────────

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// ── Parse query parameters ────────────────────────────────────────-

$filter = isset($_GET['filter']) ? strtolower(trim($_GET['filter'])) : 'public';
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

// Validate filter
$validFilters = ['featured', 'public'];
if (!in_array($filter, $validFilters)) {
    $filter = 'public';
}

// Validate limit (cap at reasonable maximum)
if ($limit !== null && ($limit <= 0 || $limit > 100)) {
    $limit = PORTFOLIO_ITEMS_PER_PAGE;
}

// ── Build and execute query ──────────────────────────────────────

try {
    if ($filter === 'featured') {
        // Featured artworks: is_public=1 AND is_featured=1, ordered by created_at DESC
        // Only apply limit if explicitly requested - otherwise return all featured
        $sql = '
            SELECT *
            FROM artworks
            WHERE `is_public` = 1 AND `is_featured` = 1
            ORDER BY `created_at` DESC
        ';
        
        if ($limit !== null) {
            $sql .= ' LIMIT :limit OFFSET :offset';
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        } else {
            $stmt = $pdo->prepare($sql);
        }
    } else {
        // All public artworks: is_public=1, featured first then others
        if ($limit === null) {
            $limit = PORTFOLIO_ITEMS_PER_PAGE;
        }

        $stmt = $pdo->prepare('
            SELECT *
            FROM artworks
            WHERE `is_public` = 1
            ORDER BY `is_featured` DESC, `created_at` DESC
            LIMIT :limit OFFSET :offset
        ');
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    }

    $stmt->execute();
    $artworks = $stmt->fetchAll();

    // Decode JSON fields for each artwork
    foreach ($artworks as &$artwork) {
        $artwork['figures']        = json_decode($artwork['figures'], true);
        $artwork['palette_config'] = json_decode($artwork['palette_config'], true);
        $artwork['library_config'] = json_decode($artwork['library_config'], true);
        
        // Add thumbnail URL for frontend use
        if ($artwork['thumbnail_path'] !== null) {
            $artwork['thumbnail_url'] = ARTWORK_THUMBNAIL_URL . $artwork['thumbnail_path'];
        }
    }
    unset($artwork);

    // Count total for pagination (only for public filter, not featured)
    $total = null;
    if ($filter === 'public' && $limit !== null) {
        $count_stmt = $pdo->prepare('SELECT COUNT(*) FROM artworks WHERE `is_public` = 1');
        $count_stmt->execute();
        $total = (int) $count_stmt->fetchColumn();
    }

    echo json_encode([
        'success'   => true,
        'artworks'  => $artworks,
        'total'     => $total,
        'limit'     => $limit,
        'offset'    => $offset,
    ]);

} catch (PDOException $e) {
    $message = APP_DEBUG
        ? 'Failed to fetch artworks: ' . $e->getMessage()
        : 'Failed to fetch artworks. Please try again later.';
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $message]);
}
