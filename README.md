# Creatrweb Data Art

A personal data art workstation for transforming datasets into generative art. Upload CSVs, TSVs, or XLSX files, map columns to visual dimensions, choose from 13 rendering styles, and compose unique artwork. This was a partnership with myself (the human) and AI (Opencode Go and Vibe CLI) using the <a href="https://github.com/cfornesa/creatrweb">Creatrweb framework</a>.

## Project Overview

**Creatrweb Data Art** is a two-phase project:

- **Phase 1** — Core Workstation: Data ingest (CSV/TSV/XLSX), HTML5 Canvas renderer with 13 art styles, full creative controls, PNG export.
- **Phase 2** — Accounts, Save & Share: User authentication, persistent artwork storage, public gallery.

Currently Phase 1 is complete with Phase 2 features partially implemented (auth system in place, save/load working, portfolio and exhibit pages built).

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript (HTML5 Canvas API) |
| Backend | PHP |
| Database | MySQL |
| Build Tools | None required |

---

## File Structure

```
/
├── index.php              # Landing page with featured artworks
├── studio.php             # Protected art creation workspace
├── portfolio.php          # Public gallery of all public artworks
├── exhibit.php            # Single artwork view with embed code
├── data.php               # Dataset management (upload/delete)
├── login.php              # Standalone login page
│
├── api/
│   ├── auth/
│   │   ├── login.php      # POST — authenticate user
│   │   ├── logout.php     # POST — destroy session
│   │   ├── register.php  # POST — registration (disabled for single-owner)
│   │   └── session.php   # GET — current session state
│   ├── artworks.php       # GET — public artwork collection with filters
│   ├── artwork.php        # GET/POST/PATCH/DELETE — single artwork CRUD
│   ├── datasets.php       # GET/POST/DELETE — dataset management
│   ├── upload.php         # POST — file upload with sanitization
│   └── apiFeeds.php      # GET — API feed caching
│
├── src/
│   ├── app.js             # Main entry point, orchestrates all modules
│   ├── data-manager.js     # Dataset CRUD UI logic
│   ├── data/
│   │   ├── normalizer.js  # Column type detection (number/date/boolean/string)
│   │   └── dataMapper.js  # Data cleaning and row filtering
│   ├── canvas/
│   │   ├── renderer.js     # Canvas rendering orchestrator
│   │   ├── artStyles.js    # Style registry (13 styles)
│   │   └── styles/
│   │       ├── particleField.js
│   │       ├── geometricGrid.js
│   │       ├── flowingCurves.js
│   │       ├── radialWave.js
│   │       ├── fractalDust.js
│   │       ├── neuralFlow.js
│   │       ├── pixelMosaic.js
│   │       ├── voronoiCells.js
│   │       ├── radialSymmetry.js
│   │       ├── timeSeries.js
│   │       ├── heatMap.js
│   │       ├── scatterMatrix.js
│   │       └── barCode.js
│   └── controls/
│       ├── controls.js       # Main controls orchestrator
│       ├── columnMapper.js  # Dataset column → visual dimension mapping
│       ├── palettePicker.js  # Color palette selection
│       └── visualDimensions.js  # Manual mode sliders (X/Y/Size/Opacity/Rotation)
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
│   └── schema.sql         # Complete MySQL schema + seed data
│
├── uploads/               # User-uploaded data files
└── public/assets/thumbnails/  # Generated artwork thumbnail PNGs
```

---

## Pages

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page with featured artworks |
| `/studio.php` | Auth only | Art creation workspace with canvas + controls |
| `/portfolio.php` | Public | Gallery of all public artworks |
| `/exhibit.php?id=N` | Public | Single artwork view with iframe embed code |
| `/data.php` | Auth only | Dataset upload and management |
| `/login.php` | Guest only | Standalone login page |

---

## Database Schema

Six tables in MySQL:

1. **users** — Account credentials (id, username, email, password_hash, is_active)
2. **datasets** — Normalized datasets with sanitization status tracking (id, user_id, source_type, source_name, storage_path, row_count, is_sanitized)
3. **dataset_columns** — Column metadata per dataset (id, dataset_id, column_name, data_type, sample_values)
4. **art_styles** — Enumerated rendering modes (id, style_key, display_name, default_config)
5. **artworks** — Saved artwork state (id, user_id, dataset_id, art_style_id, title, column_mapping, palette_config, rendering_config, mode, visual_dimensions, tags, is_public, is_featured, thumbnail_path)
6. **api_cache** — Cached API feed responses with TTL (id, source_url, response_data, expires_at)

---

## Core Features

### Data Ingest Pipeline
- Upload CSV, TSV, or XLSX files (UUID-based filenames, server-side MIME validation)
- Column type inference: string → number → date → boolean priority
- C-04 compliant sanitization before any processing

### Art Rendering
- 13 distinct art styles (Particle Field, Geometric Grid, Flowing Curves, Radial Wave, Fractal Dust, Neural Flow, Pixel Mosaic, Voronoi Cells, Radial Symmetry, Time Series, Heat Map, Scatter Matrix, Bar Code)
- Hybrid mode architecture:
  - **Data-Driven Mode**: Map dataset columns to visual dimensions (X, Y, Size, Color, Opacity, Rotation)
  - **Manual Mode**: Set explicit numeric values via sliders (X, Y, Size, Opacity, Rotation) — palette colors only
- PNG export via `canvas.toBlob()`

### Save & Share
- Save artwork state (POST creates, PATCH updates)
- Thumbnail generation on both create and update
- Public/Featured visibility flags
- Tags support (VARCHAR comma-separated)
- iFrame embed code for external display

---

## Design Identity

Dark atelier palette:
- Ground: `#1c1814` (deep warm near-black)
- Panel surfaces: `#242018` (slightly lighter warm dark)
- Canvas: `#0d0d0d` (pure black — artwork glows against it)
- Gold accent: `#c9922a`
- Teal accent: `#4a8fa8`
- Off-white text: `#f0ece4`

Hard offset shadows (`4px 4px 0px`), no gradients on UI surfaces, no soft drop shadows. System-UI typography stack.

See `DESIGN.md` for full creative identity document.

---

## Configuration

Copy `env.example` to `.env` and set required variables:

```bash
cp env.example .env
```

Key configuration constants (defined in `config/env.php`):
- `APP_ENV` — development / production
- `APP_DEBUG` — enable detailed error output
- `APP_URL` — public URL of the application
- `DB_*` — database connection parameters
- `UPLOAD_*` — upload size limits and allowed extensions
- `SESSION_*` — session name and lifetime
- `ARTWORK_THUMBNAIL_DIR` / `ARTWORK_THUMBNAIL_URL` — thumbnail storage

---

## Setup

1. Clone the repository
2. Copy `env.example` to `.env` and configure database credentials
3. Create the MySQL database and run `db/schema.sql`
4. Point your web server document root to the project root
5. Configure write permissions: `chmod 755 uploads public/assets/thumbnails`

---

## Authentication

Single-owner mode: public registration is disabled. Users must be manually created in the database. Owner login via `/login.php`.

---

## API Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/login.php` | POST | No | Authenticate user |
| `/api/auth/logout.php` | POST | Yes | Destroy session |
| `/api/auth/session.php` | GET | No | Get current session state |
| `/api/auth/register.php` | POST | No | Registration (disabled) |
| `/api/artwork.php` | GET | Optional | Get single artwork |
| `/api/artwork.php` | POST | Yes | Create new artwork |
| `/api/artwork.php` | PATCH | Yes | Update artwork |
| `/api/artwork.php` | DELETE | Yes | Delete artwork |
| `/api/artworks.php` | GET | No | List artworks (filter: featured/public) |
| `/api/datasets.php` | GET | Yes | List user's datasets |
| `/api/datasets.php` | POST | Yes | Create dataset record |
| `/api/datasets.php` | DELETE | Yes | Delete dataset |
| `/api/upload.php` | POST | Yes | Upload file |
| `/api/apiFeeds.php` | GET | No | Fetch/cached API feed |

---

## Constraints

Key non-negotiable rules (see `CONSTRAINTS.md`):

- **C-01**: No external font network requests — system-UI stack only
- **C-02**: No gradients, soft shadows, or SaaS visual language on UI surfaces
- **C-04**: All uploaded files must be sanitized server-side before processing
- **C-11**: Artwork mode and visual dimensions must persist across save/load cycles
- **C-12**: Style ID ↔ styleKey mapping must be complete (all 13 styles)
- **C-13**: Manual mode must generate ≥30 data points for meaningful output
- **C-17**: Manual mode dimensions must normalize to 0-1 range matching data-driven contract
