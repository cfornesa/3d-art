<?php
/**
 * Creatrweb 3D Art — Exhibit Page
 *
 * Public view for a single artwork.
 * Route: /exhibit.php?id=ARTWORK_ID
 *
 * Shows:
 *   - Title, description, tags, created date
 *   - Hero visual (thumbnail for gallery display only)
 *   - Embed code snippet
 *
 * Behavior:
 *   - Only shows exhibits for artworks where is_public = 1
 *   - For non-existent or private IDs: show "Not found or not public"
 *   - Embeds re-render from configuration on each view (no thumbnails)
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
            SELECT * FROM artworks
            WHERE `id` = :id AND (`is_public` = 1 OR `user_id` = :user_id)
        ');
        $stmt->execute([':id' => $artworkId, ':user_id' => $currentUserId]);
    } else {
        // Unauthenticated: only public artworks
        $stmt = $pdo->prepare('
            SELECT * FROM artworks
            WHERE `id` = :id AND `is_public` = 1
        ');
        $stmt->execute([':id' => $artworkId]);
    }

    $artwork = $stmt->fetch();

    if ($artwork) {
        // Decode JSON fields for new architecture
        $artwork['figures']       = json_decode($artwork['figures'], true);
        $artwork['palette_config'] = json_decode($artwork['palette_config'], true);
        $artwork['library_config'] = json_decode($artwork['library_config'], true);
        // Legacy fields (may be null for new artworks)
        $artwork['column_mapping']   = json_decode($artwork['column_mapping'], true);
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

// Build embed URL
$embedUrl = APP_URL . '/exhibit.php?id=' . $artworkId . '&embed=true';

// If embed mode, output minimal HTML with config-based re-rendering
if ($isEmbed) {
    header('Content-Type: text/html');
    header('Cache-Control: no-cache, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    $title = htmlspecialchars(!empty($artwork['title']) ? $artwork['title'] : 'Untitled');
    $altText = htmlspecialchars(!empty($artwork['title']) ? $artwork['title'] : 'Artwork');
    
    // For re-rendering from config, we need to encode the artwork configuration
    $config = array(
        'library' => !empty($artwork['library']) ? $artwork['library'] : 'three',
        'figures' => !empty($artwork['figures']) ? $artwork['figures'] : array(),
        'palette_config' => !empty($artwork['palette_config']) ? $artwork['palette_config'] : (object)array(),
        'library_config' => !empty($artwork['library_config']) ? $artwork['library_config'] : (object)array()
    );
    
    // Encode config as JSON with hex encoding to prevent </script> from breaking script tag
    $jsonConfig = json_encode($config, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP);
    // Handle json_encode failure to prevent syntax error - C-35
    if ($jsonConfig === false) {
        $jsonConfig = '{}';
        error_log('Exhibit embed: JSON encode failed for config');
    }
    
    // Minimal HTML for embed - re-render from configuration
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' . $title . '</title><style>';
    echo 'body,html{margin:0;padding:0;height:100%;background:#0d0d0d;display:flex;align-items:center;justify-content:center;overflow:hidden}';
    echo 'canvas{width:100%;height:100%;display:block;pointer-events:auto;min-height:400px;}';
    echo '#dta-embed-error{color:#ff6b6b;font-family:system-ui;font-size:14px;padding:24px;text-align:center;display:none;}';
    echo '#dta-embed-loading{color:#8a8580;font-family:system-ui;font-size:14px;padding:24px;text-align:center;display:none;}';
    echo '</style></head><body>';
    echo '<div id="dta-embed-loading">Loading ' . $title . '...</div>';
    echo '<div id="dta-embed-error" style="display:none;"></div>';
    
    // Canvas element for live rendering - sole visible element in embed mode
    // Per C-32: exhibit displays re-rendered canvas, not thumbnails
    echo '<canvas id="dta-embed-canvas" style="width:100%;height:100%;display:block;pointer-events:auto;min-height:400px;"></canvas>';
    
    // Encode config for JavaScript
    echo '<script>';
    echo 'var DTA_EMBED_CONFIG = ' . $jsonConfig . ';';
    echo '</script>';
    
    // Load required libraries based on artwork library
    $library = !empty($artwork['library']) ? $artwork['library'] : 'three';
    
    // Always need FigureBase and FigureManager
    // Use consistent CDNs across embed and regular modes - Fix for Session 35
    echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>';
    echo '<script src="https://cdn.jsdelivr.net/npm/p5@1.4.2/lib/p5.min.js"></script>';
    
    // Load Creatrweb 3D Art modules from absolute paths
    // Note: Using absolute paths (/src/...) to ensure correct loading
    // regardless of how embed.php is accessed (iframe, subdirectory, etc.)
    echo '<script src="/src/figures/figure-base.js"></script>';
    echo '<script src="/src/figures/figure-manager.js"></script>';
    echo '<script src="/src/libraries/three.js"></script>';
    echo '<script src="/src/libraries/p5.js"></script>';
    echo '<script src="/src/libraries/c2.js"></script>';
    
    // Embed renderer script
    echo '<script>';
    echo '(function() {';
    echo '  "use strict";';
    echo '  var config = DTA_EMBED_CONFIG;';
    echo '  var library = config.library || "three";';
    echo '  var figures = config.figures || [];';
    echo '  var canvasEl = document.getElementById("dta-embed-canvas");';
    echo '  var errorEl = document.getElementById("dta-embed-error");';
    echo '  var loadingEl = document.getElementById("dta-embed-loading");';
    echo '';
    echo '  function showError(msg) {';
    echo '    loadingEl.style.display = "none";';
    echo '    errorEl.textContent = msg;';
    echo '    errorEl.style.display = "block";';
    echo '    console.error("Embed error:", msg);';
    echo '  }';
    echo '';
    echo '  function hideLoading() {';
    echo '    loadingEl.style.display = "none";';
    echo '  }';
    echo '';
    echo '  // Wait for modules to load, then initialize';
    echo '  function initEmbed() {';
    echo '    try {';
    echo '      // Check for all required dependencies based on library';
    echo '      var dependenciesReady = false;';
    echo '      switch(library) {';
    echo '        case "three":';
    echo '          dependenciesReady = (window.THREE && window.DataToArt &&';
    echo '                            window.DataToArt.FigureBase && window.DataToArt.ThreeRenderer);';
    echo '          break;';
    echo '        case "p5":';
    echo '          dependenciesReady = (window.p5 && window.DataToArt &&';
    echo '                            window.DataToArt.FigureBase && window.DataToArt.P5Renderer);';
    echo '          break;';
    echo '        case "c2":';
    echo '          dependenciesReady = (window.DataToArt && window.DataToArt.FigureBase &&';
    echo '                            window.DataToArt.C2Renderer);';
    echo '          break;';
    echo '        default:';
    echo '          // Check for three by default';
    echo '          dependenciesReady = (window.THREE && window.DataToArt &&';
    echo '                            window.DataToArt.FigureBase && window.DataToArt.ThreeRenderer);';
    echo '          break;';
    echo '      }';
    echo '';
    echo '      if (!dependenciesReady) {';
    echo '        console.log("Waiting for deps - THREE:", typeof THREE, "DataToArt:", typeof DataToArt);';
    echo '        console.log("  FigureBase:", (window.DataToArt ? (window.DataToArt.FigureBase ? "available" : "undefined") : "undefined"));';
    echo '        console.log("  Renderer:", (window.DataToArt ? (window.DataToArt.ThreeRenderer ? "available" : "undefined") : "undefined"));';
    echo '        setTimeout(initEmbed, 100);';
    echo '        return;';
    echo '      }';
    echo '';
    echo '      // Create renderer based on library';
    echo '      var RendererClass, renderer, options;';
    echo '      // Verify canvas element exists (created in HTML)';
    echo '      if (!canvasEl) {';
    echo '        showError("Canvas element not found");';
    echo '        return;';
    echo '      }';
    echo '      switch(library) {';
    echo '        case "three":';
    echo '          RendererClass = window.DataToArt.ThreeRenderer;';
    echo '          options = { canvas: canvasEl };';
    echo '          break;';
    echo '        case "p5":';
    echo '          RendererClass = window.DataToArt.P5Renderer;';
    echo '          options = { canvas: canvasEl };';
    echo '          break;';
    echo '        case "c2":';
    echo '          RendererClass = window.DataToArt.C2Renderer;';
    echo '          options = { canvas: canvasEl };';
    echo '          break;';
    echo '        default:';
    echo '          // Fallback to three.js for unknown libraries';
    echo '          RendererClass = window.DataToArt.ThreeRenderer;';
    echo '          options = { canvas: canvasEl };';
    echo '          break;';
    echo '      }';
    echo '';
    echo '      if (!RendererClass) {';
    echo '        showError("Renderer not available for library: " + library);';
    echo '        return;';
    echo '      }';
    echo '';
    echo '      try {';
    echo '        renderer = new RendererClass(options);';
    echo '        hideLoading();';
    echo '';
    echo '        // Set figures and render';
    echo '        if (renderer.setFigures && Array.isArray(figures)) {';
    echo '          renderer.setFigures(figures);';
    echo '        }';
    echo '        if (renderer.render) {';
    echo '          renderer.render();';
    echo '        }';
    echo '      } catch(e) {';
    echo '        showError("Failed to initialize renderer: " + e.message);';
    echo '      }';
    echo '    } catch(e) {';
    echo '      showError("Error: " + e.message);';
    echo '    }';
    echo '  }';
    echo '';
    echo '  // Start initialization';
    echo '  if (document.readyState === "complete" || document.readyState === "interactive") {';
    echo '    console.log("Starting embed - THREE:", typeof THREE, "DataToArt:", typeof DataToArt);';
    echo '    console.log("  FigureBase:", (window.DataToArt ? (window.DataToArt.FigureBase ? "available" : "undefined") : "undefined"));';
    echo '    console.log("  ThreeRenderer:", (window.DataToArt ? (window.DataToArt.ThreeRenderer ? "available" : "undefined") : "undefined"));';
    echo '    setTimeout(initEmbed, 500);';
    echo '  } else {';
    echo '    document.addEventListener("DOMContentLoaded", function() {';
    echo '      console.log("DOM ready - THREE:", typeof THREE, "DataToArt:", typeof DataToArt);';
    echo '      console.log("  FigureBase:", (window.DataToArt ? (window.DataToArt.FigureBase ? "available" : "undefined") : "undefined"));';
    echo '      console.log("  ThreeRenderer:", (window.DataToArt ? (window.DataToArt.ThreeRenderer ? "available" : "undefined") : "undefined"));';
    echo '      setTimeout(initEmbed, 500);';
    echo '    });';
    echo '  }';
    echo '})();';
    echo '</script>';
    
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
  <title><?php echo htmlspecialchars($artwork ? (!empty($artwork['title']) ? $artwork['title'] : 'Untitled') : 'Not Found'); ?> — Creatrweb 3D Art</title>
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
      height: 400px;
      background: #0d0d0d;
      border: 1px solid #2a2a2a;
      box-shadow: 4px 4px 0px #000000;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }

    #dta-exhibit-canvas {
      width: 100%;
      height: 100%;
    }

    #dta-exhibit-canvas canvas {
      width: 100%;
      height: 100%;
      display: block;
      pointer-events: auto;
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
        <!-- Canvas for live rendering - thumbnails are for gallery only per C-25/C-26 -->
        <div id="dta-exhibit-canvas"></div>
      </div>

      <!-- Load required libraries for exhibit rendering -->
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/p5@1.4.2/lib/p5.min.js"></script>
      <script src="/src/figures/figure-base.js"></script>
      <script src="/src/figures/figure-manager.js"></script>
      <script src="/src/libraries/three.js"></script>
      <script src="/src/libraries/p5.js"></script>
      <script src="/src/libraries/c2.js"></script>

      <script>
      (function() {
        'use strict';
        
        var artwork = <?php echo json_encode([
            'id' => $artwork['id'],
            'library' => $artwork['library'] ?? 'three',
            'figures' => $artwork['figures'] ?? [],
            'palette_config' => $artwork['palette_config'] ?? (object)[],
            'library_config' => $artwork['library_config'] ?? (object)[]
        ], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
        
        var library = artwork.library || 'three';
        var figures = artwork.figures || [];
        
        // Wait for modules to load
        function initExhibit() {
          var dependenciesReady = false;
          switch(library) {
            case 'three':
              dependenciesReady = (window.THREE && window.DataToArt && 
                                  window.DataToArt.FigureBase && window.DataToArt.ThreeRenderer);
              break;
            case 'p5':
              dependenciesReady = (window.p5 && window.DataToArt && 
                                  window.DataToArt.FigureBase && window.DataToArt.P5Renderer);
              break;
            case 'c2':
              dependenciesReady = (window.DataToArt && window.DataToArt.FigureBase &&
                                  window.DataToArt.C2Renderer);
              break;
            default:
              dependenciesReady = (window.THREE && window.DataToArt && 
                                  window.DataToArt.FigureBase && window.DataToArt.ThreeRenderer);
              break;
          }
          
          if (!dependenciesReady) {
            setTimeout(initExhibit, 100);
            return;
          }
          
          var container = document.getElementById('dta-exhibit-canvas');
          var RendererClass;
          var canvasEl = document.createElement('canvas');
          canvasEl.style.cssText = 'width:100%;height:100%;';
          container.appendChild(canvasEl);
          
          // Set canvas width/height to match container
          function resizeCanvas() {
            canvasEl.width = container.clientWidth;
            canvasEl.height = container.clientHeight;
          }
          resizeCanvas();
          window.addEventListener('resize', resizeCanvas);
          
          switch(library) {
            case 'three':
              RendererClass = window.DataToArt.ThreeRenderer;
              break;
            case 'p5':
              RendererClass = window.DataToArt.P5Renderer;
              break;
            case 'c2':
              RendererClass = window.DataToArt.C2Renderer;
              break;
            default:
              RendererClass = window.DataToArt.ThreeRenderer;
          }
          
          if (RendererClass) {
            try {
              var renderer = new RendererClass({ canvas: canvasEl });
              if (renderer.setFigures && Array.isArray(figures)) {
                renderer.setFigures(figures);
              }
              if (renderer.render) {
                renderer.render();
              }
            } catch(e) {
              console.error('Failed to initialize exhibit renderer:', e.message);
            }
          }
        }
        
        // Start initialization
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          setTimeout(initExhibit, 500);
        } else {
          document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initExhibit, 500);
          });
        }
      })();
      </script>

      <div id="dta-exhibit-details">
        <h2>Artwork Details</h2>
        <div class="dta-exhibit-meta">
          <div class="dta-exhibit-meta-item">
            <strong>Created:</strong>
            <span><?php echo htmlspecialchars(date('M j, Y, g:i a', strtotime($artwork['created_at']))); ?></span>
          </div>
          <?php if (!empty($artwork['library'])): ?>
          <div class="dta-exhibit-meta-item">
            <strong>Library:</strong>
            <span><?php echo htmlspecialchars(ucfirst($artwork['library'])); ?></span>
          </div>
          <?php endif; ?>
          <?php if (!empty($artwork['figures']) && is_array($artwork['figures'])): ?>
          <div class="dta-exhibit-meta-item">
            <strong>Figures:</strong>
            <span><?php echo count($artwork['figures']); ?></span>
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
    <p>Creatrweb 3D Art: Multi-library art generation studio. Copyright (c) <?php echo date('Y'); ?> <a href="https://creatrweb.com" style="color:#606060;" target="_blank">Fornesus</a>.</p>
    <p>Developed with open-source AI tools and models: Vibe CLI, Kilo Code, Opencode Go.</p>
    <p><a href="portfolio.php" style="color:#606060;">View all public artworks</a>.</p>
  </footer>

  <?php else: ?>
  
  <main id="dta-exhibit-not-found">
    <h1>Not Found or Not Public</h1>
    <p>The requested artwork does not exist or is not publicly accessible.</p>
    <p><a href="/portfolio.php">← Back to Portfolio</a> | <a href="/index.php">← Back to Home</a></p>
  </main>

  <?php endif; ?>

</body>
</html>
