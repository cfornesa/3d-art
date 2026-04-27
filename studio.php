<?php
/**
 * Creatrweb Data Art — Protected Studio View
 *
 * Route: /studio.php
 * 
 * - If user is NOT authenticated, redirect to /login.php
 * - If user IS authenticated, render the full studio UI
 */

require_once __DIR__ . '/config/bootstrap.php';

$current_page = 'studio';

// ── Redirect unauthenticated users to login ────────────────────────────
if (!is_authenticated()) {
    header('Location: /login.php');
    exit;
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Creatrweb Data Art</title>
  <link rel="stylesheet" href="css/app.css">
</head>
<body>

  <!-- Header with Navigation -->
  <header id="dta-header">
    <div class="dta-header-title">
      <h1>Creatrweb Data Art</h1>
      <button class="dta-hamburger" onclick="toggleMobileNav()" aria-label="Menu">☰</button>
    </div>
    <nav class="dta-nav">
      <a href="index.php">Home</a>
      <?php if (is_authenticated()): ?>
        <a href="studio.php" class="active">Studio</a>
        <a href="data.php">Data</a>
        <a href="portfolio.php">Portfolio</a>
        <a href="#" onclick="event.preventDefault(); logout(); toggleMobileNav();" class="dta-nav-logout">Log Out</a>
      <?php else: ?>
        <a href="portfolio.php">Portfolio</a>
      <?php endif; ?>
    </nav>
    <nav class="dta-mobile-nav">
      <a href="index.php">Home</a>
      <?php if (is_authenticated()): ?>
        <a href="studio.php" class="active">Studio</a>
        <a href="data.php">Data</a>
        <a href="portfolio.php">Portfolio</a>
        <a href="#" onclick="event.preventDefault(); logout(); toggleMobileNav();" class="dta-nav-logout">Log Out</a>
      <?php else: ?>
        <a href="portfolio.php">Portfolio</a>
      <?php endif; ?>
    </nav>
  </header>

  <!-- Error / Status Display -->
  <div id="dta-error-display"></div>

  <!-- Main Layout: Canvas + Sidebar -->
  <main id="dta-main">

    <!-- Canvas Region (hero) -->
    <section id="dta-canvas-region">
      <canvas id="dta-canvas"></canvas>
      <div id="dta-empty-state">
        <p>Pick a dataset to begin</p>
      </div>
    </section>

    <!-- Controls Sidebar -->
    <aside id="dta-sidebar">

      <!-- Top Control Bar -->
      <div class="dta-control-group">
        <label for="dta-dataset-select">Dataset</label>
        <select id="dta-dataset-select">
          <option value="">— No datasets yet —</option>
        </select>

        <label for="dta-style-select">Art Style</label>
        <select id="dta-style-select">
          <option value="">— Select art style —</option>
        </select>

        <div class="dta-button-row">
          <button id="dta-export-btn">Export PNG</button>
        </div>
        <div class="dta-button-row">
          <button id="dta-save-artwork-btn">Save Artwork</button>
          <button id="dta-load-artwork-btn">Load Artwork</button>
          <button id="dta-new-artwork-btn">New Artwork</button>
        </div>
        <div class="dta-button-row">
          <button id="dta-delete-artwork-btn" class="dta-delete-artwork-btn">Delete Artwork</button>
        </div>

        <!-- Mode Toggle -->
        <div class="dta-mode-toggle" style="margin-top: 16px; padding: 8px; background: #1a1a1a; border: 1px solid #2a2a2a;">
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
            <input type="radio" name="dimension-mode" id="dta-mode-manual" value="manual" checked style="margin: 0;">
            <span style="font-size: 13px; color: #c9922a; font-weight: 600;">Manual Dimensions</span>
          </label>
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; margin-left: 24px;">
            <input type="radio" name="dimension-mode" id="dta-mode-data" value="data" style="margin: 0;">
            <span style="font-size: 13px; color: #8a8580;">Data-Driven</span>
          </label>
        </div>
      </div>

      <!-- Artwork Metadata Panel -->
      <details id="dta-metadata-section" class="dta-control-group">
        <summary>Artwork Metadata</summary>
        <div id="dta-metadata-panel">
          <input type="hidden" id="dta-current-artwork-id" value="">
          <label for="dta-artwork-title">Title</label>
          <input type="text" id="dta-artwork-title" placeholder="Give your artwork a title">

          <label for="dta-artwork-description">Description</label>
          <textarea id="dta-artwork-description" placeholder="Describe your artwork (optional)" rows="3"></textarea>

          <label for="dta-artwork-tags">Tags</label>
          <input type="text" id="dta-artwork-tags" placeholder="Comma-separated tags (optional)">

          <div class="dta-visibility-controls">
            <label>
              <input type="checkbox" id="dta-artwork-is-public">
              <span>Public</span>
            </label>
            <label>
              <input type="checkbox" id="dta-artwork-is-featured">
              <span>Featured</span>
            </label>
          </div>

          <button id="dta-save-metadata-btn" class="dta-metadata-save-btn">Save Metadata</button>
          <div id="dta-save-status"></div>
          <button id="dta-delete-artwork-btn" class="dta-delete-artwork-btn" style="display:none; margin-top: 12px; background: #1c1814; border: 2px solid #c9922a; color: #f0ece4; font-family: system-ui; font-size: 13px; padding: 8px 16px; cursor: pointer;">Delete Artwork</button>
        </div>
      </details>

      <!-- Column Mapper & Palette Picker are auto-rendered here by Controls -->
      <div id="dta-controls"></div>

    </aside>
  </main>

  <!-- Logout & Mobile Nav Functions -->
  <script>
    function logout() {
      fetch('api/auth/logout.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        if (data.success) {
          window.location.href = 'index.php';
        } else {
          alert('Logout failed: ' + (data.error || 'Unknown error'));
        }
      })
      .catch(function(err) {
        alert('Logout failed: ' + err.message);
      });
    }

    function toggleMobileNav() {
      var mobileNav = document.querySelector('.dta-mobile-nav');
      if (mobileNav) {
        mobileNav.classList.toggle('dta-visible');
      }
    }

    // Close mobile nav when clicking outside
    document.addEventListener('click', function(event) {
      var hamburger = document.querySelector('.dta-hamburger');
      var mobileNav = document.querySelector('.dta-mobile-nav');
      if (hamburger && mobileNav && mobileNav.classList.contains('dta-visible')) {
        if (!hamburger.contains(event.target) && !mobileNav.contains(event.target)) {
          mobileNav.classList.remove('dta-visible');
        }
      }
    });

    // Close mobile nav when clicking a link inside it
    document.addEventListener('click', function(event) {
      var mobileNav = document.querySelector('.dta-mobile-nav');
      if (mobileNav && event.target.closest('a') && mobileNav.contains(event.target)) {
        mobileNav.classList.remove('dta-visible');
      }
    });
  </script>

  <!-- Scripts (load order is critical) -->
  <script src="src/canvas/styles/particleField.js"></script>
  <script src="src/canvas/styles/geometricGrid.js"></script>
  <script src="src/canvas/styles/flowingCurves.js"></script>
  <script src="src/canvas/styles/radialWave.js"></script>
  <script src="src/canvas/styles/fractalDust.js"></script>
  <script src="src/canvas/styles/neuralFlow.js"></script>
  <script src="src/canvas/styles/pixelMosaic.js"></script>
  <script src="src/canvas/styles/voronoiCells.js"></script>
  <script src="src/canvas/styles/radialSymmetry.js"></script>
  <script src="src/canvas/styles/timeSeries.js"></script>
  <script src="src/canvas/styles/heatMap.js"></script>
  <script src="src/canvas/styles/scatterMatrix.js"></script>
  <script src="src/canvas/styles/barCode.js"></script>
  <script src="src/canvas/artStyles.js"></script>
  <script src="src/canvas/renderer.js"></script>
  <script src="src/data/normalizer.js"></script>
  <script src="src/data/dataMapper.js"></script>
  <script src="src/controls/columnMapper.js"></script>
  <script src="src/controls/palettePicker.js"></script>
  <script src="src/controls/visualDimensions.js"></script>
  <script src="src/controls/controls.js"></script>
  <script src="src/app.js"></script>

</body>
</html>
