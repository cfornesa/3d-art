<?php
/**
 * Migration: Remove A-Frame Library Support
 * 
 * This migration converts all A-Frame artworks to Three.js artworks
 * and normalizes figure types from A-Frame format (a-box) to Three.js format (box).
 * 
 * Run this migration after removing A-Frame from the codebase.
 * 
 * IMPORTANT: Backup your database before running this migration!
 * mysqldump -u u276695328_3d_art -p u276695328_3d_art > backup_before_aframe_removal.sql
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../config/env.php';

// Connect to database
try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    echo "Connected to database: " . DB_NAME . "\n";

    // Step 1: Count A-Frame artworks
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM artworks WHERE `library` = 'aframe'");
    $count = $stmt->fetch()['count'];
    echo "Found $count A-Frame artworks to convert...\n";

    if ($count === 0) {
        echo "No A-Frame artworks found. Migration complete.\n";
        exit(0);
    }

    // Step 2: Fetch all A-Frame artworks
    $stmt = $pdo->query("SELECT `id`, `figures` FROM artworks WHERE `library` = 'aframe'");
    $artworks = $stmt->fetchAll();

    $converted = 0;
    $failed = 0;

    // Step 3: Convert each artwork
    foreach ($artworks as $artwork) {
        $id = $artwork['id'];
        $figuresJson = $artwork['figures'];
        
        try {
            // Parse figures JSON
            $figures = json_decode($figuresJson, true);
            if (!is_array($figures)) {
                echo "Warning: Invalid figures JSON for artwork $id, skipping...\n";
                $failed++;
                continue;
            }

            // Normalize figure types: strip 'a-' prefix
            $normalizedFigures = [];
            foreach ($figures as $figure) {
                if (isset($figure['type']) && strpos($figure['type'], 'a-') === 0) {
                    $figure['type'] = substr($figure['type'], 2); // Remove 'a-' prefix
                }
                // Also handle library_data if it has A-Frame specific properties
                if (isset($figure['library_data'])) {
                    // Remove A-Frame specific properties if present
                    unset($figure['library_data']['shadow']); // A-Frame specific
                }
                $normalizedFigures[] = $figure;
            }

            // Update artwork in database
            $newFiguresJson = json_encode($normalizedFigures);
            
            $updateStmt = $pdo->prepare("UPDATE artworks SET `library` = 'three', `figures` = :figures WHERE `id` = :id");
            $updateStmt->execute([
                ':id' => $id,
                ':figures' => $newFiguresJson
            ]);
            
            $converted++;
            echo ".";
            
        } catch (Exception $e) {
            echo "Error converting artwork $id: " . $e->getMessage() . "\n";
            $failed++;
        }
    }

    // Step 4: Summary
    echo "\n\nMigration Summary:\n";
    echo "================\n";
    echo "Total A-Frame artworks: $count\n";
    echo "Successfully converted: $converted\n";
    echo "Failed: $failed\n";

    if ($failed === 0) {
        echo "\n✅ All A-Frame artworks converted to Three.js!\n";
    } else {
        echo "\n⚠️  Some artworks could not be converted. Check errors above.\n";
    }

} catch (PDOException $e) {
    echo "Database connection error: " . $e->getMessage() . "\n";
    exit(1);
}
