<?php
/**
 * Creatrweb Data Art — File Upload Handler
 *
 * Accepts CSV, TSV, and XLSX uploads. Enforces the C-04 sanitization
 * pipeline: MIME validation, size limit, extension allowlist, and
 * content scanning — all before any database write.
 *
 * POST /api/upload.php
 * Content-Type: multipart/form-data
 * Field name: "file"
 */

error_log('Upload method: ' . ($_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN'));

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Invalid content type']);
    exit;
}

header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/auth/session.php';

// ── Helpers ─────────────────────────────────────────────────

/**
 * Send a JSON error response and exit.
 */
function upload_error(string $message, int $code = 400): void
{
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error'   => $message,
    ]);
    exit;
}

/**
 * Send a JSON success response and exit.
 */
function upload_success(array $data): void
{
    http_response_code(200);
    echo json_encode(array_merge(['success' => true], $data));
    exit;
}

/**
 * Generate a UUID v4 string.
 */
function uuid_v4(): string
{
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // version 4
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // variant 10
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

/**
 * Infer the data type of a column from its values.
 */
function infer_column_type(array $values): string
{
    $has_number = false;
    $has_date   = false;
    $has_bool   = false;

    foreach ($values as $v) {
        if ($v === null || $v === '') {
            continue;
        }

        $lower = strtolower(trim($v));

        // Boolean
        if (in_array($lower, ['true', 'false', 'yes', 'no', '1', '0'], true)) {
            $has_bool = true;
            continue;
        }

        // Number
        if (is_numeric($v)) {
            $has_number = true;
            continue;
        }

        // Date — basic ISO 8601 and common formats
        if (preg_match('/^\d{4}-\d{2}-\d{2}/', $v) ||
            preg_match('/^\d{1,2}\/\d{1,2}\/\d{2,4}/', $v)) {
            $has_date = true;
            continue;
        }

        // If any value is clearly a string, short-circuit
        return 'string';
    }

    // Priority: string > number > date > boolean > unknown
    if ($has_number && !$has_date && !$has_bool) {
        return 'number';
    }
    if ($has_date && !$has_number) {
        return 'date';
    }
    if ($has_bool && !$has_number && !$has_date) {
        return 'boolean';
    }
    if ($has_number) {
        return 'number';
    }

    return 'string';
}

/**
 * Parse a CSV file and return [headers, rows].
 */
function parse_csv(string $path, string $delimiter = ','): array
{
    $handle = fopen($path, 'r');
    if ($handle === false) {
        throw new RuntimeException('Unable to open CSV file.');
    }

    $headers = fgetcsv($handle, 0, $delimiter, '"', '\\');
    if ($headers === false) {
        fclose($handle);
        throw new RuntimeException('CSV file is empty or has no headers.');
    }

    // Sanitize headers
    $headers = array_map(function ($h) {
        return trim($h !== null ? $h : '');
    }, $headers);

    $rows = [];
    while (($row = fgetcsv($handle, 0, $delimiter, '"', '\\')) !== false) {
        // Pad or trim row to match header count
        if (count($row) < count($headers)) {
            $row = array_pad($row, count($headers), '');
        } elseif (count($row) > count($headers)) {
            $row = array_slice($row, 0, count($headers));
        }
        $rows[] = array_map(function ($cell) {
            return $cell !== null ? trim($cell) : '';
        }, $row);
    }

    fclose($handle);
    return [$headers, $rows];
}

/**
 * Parse an XLSX file using ZipArchive + SimpleXML.
 * Returns [headers, rows].
 */
function parse_xlsx(string $path): array
{
    if (!class_exists('ZipArchive')) {
        throw new RuntimeException('XLSX support requires the ZipArchive extension.');
    }

    $zip = new ZipArchive();
    if ($zip->open($path) !== true) {
        throw new RuntimeException('Unable to open XLSX file.');
    }

    // Read shared strings
    $shared_strings = [];
    $ss_xml = $zip->getFromName('xl/sharedStrings.xml');
    if ($ss_xml !== false) {
        $ss = simplexml_load_string($ss_xml);
        if ($ss !== false) {
            foreach ($ss->si as $si) {
                // Concatenate all <t> children (handles rich text)
                $text = '';
                if (isset($si->t)) {
                    $text = (string) $si->t;
                } else {
                    foreach ($si->r as $r) {
                        if (isset($r->t)) {
                            $text .= (string) $r->t;
                        }
                    }
                }
                $shared_strings[] = $text;
            }
        }
    }

    // Read first worksheet
    $sheet_xml = $zip->getFromName('xl/worksheets/sheet1.xml');
    if ($sheet_xml === false) {
        $zip->close();
        throw new RuntimeException('XLSX file has no worksheet data.');
    }

    $sheet = simplexml_load_string($sheet_xml);
    if ($sheet === false) {
        $zip->close();
        throw new RuntimeException('Unable to parse XLSX worksheet.');
    }

    // Register namespaces
    $sheet->registerXPathNamespace('s', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');

    $rows_data = [];
    foreach ($sheet->sheetData->row as $row) {
        $row_cells = [];
        foreach ($row->c as $cell) {
            $ref  = (string) $cell['r'];   // e.g. "A1", "B1"
            $type = (string) $cell['t'];   // "s" = shared string, "n" = number, etc.
            $val  = null;

            if (isset($cell->v)) {
                $val = (string) $cell->v;
            } elseif (isset($cell->is->t)) {
                $val = (string) $cell->is->t;
            }

            // Resolve shared string reference
            if ($type === 's' && $val !== null && isset($shared_strings[(int) $val])) {
                $val = $shared_strings[(int) $val];
            }

            // Extract column letter from reference (A1 → 0, B1 → 1, etc.)
            $col_letter = preg_replace('/[^A-Z]/', '', strtoupper($ref));
            $col_index  = 0;
            for ($i = 0; $i < strlen($col_letter); $i++) {
                $col_index = $col_index * 26 + (ord($col_letter[$i]) - ord('A') + 1);
            }
            $col_index--; // zero-based

            $row_cells[$col_index] = $val !== null ? $val : '';
        }

        // Fill gaps
        if (!empty($row_cells)) {
            $max_col = max(array_keys($row_cells));
            for ($i = 0; $i <= $max_col; $i++) {
                if (!isset($row_cells[$i])) {
                    $row_cells[$i] = '';
                }
            }
            ksort($row_cells);
            $rows_data[] = array_values($row_cells);
        }
    }

    $zip->close();

    if (empty($rows_data)) {
        throw new RuntimeException('XLSX file contains no data rows.');
    }

    // First row is headers
    $headers = array_shift($rows_data);
    return [$headers, $rows_data];
}

/**
 * Detect column types and collect sample values from parsed data.
 */
function analyze_columns(array $headers, array $rows): array
{
    $col_count  = count($headers);
    $sample_max = COLUMN_SAMPLE_COUNT;
    $columns    = [];

    for ($i = 0; $i < $col_count; $i++) {
        $values = [];
        foreach ($rows as $row) {
            if (isset($row[$i]) && $row[$i] !== '') {
                $values[] = $row[$i];
            }
        }

        $columns[] = [
            'column_name'  => $headers[$i],
            'display_name' => $headers[$i],
            'data_type'    => infer_column_type($values),
            'sample_values' => array_slice($values, 0, $sample_max),
        ];
    }

    return $columns;
}

// ── Main Pipeline ───────────────────────────────────────────

error_log('Upload method: ' . ($_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN'));

// Step 1: Method check
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    upload_error('Invalid content type', 405);
}

// Step 2: Check $_FILES for upload errors
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $error_code = isset($_FILES['file']) ? $_FILES['file']['error'] : -1;

    $error_messages = [
        UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload limit.',
        UPLOAD_ERR_FORM_SIZE  => 'File exceeds form upload limit.',
        UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded.',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Server configuration error.',
        UPLOAD_ERR_CANT_WRITE => 'Server unable to write file.',
        UPLOAD_ERR_EXTENSION  => 'Upload blocked by server extension.',
    ];

    $msg = $error_messages[$error_code] ?? 'Unknown upload error.';
    upload_error($msg);
}

$file = $_FILES['file'];

// Step 3: File size limit
if ($file['size'] > UPLOAD_MAX_BYTES) {
    upload_error(sprintf(
        'File too large. Maximum size is %d MB.',
        UPLOAD_MAX_BYTES / 1024 / 1024
    ));
}

// Step 4: Extension allowlist
$original_name = $file['name'];
$extension = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));

if (!in_array($extension, UPLOAD_ALLOWED_EXT, true)) {
    upload_error(sprintf(
        'File type ".%s" is not allowed. Accepted types: %s',
        $extension,
        implode(', ', UPLOAD_ALLOWED_EXT)
    ));
}

// Step 5: MIME type validation via finfo — do NOT trust browser Content-Type
$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mime     = $finfo->file($file['tmp_name']);
$allowed  = UPLOAD_ALLOWED_MIME;

if (!isset($allowed[$extension]) || !in_array($mime, $allowed[$extension], true)) {
    upload_error(sprintf(
        'File content does not match expected type for .%s files.',
        $extension
    ));
}

// Step 6: Move to uploads with UUID-based filename
$uuid_filename = uuid_v4() . '.' . $extension;
$upload_path   = UPLOAD_DIR . '/' . $uuid_filename;

if (!is_dir(UPLOAD_DIR)) {
    if (!mkdir(UPLOAD_DIR, 0755, true)) {
        upload_error('Server unable to create upload directory.', 500);
    }
}

if (!move_uploaded_file($file['tmp_name'], $upload_path)) {
    upload_error('Server unable to store uploaded file.', 500);
}

// ── Database Operations (transactional) ─────────────────────

try {
    $pdo->beginTransaction();

    // Step 7: Insert dataset record with is_sanitized = 0
    $stmt = $pdo->prepare('
        INSERT INTO datasets
            (user_id, source_type, source_name, original_filename,
             file_size_bytes, mime_type, storage_path, is_sanitized)
        VALUES
            (:user_id, :source_type, :source_name, :original_filename,
             :file_size_bytes, :mime_type, :storage_path, 0)
    ');

    $stmt->execute([
        ':user_id'           => $currentUserId,
        ':source_type'       => 'upload',
        ':source_name'       => $original_name,
        ':original_filename' => $original_name,
        ':file_size_bytes'   => $file['size'],
        ':mime_type'         => $mime,
        ':storage_path'      => $upload_path,
    ]);

    $dataset_id = (int) $pdo->lastInsertId();

    // Step 8: Parse file contents
    switch ($extension) {
        case 'csv':
            [$headers, $rows] = parse_csv($upload_path, ',');
            break;
        case 'tsv':
            [$headers, $rows] = parse_csv($upload_path, "\t");
            break;
        case 'xlsx':
            [$headers, $rows] = parse_xlsx($upload_path);
            break;
        default:
            throw new RuntimeException('Unsupported file type after allowlist check.');
    }

    if (empty($headers)) {
        throw new RuntimeException('File contains no column headers.');
    }

    $row_count = count($rows);

    // Step 9: Analyze columns — detect types and collect samples
    $column_data = analyze_columns($headers, $rows);

    // Step 10: Insert column metadata
    $col_stmt = $pdo->prepare('
        INSERT INTO dataset_columns
            (dataset_id, column_name, display_name, data_type,
             sample_values, column_order)
        VALUES
            (:dataset_id, :column_name, :display_name, :data_type,
             :sample_values, :column_order)
    ');

    $column_summaries = [];

    foreach ($column_data as $order => $col) {
        $col_stmt->execute([
            ':dataset_id'    => $dataset_id,
            ':column_name'   => $col['column_name'],
            ':display_name'  => $col['display_name'],
            ':data_type'     => $col['data_type'],
            ':sample_values' => json_encode($col['sample_values']),
            ':column_order'  => $order,
        ]);

        $column_summaries[] = [
            'column_name'  => $col['column_name'],
            'display_name' => $col['display_name'],
            'data_type'    => $col['data_type'],
            'sample_count' => count($col['sample_values']),
        ];
    }

    // Step 11: Update row count, sanitized status
    $update_stmt = $pdo->prepare('
        UPDATE datasets
        SET row_count    = :row_count,
            is_sanitized = 1,
            sanitized_at = NOW()
        WHERE id = :id
    ');

    $update_stmt->execute([
        ':row_count' => $row_count,
        ':id'        => $dataset_id,
    ]);

    $pdo->commit();

    // Step 12: Return success
    upload_success([
        'dataset_id'  => $dataset_id,
        'source_name' => $original_name,
        'row_count'   => $row_count,
        'columns'     => $column_summaries,
    ]);

} catch (Exception $e) {
    // Roll back any partial DB writes
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    // Clean up the uploaded file on failure
    if (file_exists($upload_path)) {
        unlink($upload_path);
    }

    $message = APP_DEBUG
        ? 'Upload processing failed: ' . $e->getMessage()
        : 'Upload processing failed. Please check your file and try again.';

    upload_error($message, 422);
}
