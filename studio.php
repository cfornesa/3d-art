<?php
/**
 * Creatrweb 3D Art — Protected Studio View
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
  <title>Creatrweb 3D Art</title>
  <link rel="stylesheet" href="css/app.css">
</head>
<body>

  <!-- Header with Navigation -->
  <header id="dta-header">
    <div class="dta-header-title">
      <h1>Creatrweb 3D Art</h1>
      <button class="dta-hamburger" onclick="toggleMobileNav()" aria-label="Menu">☰</button>
    </div>
    <nav class="dta-nav">
      <a href="index.php">Home</a>
      <?php if (is_authenticated()): ?>
        <a href="studio.php" class="active">Studio</a>
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
      <!-- Library-specific canvas containers -->
      <canvas id="dta-canvas-three" style="display: none;"></canvas>
      <canvas id="dta-canvas-p5" style="display: none;"></canvas>
      <canvas id="dta-canvas-c2" style="display: none;"></canvas>
      <div id="dta-empty-state">
        <p>Select a library and add figures to begin</p>
      </div>
    </section>

    <!-- Controls Sidebar -->
    <aside id="dta-sidebar">

      <!-- Library Selector -->
      <div class="dta-control-group" style="border-left: 3px solid #c9922a;">
        <label for="dta-library-select">Rendering Library</label>
        <select id="dta-library-select" class="dta-select">
          <option value="three" selected>Three.js (3D)</option>

          <option value="p5">P5.js (2D Creative Coding)</option>
          <option value="c2">C2 (2D Canvas)</option>
        </select>
        <p class="dta-note" style="font-size: 12px; color: #8a8580; margin-top: 8px;">
          Choose a library per artwork. Switching changes the rendering approach.
        </p>
        
        <div class="dta-button-row" style="margin-top: 16px;">
          <button id="dta-export-btn" class="dta-btn">Export PNG</button>
        </div>
        
        <div class="dta-button-row">
          <button id="dta-save-artwork-btn" class="dta-btn dta-btn-primary">Save Artwork</button>
          <button id="dta-load-artwork-btn" class="dta-btn">Load Artwork</button>
          <button id="dta-new-artwork-btn" class="dta-btn">New Artwork</button>
        </div>
        <div class="dta-button-row">
          <button id="dta-delete-artwork-btn" class="dta-btn dta-btn-danger" style="display: none;">Delete Artwork</button>
        </div>
      </div>

      <!-- Figure Manager Panel -->
      <details id="dta-figures-section" class="dta-control-group" style="border-left: 3px solid #4a8fa8;" open>
        <summary>Figure Manager</summary>
        <div id="dta-figure-manager-container"></div>
      </details>

      <!-- Figure Properties Panel (appears when figure selected) -->
      <details id="dta-figure-properties-section" class="dta-control-group" style="border-left: 3px solid #4a8fa8; display: none;">
        <summary>Figure Properties</summary>
        <div id="dta-figure-properties-panel">
          <label for="dta-figure-name">Name</label>
          <input type="text" id="dta-figure-name" placeholder="Figure name">
          
          <label for="dta-figure-type">Type</label>
          <select id="dta-figure-type" class="dta-select">
            <option value="box">Box</option>
            <option value="sphere">Sphere</option>
            <option value="plane">Plane</option>
            <option value="cylinder">Cylinder</option>
            <option value="torus">Torus</option>
            <option value="cone">Cone</option>
          </select>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
            <div>
              <label for="dta-figure-x">Position X</label>
              <input type="number" id="dta-figure-x" step="0.1" value="0">
            </div>
            <div>
              <label for="dta-figure-y">Position Y</label>
              <input type="number" id="dta-figure-y" step="0.1" value="0">
            </div>
            <div>
              <label for="dta-figure-z">Position Z</label>
              <input type="number" id="dta-figure-z" step="0.1" value="0">
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
            <div>
              <label for="dta-figure-rotation-x">Rotation X</label>
              <input type="number" id="dta-figure-rotation-x" step="1" value="0">
            </div>
            <div>
              <label for="dta-figure-rotation-y">Rotation Y</label>
              <input type="number" id="dta-figure-rotation-y" step="1" value="0">
            </div>
            <div>
              <label for="dta-figure-rotation-z">Rotation Z</label>
              <input type="number" id="dta-figure-rotation-z" step="1" value="0">
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
            <div>
              <label for="dta-figure-scale-x">Scale X</label>
              <input type="number" id="dta-figure-scale-x" step="0.1" value="1">
            </div>
            <div>
              <label for="dta-figure-scale-y">Scale Y</label>
              <input type="number" id="dta-figure-scale-y" step="0.1" value="1">
            </div>
            <div>
              <label for="dta-figure-scale-z">Scale Z</label>
              <input type="number" id="dta-figure-scale-z" step="0.1" value="1">
            </div>
          </div>
          
          <label for="dta-figure-color" style="margin-top: 12px;">Color</label>
          <input type="color" id="dta-figure-color" value="#c9922a">
          
          <label for="dta-figure-opacity" style="margin-top: 12px;">Opacity</label>
          <input type="range" id="dta-figure-opacity" min="0" max="1" step="0.1" value="1">
          <span id="dta-figure-opacity-value">1.0</span>
        </div>
      </details>

      <!-- Palette Picker -->
      <div id="dta-palette-controls"></div>

      <!-- Artwork Metadata Panel -->
      <details id="dta-metadata-section" class="dta-control-group">
        <summary>Artwork Metadata</summary>
        <div id="dta-metadata-panel">
          <input type="hidden" id="dta-current-artwork-id" value="">
          <label for="dta-artwork-title">Title</label>
          <input type="text" id="dta-artwork-title" placeholder="Give your artwork a title">

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

          <button id="dta-save-metadata-btn" class="dta-btn dta-btn-primary" style="margin-top: 12px;">Save Metadata</button>
          <button id="dta-delete-artwork-btn" class="dta-btn dta-btn-danger" style="display:none; margin-top: 12px;">Delete Artwork</button>
          <div id="dta-save-status"></div>
        </div>
      </details>

      <!-- Available Controls -->
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

  <!-- Library Scripts (loaded dynamically by app.js when library is selected) -->
  <!-- Three.js and p5.js loaded on-demand -->

  <!-- Creatrweb 3D Art Modules -->
  <!-- Figure System -->
  <script src="src/figures/figure-base.js"></script>
  <script src="src/figures/figure-manager.js"></script>
  
  <!-- Library Renderers -->
  <script src="src/libraries/three.js"></script>
  <script src="src/libraries/p5.js"></script>
  <script src="src/libraries/c2.js"></script>
  
  <!-- Main App -->
  <script src="src/app.js"></script>

</body>
</html>
