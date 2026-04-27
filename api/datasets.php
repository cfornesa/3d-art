<?php
/**
 * Creatrweb Data Art — Datasets Endpoint
 *
 * GET    /api/datasets.php          List user's + preloaded datasets with columns
 * DELETE /api/datasets.php?id={id}  Delete a user-owned dataset and its physical file
 *
 * Both methods require authentication.
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/auth/session.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── GET — List datasets ──────────────────────────────────────

if ($method === 'GET') {
    try {
        // Fetch datasets belonging to the user OR preloaded datasets
        $stmt = $pdo->prepare('
            SELECT d.*
            FROM datasets d
            WHERE (d.user_id = :user_id OR d.user_id IS NULL OR d.source_type = \'preloaded\')
            ORDER BY d.created_at DESC
        ');
        $stmt->execute([':user_id' => $currentUserId]);
        $datasets = $stmt->fetchAll();

        // Fetch columns for each dataset
        $col_stmt = $pdo->prepare('
            SELECT id, column_name, display_name, data_type,
                   sample_values, column_order, is_mappable
            FROM dataset_columns
            WHERE dataset_id = :dataset_id
            ORDER BY column_order ASC
        ');

        foreach ($datasets as &$dataset) {
            $col_stmt->execute([':dataset_id' => $dataset['id']]);
            $columns = $col_stmt->fetchAll();

            // Decode sample_values JSON for each column
            foreach ($columns as &$col) {
                $col['sample_values'] = json_decode($col['sample_values'], true) ?? [];
            }
            unset($col);

            $dataset['columns'] = $columns;
        }
        unset($dataset);

        echo json_encode([
            'success'  => true,
            'datasets' => $datasets,
        ]);

    } catch (PDOException $e) {
        $message = APP_DEBUG
            ? 'Failed to fetch datasets: ' . $e->getMessage()
            : 'Failed to fetch datasets. Please try again later.';
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $message]);
    }
    exit;
}

// ── DELETE — Delete dataset ───────────────────────────────────

if ($method === 'DELETE') {
    // Parse id from query string
    $id = isset($_GET['id']) ? $_GET['id'] : null;

    if ($id === null || $id === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Dataset ID required']);
        exit;
    }

    $id = filter_var($id, FILTER_VALIDATE_INT);
    if ($id === false || $id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid dataset ID']);
        exit;
    }

    try {
        // Verify ownership and retrieve storage_path
        $stmt = $pdo->prepare('
            SELECT user_id, storage_path
            FROM datasets
            WHERE id = :id AND user_id = :user_id
        ');
        $stmt->execute([':id' => $id, ':user_id' => $currentUserId]);
        $dataset = $stmt->fetch();

        if (!$dataset) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Dataset not found']);
            exit;
        }

        // Delete DB record (CASCADE handles dataset_columns)
        $del_stmt = $pdo->prepare('DELETE FROM datasets WHERE id = :id AND user_id = :user_id');
        $del_stmt->execute([':id' => $id, ':user_id' => $currentUserId]);

        // Delete physical file if it exists
        if (!empty($dataset['storage_path']) && file_exists($dataset['storage_path'])) {
            if (!@unlink($dataset['storage_path'])) {
                error_log("datasets.php: Failed to delete physical file: {$dataset['storage_path']}");
            }
        }

        echo json_encode(['success' => true]);

    } catch (PDOException $e) {
        $message = APP_DEBUG
            ? 'Failed to delete dataset: ' . $e->getMessage()
            : 'Failed to delete dataset. Please try again later.';
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $message]);
    }
    exit;
}

// ── Method not allowed ───────────────────────────────────────

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
