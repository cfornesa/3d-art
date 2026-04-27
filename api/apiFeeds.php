<?php
/**
 * Creatrweb Data Art — API Feeds Endpoint
 *
 * GET /api/apiFeeds.php?source_url={url}&source_name={name}
 *
 * Fetches external API data with MySQL TTL caching.
 * Requires authentication.
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/auth/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// ── Validate parameters ──────────────────────────────────────

$source_url  = isset($_GET['source_url']) ? trim($_GET['source_url']) : null;
$source_name = isset($_GET['source_name']) ? trim($_GET['source_name']) : null;

if (empty($source_url) || empty($source_name)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error'   => 'source_url and source_name are required',
    ]);
    exit;
}

if (!filter_var($source_url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error'   => 'Invalid source_url',
    ]);
    exit;
}

// ── Check cache ──────────────────────────────────────────────

try {
    $cache_stmt = $pdo->prepare('
        SELECT response_data, cached_at, access_count
        FROM api_cache
        WHERE source_url = :source_url AND expires_at > NOW()
    ');
    $cache_stmt->execute([':source_url' => $source_url]);
    $cached = $cache_stmt->fetch();

    if ($cached) {
        // Update access count and last_accessed_at on cache hit
        $update_stmt = $pdo->prepare('
            UPDATE api_cache
            SET access_count = access_count + 1,
                last_accessed_at = NOW()
            WHERE source_url = :source_url
        ');
        $update_stmt->execute([':source_url' => $source_url]);

        $data = json_decode($cached['response_data'], true);

        echo json_encode([
            'success'   => true,
            'data'      => $data,
            'cached'    => true,
            'cached_at' => $cached['cached_at'],
        ]);
        exit;
    }

} catch (PDOException $e) {
    $message = APP_DEBUG
        ? 'Cache lookup failed: ' . $e->getMessage()
        : 'Failed to check API cache. Please try again later.';
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}

// ── Fetch from external API ──────────────────────────────────

$etag          = null;
$last_modified = null;

// Header callback to capture ETag and Last-Modified
$header_callback = function ($curl, $header) use (&$etag, &$last_modified) {
    $len   = strlen($header);
    $colon = strpos($header, ':');
    if ($colon !== false) {
        $name  = strtolower(trim(substr($header, 0, $colon)));
        $value = trim(substr($header, $colon + 1));
        if ($name === 'etag') {
            $etag = $value;
        } elseif ($name === 'last-modified') {
            $last_modified = $value;
        }
    }
    return $len;
};

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $source_url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_HEADERFUNCTION => $header_callback,
]);

$response = curl_exec($ch);
$http_code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

if ($response === false) {
    error_log("apiFeeds.php: cURL failed for {$source_url}: {$curl_error}");
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Failed to fetch API feed',
    ]);
    exit;
}

// Validate JSON response
$data = json_decode($response, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("apiFeeds.php: Invalid JSON from {$source_url}: " . json_last_error_msg());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Invalid JSON response from API',
    ]);
    exit;
}

// ── Store in cache ───────────────────────────────────────────

try {
    $cache_ttl = API_CACHE_TTL_SECONDS;

    $insert_stmt = $pdo->prepare('
        INSERT INTO api_cache
            (source_url, source_name, response_data, cached_at, expires_at,
             etag, last_modified, http_status, access_count, last_accessed_at)
        VALUES
            (:source_url, :source_name, :response_data, NOW(),
             DATE_ADD(NOW(), INTERVAL :ttl SECOND),
             :etag, :last_modified, :http_status, 1, NOW())
        ON DUPLICATE KEY UPDATE
            source_name    = VALUES(source_name),
            response_data  = VALUES(response_data),
            cached_at      = VALUES(cached_at),
            expires_at     = VALUES(expires_at),
            etag           = VALUES(etag),
            last_modified  = VALUES(last_modified),
            http_status    = VALUES(http_status),
            access_count   = access_count + 1,
            last_accessed_at = NOW()
    ');

    $insert_stmt->execute([
        ':source_url'    => $source_url,
        ':source_name'   => $source_name,
        ':response_data' => json_encode($data),
        ':ttl'           => $cache_ttl,
        ':etag'          => $etag,
        ':last_modified' => $last_modified,
        ':http_status'   => $http_code,
    ]);

} catch (PDOException $e) {
    // Cache write failure is non-fatal — log and return the data anyway
    error_log("apiFeeds.php: Cache write failed for {$source_url}: " . $e->getMessage());
}

// ── Return fresh data ────────────────────────────────────────

echo json_encode([
    'success'   => true,
    'data'      => $data,
    'cached'    => false,
    'cached_at' => date('Y-m-d H:i:s'),
]);
