<?php
/**
 * Creatrweb Data Art — Exhibit Page
 *
 * Public view for a single artwork.
 * Route: /exhibit.php?id=ARTWORK_ID
 *
 * Shows:
 *   - Title, description, tags, created date
 *   - Hero visual (thumbnail for now)
 *   - Embed code snippet
 *
 * Behavior:
 *   - Only shows exhibits for artworks where is_public = 1
 *   - For non-existent or private IDs: show "Not found or not public"
 */

require_once __DIR__ . '/config/bootstrap.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/env.php';

// Get artwork ID from query string
$artworkId = isset($_GET['id']) ? trim($_GET['id']) : null;

// If no ID or invalid ID, redirect or show error
if (!$artworkId) {
    header('Location: /portfolio.php');
    exit;
}

$artworkId = filter_var($artworkId, FILTER_VALIDATE_INT);
if ($artworkId === false || $artworkId <= 0) {
    header('Location: /portfolio.php');
    exit;
}

// The user may or may not be authenticated; session started by bootstrap.php
$currentUserId = !empty($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;

// Fetch the artwork
$artwork = null;
try {
    if ($currentUserId !== null) {
        // Authenticated: can see own private + any public
        $stmt = $pdo->prepare('
            SELECT a.*, s.display_name AS art_style_name, s.style_key
            FROM artworks a
            JOIN art_styles s ON a.art_style_id = s.id
            WHERE a.id = :id AND (a.is_public = 1 OR a.user_id = :user_id)
        ');
        $stmt->execute([':id' => $artworkId, ':user_id' => $currentUserId]);
    } else {
        // Unauthenticated: only public artworks
        $stmt = $pdo->prepare('
            SELECT a.*, s.display_name AS art_style_name, s.style_key
            FROM artworks a
            JOIN art_styles s ON a.art_style_id = s.id
            WHERE a.id = :id AND a.is_public = 1
        ');
        $stmt->execute([':id' => $artworkId]);
    }

    $artwork = $stmt->fetch();

    if ($artwork) {
        // Decode JSON fields
        $artwork['column_mapping']   = json_decode($artwork['column_mapping'], true);
        $artwork['palette_config']   = json_decode($artwork['palette_config'], true);
        $artwork['rendering_config'] = json_decode($artwork['rendering_config'], true);
    }

} catch (PDOException $e) {
    // Database error - show error page
    $artwork = null;
}

// If artwork not found or not accessible, show error
if (!$artwork) {
    // Show not found page
    header('HTTP/1.0 404 Not Found');
    // Fall through to 404 page below
} else {
// Check if this is an embed request
$isEmbed = isset($_GET['embed']) && $_GET['embed'] === 'true';

// Build embed URL with cache-busting
$embedUrl = APP_URL . '/exhibit.php?id=' . $artworkId . '&embed=true';
if (!empty($artwork['updated_at'])) {
    $embedUrl .= '&v=' . strtotime($artwork['updated_at']);
}

// If embed mode, output minimal HTML with just the artwork
if ($isEmbed) {
    header('Content-Type: text/html');
    header('Cache-Control: no-cache, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    $title = htmlspecialchars(!empty($artwork['title']) ? $artwork['title'] : 'Untitled');
    $altText = htmlspecialchars(!empty($artwork['title']) ? $artwork['title'] : 'Artwork');
    
    // Minimal HTML for embed - just the artwork
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' . $title . '</title><style>body,html{margin:0;padding:0;height:100%;background:#0d0d0d;display:flex;align-items:center;justify-content:center;overflow:hidden}img{max-width:100%;max-height:100%;display:block;object-fit:contain}</style></head><body>';
    
    if (!empty($artwork['thumbnail_path'])) {
        $thumbUrl = htmlspecialchars(ARTWORK_THUMBNAIL_URL . $artwork['thumbnail_path']);
        $fullPath = ARTWORK_THUMBNAIL_DIR . $artwork['thumbnail_path'];
        if (file_exists($fullPath)) {
            echo '<img src="' . $thumbUrl . '" alt="' . $altText . '">';
        } else {
            echo '<div style="color:#555;font-family:monospace;font-size:14px;padding:32px;">' . htmlspecialchars($fullPath) . ' NOT FOUND</div>';
        }
    } else {
        echo '<div style="color:#555;font-family:monospace;font-size:14px;padding:32px;">No thumbnail available</div>';
    }
    
    echo '</body></html>';
    exit;
}
}

// No-cache for regular exhibit view: ensure updated artwork is always visible
header('Cache-Control: no-cache, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo htmlspecialchars($artwork ? (!empty($artwork['title']) ? $artwork['title'] : 'Untitled') : 'Not Found'); ?> — Creatrweb Data Art</title>
  <link rel="stylesheet" href="css/app.css">
  <meta name="description" content="<?php echo htmlspecialchars($artwork ? (!empty($artwork['description']) ? $artwork['description'] : '') : 'Artwork not found'); ?>">
  <style>
    /* Exhibit page specific styles */
    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    #dta-exhibit-header {
      background: #242018;
      border-bottom: 2px solid #c9922a;
      box-shadow: 4px 4px 0px #000000;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    #dta-exhibit-header a {
      color: #c9922a;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    #dta-exhibit-header h1 {
      flex: 1;
      font-size: 18px;
      font-weight: 700;
      color: #f0ece4;
      letter-spacing: 0.05em;
      margin: 0;
    }

    #dta-exhibit-main {
      flex: 1 1 auto;
      max-width: 1000px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    #dta-exhibit-hero {
      margin-bottom: 48px;
    }

    #dta-exhibit-visual {
      width: 100%;
      max-height: 400px;
      background: #0d0d0d;
      border: 1px solid #2a2a2a;
      box-shadow: 4px 4px 0px #000000;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    #dta-exhibit-visual img {
      max-width: 100%;
      max-height: 400px;
      object-fit: contain;
    }

    #dta-exhibit-visual .dta-placeholder {
      color: #555;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      padding: 32px;
    }

    #dta-exhibit-details {
      background: #242018;
      border: 1px solid #2a2a2a;
      box-shadow: 4px 4px 0px #000000;
      padding: 24px;
    }

    #dta-exhibit-details h2 {
      font-size: 16px;
      font-weight: 700;
      color: #c9922a;
      margin: 0 0 16px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .dta-exhibit-meta {
      margin-bottom: 16px;
    }

    .dta-exhibit-meta-item {
      margin-bottom: 8px;
    }

    .dta-exhibit-meta-item strong {
      color: #f0ece4;
      display: inline-block;
      width: 80px;
    }

    .dta-exhibit-meta-item span {
      color: #8a8580;
    }

    .dta-exhibit-description {
      background: #1c1814;
      border: 1px solid #2a2a2a;
      padding: 16px;
      margin-top: 24px;
    }

    .dta-exhibit-description p {
      color: #a0a0a0;
      line-height: 1.6;
      margin: 0;
    }

    #dta-exhibit-embed {
      background: #1c1814;
      border: 1px solid #2a2a2a;
      padding: 24px;
      margin-top: 32px;
    }

    #dta-exhibit-embed h2 {
      font-size: 16px;
      font-weight: 700;
      color: #c9922a;
      margin: 0 0 16px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    #dta-exhibit-embed p {
      color: #606060;
      font-size: 13px;
      margin: 0 0 12px 0;
    }

    #dta-embed-code {
      background: #0d0d0d;
      border: 1px solid #2a2a2a;
      padding: 12px 16px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #a0a0a0;
      overflow-x: auto;
      white-space: pre;
    }

    #dta-exhibit-not-found {
      text-align: center;
      padding: 64px 24px;
      color: #606060;
    }

    #dta-exhibit-not-found h1 {
      color: #8a8580;
      margin-bottom: 16px;
    }

    #dta-exhibit-not-found p {
      margin-bottom: 24px;
    }

    #dta-exhibit-not-found a {
      color: #c9922a;
      text-decoration: none;
    }

    #dta-exhibit-footer {
      padding: 24px;
      font-size: 12px;
      color: #606060;
      text-align: center;
      border-top: 1px solid #2a2a2a;
      margin-top: 48px;
    }

    @media (max-width: 768px) {
      #dta-exhibit-main {
        max-width: 100%;
        padding: 16px;
      }
    }
  </style>
</head>
<body>

  <?php if ($artwork): ?>
  
  <header id="dta-exhibit-header">
    <a href="/portfolio.php">←</a>
    <h1 class="dta-exhibit-title"><?php echo htmlspecialchars(!empty($artwork['title']) ? $artwork['title'] : 'Untitled'); ?></h1>
  </header>

  <main id="dta-exhibit-main">
    <div id="dta-exhibit-hero">
      <div id="dta-exhibit-visual">
        <?php if (!empty($artwork['thumbnail_path'])): ?>
          <img src="<?php echo htmlspecialchars(ARTWORK_THUMBNAIL_URL . basename($artwork['thumbnail_path'])); ?>" alt="<?php echo htmlspecialchars(!empty($artwork['title']) ? $artwork['title'] : 'Artwork'); ?>">
        <?php else: ?>
          <div class="dta-placeholder">No thumbnail available</div>
        <?php endif; ?>
      </div>

      <div id="dta-exhibit-details">
        <h2>Artwork Details</h2>
        <div class="dta-exhibit-meta">
          <div class="dta-exhibit-meta-item">
            <strong>Created:</strong>
            <span><?php echo htmlspecialchars(date('M j, Y, g:i a', strtotime($artwork['created_at']))); ?></span>
          </div>
          <?php if ($artwork['art_style_name']): ?>
          <div class="dta-exhibit-meta-item">
            <strong>Style:</strong>
            <span><?php echo htmlspecialchars($artwork['art_style_name']); ?></span>
          </div>
          <?php endif; ?>
          <?php if ($artwork['tags']): ?>
          <div class="dta-exhibit-meta-item">
            <strong>Tags:</strong>
            <span><?php echo htmlspecialchars($artwork['tags']); ?></span>
          </div>
          <?php endif; ?>
        </div>
        
        <?php if ($artwork['description']): ?>
        <div class="dta-exhibit-description">
          <p><?php echo nl2br(htmlspecialchars($artwork['description'])); ?></p>
        </div>
        <?php endif; ?>
      </div>

      <div id="dta-exhibit-embed">
        <h2>Embed This Piece</h2>
        <p>Copy and paste this code into your website to embed this artwork:</p>
        <div id="dta-embed-code">&lt;iframe src=&quot;<?php echo htmlspecialchars($embedUrl); ?>&quot; width=&quot;800&quot; height=&quot;600&quot; frameborder=&quot;0&quot;&gt;&lt;/iframe&gt;</div>
      </div>
    </div>
  </main>

  <footer id="dta-exhibit-footer">
    <p>Creatrweb Data Art: My data art workstation. Copyright (c) <?php echo date('Y'); ?> <a href="https://creatrweb.com" style="color:#606060;" target="_blank">Fornesus</a>.</p>
    <p>Developed with open-source AI tools and models: Vibe CLI, Kilo Code, Opencode Go.</p>
    <p><a href="portfolio.php" style="color:#606060;">View all public artworks</a>.</p>
  </footer>

  <?php else: ?>
  
  <main id="dta-exhibit-not-found">
    <h1>Not Found or Not Public</h1>
    <p>The requested artwork does not exist or is not publicly accessible.</p>
    <p><a href="/portfolio.php">← Back to Portfolio</a> | <a href="/">← Back to Home</a></p>
  </main>

  <?php endif; ?>

</body>
</html>
