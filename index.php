<?php
/**
 * Creatrweb Data Art — Public Landing Page
 *
 * Route: /
 * 
 * - Show public landing page with featured artworks
 * - Authenticated users can access Studio and Data via navigation
 */

require_once __DIR__ . '/config/bootstrap.php';
require_once __DIR__ . '/config/env.php';

$current_page = 'home';

// No redirect - allow both authenticated and unauthenticated users
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Creatrweb Data Art</title>
  <link rel="stylesheet" href="css/app.css">
  <script>
    var DTA_CONFIG = {
      thumbnailUrl: '<?php echo ARTWORK_THUMBNAIL_URL; ?>'
    };
  </script>
  <style>
    /* Landing page specific styles */
    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    #dta-landing-main {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    
    #dta-landing-header {
      margin-bottom: 24px;
    }
    
    /* Landing header is now replaced by nav in header */
    #dta-landing-header h1 {
      display: none;
    }
    
    #dta-landing-header h1 {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #f0ece4;
      border-bottom: 2px solid #c9922a;
      padding-bottom: 12px;
      display: inline-block;
    }
    
    #dta-landing-description {
      max-width: 600px;
      margin: 0 auto 48px;
      font-size: 18px;
      line-height: 1.8;
      color: #a0a0a0;
    }
    
    #dta-landing-actions {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .dta-cta-btn {
      display: inline-block;
      padding: 16px 32px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border: none;
      border-radius: 0;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    
    .dta-cta-btn-primary {
      background: #c9922a;
      color: #1c1814;
    }
    
    .dta-cta-btn-primary:hover {
      background: #a67a22;
    }
    
    .dta-cta-btn-secondary {
      background: #242018;
      color: #f0ece4;
      border: 2px solid #c9922a;
    }
    
    .dta-cta-btn-secondary:hover {
      background: #322c24;
    }
    
    #dta-landing-features {
      max-width: 600px;
      margin: 48px auto 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
      text-align: left;
    }
    
    .dta-feature-card {
      background: #242018;
      padding: 24px;
      border: 1px solid #2a2a2a;
      box-shadow: 4px 4px 0px #000000;
    }
    
    .dta-feature-card h3 {
      font-size: 16px;
      font-weight: 700;
      color: #c9922a;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .dta-feature-card p {
      font-size: 14px;
      color: #a0a0a0;
      line-height: 1.6;
    }
    
    #dta-featured-section {
      max-width: 800px;
      margin: 64px auto 48px;
      text-align: center;
    }
    
    #dta-featured-section h2 {
      font-size: 24px;
      font-weight: 700;
      color: #c9922a;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    
    #dta-featured-section p {
      color: #8a8580;
      margin-bottom: 24px;
      font-size: 15px;
    }
    
    #dta-featured-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 24px;
    }

    /* Mobile: force single column */
    @media (max-width: 500px) {
      #dta-featured-grid {
        grid-template-columns: 1fr;
      }
    }

    .dta-featured-card {
      background: #242018;
      border: 1px solid #2a2a2a;
      box-shadow: 4px 4px 0px #000000;
      overflow: hidden;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .dta-featured-card:hover {
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0px #000000;
    }
    
    .dta-featured-thumbnail {
      width: 100%;
      height: 180px;
      background: #0d0d0d;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    .dta-featured-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    
    .dta-featured-thumbnail .dta-placeholder {
      color: #555;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      text-align: center;
      padding: 16px;
    }
    
    .dta-featured-info {
      padding: 16px;
    }
    
    .dta-featured-info h3 {
      font-size: 15px;
      font-weight: 600;
      color: #f0ece4;
      margin-bottom: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .dta-featured-info p {
      font-size: 13px;
      color: #8a8580;
      line-height: 1.5;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .dta-featured-empty {
      background: #242018;
      border: 1px solid #2a2a2a;
      box-shadow: 4px 4px 0px #000000;
      padding: 48px 24px;
      grid-column: 1 / -1;
    }
    
    .dta-featured-empty p {
      color: #606060;
      font-style: italic;
      margin: 0;
    }
    
    #dta-landing-footer {
      padding: 24px;
      font-size: 12px;
      color: #606060;
      text-align: center;
      border-top: 1px solid #2a2a2a;
    }
  </style>
</head>
<body>

  <!-- Header with Navigation -->
  <header id="dta-header">
    <div class="dta-header-title">
      <h1><a href="/portfolio.php">Creatrweb Data Art</a></h1>
      <button class="dta-hamburger" onclick="toggleMobileNav()" aria-label="Menu">☰</button>
    </div>
    <nav class="dta-nav">
      <a href="index.php" class="active">Home</a>
      <?php if (is_authenticated()): ?>
        <a href="studio.php">Studio</a>
        <a href="data.php">Data</a>
        <a href="portfolio.php">Portfolio</a>
        <a href="#" onclick="event.preventDefault(); logout(); toggleMobileNav();" class="dta-nav-logout">Log Out</a>
      <?php else: ?>
        <a href="portfolio.php">Portfolio</a>
      <?php endif; ?>
    </nav>
    <nav class="dta-mobile-nav">
      <a href="index.php" class="active">Home</a>
      <?php if (is_authenticated()): ?>
        <a href="studio.php">Studio</a>
        <a href="data.php">Data</a>
        <a href="portfolio.php">Portfolio</a>
        <a href="#" onclick="event.preventDefault(); logout(); toggleMobileNav();" class="dta-nav-logout">Log Out</a>
      <?php else: ?>
        <a href="portfolio.php">Portfolio</a>
      <?php endif; ?>
    </nav>
  </header>

  <!-- Landing Page Content -->
  <main id="dta-landing-main">
    <div id="dta-landing-header">
      <h1>Creatrweb Data Art</h1>
    </div>

    <p id="dta-landing-description">
      This is a personal data art workstation where I transform datasets that matter to me into generative art pieces. All data is beautiful and so are their expressions, whether abstract or informative.
    </p>

    <!-- Featured Pieces Section -->
    <section id="dta-featured-section">
      <h2>Featured Pieces</h2>
      <p>Selected works from the collection</p>
      <div id="dta-featured-grid">
        <!-- Featured artworks will be loaded dynamically -->
      </div>
    </section>

    <p id="dta-landing-description">
      The point of these pieces are not to meaningfully reflect the data but, rather, to experiment with different creative manifestations of visualizing data. This is data art, not data visualization.
    </p>
  </main>

  <footer id="dta-landing-footer">
    <p>Creatrweb Data Art: My data art workstation. Copyright (c) <?php echo date('Y'); ?> <a href="https://creatrweb.com" style="color:#606060;" target="_blank">Fornesus</a>.</p>
    <p>Developed with open-source AI tools and models, such as: Vibe CLI, Kilo Code, and Opencode Go.</p>
    <p><a href="portfolio.php" style="color:#606060;">View all public artworks</a>.</p>
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
    
    // Load featured artworks on page load
    document.addEventListener('DOMContentLoaded', function() {
      loadFeaturedArtworks();
    });

    function loadFeaturedArtworks() {
      var grid = document.getElementById('dta-featured-grid');
      if (!grid) return;

      fetch('api/artworks.php?filter=featured')
        .then(function(response) {
          if (!response.ok) {
            throw new Error('Failed to load featured artworks');
          }
          return response.json();
        })
        .then(function(data) {
          if (data.success && data.artworks && data.artworks.length > 0) {
            displayFeaturedArtworks(data.artworks);
          } else {
            showFeaturedEmptyState();
          }
        })
        .catch(function(err) {
          console.error('Error loading featured artworks:', err);
          showFeaturedEmptyState();
        });
    }

    function displayFeaturedArtworks(artworks) {
      var grid = document.getElementById('dta-featured-grid');
      if (!grid) return;

      grid.innerHTML = '';

      artworks.forEach(function(artwork) {
        var card = document.createElement('div');
        card.className = 'dta-featured-card';

        // Thumbnail section
        var thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = 'dta-featured-thumbnail';

        if (artwork.thumbnail_path) {
          var img = document.createElement('img');
          img.src = DTA_CONFIG.thumbnailUrl + artwork.thumbnail_path.split('/').pop();
          img.alt = artwork.title || 'Artwork thumbnail';
          thumbnailDiv.appendChild(img);
        } else {
          var placeholder = document.createElement('div');
          placeholder.className = 'dta-placeholder';
          placeholder.textContent = 'No thumbnail available';
          thumbnailDiv.appendChild(placeholder);
        }

        card.appendChild(thumbnailDiv);

        // Info section
        var infoDiv = document.createElement('div');
        infoDiv.className = 'dta-featured-info';

        var titleEl = document.createElement('h3');
        titleEl.textContent = artwork.title || 'Untitled';
        infoDiv.appendChild(titleEl);

        var descEl = document.createElement('p');
        descEl.textContent = (artwork.description && artwork.description.length > 100) 
          ? artwork.description.substring(0, 100) + '…' 
          : (artwork.description || 'No description') ;
        infoDiv.appendChild(descEl);

        card.appendChild(infoDiv);

        // Link to exhibit page
        var link = document.createElement('a');
        link.href = 'exhibit.php?id=' + artwork.id;
        link.style.cssText = 'display:block; text-decoration:none; color:inherit;';
        link.appendChild(card);

        grid.appendChild(link);
      });
    }

    function showFeaturedEmptyState() {
      var grid = document.getElementById('dta-featured-grid');
      if (!grid) return;

      grid.innerHTML = '<div class="dta-featured-empty"><p>No featured pieces yet</p></div>';
    }
  </script>

</body>
</html>
