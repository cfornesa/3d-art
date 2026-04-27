# PROMPTS.md

<!-- Moving forward, all prompts must be recorded according to the agent's logic to ensure continuity even after instances of compaction or other interruptions. -->

**Note:** Pruned selectively for Creatrweb 3D Art retrofit (2026-06-XX). Removed prompts specific to deprecated data-driven architecture. Kept general patterns and template.

---

## Prompt Template
- **Details:** Specific details relevant to the prompt.
- **Scope:** The scope of changes according to the user's prompt/request.
- **Plan:** A short paragraph with specific implementation details associated with the prompt.
- **Success:** A short paragraph with specific details about what success means for implementing this prompt.

---

## Current Prompts

## Prompt 9: Creatrweb 3D Art Retrofit - Multi-Library Architecture (2026-06-XX)
- **Details:** Complete architectural pivot from data-driven generative art workstation to multi-library direct-creation tool. User wants to generate new art pieces using A-Frame, Three.js, P5.js, and C2 libraries. Each artwork uses ONE library and can define up to 40 figures. Configuration panel in studio.php must accommodate library selection and figure management.
- **Scope:** All markdown documentation (README.md, DESIGN.md, DECISIONS.md, CONSTRAINTS.md, PROMPTS.md, MEMORY.md) + future implementation of library renderers, figure manager, and UI updates.
- **Plan:** 
  - Phase 1 (Documentation - COMPLETE): Update all markdown files to reflect new architecture, remove EVAL_SESSION files
  - Phase 2 (Database - COMPLETE): Migrate schema - remove data-related tables, add library/figures columns to artworks
  - Phase 3 (Backend - COMPLETE): Update API endpoints to handle library/figures configuration
  - Phase 4 (Frontend - COMPLETE): Implement library abstraction layer, figure management, UI controls, page updates, CSS
  - Phase 5 (Cleanup - COMPLETE): Deprecate old modules (data upload, column mapping, canvas styles, controls)
- **Success:** 
  - All markdown accurately reflects Creatrweb 3D Art architecture
  - Users can create artworks with any of 4 libraries (A-Frame, Three.js, P5.js, C2)
  - Users can manage up to 40 figures with layer-based controls (add/remove/edit/reorder/duplicate/show/hide)
  - Auto-select library when loading saved artwork
  - Thumbnails generated for gallery display (index.php, portfolio.php)
  - Embeds re-render from configuration (no thumbnails for embeds)
  - No EVAL_SESSION clutter files remain

---

## Prompt 10: Phase 4 Completion - Testing and Verification (2026-06-XX)
- **Details:** Phase 4 frontend implementation is complete. All core functionality implemented: app.js rewrite with library switching, FigureManager integration, bidirectional property binding, new save/load logic with library/figures fields, thumbnail capture, and CSS for new UI elements. Markdown documentation updated to reflect completed work.
- **Scope:** Testing of all implemented features across all browsers, verification of figure limit enforcement, library switching, save/load cycles, and embed functionality. Final cleanup of any remaining deprecated module references.
- **Plan:** 
  - Browser testing: Three.js, A-Frame, P5.js, C2 placeholder renderers
  - Test figure limit: Attempt to add 41st figure, verify rejection
  - Test library switching: Switch between all 4 libraries with existing figures
  - Test save/load: Save artwork, load it back, verify library auto-selected and figures restored
  - Test embed: Verify exhibit.php iframe shows artwork (thumbnail for now, full re-render future)
  - Verify CSS: All new UI elements styled correctly
  - Final cleanup: Remove any lingering references to deprecated modules
- **Success:** 
  - All 4 libraries render correctly in studio.php
  - Figure Manager allows adding up to 40 figures, prevents 41st
  - Library switching preserves figures across renderer change
  - Save/load cycle works for all library types
  - index.php, portfolio.php, exhibit.php display correctly with new architecture
  - No errors in console during normal workflow

---

## Prompt 11: Phase 5 Completion - Database Setup and Test Data (2026-06-XX)
- **Details:** Phase 5 database infrastructure is complete. Schema imported with MySQL 9.6 compatibility fixes (backticked `library` reserved keyword, LONGTEXT for JSON columns). Database user created with proper privileges. Owner user inserted with password hash. Four test artworks created (one per library: three, aframe, p5, c2) with sample figures.
- **Scope:** Database setup, schema validation, user management, test data population.
- **Plan:** 
  - Drop corrupted database and recreate with corrected schema
  - Import schema.sql with MySQL 9.6 compatibility fixes
  - Create database user 'u276695328_3d_art' with proper privileges
  - Insert owner user with password hash for '?@!3DART9s1s20e18'
  - Insert 4 test artworks with sample figures for each library
  - Verify PHP PDO connection works with application credentials
- **Success:** 
  - Database u276695328_3d_art exists with users, artworks, api_cache tables
  - MySQL 9.6 reserved keyword issue resolved (backticked `library` column)
  - LONGTEXT columns working for JSON data storage
  - Database user has correct privileges
  - Owner user can authenticate
  - 4 test artworks (one per library) populated and queryable via PDO

---

## Prompt 12: Phase 6 - Fix Library Renderer Initialization and Script Loading (2026-06-XX)
- **Details:** Console errors persist preventing figure rendering: (1) p5.js:86 Uncaught SyntaxError, (2) Three.js multiple instances warning from A-Frame's bundled Three.js v0.125.1 conflicting with unconditionally-loaded standalone Three.js r128, (3) A-Frame scene taking full viewport and covering sidebar controls, (4) figures not rendering despite being loaded via Load Artwork. Root cause: A-Frame v1.2.0 bundles its own Three.js, causing version conflicts when both Three.js CDN and A-Frame CDN are loaded. All library CDN scripts are loaded unconditionally at page load regardless of which library is selected.
- **Scope:** Fix library script loading strategy to be dynamic, A-Frame canvas containment, Three.js multiple instance conflicts, p5.js initialization.
- **Plan:** 
  - Step 1: Remove Three.js and p5.js CDN scripts from studio.php body (keep A-Frame in head)
  - Step 2: Add _loadLibraryScript() utility in app.js to dynamically load Three.js and p5.js only when needed
  - Step 3: Update _createRenderer() to call _loadLibraryScript() before creating renderer, with callback chain
  - Step 4: Add CSS ensuring #dta-canvas-region (65%) + #dta-sidebar (35%) horizontal layout, overflow:hidden on region
  - Step 5: Fix p5.js renderer to properly position its canvas within parent container
  - Step 6: Ensure all renderers handle the figure type names from test data (box, sphere, rect, ellipse)
  - Step 7: Test all 4 libraries with existing artworks and new figure creation
- **Success:** 
  - No "Multiple instances of Three.js" warning in console
  - No p5.js syntax errors in console
  - A-Frame scene constrained within canvas region (not full viewport, sidebar controls usable)
  - Horizontal layout: canvas region (65%) + sidebar (35%) side-by-side
  - Figures render correctly when artwork loaded via Load Artwork
  - Figures render correctly when added via Add Figure button
  - Library switching works without errors for all 4 libraries
  - No application errors in console (extension errors can be ignored)

---

## Prompt 15: Session 32 - Thumbnail Generation Fix and Three.js Canvas Stabilization (2026-06-XX)

- **Primary Goal:** Fix thumbnail generation pipeline and stabilize Three.js rendering
- **Details:** Thumbnails not displaying in portfolio/gallery pages due to missing `thumbnail_data` in save payload. Three.js canvas clears/corrupts after save due to: (1) missing animation loop, (2) CSS style corruption from setSize() with updateStyle=true using device-pixel dimensions. P5.js and C2 produce oversized thumbnails ignoring width/height parameters. A-Frame artwork remains in database.
- **Scope:** Fix thumbnail payload in app.js, Three.js captureThumbnail to preserve CSS styles, P5.js and C2 captureThumbnail to respect dimensions, run A-Frame migration, remove EVAL_SESSION files
- **Success:** 
  - Thumbnails display correctly in portfolio.php, index.php, exhibit.php
  - Three.js canvas renders continuously without clearing
  - All renderers produce 200x200 thumbnails
  - Thumbnails captured without corrupting canvas CSS
  - No A-Frame artworks in database
  - No EVAL_SESSION*.md files in repository
  - Save, load, and switch operations don't require page refresh

---

## Archived Prompts
*The following prompts were archived as they related to deprecated data-driven architecture. Available in git history or docs/archive/ if needed.*

- **Prompt 1:** Sample Prompt (template, kept above)
- **Prompt 2:** Session 27 - Studio Architecture Overhaul (Manual/Data-Driven modes, 13 styles)
- **Prompt 3:** Session 27 Bug Fix - Missing Variable Declarations
- **Prompt 4:** Session 27 Bug Fix - heatMap.js Undefined Variable
- **Prompt 5:** Session 28 - Existing Artwork Rendering Architectural Fix
- **Prompt 6:** Session 28 - Manual Mode Rendering and Panel Fix
- **Prompt 7:** New Artwork Button Event Listener Fix
- **Prompt 8:** PHP Logical OR Bug Fix in exhibit.php

---

## Prompt 13: Phase 6.4 - Emergency Bug Fixes: SQL Syntax, C2 Over-Correction, Export Pipeline, P5.js CDN (2026-06-XX)
- **Details:** After Phase 6.3 (A-Frame removal), critical regressions emerged: (1) SQL syntax error on save due to `library` column (MySQL 9.6 reserved keyword) not backticked in INSERT statement in api/artwork.php:195, (2) C2 coordinate system over-corrected causing figures at (0,0) to render at bottom-right corner requiring (-700,-450) to center due to DPR scaling conflict, (3) Export PNG blank for all libraries rendering only background, (4) P5.js completely broken with SyntaxError at line 99 and no rendering.
- **Scope:** Fix SQL syntax error, correct C2 coordinate system with DPR awareness, debug and fix export pipeline, resolve P5.js CDN/initialization issues, verify all 3 remaining libraries (three, p5, c2) function correctly.
- **Plan:** 
  - Fix SQL INSERT in api/artwork.php to backtick `library` reserved keyword
  - Fix C2 _drawAll() to use logical (CSS) dimensions instead of physical dimensions for coordinate centering, accounting for DPR scaling
  - Add export diagnostics to app.js to identify why canvas is blank
  - Fix P5.js getCanvas() to return actual p5 canvas element, test with alternative CDN if needed
  - Test each library independently with browser console open
- **Success:** 
  - Save artwork succeeds without SQL errors
  - Export PNG downloads file with actual rendered figures, not blank background
  - C2 position (0,0) renders at canvas center, position (50,50) is 50px offset from center
  - P5.js library loads successfully, renders figures, and exports correctly
  - All 3 remaining libraries (three, p5, c2) functional for creation, editing, and export

---

Prompt 14 Added (Critical Bugs: SQL Syntax, C2 DPR Scaling, Export Blank, P5.js CDN):
## Prompt 14: Phase 6.5 - Deep Root Cause Analysis (2026-06-XX)
- **Details:** All Phase 6.4 fixes failed to resolve issues: (1) SQL backtick fix didn't resolve save errors, (2) C2 clientWidth/clientHeight still positions incorrectly, (3) Export diagnostics show canvas has content but toDataURL returns blank, (4) P5.js CDN change + getCanvas fix still results in no rendering. Fundamental architectural issues remain unaddressed.
- **Scope:** Complete audit of rendering pipeline, database persistence layer, and library initialization flow.
- **Plan:**
  - Audit all SQL statements for reserved keywords
  - Review Three.js/P5.js/C2 renderer lifecycle and actual canvas rendering
  - Trace export pipeline from renderer.getCanvas() through toDataURL()
  - Test P5.js without dynamic loading (inline in head)
  - Verify DPR handling in all renderers
- **Success:**
  - All 3 libraries render figures correctly
  - Save/load works for all libraries
  - Export produces PNG with visible figures
  - Browser console clean of errors

---

## Archived Prompts
