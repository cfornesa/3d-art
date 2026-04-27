<?php
/**
 * Creatrweb 3D Art — Artwork Endpoint
 *
 * POST   /api/artwork.php          Save a new artwork
 * PATCH  /api/artwork.php?id={id}  Update artwork (config + metadata)
 * GET    /api/artwork.php?id={id}  Get single artwork (public if is_public=1, else owned)
 * GET    /api/artwork.php          List current user's artworks
 * DELETE /api/artwork.php?id={id}  Delete a user-owned artwork
 *
 * POST, PATCH, and DELETE require authentication.
 * GET (single) allows unauthenticated access for public artworks.
 * GET (list) requires authentication.
 *
 * Libraries supported: three, p5, c2 (A-Frame removed)
 * Maximum figures per artwork: 40 (hard limit, enforced at app level)
 */

header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── Auth routing ─────────────────────────────────────────────
// POST, DELETE, and GET (list) require authentication.
// GET (single with ?id=) has optional auth — public artworks are
// accessible without a session.

$is_single_get = ($method === 'GET' && !empty($_GET['id']));

if (!$is_single_get) {
    require_once __DIR__ . '/auth/session.php';
} else {
    // Optional auth: session already started by bootstrap.php
    $currentUserId = !empty($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
}

// Valid library values (A-Frame removed due to persistent full-screen issues)
$validLibraries = ['three', 'p5', 'c2'];

// ── POST — Save artwork ──────────────────────────────────────

if ($method === 'POST') {
    // Parse JSON body
    $input = file_get_contents('php://input');
    $body = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($body)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON body']);
        exit;
    }

    // Extract and validate fields
    $title          = $body['title'] ?? null;
    $library        = $body['library'] ?? 'three';
    $figures        = $body['figures'] ?? [];
    $palette_config = $body['palette_config'] ?? null;
    $library_config = $body['library_config'] ?? null;
    $tags           = $body['tags'] ?? null;
    $is_public      = $body['is_public'] ?? ARTWORK_DEFAULT_IS_PUBLIC;
    $is_featured    = $body['is_featured'] ?? ARTWORK_DEFAULT_IS_FEATURED;
    $thumbnail_data = $body['thumbnail_data'] ?? null;

    // Validate required fields
    $missing = [];
    if ($title === null || $title === '') $missing[] = 'title';
    
    // Library must be valid
    if (!in_array($library, $validLibraries)) {
        $library = 'three'; // Default to three.js
    }

    if (!empty($missing)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'Missing required fields: ' . implode(', ', $missing),
        ]);
        exit;
    }

    // Validate title length
    if (mb_strlen($title) > 255) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'Title must not exceed 255 characters',
        ]);
        exit;
    }

    // Validate tags length
    if ($tags !== null && mb_strlen($tags) > 255) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'Tags must not exceed 255 characters',
        ]);
        exit;
    }

    // Sanitize tags: remove any HTML and trim
    if ($tags !== null) {
        $tags = trim(strip_tags($tags));
    }

    // Validate is_public
    $is_public = filter_var($is_public, FILTER_VALIDATE_INT);
    if ($is_public === false) $is_public = ARTWORK_DEFAULT_IS_PUBLIC;
    $is_public = $is_public ? 1 : 0;

    // Validate is_featured
    $is_featured = filter_var($is_featured, FILTER_VALIDATE_INT);
    if ($is_featured === false) $is_featured = ARTWORK_DEFAULT_IS_FEATURED;
    $is_featured = $is_featured ? 1 : 0;

    // Validate figures is an array (JSON array decoded)
    if (!is_array($figures)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'figures must be a JSON array',
        ]);
        exit;
    }

    // Validate figure count does not exceed 40 (C-23: Maximum Figure Limit)
    if (count($figures) > 40) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'Maximum 40 figures per artwork',
        ]);
        exit;
    }

    // Validate palette_config is an array or null
    if ($palette_config !== null && !is_array($palette_config)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'palette_config must be a JSON object or null',
        ]);
        exit;
    }

    // Validate library_config is an array or null
    if ($library_config !== null && !is_array($library_config)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'library_config must be a JSON object or null',
        ]);
        exit;
    }

    try {
        // Encode JSON fields (validate encoding doesn't fail)
        $encoded_figures = json_encode($figures);
        $encoded_palette_config = ($palette_config !== null) ? json_encode($palette_config) : null;
        $encoded_library_config = ($library_config !== null) ? json_encode($library_config) : null;

        if ($encoded_figures === false) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error'   => 'Failed to encode figures as JSON: ' . json_last_error_msg(),
            ]);
            exit;
        }
        if ($palette_config !== null && $encoded_palette_config === false) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error'   => 'Failed to encode palette_config as JSON: ' . json_last_error_msg(),
            ]);
            exit;
        }
        if ($library_config !== null && $encoded_library_config === false) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error'   => 'Failed to encode library_config as JSON: ' . json_last_error_msg(),
            ]);
            exit;
        }

        // Insert artwork with NULL thumbnail_path initially
        $insert_stmt = $pdo->prepare('
            INSERT INTO artworks
                (`user_id`, `title`, `library`, `figures`, `palette_config`, `library_config`, `tags`, `is_public`, `is_featured`, `thumbnail_path`)
            VALUES
                (:user_id, :title, :library, :figures, :palette_config, :library_config, :tags, :is_public, :is_featured, NULL)
        ');

        $insert_stmt->execute([
            ':user_id'         => $currentUserId,
            ':title'           => $title,
            ':library'         => $library,
            ':figures'         => $encoded_figures,
            ':palette_config'  => $encoded_palette_config,
            ':library_config'  => $encoded_library_config,
            ':tags'            => $tags,
            ':is_public'       => $is_public,
            ':is_featured'     => $is_featured,
        ]);

        $artwork_id = (int) $pdo->lastInsertId();

        // ── Process thumbnail (if provided) ──────────────────────────────────
        if ($thumbnail_data !== null) {
            // Strip the data:image/png;base64, prefix if present
            $base64_string = preg_replace('/^data:image\/\w+;base64,/', '', $thumbnail_data);
            $image_data = base64_decode($base64_string);

            if ($image_data !== false && strlen($image_data) > 0) {
                $thumbnail_filename = $artwork_id . '_' . time() . '.png';
                $thumbnail_path_full = ARTWORK_THUMBNAIL_DIR . $thumbnail_filename;

                if (file_put_contents($thumbnail_path_full, $image_data) !== false) {
                    // Update the artwork record with the thumbnail filename
                    $update_thumb_stmt = $pdo->prepare('UPDATE artworks SET `thumbnail_path` = :thumbnail_path WHERE `id` = :id');
                    $update_thumb_stmt->execute([':thumbnail_path' => $thumbnail_filename, ':id' => $artwork_id]);
                }
            }
        }

        http_response_code(201);
        echo json_encode([
            'success'    => true,
            'artwork_id' => $artwork_id,
        ]);

    } catch (PDOException $e) {
        // Always include error details for artwork save to help debug
        $message = 'Failed to save artwork: ' . $e->getMessage() . ' [SQLSTATE: ' . $e->getCode() . ']';
        error_log($message);
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $message]);
    }
    exit;
}

// ── PATCH — Update artwork ────────────────────────────────────

if ($method === 'PATCH') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : null;

    if ($id === null || $id === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Artwork ID required']);
        exit;
    }

    $id = filter_var($id, FILTER_VALIDATE_INT);
    if ($id === false || $id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid artwork ID']);
        exit;
    }

    // Parse JSON body
    $input = file_get_contents('php://input');
    $body = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($body)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON body']);
        exit;
    }

    // Allowed fields for update
    $allowedFields = ['title', 'library', 'figures', 'palette_config', 'library_config', 'tags', 'is_public', 'is_featured', 'thumbnail_data'];
    $updates = [];
    $params = ['id' => $id, 'user_id' => $currentUserId];
    $thumbnail_data = null;

    foreach ($allowedFields as $field) {
        if (isset($body[$field])) {
            switch ($field) {
                case 'title':
                    if (mb_strlen($body['title']) > 255) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'Title must not exceed 255 characters']);
                        exit;
                    }
                    $updates[] = "`$field` = :$field";
                    $params[":$field"] = $body['title'];
                    break;

                case 'library':
                    if (!in_array($body['library'], $validLibraries)) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'Invalid library. Must be one of: ' . implode(', ', $validLibraries)]);
                        exit;
                    }
                    $updates[] = "`$field` = :$field";
                    $params[":$field"] = $body['library'];
                    break;

                case 'figures':
                    if (!is_array($body['figures'])) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'figures must be a JSON array']);
                        exit;
                    }
                    if (count($body['figures']) > 40) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'Maximum 40 figures per artwork']);
                        exit;
                    }
                    $encoded = json_encode($body['figures']);
                    if ($encoded === false) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'Failed to encode figures as JSON']);
                        exit;
                    }
                    $updates[] = "`$field` = :$field";
                    $params[":$field"] = $encoded;
                    break;

                case 'palette_config':
                    if ($body['palette_config'] !== null && !is_array($body['palette_config'])) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'palette_config must be a JSON object or null']);
                        exit;
                    }
                    $encoded = ($body['palette_config'] !== null) ? json_encode($body['palette_config']) : null;
                    if ($body['palette_config'] !== null && $encoded === false) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'Failed to encode palette_config as JSON']);
                        exit;
                    }
                    $updates[] = "`$field` = :$field";
                    $params[":$field"] = $encoded;
                    break;

                case 'library_config':
                    if ($body['library_config'] !== null && !is_array($body['library_config'])) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'library_config must be a JSON object or null']);
                        exit;
                    }
                    $encoded = ($body['library_config'] !== null) ? json_encode($body['library_config']) : null;
                    if ($body['library_config'] !== null && $encoded === false) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'Failed to encode library_config as JSON']);
                        exit;
                    }
                    $updates[] = "`$field` = :$field";
                    $params[":$field"] = $encoded;
                    break;

                case 'tags':
                    if (mb_strlen($body['tags']) > 255) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'Tags must not exceed 255 characters']);
                        exit;
                    }
                    $updates[] = "`$field` = :$field";
                    $params[":$field"] = trim(strip_tags($body['tags']));
                    break;

                case 'is_public':
                    $val = filter_var($body['is_public'], FILTER_VALIDATE_INT);
                    $updates[] = "`$field` = :$field";
                    $params[":$field"] = ($val === false ? 0 : ($val ? 1 : 0));
                    break;

                case 'is_featured':
                    $val = filter_var($body['is_featured'], FILTER_VALIDATE_INT);
                    $updates[] = "`$field` = :$field";
                    $params[":$field"] = ($val === false ? 0 : ($val ? 1 : 0));
                    break;

                case 'thumbnail_data':
                    // Don't add to UPDATE clause - handle separately after UPDATE
                    $thumbnail_data = $body['thumbnail_data'];
                    break;
            }
        }
    }

    if (empty($updates) && $thumbnail_data === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No valid fields to update']);
        exit;
    }

    try {
        // Verify ownership
        $chk_stmt = $pdo->prepare('SELECT `user_id` FROM artworks WHERE `id` = :id AND `user_id` = :user_id');
        $chk_stmt->execute([':id' => $id, ':user_id' => $currentUserId]);
        if (!$chk_stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Artwork not found']);
            exit;
        }

        // Build and execute UPDATE
        $params[':id'] = $id;
        $params[':user_id'] = $currentUserId;
        $setClause = implode(', ', $updates);
        $update_sql = "UPDATE artworks SET $setClause, `updated_at` = CURRENT_TIMESTAMP WHERE `id` = :id AND `user_id` = :user_id";
        $update_stmt = $pdo->prepare($update_sql);
        $update_stmt->execute($params);

        if ($update_stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Artwork not found or not updated']);
            exit;
        }

        // ── Process thumbnail if provided ──────────────────────────────────
        if ($thumbnail_data !== null) {
            // Fetch current thumbnail_path to delete old file
            $old_thumb_stmt = $pdo->prepare('SELECT `thumbnail_path` FROM artworks WHERE `id` = :id');
            $old_thumb_stmt->execute([':id' => $id]);
            $old_thumb = $old_thumb_stmt->fetch();
            
            if ($old_thumb && $old_thumb['thumbnail_path'] !== null) {
                $old_thumb_path_full = ARTWORK_THUMBNAIL_DIR . $old_thumb['thumbnail_path'];
                if (file_exists($old_thumb_path_full)) {
                    unlink($old_thumb_path_full);
                }
            }

            // Strip the data:image/png;base64, prefix if present
            $base64_string = preg_replace('/^data:image\/\w+;base64,/', '', $thumbnail_data);
            $image_data = base64_decode($base64_string);

            if ($image_data !== false && strlen($image_data) > 0) {
                $thumbnail_filename = $id . '_' . time() . '.png';
                $thumbnail_path_full = ARTWORK_THUMBNAIL_DIR . $thumbnail_filename;

                if (file_put_contents($thumbnail_path_full, $image_data) !== false) {
                    // Update the artwork record with the new thumbnail filename
                    $update_thumb_stmt = $pdo->prepare('UPDATE artworks SET `thumbnail_path` = :thumbnail_path WHERE `id` = :id');
                    $update_thumb_stmt->execute([':thumbnail_path' => $thumbnail_filename, ':id' => $id]);
                }
            }
        }

        echo json_encode([
            'success' => true,
            'artwork_id' => $id
        ]);

    } catch (PDOException $e) {
        $message = APP_DEBUG
            ? 'Failed to update artwork: ' . $e->getMessage()
            : 'Failed to update artwork. Please try again later.';
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $message]);
    }
    exit;
}

// ── GET — Retrieve artwork(s) ──────────────────────────────────

if ($method === 'GET') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : null;

    try {
        if ($id !== null && $id !== '') {
            // ── Single artwork ───────────────────────────────
            $id = filter_var($id, FILTER_VALIDATE_INT);
            if ($id === false || $id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid artwork ID']);
                exit;
            }

            if ($currentUserId !== null) {
                // Authenticated: can see own private + any public
                $stmt = $pdo->prepare('
                    SELECT *
                    FROM artworks
                    WHERE `id` = :id AND (`is_public` = 1 OR `user_id` = :user_id)
                ');
                $stmt->execute([':id' => $id, ':user_id' => $currentUserId]);
            } else {
                // Unauthenticated: only public artworks
                $stmt = $pdo->prepare('
                    SELECT *
                    FROM artworks
                    WHERE `id` = :id AND `is_public` = 1
                ');
                $stmt->execute([':id' => $id]);
            }

            $artwork = $stmt->fetch();

            if (!$artwork) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Artwork not found']);
                exit;
            }

            // Decode JSON fields
            $artwork['figures']        = json_decode($artwork['figures'], true);
            $artwork['palette_config'] = json_decode($artwork['palette_config'], true);
            $artwork['library_config'] = json_decode($artwork['library_config'], true);

            echo json_encode([
                'success' => true,
                'artwork' => $artwork,
            ]);

        } else {
            // ── List user's artworks ─────────────────────────
            $stmt = $pdo->prepare('
                SELECT *
                FROM artworks
                WHERE `user_id` = :user_id
                ORDER BY `created_at` DESC
            ');
            $stmt->execute([':user_id' => $currentUserId]);
            $artworks = $stmt->fetchAll();

            // Decode JSON fields for each artwork
            foreach ($artworks as &$artwork) {
                $artwork['figures']        = json_decode($artwork['figures'], true);
                $artwork['palette_config'] = json_decode($artwork['palette_config'], true);
                $artwork['library_config'] = json_decode($artwork['library_config'], true);
            }
            unset($artwork);

            echo json_encode([
                'success'  => true,
                'artworks' => $artworks,
            ]);
        }

    } catch (PDOException $e) {
        $message = APP_DEBUG
            ? 'Failed to fetch artwork: ' . $e->getMessage()
            : 'Failed to fetch artwork. Please try again later.';
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $message]);
    }
    exit;
}

// ── DELETE — Delete artwork ───────────────────────────────────

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : null;

    if ($id === null || $id === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Artwork ID required']);
        exit;
    }

    $id = filter_var($id, FILTER_VALIDATE_INT);
    if ($id === false || $id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid artwork ID']);
        exit;
    }

    try {
        // Verify ownership and retrieve thumbnail_path
        $stmt = $pdo->prepare('
            SELECT `user_id`, `thumbnail_path`
            FROM artworks
            WHERE `id` = :id AND `user_id` = :user_id
        ');
        $stmt->execute([':id' => $id, ':user_id' => $currentUserId]);
        $artwork = $stmt->fetch();

        if (!$artwork) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Artwork not found']);
            exit;
        }

        // Delete DB record
        $del_stmt = $pdo->prepare('DELETE FROM artworks WHERE `id` = :id AND `user_id` = :user_id');
        $del_stmt->execute([':id' => $id, ':user_id' => $currentUserId]);

        // Delete thumbnail file if it exists
        if (!empty($artwork['thumbnail_path'])) {
            $thumb_path = ARTWORK_THUMBNAIL_DIR . basename($artwork['thumbnail_path']);
            if (file_exists($thumb_path)) {
                if (!@unlink($thumb_path)) {
                    error_log("artwork.php: Failed to delete thumbnail: {$thumb_path}");
                }
            }
        }

        echo json_encode(['success' => true]);

    } catch (PDOException $e) {
        $message = APP_DEBUG
            ? 'Failed to delete artwork: ' . $e->getMessage()
            : 'Failed to delete artwork. Please try again later.';
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $message]);
    }
    exit;
}

/*
 * NOTE ON AUTO_INCREMENT AFTER DELETE:
 * MySQL InnoDB does NOT reuse AUTO_INCREMENT IDs by default.
 * After deleting artwork ID 1, the next insert will still use the next
 * available ID (MAX(id) + 1), not reuse ID 1.
 *
 * To reset the counter (rarely needed):
 *   ALTER TABLE artworks AUTO_INCREMENT = 1;
 * MySQL will set it to MAX(id) + 1, so if only ID 2 exists, next is 3.
 *
 * To actually reuse ID 1, you must:
 *   1. DELETE FROM artworks WHERE id = 1;
 *   2. ALTER TABLE artworks AUTO_INCREMENT = 1;
 *   3. Next insert will be ID 2 (or 1 if table is empty)
 */

// ── Method not allowed ───────────────────────────────────────

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
