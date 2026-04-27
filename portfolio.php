<?php
/**
 * Creatrweb Data Art — Portfolio Page
 *
 * Public page showing all public artworks, with featured pieces first.
 * Route: /portfolio.php
 */

require_once __DIR__ . '/config/bootstrap.php';
require_once __DIR__ . '/config/env.php';

// No-cache: ensure updated artworks are always visible
header('Cache-Control: no-cache, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

$current_page = 'portfolio';

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio — Creatrweb Data Art</title>
  <link rel="stylesheet" href="css/app.css">
  <script>
    var DTA_CONFIG = {
      thumbnailUrl: '<?php echo ARTWORK_THUMBNAIL_URL; ?>'
    };
  </script>
  <style>
    /* Portfolio page specific styles */
    #dta-portfolio-header {
      display: none;
    }
    /* Portfolio page specific styles */
    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    #dta-portfolio-header {
      background: #242018;
      border-bottom: 2px solid #c9922a;
      box-shadow: 4px 4px 0px #000000;
      padding: 16px 24px;
    }

    #dta-portfolio-header h1 {
      font-size: 20px;
      font-weight: 700;
      color: #f0ece4;
      letter-spacing: 0.05em;
      margin: 0;
    }

    #dta-portfolio-main {
      flex: 1 1 auto;
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    #dta-portfolio-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .dta-portfolio-card {
      background: #242018;
      border: 1px solid #2a2a2a;
      box-shadow: 4px 4px 0px #000000;
      overflow: hidden;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .dta-portfolio-card:hover {
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0px #000000;
    }

    .dta-portfolio-thumbnail {
      width: 100%;
      height: 200px;
      background: #0d0d0d;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .dta-portfolio-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .dta-portfolio-thumbnail .dta-placeholder {
      color: #555;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      text-align: center;
      padding: 16px;
    }

    .dta-portfolio-info {
      padding: 16px;
    }

    .dta-portfolio-info h3 {
      font-size: 16px;
      font-weight: 600;
      color: #f0ece4;
      margin: 0 0 8px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dta-portfolio-info p {
      font-size: 13px;
      color: #8a8580;
      line-height: 1.5;
      margin: 0 0 8px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .dta-portfolio-tags {
      font-size: 12px;
      color: #606060;
      margin-top: 8px;
    }

    .dta-portfolio-featured-badge {
      display: inline-block;
      background: #c9922a;
      color: #1c1814;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }

    .dta-portfolio-empty {
      background: #242018;
      border: 1px solid #2a2a2a;
      box-shadow: 4px 4px 0px #000000;
      padding: 48px 24px;
      text-align: center;
    }

    .dta-portfolio-empty p {
      color: #606060;
      font-style: italic;
      margin: 0;
    }

    #dta-portfolio-footer {
      padding: 24px;
      font-size: 12px;
      color: #606060;
      text-align: center;
      border-top: 1px solid #2a2a2a;
      margin-top: 48px;
    }

    @media (max-width: 768px) {
      #dta-portfolio-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
      }
    }
  </style>
</head>
<body>

  <!-- Header with Navigation -->
  <header id="dta-header">
    <div class="dta-header-title">
      <h1><a href="/index.php">Creatrweb Data Art</a></h1>
      <button class="dta-hamburger" onclick="toggleMobileNav()" aria-label="Menu">☰</button>
    </div>
    <nav class="dta-nav">
      <a href="index.php">Home</a>
      <?php if (is_authenticated()): ?>
        <a href="studio.php">Studio</a>
        <a href="data.php">Data</a>
        <a href="portfolio.php" class="active">Portfolio</a>
        <a href="#" onclick="event.preventDefault(); logout(); toggleMobileNav();" class="dta-nav-logout">Log Out</a>
      <?php else: ?>
        <a href="portfolio.php" class="active">Portfolio</a>
      <?php endif; ?>
    </nav>
    <nav class="dta-mobile-nav">
      <a href="index.php">Home</a>
      <?php if (is_authenticated()): ?>
        <a href="studio.php">Studio</a>
        <a href="data.php">Data</a>
        <a href="portfolio.php" class="active">Portfolio</a>
        <a href="#" onclick="event.preventDefault(); logout(); toggleMobileNav();" class="dta-nav-logout">Log Out</a>
      <?php else: ?>
        <a href="portfolio.php" class="active">Portfolio</a>
      <?php endif; ?>
    </nav>
  </header>

  <main id="dta-portfolio-main">
    <h2 style="color:#c9922a; font-size:18px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.05em;">
      Public Artworks
    </h2>
    <p style="color:#8a8580; margin-bottom:32px;">
      Featured pieces appear first, followed by all other public works.
    </p>

    <div id="dta-portfolio-grid">
      <!-- Artworks loaded dynamically -->
    </div>
  </main>

  <footer id="dta-portfolio-footer">
    <p>Creatrweb Data Art: My data art workstation. Copyright (c) <?php echo date('Y'); ?> <a href="https://creatrweb.com" style="color:#606060;" target="_blank">Fornesus</a>.</p>
    <p>Developed with open-source AI tools and models: Vibe CLI, Kilo Code, Opencode Go.</p>
    <p><a href="index.php" style="color:#606060;">Back to Home</a>.</p>
  </footer>

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
    
    document.addEventListener('DOMContentLoaded', function() {
      loadPortfolioArtworks();
    });

    function loadPortfolioArtworks() {
      var grid = document.getElementById('dta-portfolio-grid');
      if (!grid) return;

      fetch('api/artworks.php?filter=public')
        .then(function(response) {
          if (!response.ok) {
            throw new Error('Failed to load portfolio artworks');
          }
          return response.json();
        })
        .then(function(data) {
          if (data.success && data.artworks && data.artworks.length > 0) {
            displayPortfolioArtworks(data.artworks);
          } else {
            showPortfolioEmptyState();
          }
        })
        .catch(function(err) {
          console.error('Error loading portfolio:', err);
          showPortfolioEmptyState();
        });
    }

    function displayPortfolioArtworks(artworks) {
      var grid = document.getElementById('dta-portfolio-grid');
      if (!grid) return;

      grid.innerHTML = '';

      artworks.forEach(function(artwork) {
        var card = document.createElement('div');
        card.className = 'dta-portfolio-card';

        // Thumbnail section
        var thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = 'dta-portfolio-thumbnail';

        if (artwork.thumbnail_path) {
          var img = document.createElement('img');
          img.src = DTA_CONFIG.thumbnailUrl + artwork.thumbnail_path.split('/').pop();
          img.alt = artwork.title || 'Artwork thumbnail';
          thumbnailDiv.appendChild(img);
        } else {
          var placeholder = document.createElement('div');
          placeholder.className = 'dta-placeholder';
          placeholder.textContent = 'No thumbnail';
          thumbnailDiv.appendChild(placeholder);
        }

        card.appendChild(thumbnailDiv);

        // Info section
        var infoDiv = document.createElement('div');
        infoDiv.className = 'dta-portfolio-info';

        // Featured badge
        if (artwork.is_featured == 1) {
          var badge = document.createElement('span');
          badge.className = 'dta-portfolio-featured-badge';
          badge.textContent = 'Featured';
          infoDiv.appendChild(badge);
          infoDiv.appendChild(document.createElement('br'));
        }

        var titleEl = document.createElement('h3');
        titleEl.textContent = artwork.title || 'Untitled';
        infoDiv.appendChild(titleEl);

        var descEl = document.createElement('p');
        descEl.textContent = (artwork.description && artwork.description.length > 140)
          ? artwork.description.substring(0, 140) + '…'
          : (artwork.description || 'No description');
        infoDiv.appendChild(descEl);

        // Tags
        if (artwork.tags) {
          var tagsEl = document.createElement('div');
          tagsEl.className = 'dta-portfolio-tags';
          tagsEl.textContent = artwork.tags;
          infoDiv.appendChild(tagsEl);
        }

        card.appendChild(infoDiv);

        // Link to exhibit page
        var link = document.createElement('a');
        link.href = 'exhibit.php?id=' + artwork.id;
        link.style.cssText = 'display:block; text-decoration:none; color:inherit;';
        link.appendChild(card);

        grid.appendChild(link);
      });
    }

    function showPortfolioEmptyState() {
      var grid = document.getElementById('dta-portfolio-grid');
      if (!grid) return;

      grid.innerHTML = '<div class="dta-portfolio-empty"><p>No public artworks yet</p></div>';
    }
  </script>

</body>
</html>
