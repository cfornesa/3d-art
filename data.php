<?php
/**
 * Creatrweb Data Art — Data Management Page
 *
 * Route: /data.php
 *
 * - If user is NOT authenticated, redirect to /login.php
 * - If user IS authenticated, render the data management UI
 *
 * This page handles dataset upload and deletion.
 * For artwork creation, use studio.php.
 */

require_once __DIR__ . '/config/bootstrap.php';

$current_page = 'data';

// ── Redirect unauthenticated users to login ────────────────────────────
if (!is_authenticated()) {
    header('Location: /login.php');
    exit;
}

$username = $_SESSION['username'] ?? $_SESSION['email'] ?? 'Owner';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Management — Creatrweb Data Art</title>
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
        <a href="studio.php">Studio</a>
        <a href="data.php" class="active">Data</a>
        <a href="portfolio.php">Portfolio</a>
        <a href="#" onclick="event.preventDefault(); logout(); toggleMobileNav();" class="dta-nav-logout">Log Out</a>
      <?php else: ?>
        <a href="portfolio.php">Portfolio</a>
      <?php endif; ?>
    </nav>
    <nav class="dta-mobile-nav">
      <a href="index.php">Home</a>
      <?php if (is_authenticated()): ?>
        <a href="studio.php">Studio</a>
        <a href="data.php" class="active">Data</a>
        <a href="portfolio.php">Portfolio</a>
        <a href="#" onclick="event.preventDefault(); logout(); toggleMobileNav();" class="dta-nav-logout">Log Out</a>
      <?php else: ?>
        <a href="portfolio.php">Portfolio</a>
      <?php endif; ?>
    </nav>
  </header>

  <!-- Error / Status Display -->
  <div id="dta-error-display"></div>

  <div id="dta-data-main" style="max-width: 800px; margin: 40px auto; padding: 0 20px;">
    <!-- Auth Status -->
    <div id="dta-auth-status" style="margin-bottom: 24px; font-size: 14px; color: #4a8fa8;">
      Logged in as <strong><?php echo htmlspecialchars($username, ENT_QUOTES, 'UTF-8'); ?></strong>
    </div>
    
    <!-- Upload Section -->
    <section id="dta-upload-section" class="dta-control-group">
      <h2>Upload New Dataset</h2>
      <label for="dta-file-upload">Select File (CSV, TSV, XLSX)</label>
      <input type="file" id="dta-file-upload" accept=".csv,.tsv,.xlsx">
      <div id="dta-upload-status"></div>
    </section>

    <!-- Dataset List Section -->
    <section id="dta-datasets-section" class="dta-control-group" style="margin-top: 24px;">
      <h2>Your Datasets</h2>
      <div id="dta-dataset-list">
        <!-- Dataset cards rendered by data-manager.js -->
      </div>
    </section>
    
  </div>

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

  <!-- Data Manager Script -->
  <script src="src/data-manager.js"></script>

</body>
</html>
