<?php
/**
 * Creatrweb Data Art — Artworks Listing Endpoint
 *
 * GET /api/artworks.php?filter=featured&limit=N    List featured public artworks (for homepage)
 * GET /api/artworks.php?filter=public             List all public artworks (for portfolio)
 * GET /api/artworks.php                          List all public artworks (default)
 *
 * All endpoints are public (no authentication required).
 * Only returns artworks where is_public = 1.
 * Featured filter also requires is_featured = 1.
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
            SELECT a.*, s.display_name AS art_style_name, s.style_key
            FROM artworks a
            LEFT JOIN art_styles s ON a.art_style_id = s.id
            WHERE a.is_public = 1 AND a.is_featured = 1
            ORDER BY a.created_at DESC
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
            SELECT a.*, s.display_name AS art_style_name, s.style_key
            FROM artworks a
            LEFT JOIN art_styles s ON a.art_style_id = s.id
            WHERE a.is_public = 1
            ORDER BY a.is_featured DESC, a.created_at DESC
            LIMIT :limit OFFSET :offset
        ');
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    }

    $stmt->execute();
    $artworks = $stmt->fetchAll();

    // Decode JSON fields for each artwork
    foreach ($artworks as &$artwork) {
        $artwork['column_mapping']   = json_decode($artwork['column_mapping'], true);
        $artwork['palette_config']   = json_decode($artwork['palette_config'], true);
        $artwork['rendering_config'] = json_decode($artwork['rendering_config'], true);
        $artwork['visual_dimensions'] = $artwork['visual_dimensions'] !== null ? json_decode($artwork['visual_dimensions'], true) : null;
    }
    unset($artwork);

    // Count total for pagination (only for public filter, not featured)
    $total = null;
    if ($filter === 'public' && $limit !== null) {
        $count_stmt = $pdo->prepare('SELECT COUNT(*) FROM artworks WHERE is_public = 1');
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
