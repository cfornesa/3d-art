# Creatrweb 3D Art

A multi-library art generation studio for creating 2D and 3D artwork using Three.js, P5.js, and C2. Each artwork uses one rendering library and can compose up to 40 figures with layer-based controls. This is a retrofit of the original Creatrweb Data Art application, repurposed as a direct-creation tool for generative art.

## Project Overview

**Creatrweb 3D Art** is a single-phase creative workstation where users can:

- Select a rendering library (Three.js, P5.js, or C2) per artwork
- Create and manage up to 40 figures per piece with layer-based controls
- Configure figure properties, visibility, ordering, and duplication
- Save artwork configurations with thumbnail generation
- Share artworks via embeddable iframes that re-render from configuration
- View public artworks in a portfolio gallery with featured pieces highlighted

**Note:** A-Frame library support was removed in Session 23 due to persistent full-screen issues that could not be resolved.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript, Three.js (r128), P5.js (v1.4.2), C2 |
| Backend | PHP |
| Database | MySQL |
| CDN | jsDelivr (Three.js, P5.js), Cloudflare |
| Build Tools | None required |

---

## File Structure

```
/
├── index.php              # Public landing page with featured artworks
├── studio.php             # Protected art creation workspace (auth required)
├── portfolio.php          # Public gallery of all public artworks
├── exhibit.php            # Single artwork view with embed code support
├── login.php              # Standalone login page
├── data.php               # DEPRECATED - redirects to studio.php
│
├── api/
│   ├── apiFeeds.php       # GET — fetch external API data with caching
│   ├── artwork.php         # GET/POST/PATCH/DELETE — single artwork CRUD
│   ├── artworks.php        # GET — public artwork collection with filters
│   ├── datasets.php        # DEPRECATED — returns 410 Gone
│   ├── upload.php          # DEPRECATED — returns 410 Gone
│   └── auth/
│       ├── login.php      # POST — authenticate user
│       ├── logout.php     # POST — destroy session
│       ├── register.php   # POST — registration (disabled for single-owner)
│       └── session.php    # GET — current session state
│
├── src/
│   ├── app.js             # Main entry point, orchestrates all modules
│   ├── data-manager.js    # Data management utilities
│   │
│   ├── canvas/            # DEPRECATED canvas rendering modules
│   │   ├── artStyles.js    # Art style definitions
│   │   ├── renderer.js     # DEPRECATED - throws error, use(src/libraries/*) instead
│   │   └── styles/        # 14 pre-defined canvas art styles (deprecated)
│   │       ├── barCode.js, flowingCurves.js, fractalDust.js
│   │       ├── geometricGrid.js, heatMap.js, neuralFlow.js
│   │       ├── particleField.js, pixelMosaic.js, radialSymmetry.js
│   │       ├── radialWave.js, scatterMatrix.js, timeSeries.js
│   │       ├── voronoiCells.js
│   │
│   ├── controls/
│   │   ├── columnMapper.js  # Column mapping utilities (legacy)
│   │   ├── controls.js      # Main controls orchestrator
│   │   ├── palettePicker.js  # Color palette selection
│   │   └── visualDimensions.js # Visual dimension controls (legacy)
│   │
│   ├── data/
│   │   ├── dataMapper.js    # Data mapping utilities (legacy)
│   │   └── normalizer.js    # Data normalization (legacy)
│   │
│   ├── figures/
│   │   ├── figure-base.js   # Base figure properties and common interface
│   │   └── figure-manager.js # Core figure CRUD and layer management
│   │
│   ├── libraries/
│   │   ├── three.js        # Three.js rendering engine and figure types
│   │   ├── p5.js           # P5.js rendering engine and figure types
│   │   └── c2.js           # C2 rendering engine and figure types
│   │
│   └── vendor/
│       └── three/
│           └── OrbitControls.js  # Self-hosted Three.js OrbitControls
│
├── css/
│   └── app.css            # Main stylesheet (dark atelier palette)
│
├── config/
│   ├── bootstrap.php       # Session config, auth helpers, env.php require
│   ├── database.php        # PDO connection singleton
│   └── env.php            # Configuration constants (DB, APP, paths)
│
├── db/
│   ├── schema.sql         # Complete MySQL schema + seed data
│   └── migrations/
│       └── 2026_remove_aframe.php  # Migration removing A-Frame support
│
├── public/
│   └── assets/
│       └── thumbnails/     # Generated artwork thumbnail PNGs
│
└── docs/
    └── dependencies.md     # External and self-hosted dependency documentation
```

---

## Pages

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page with featured artworks, CTA to Studio |
| `/index.php` | Public | Same as / — landing page |
| `/studio.php` | Auth only | Art creation workspace with library selector + figure controls |
| `/portfolio.php` | Public | Gallery of all public artworks (featured first) |
| `/exhibit.php?id=N` | Public | Single artwork view with iframe embed code |
| `/exhibit.php?id=N&embed=true` | Public | Embed mode — minimal HTML with config-based re-rendering |
| `/login.php` | Guest only | Standalone login page |
| `/data.php` | N/A | **DEPRECATED** — redirects to /studio.php |

---

## Database Schema

Four tables in MySQL:

1. **users** — Account credentials (id, username, email, password_hash, is_active, created_at, updated_at)
2. **artworks** — Saved artwork state (id, user_id, title, library, figures, palette_config, library_config, tags, is_public, is_featured, thumbnail_path, created_at, updated_at)
3. **api_cache** — Cached API feed responses with TTL (id, source_url, source_name, response_data, cached_at, expires_at, etag, last_modified, http_status, access_count, last_accessed_at)

**Note:** The `figures` column stores a JSON array of figure configurations. Each figure includes library-specific properties for position, scale, rotation, color, opacity, and visibility. The `library_config` and `palette_config` columns also store JSON data.

**Removed tables (from Data Art):** datasets, dataset_columns, art_styles

---

## Core Features

### Library Selection
- Choose from three rendering libraries: Three.js (3D), P5.js (2D Creative Coding), or C2 (2D Canvas)
- Each artwork uses exactly one library (Constraint C-24)
- Library auto-selected when loading existing artwork
- Common figure management interface across all libraries
- A-Frame removed due to persistent full-screen issues

### Figure Management
- Create, edit, and delete figures (up to 40 per artwork — Constraint C-23, hard limit)
- Layer-based controls: show/hide, reorder (drag or buttons), duplicate
- Per-figure property editor with library-specific options
- Figure count indicator (X/40)
- Common base properties: name, type, position (x, y, z for 3D), rotation, scale, color, opacity, visibility, layer

#### Figure Types by Library

| Library | Available Figure Types |
|---------|------------------------|
| Three.js | box, sphere, plane, cylinder, torus, cone |
| P5.js | rect, ellipse, polygon, line, point, arc, star, triangle |
| C2 | rectangle, ellipse, line, point, star, polygon |

### Art Rendering
- Each library provides its own figure types and rendering capabilities
- **Three.js**: 3D graphics with WebGL, OrbitControls for camera manipulation
- **P5.js**: 2D graphics and creative coding with familiar p5 API
- **C2**: 2D canvas rendering (custom implementation)
- Thumbnail generation on create and update for index/portfolio display
- Canvas area uses pure black background (`#0d0d0d`) so artwork glows

### Save & Share
- Save artwork configuration (library, figures, palette, tags, metadata)
- Thumbnail generation for gallery display (Constraint C-26: thumbnails used for display only, not for embeds)
- Public/Featured visibility flags for portfolio and landing page
- Tags support (comma-separated)
- iFrame embed code that re-renders artwork from configuration (Constraint C-25)
- Embed mode hides all non-visual elements, shows only the canvas

### API Feed Caching
- Fetch external API data with MySQL TTL caching
- Cache TTL configurable via `API_CACHE_TTL_SECONDS` constant
- Cached responses include ETag and Last-Modified headers
- Access count tracking for cache analytics

---

## Deprecated Features

The following features from Creatrweb Data Art have been removed:

| Feature | Replacement | Notes |
|---------|-------------|-------|
| Data file upload (CSV/TSV/XLSX) | Direct figure configuration | Metadata for data upload removed from env.php |
| Dataset management | Direct figure configuration | datasets, dataset_columns tables removed |
| Art styles | Direct figure configuration | art_styles table removed |
| A-Frame library support | Three.js, P5.js, C2 | Removed due to full-screen issues |
| Canvas renderer | Library-based renderers | src/canvas/renderer.js throws error |
| Column mapping | Direct figure properties | columnMapper.js kept for legacy |
| Data normalization | Direct figure properties | normalizer.js kept for legacy |

**Deprecated endpoints (return 410 Gone):**
- `GET/POST /api/datasets.php`
- `GET/POST /api/upload.php`

**Deprecated pages (redirect):**
- `/data.php` → `/studio.php`

---

## Design Identity

Dark atelier palette (from `DESIGN.md`):
- **Ground**: `#1c1814` (deep warm near-black)
- **Panel surfaces**: `#242018` (slightly lighter warm dark)
- **Canvas**: `#0d0d0d` (pure black — artwork glows against it)
- **Gold accent**: `#c9922a`
- **Slate-teal accent**: `#4a8fa8`
- **Off-white text**: `#f0ece4`

Hard offset shadows (`4px 4px 0px`), no gradients on UI surfaces, no soft drop shadows. System-UI typography stack. No external font requests.

**Key design principles:**
- Canvas as hero, controls as instruments
- Workstation metaphor
- No SaaS visual language
- Authenticity traceable to specific person's practice

See `DESIGN.md` for full creative identity document.

---

## Constraints

Key non-negotiable rules (see `CONSTRAINTS.md` for full list):

| Constraint | Description |
|------------|-------------|
| **C-01** | No external font network requests — system-UI stack only |
| **C-02** | No gradients, soft shadows, or SaaS visual language on UI surfaces |
| **C-03** | Canvas output is exempt from visual constraints (user-generated content) |
| **C-23** | Maximum 40 figures per artwork — hard limit |
| **C-24** | Each artwork uses exactly one rendering library |
| **C-25** | Embedded artworks must re-render from configuration on each view |
| **C-26** | Thumbnails used for display only (index/portfolio) — not for embeds |

---

## Configuration

Copy `env.example` to `.env` and set required variables:

```bash
cp env.example .env
```

Key configuration constants (defined in `config/env.php`):

### Application Settings
- `APP_ENV` — development / production
- `APP_DEBUG` — enable detailed error output
- `APP_URL` — public URL of the application

### Database
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` — database connection parameters

### Session
- `SESSION_NAME` — session name for cookies
- `SESSION_LIFETIME` — session lifetime in seconds (86400 = 24 hours)

### Artwork
- `ARTWORK_THUMBNAIL_DIR` — thumbnail storage directory (relative to project root)
- `ARTWORK_THUMBNAIL_URL` — thumbnail URL path
- `ARTWORK_DEFAULT_IS_PUBLIC` — default visibility (0 = private)
- `ARTWORK_DEFAULT_IS_FEATURED` — default featured status (0 = not featured)

### Limits
- `MAX_FIGURES` — maximum figures per artwork (default: 40)
- `VALID_LIBRARIES` — array of supported libraries: `['three', 'p5', 'c2']`
- `PORTFOLIO_FEATURED_LIMIT` — number of featured pieces on homepage (default: 3)
- `PORTFOLIO_ITEMS_PER_PAGE` — items per page in portfolio (default: 12)

### API Cache
- `API_CACHE_TTL_SECONDS` — default cache TTL (default: 3600 = 1 hour)

### Deprecated (kept for reference)
- `UPLOAD_MAX_BYTES`, `UPLOAD_ALLOWED_MIME`, `UPLOAD_ALLOWED_EXT`, `UPLOAD_DIR`
- `COLUMN_SAMPLE_COUNT`

---

## Setup

### Prerequisites
- PHP 7.4 or higher
- MySQL 5.7 or higher (MySQL 8 recommended)
- Web server (Apache, Nginx, etc.)
- Node.js (for development, optional — CDN libraries used in production)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd creatrweb-3d-art
   ```

2. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

3. **Create database and run schema**
   ```bash
   mysql -u root -p -e "CREATE DATABASE creatrweb_3d_art;"
   mysql -u root -p creatrweb_3d_art < db/schema.sql
   ```

4. **Create user (optional)**
   The schema includes a commented INSERT for the owner user. Uncomment and modify in `db/schema.sql` before importing, or insert manually:
   ```sql
   INSERT INTO users (username, email, password_hash, is_active) 
   VALUES ('owner', 'owner@example.com', '$2y$12$...', 1);
   ```

5. **Configure web server**
   Point your web server document root to the project root directory.

6. **Set permissions**
   Ensure the thumbnail directory is writable by the web server:
   ```bash
   mkdir -p public/assets/thumbnails
   chmod 755 public/assets/thumbnails
   ```

7. **Access the application**
   - Public pages: `/`, `/portfolio.php`, `/exhibit.php?id=N`
   - Authenticated pages: `/studio.php` (requires login), `/login.php`

---

## Authentication

**Single-owner mode**: Public registration is disabled. Users must be manually created in the database.

- Login via `/login.php` with database credentials
- Session managed via PHP sessions (`SESSION_NAME`, `SESSION_LIFETIME`)
- Auth check: `is_authenticated()` function in `config/bootstrap.php`

---

## API Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/login.php` | POST | No | Authenticate user (returns session) |
| `/api/auth/logout.php` | POST | Yes | Destroy session |
| `/api/auth/session.php` | GET | No | Get current session state |
| `/api/auth/register.php` | POST | No | **DISABLED** — registration not supported |
| `/api/artwork.php` | GET | Optional | Get single artwork (public if is_public=1, else owned) |
| `/api/artwork.php` | POST | Yes | Create new artwork |
| `/api/artwork.php` | PATCH | Yes | Update artwork |
| `/api/artwork.php` | DELETE | Yes | Delete user-owned artwork |
| `/api/artworks.php` | GET | No | List public artworks with filters |
| `/api/apiFeeds.php` | GET | Yes | Fetch external API data with caching |
| `/api/datasets.php` | GET/POST | No | **DEPRECATED** — returns 410 Gone |
| `/api/upload.php` | POST | No | **DEPRECATED** — returns 410 Gone |

### API Query Parameters

**`/api/artworks.php`:**
- `?filter=featured` — return only featured public artworks
- `?filter=public` — return all public artworks (default)
- `?limit=N` — limit results (max 100, default: PORTFOLIO_ITEMS_PER_PAGE)
- `?offset=N` — pagination offset

**`/api/artwork.php`:**
- `?id=N` — get/update/delete specific artwork

**`/api/apiFeeds.php`:**
- `?source_url=URL` — (required) URL of API to fetch
- `?source_name=NAME` — (required) human-readable name for the source

---

## External Dependencies

| Library | CDN URL | Self-Hosted | Purpose |
|---------|---------|-------------|---------|
| Three.js | `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js` | No | 3D WebGL rendering |
| P5.js | `https://cdn.jsdelivr.net/npm/p5@1.4.2/lib/p5.min.js` | No | 2D creative coding |
| OrbitControls | N/A | `src/vendor/three/OrbitControls.js` | Three.js camera controls |

See `docs/dependencies.md` for full dependency documentation.

---

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (Chrome, Safari iOS)

**Requirements:**
- ES6 support
- WebGL support (for Three.js)
- Canvas support (for P5.js and C2)

---

## Development

### Running locally
```bash
# Start PHP built-in server
php -S localhost:8000

# Or use Docker
# See docker-compose.yml if available
```

### Enable debug mode
Add to `.env`:
```
APP_ENV=development
APP_DEBUG=true
```

Or append to URL: `?debug=true`

### Debugging
- Console output includes `[Creatrweb3D.App]` prefix when debug enabled
- PHP errors shown when `APP_DEBUG=true`
- Check `error_log` for server-side issues

---

## Testing

### Manual Testing
1. Create artwork in studio with each library (three, p5, c2)
2. Add 40 figures to verify hard limit
3. Test embed mode for each artwork
4. Verify public/private visibility
5. Test thumbnail generation

### API Testing
```bash
# List public artworks
curl -i http://localhost:8000/api/artworks.php

# Get single artwork
curl -i http://localhost:8000/api/artwork.php?id=1

# Create artwork (requires auth)
curl -X POST http://localhost:8000/api/artwork.php \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","library":"three","figures":[]}'
```

---

## Deployment

### Production Checklist
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] Database configured and schema imported
- [ ] Thumbnail directory created and writable
- [ ] Session directory writable (if using file-based sessions)
- [ ] SSL certificate installed (HTTPS recommended)

### Deployment Commands
```bash
# Pull latest changes
git pull origin main

# Run database migrations (if any)
# php db/migrations/<migration>.php

# Clear caches (if applicable)
# rm -rf cache/*

# Restart web server
# systemctl restart apache2
# or: systemctl restart nginx
```

---

## Migration Notes

### From Creatrweb Data Art
The following changes were made during the retrofit:

1. **Removed tables**: datasets, dataset_columns, art_styles
2. **Added columns to artworks**: library, figures, library_config
3. **Removed columns from artworks**: dataset_id, art_style_id, column_mapping, rendering_config, mode, visual_dimensions
4. **Removed library**: A-Frame (due to full-screen issues)
5. **Added feature**: Direct figure configuration
6. **Added feature**: Embed mode for exhibit pages
7. **Added feature**: API feed caching

See `DECISIONS.md` for detailed migration decisions.

---

## License

Creatrweb 3D Art application code: Proprietary (single-owner)

External libraries maintain their original licenses:
- Three.js: MIT License
- P5.js: LGPL-2.1 License
- OrbitControls: MIT License (part of Three.js)

---

## Contacts & Resources

- **Author**: Fornesus
- **Website**: https://creatrweb.com
- **Portfolio**: https://fornesusart.com

## Documentation Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | Agent instructions and constraints |
| `CONSTRAINTS.md` | Full constraint documentation |
| `DECISIONS.md` | Architectural decisions and history |
| `DESIGN.md` | Creative identity and design system |
| `MEMORY.md` | Session memory and observations |
| `PROMPTS.md` | Current prompt and session context |
| `docs/dependencies.md` | External and internal dependencies |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-XX | Initial Creatrweb 3D Art retrofit (from Creatrweb Data Art) |

---

*Built with open-source AI tools and models: Vibe CLI, Kilo Code, Opencode Go.*
