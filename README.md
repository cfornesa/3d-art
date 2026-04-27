# Creatrweb 3D Art

A multi-library art generation studio for creating 2D and 3D artwork using Three.js, P5.js, and C2. Each artwork uses one rendering library and can compose up to 40 figures with layer-based controls. This is a retrofit of the original Creatrweb Data Art application, repurposed as a direct-creation tool for generative art.

## Project Overview

**Creatrweb 3D Art** is a single-phase creative workstation:

- Select a rendering library (Three.js, P5.js, or C2) per artwork
- Create and manage up to 40 figures per piece with layer-based controls
- Configure figure properties, visibility, ordering, and duplication
- Save artwork configurations with thumbnail generation
- Share artworks via embeddable iframes that re-render from configuration

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript, Three.js (+OrbitControls), P5.js, C2 |
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
├── login.php              # Standalone login page
│
├── api/
│   ├── auth/
│   │   ├── login.php      # POST — authenticate user
│   │   ├── logout.php     # POST — destroy session
│   │   ├── register.php  # POST — registration (disabled for single-owner)
│   │   └── session.php   # GET — current session state
│   ├── artworks.php       # GET — public artwork collection with filters
│   └── artwork.php        # GET/POST/PATCH/DELETE — single artwork CRUD
│
├── src/
│   ├── app.js             # Main entry point, orchestrates all modules
│   ├── libraries/
│   │   ├── three.js        # Three.js rendering engine and figure types
│   │   ├── p5.js           # P5.js rendering engine and figure types
│   │   └── c2.js           # C2 rendering engine and figure types
│   ├── figures/
│   │   ├── figure-manager.js  # Core figure CRUD and layer management
│   │   └── figure-base.js   # Base figure properties and common interface
│   └── controls/
│       ├── controls.js    # Main controls orchestrator
│       └── palettePicker.js  # Color palette selection
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
└── public/assets/thumbnails/  # Generated artwork thumbnail PNGs
```

---

## Pages

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page with featured artworks |
| `/studio.php` | Auth only | Art creation workspace with library selector + figure controls |
| `/portfolio.php` | Public | Gallery of all public artworks |
| `/exhibit.php?id=N` | Public | Single artwork view with iframe embed code |
| `/login.php` | Guest only | Standalone login page |

---

## Database Schema

Three tables in MySQL:

1. **users** — Account credentials (id, username, email, password_hash, is_active)
2. **artworks** — Saved artwork state (id, user_id, title, library, figures, palette_config, tags, is_public, is_featured, thumbnail_path, created_at, updated_at)
3. **api_cache** — Cached API feed responses with TTL (id, source_url, response_data, expires_at)

**Note:** The `figures` column stores a JSON array of figure configurations. Each figure includes library-specific properties for position, scale, rotation, color, and visibility.

---

## Core Features

### Library Selection
- Choose from three rendering libraries: Three.js, P5.js, or C2
- Each artwork uses exactly one library
- Library auto-selected when loading existing artwork
- Common figure management interface across all libraries

### Figure Management
- Create, edit, and delete figures (up to 40 per artwork)
- Layer-based controls: show/hide, reorder (drag or buttons), duplicate
- Per-figure property editor with library-specific options
- Figure count indicator (X/40)
- Common base properties: position, scale, rotation, color, visibility

### Art Rendering
- Each library provides its own figure types and rendering capabilities
- Three.js: 3D graphics with WebGL
- P5.js: 2D graphics and creative coding
- C2: 2D canvas rendering
- Thumbnail generation for gallery display

### Save & Share
- Save artwork configuration (library, figures, palette, tags)
- Thumbnail generation on create and update for index/portfolio display
- Public/Featured visibility flags
- Tags support (comma-separated)
- iFrame embed code that re-renders artwork from configuration

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
- `SESSION_*` — session name and lifetime
- `ARTWORK_THUMBNAIL_DIR` / `ARTWORK_THUMBNAIL_URL` — thumbnail storage
- `MAX_FIGURES` — maximum figures per artwork (default: 40)

---

## Setup

1. Clone the repository
2. Copy `env.example` to `.env` and configure database credentials
3. Create the MySQL database and run `db/schema.sql`
4. Point your web server document root to the project root
5. Configure write permissions: `chmod 755 public/assets/thumbnails`

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

---

## Constraints

Key non-negotiable rules (see `CONSTRAINTS.md`):

- **C-01**: No external font network requests — system-UI stack only
- **C-02**: No gradients, soft shadows, or SaaS visual language on UI surfaces
- **C-03**: Canvas output is exempt from visual constraints (user-generated content)
- **C-23**: Maximum 40 figures per artwork — hard limit
- **C-24**: Each artwork uses exactly one rendering library
- **C-25**: Embedded artworks must re-render from configuration on each view
- **C-26**: Thumbnails used for display only (index/portfolio) — not for embeds
