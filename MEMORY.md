# MEMORY.md

<!-- GOVERNANCE
     This file records confirmed durable lessons from prior sessions.
     Only entries the owner has explicitly confirmed are added here.
     Each entry is a single confirmed lesson — not a summary or a note.

     Format:
     YYYY-MM-DD · CATEGORY · Lesson in one sentence.
         [Optional: the exact exchange or context that surfaced it]

     Valid categories:
     DESIGN · ARCHITECTURE · CONSTRAINT · WORKFLOW · IDENTITY

     Entries are permanent unless explicitly removed by the owner.
     When approaching 50 entries, ask the owner to review —
     consolidate stable patterns and archive older entries to
     docs/memory-archive.md. -->

2026-04-24 · ARCHITECTURE · Save/update operations must branch on existing state
    (`_currentArtworkId`) rather than always creating new records — POST for new
    artworks, PATCH for existing updates, with distinct status messages and error
    handling.
    [Session 23: `_onSaveArtworkClick()` in src/app.js checks `_currentArtworkId`
    before fetch; api/artwork.php PATCH handler extended to handle full artwork
    fields (art_style_id, dataset_id, column_mapping, palette_config,
    rendering_config)]

---

## Confirmed Lessons

2026-04-23 · DESIGN · The dark atelier palette was chosen deliberately
    over a light studio ground because distinctiveness from generic art
    tools is a design value, not merely an aesthetic preference.
    [User: "a dark atelier at night would be more unique compared to
    most light-themed artistic websites."]

2026-04-23 · DESIGN · fornesusart.com is the canonical palette reference
    for any project where the UI must recede behind user-generated visual
    content — emotionally varied, chromatic, and abstract-first.
    [User: "the fornesusart.com color scheme may be more varied, which
    is what I envision for this application."]

2026-04-23 · IDENTITY · The canvas-as-hero / controls-as-instruments
    tension is a confirmed structural principle for the Data-to-Art
    Studio — the generative canvas is always the dominant visual zone
    and all controls are secondary instruments arranged around it, not
    a feature checklist.
    [Confirmed during Derived Identity review, 2026-04-23.]

2026-04-23 · CONSTRAINT · User-uploaded file sanitization is
    non-negotiable before any data reaches the normalization pipeline
    or canvas renderer — MIME type validation, file size limits,
    extension allowlist enforcement, and content scanning must all
    occur server-side before processing begins.
    [Recorded as C-04 in CONSTRAINTS.md, 2026-04-23.]

2026-04-23 · ARCHITECTURE · Opencode Zen free models are supplemental
    and substitutable by design — no feature, architectural decision,
    or session plan may depend on a specific free Zen model being
    available between sessions.
    [Recorded as C-05 in CONSTRAINTS.md, 2026-04-23.]

2026-04-23 · ARCHITECTURE · The C-04 sanitization pipeline must execute
    in strict order — validate (size, extension, MIME via finfo) before
    move, move before parse, parse before DB write — with is_sanitized = 0
    on initial insert and = 1 only after successful parse, all wrapped in
    a transaction with rollback and file cleanup on failure.
    [Implemented in api/upload.php, Session 3, 2026-04-23.]

2026-04-23 · ARCHITECTURE · The canvas renderer uses a global namespace
    pattern (`window.DataToArt`) with IIFE-wrapped modules and script load
    order dependency — style files must load before `artStyles.js`, which
    must load before `renderer.js`. No ES modules or bundler.
    [Implemented in src/canvas/*, Session 6, 2026-04-23.]

2026-04-23 · ARCHITECTURE · Data normalization is embedded in renderer.js
    rather than a separate module — detects column type
    (number/boolean/date/string) from a 50-value sample, applies
    type-specific min-max normalization, and returns null for missing
    values so style modules can apply fallbacks.
    [Implemented in src/canvas/renderer.js, Session 6, 2026-04-23.]

2026-04-23 · DESIGN · Canvas rendering is synchronous by default with
    animation opt-in via `renderingConfig.animate === true`, aligning with
    the principle that rendering is intentional and user-triggered — no
    ambient or auto-playing canvas output.
    [Implemented in src/canvas/renderer.js, Session 6, 2026-04-23.]

2026-04-23 · ARCHITECTURE · The app entry point (src/app.js) follows the
    IIFE-on-window.DataToArt namespace pattern, wiring DOM events to module
    APIs in a DOMContentLoaded handler — all other modules must be loaded
    before app.js via the 11-script sequence in index.html.
    [Implemented in src/app.js and public/index.html, Session 8, 2026-04-23.]

2026-04-23 · ARCHITECTURE · Dataset list comes from a single GET to
    datasets.php (no detail endpoint); app.js caches the list and filters
    client-side by id to load individual datasets.
    [Implemented in src/app.js, Session 8, 2026-04-23.]

2026-04-23 · DESIGN · The sidebar layout (canvas ~65%, controls ~35%)
     implements the "atelier workstation" metaphor from DESIGN.md — canvas
     as hero, controls as instruments arranged beside it, not in a feature
     checklist.
     [Implemented in public/index.html and public/css/app.css, Session 8, 2026-04-23.]

2026-04-23 · DESIGN · Canvas frame uses neutral #2a2a2a at 2px rather than
     warm palette tones — warmer colors like #2a2420 compete with the gold
     sidebar accent; the gallery-wall metaphor benefits from a border that
     recedes rather than asserts itself.
     [Implemented in public/css/app.css, Session 9, 2026-04-23.]

2026-04-23 · DESIGN · The border-left accent pattern on .dta-control-group
     (3px gold #c9922a) is a reusable "instrument frame" convention that
     requires no HTML changes — any future sidebar section can adopt it
     for visual grouping without adding new wrapper elements.
     [Implemented in public/css/app.css, Session 9, 2026-04-23.]

2026-04-24 · ARCHITECTURE · Project root serves as document root for PHP
    hosting — `public/` directory eliminated, all assets served from root.
    [Structure refactor: public/index.html → index.html, public/css/ → css/]

2026-04-24 · WORKFLOW · Empty states are first-class UX concerns — canvas
    overlay with quiet messaging for new users, dataset select with
    clear next-action copy. Aligns with "playful lab inside calm gallery" tone.
    [Implemented in index.html, css/app.css, src/app.js]

2026-04-24 · ARCHITECTURE · Auth flow completeness requires logout
    capability — session destruction endpoint and UI controls are
    minimum viable for user account management in Phase 2.
    [Created api/auth/logout.php, added logout button with show/hide logic]

2026-04-24 · ARCHITECTURE · Single-owner app positioning disables public
    registration — api/auth/register.php returns static disabled response,
    all register UI removed from landing page and studio sidebar. Existing
    auth endpoints unchanged; manually created DB users only.
    [Implemented in Session 13: api/auth/register.php, index.php,
    studio.php, src/app.js]

2026-04-24 · ARCHITECTURE · Defense-in-depth data cleaning uses both
    preprocessing (filter invalid rows) and runtime guards (sanitize normalized
    values) — dataMapper.cleanData() filters rows with null/NaN/non-numeric
    values for mapped numeric dimensions, while renderer.js sanitizes to
    prevent NaN/Infinity in style modules.
    [Implemented in Session 14: src/data/dataMapper.js, src/canvas/renderer.js]

2026-04-24 · ARCHITECTURE · RESTful endpoint separation: single resource
    CRUD at artwork.php, collection queries at artworks.php — cleaner than
    overloading single endpoint with filter parameters.
    [Implemented in Session 14: api/artwork.php (POST/PATCH/GET/DELETE),
    api/artworks.php (GET with filter param)]

2026-04-24 · WORKFLOW · Additive changes must maintain graceful empty states
    — all public pages show friendly messages and navigation options when no
    data exists, preventing crashes or errors.
    [Implemented in Session 14: index.php, portfolio.php, exhibit.php]

2026-04-24 · DESIGN · Public portfolio/exhibit pages extend dark atelier identity
    consistently — same color palette (#1c1814, #242018, #0d0d0d, #c9922a,
    #4a8fa8, #f0ece4), hard offset shadows, no gradients, system fonts only.
    [Implemented in Session 14: portfolio.php, exhibit.php with inline styles
    matching css/app.css palette]

2026-04-24 · ARCHITECTURE · The existing DELETE handler at api/artwork.php
    (lines 513-571) is fully functional with ownership verification and
    thumbnail cleanup — frontend features like delete can be added without
    any backend changes.
    [Implemented in Session 21: Delete Artwork button in studio.php using
    existing DELETE endpoint]

2026-04-24 · ARCHITECTURE · User confirmation required for irreversible
    decisions — ALTER TABLE statements provided as SQL comments for manual
    execution via phpMyAdmin, not executed automatically.
    [Session 14: db/schema.sql includes commented ALTER TABLE statements]

2026-04-24 · WORFLOW · JS-PHP state passing requires explicit reliability checks
    — session-dependent attributes (data-username) may be empty even for
    authenticated users; always provide a fallback attribute (data-authenticated)
    for critical state detection.
    [Session 16: studio.php added data-authenticated="1", src/app.js checks
    data-authenticated || data-username]

2026-04-24 · ARCHITECTURE · Public asset URLs must be passed to frontend JS via
    PHP-echoed config variables — never hardcode paths that differ between
    development and production environments.
    [Session 15: index.php and portfolio.php use DTA_CONFIG.thumbnailUrl from
    ARTWORK_THUMBNAIL_URL constant]

2026-04-24 · WORKFLOW · Regression diagnosis must trace state propagation
    through the full stack — PHP session → HTML data attributes → JS initialization
    → CSS class toggles → DOM visibility. Auth UI issues often stem from
    broken state chains, not UI code.
    [Session 16: studio.php auth panel regression traced to null username
    causing empty data-username, failing JS truthy check]

2026-04-24 · ARCHITECTURE · Private closure variables in IIFE modules are
    inaccessible to other modules — cross-module state must be exposed as
    public object properties, not private vars, when accessed by external code.
    [Session 18: Controls._currentDataset was private closure var; app.js
    Export/Save handlers needed access — exposed as Controls public properties]

2026-04-24 · ARCHITECTURE · PHP version-specific functions (e.g.,
    array_is_list() requires PHP 8.1+) must be avoided in shareable code
    — use compatible alternatives or polyfills.
    [Session 18: array_is_list() caused fatal errors on PHP < 8.1;
    replaced with simple is_array() check in artwork.php]

2026-04-24 · WORKFLOW · Database schema changes require retroactive ALTER
    TABLE statements for existing installations — CREATE TABLE IF NOT EXISTS
    does not automatically add new columns to pre-existing tables.
    [Session 18: Missing is_featured column caused 500 error on artwork POST;
    user must run ALTER TABLE manually per schema.sql comments]

2026-04-24 · ARCHITECTURE · The global namespace pattern (window.DataToArt) enables
    cross-module method chaining for 2-step operations — renderer.exportBase64()
    exposed via controls.exportBase64() exposed via app.js -> PHP backend, allowing
    canvas capture at save time without architectural changes.
    [Session 19: Thumbnail generation fix added exportBase64() to renderer.js,
    controls.js wrapper, and app.js payload integration]

2026-04-24 · ARCHITECTURE · Public asset URLs must be passed to frontend JS via
    PHP-echoed config variables — never hardcode paths that differ between
    development and production environments.
    [Session 15: index.php and portfolio.php use DTA_CONFIG.thumbnailUrl from
    ARTWORK_THUMBNAIL_URL constant]

2026-04-24 · ARCHITECTURE · Phase 2 requires auth integration at all data-mutating
    endpoints; upload.php completion closes C-04 gap by requiring session.php
    and passing $currentUserId to the database.
    [Session 24: api/upload.php now properly associates uploads with authenticated
    users, addressing unresolved checkpoint from Session 4]

2026-04-24 · WORKFLOW · Mobile-first progressive enhancement must maintain C-02
    compliance: hamburger menus use CSS display toggle, hard offset shadows,
    no gradients, and maintain instrument-like feel for controls.
    [Session 24: css/app.css mobile navigation system with 120+ lines of
    responsive layout code following DESIGN.md workstation metaphor]

2026-04-24 · ARCHITECTURE · Artwork thumbnail generation must occur on both POST
    (create) and PATCH (update) — PATCH handler must include thumbnail_data in
    allowed fields and process it identically to POST, including old file cleanup.
    [Session 26: api/artwork.php PATCH handler extended to mirror POST thumbnail
    pipeline; old thumbnail files deleted before new ones saved]

2026-04-24 · ARCHITECTURE · Visual dimensions must be decoupled from dataset
    column mapping — dimensions (X, Y, Size, Opacity, Rotation, Color) are
    explicit user-defined parameters, not derived from data columns. This
    separation enables direct creative control while preserving data-driven
    capabilities via mode toggle.
    [Session 27: visualDimensions.js created with explicit sliders; mode
    toggle added to studio.php; Controls adapted to support both Manual
    (explicit dimensions) and Data-driven (column mapping) modes]

2026-04-24 · ARCHITECTURE · Art style modules must expose maxSize property
    for VisualDimensions module to constrain Size slider range appropriately
    per style.
    [Session 27: All art style modules include maxSize; VisualDimensions.reads
    current style maxSize and updates Size slider max accordingly]

2026-04-25 · BLOCKER · Hybrid mode architecture requires database schema
    extension: mode column and visual_dimensions JSON column in artworks
    table to support Manual mode persistence. Without these, Manual mode
    artworks lose all dimension state on save/reload.
    [Session 28: ALTER TABLE artworks ADD COLUMN mode VARCHAR(10),
    ADD COLUMN visual_dimensions JSON; save/load updated to persist mode
    and visualDimensions]

2026-04-25 · ARCHITECTURE · Style loading map must include all registered
    styles (1-13) to correctly load artworks by art_style_id. Previously only
    mapped 1-3 (particleField, geometricGrid, flowingCurves) causing new styles
    to default to particleField on load.
    [Session 28: Extended styleKeyForId map to include all 13 styles]

2026-04-25 · WORKFLOW · Fetch promises must include .catch() handlers to
    prevent unhandled promise rejections that mask real errors and clutter
    browser console.
    [Session 28: All fetch() calls in app.js updated with .catch()
    handlers interconnected to _showError()]

2026-04-25 · BLOCKER · renderUsingExplicitDimensions method was missing from
    Renderer, causing Manual mode to fail completely with TypeError. Single data
    point generation insufficient for meaningful art style output.
    VisualDimensions module existed but was not integrated in Controls, causing
    panel to be missing from UI.
    [Session 28: Added renderUsingExplicitDimensions() to Renderer generating 30
    data points; integrated VisualDimensions in Controls; wired mode toggle
    in app.js]

2026-04-25 · ARCHITECTURE · Manual mode uses explicit user-defined parameters
    (x, y, size, opacity, rotation, color) to generate synthetic data, while
    Data-Driven mode uses actual dataset columns. These are fundamentally
    different rendering paths requiring separate code.
    [Session 28: Controls.js mode detection routes to separate render paths;
    Manual mode uses renderUsingExplicitDimensions with synthetic data points;
    Data-Driven mode uses original render with dataset data]

2026-04-25 · WORKFLOW · Mode toggle radio in studio.php must sync with Controls
    internal mode state, and show/hide appropriate control panels
    (VisualDimensions for Manual, ColumnMapper for Data-Driven).
    [Session 28: Controls.setMode() updates _currentMode and toggles panel
    visibility; app.js syncs radio state with mode and wires change events]

2026-06-25 · ARCHITECTURE · Manual and Data-Driven modes must converge on the same data point format (0-1 normalized values) for art styles to render consistently across both modes.

2026-06-25 · WORKFLOW · Mode state and visual dimensions must be explicitly persisted with artworks to enable fidelity across save/load cycles.

2025-XX-XX · PROCESS · RULES · Rule 8 pre-write self-check prevents syntax errors
    Attempted multi-line search/replace to remove color dimension from
    visualDimensions.js. Failed to account for orphan closing brace from
    removed if/else block. Result: SyntaxError on line 358 prevented entire
    module from loading. Fix: Added node -c validation step; removed
    orphan brace, corrected indentation.
    Lesson: Structural changes to code with nested blocks require post-edit
    syntax validation.
    Durable: JavaScript file modifications must pass node -c before
    proceeding to next change.

2025-XX-XX · PROCESS · RULES · Rule 1 applies regardless of user context quality
    User provided exhaustive implementation context with exact code changes
    needed. Proceeded directly to implementation without naming assumptions.
    Result: Violated Rule 1; missed opportunity to confirm understanding.
    lesson: Detailed user instructions do NOT exempt agent from Rule 1
    obligation.
    Durable: Always name at least one embedded assumption before first file
    write, even when direction appears unambiguous.

2025-XX-XX · ARCHITECTURE · CLARITY · Manual mode and Data-Driven mode have separate
    dimension handling
    Manual mode: VisualDimensions module (X, Y, Size, Opacity, Rotation) +
    palette colors only. Data-Driven mode: ColumnMapper module (X, Y,
    Size, Color, Opacity, Rotation) + dataset values. Color is intentionally
    absent from Manual mode VisualDimensions. Both modes produce normalized
    0-1 data points compatible with all art styles.
    Durable: Color dimension only available in Data-Driven mode via dataset
    column mapping; Manual mode uses palettecolors exclusively.

---

2026-04-25 · ARCHITECTURE · Canvas-level opacity must be explicitly passed via
    renderingConfig.opacity to art styles — each style manages its own ctx.globalAlpha
    independently via ctx.save()/restore() per-element, which isolates any
    canvas-level globalAlpha set before the rendering loop.
    The fix: renderer sets renderConfig.opacity = normOpacity; art styles check
    for it in manual mode when point opacity is null (p.opacity === null &&
    renderingConfig.opacity !== undefined → use canvas opacity).
    Durable: All 13 art styles required the same opacity pattern fix to work
    correctly in Manual mode. Pattern must be documented when adding new styles.

2026-04-25 · UX · "Center Position" button added to VisualDimensions panel to
    give users an explicit, discoverable way to center artwork. Mathematically
    the defaults (x=0,y=0) already produce centered output, but users need an
    obvious affordance to understand and act on the centering concept.
    Durable: Users interpret slider position 0 as "zero offset" not "center"
    unless explicitly labeled or actioned. Explicit centering UI improves
    discoverability of the centering concept.

2026-04-25 · ARCHITECTURE · Manual mode art centering requires art styles to
    use origin-centered coordinates (`(normX - 0.5) * drawW`) instead of
    top-left-origin coordinates (`padX + normX * drawW`) when
    `renderingConfig.manualMode === true`. The renderer passes this flag via
    `renderConfig.manualMode = true` to inform styles that the canvas origin
    has been moved to center via `ctx.translate()`. This ensures artwork appears
    centered and rotation happens around the artwork's visual center.
    Durable: All 13 art styles must handle the manualMode flag consistently;
    styles using `cx + p.x * width/2` pattern also need adjustment to
    `(p.x - 0.5) * width` for manual mode. Grid-based styles (geometricGrid,
    scatterMatrix) that use fixed index-based positioning are unaffected.

2026-04-25 · BUG FIX · 7 art styles failed in Manual mode because they only used
    `dataPoints[0]` instead of iterating all points. The `renderUsingExplicitDimensions`
    method generates 30 data points, so element sizes must be reduced proportionally
    (~3x smaller) when iterating all points. Pattern from `particleField.js`
    (`for (var i = 0; i < total; i++)`) applied to all 8 affected styles
    (neuralFlow, pixelMosaic, radialSymmetry, timeSeries, heatMap,
    scatterMatrix, barCode, voronoiCells).

2026-04-25 · ARCHITECTURE · Four art styles (GeometricGrid, VoronoiCells, ScatterMatrix,
    BarCode) required fixes for Manual mode rendering. GeometricGrid needed
    `isManualMode` check and centered coordinate calculation like particleField.
    VoronoiCells needed single cohesive rendering instead of 30 scattered tiny
    Voronois. ScatterMatrix needed `_drawManualMatrix()` with 50px cells (not 8px
    tiny cells). BarCode needed `_drawManualBarCode()` drawing horizontal bar code
    across canvas center instead of scattered mini-barcodes at each data point.
    Durable: Art styles in Manual mode should draw ONE cohesive visualization
    using all data points for properties, not multiple mini-visualizations
    scattered across the canvas.

2026-04-25 · ARCHITECTURE · Canvas transform `ctx.translate(cssWidth/2 + translateX,
    cssHeight/2 + translateY)` moves origin to canvas center. Art styles must
    position content relative to transformed origin (0,0 = center) using
    `startX = -contentWidth/2`, NOT `(w - contentWidth) / 2`. A previous fix
    incorrectly added offsets that the canvas transform already handles, causing
    double-application and content appearing in lower-right quadrant.
    Durable: When renderer translates context to center, styles should center
    content at origin using negative half-widths, never add cumulative offsets.

2026-04-25 · BUG · voronoiCells sampling loop `for (x = 0; x < w; x += 4)` only
    covered bottom-right quadrant after canvas transform moved origin to center.
    Fix: sample from `-w/2` to `w/2` to cover full canvas. The sampling bounds
    must be relative to the transformed origin, not absolute canvas dimensions.
    Durable: Any sampling/drawing operation in transformed coordinate space must
    use bounds centered at (0,0), not top-left-origin bounds.

2026-04-25 · BUG FIX · The "New Artwork" button in studio.php was non-functional —
    `_newArtworkBtn` DOM element was referenced in app.js (line 976) but no
    `addEventListener` call existed for it. All other artwork buttons (Save,
    Load, Delete) followed a consistent null-check handler-wiring pattern in
    `init()` that New Artwork was simply missing. Fix added `_onNewArtworkClick`
    handler (clears ID, metadata, calls `Controls.reset()`, shows status) and
    wired it with the same `if (_newArtworkBtn) { _newArtworkBtn.addEventListener(...) }`
    null-check pattern. After fix, next save correctly POSTs new artwork instead
    of PATCHing a stale `_currentArtworkId`.
    Durable: Every interactive DOM element in app.js needs both a variable assignment
    AND an event listener wiring in `init()` — missing listener = silent no-op.

2026-04-25 · CSS · The flex column sticky footer pattern (`body { display: flex; flex-direction: column; }`) requires `flex: 1 1 auto` on the main content area. Duplicate selectors in embedded CSS can silently override this property and break footer positioning without triggering any errors.

---

2026-04-25 · ARCHITECTURE · Featured items API endpoint must not apply default
    limits — when `filter=featured` with no explicit limit parameter, all
    featured public artworks are returned. This enables the homepage grid to
    display any number of featured items without arbitrary truncation.
    [Session 30: api/artworks.php removes default PORTFOLIO_FEATURED_LIMIT
    for featured filter; index.php adds mobile breakpoint at 500px for single-column layout]

2026-04-25 · BUG FIX · PHP `||` operator returns boolean (true/false), not the
    first truthy value like JavaScript. Always use `!empty($var) ? $var : 'default'`
    for default value fallbacks in PHP to handle both null and empty string cases.
    Common JS→PHP developer confusion pattern.
    [Session 34: exhibit.php titles displayed as "1" instead of actual title;
    all 6 occurrences of `||` replaced with `!empty()` ternary]

2026-04-26 · DESIGN · Mobile CSS breakpoints should consolidate fixes into existing
    media queries rather than creating new ones — the 768px breakpoint serves
    multiple pages (exhibit.php, studio.php, portfolio.php) with consistent
    mobile behavior, and `margin-left: auto` on flex items provides right-
    alignment without restructuring parent containers.
    [Session 35: All 5 mobile CSS fixes appended to existing @media (max-width: 768px)
    block; hamburger right-aligned via margin-left: auto rather than header refactor]

2026-04-26 · WORKFLOW · CSS specificity issues with inline style blocks (exhibit.php's
    `<style>` tag) can often be resolved by appending to the shared app.css media
    query first; only escalate to `!important` or inline overrides if conflicts
    persist after verification.
    [Session 35: Plan noted exhibit.php's inline styles as potential conflict,
    but app.css rules were preferred first; specificity handled via standard
    cascade rather than !important]

2026-04-26 · CSS · Inline `<style>` blocks in HTML documents override external CSS files
    when they have equal specificity and load later in the document. Mobile fixes
    for inline-styled elements must be added to the inline block itself, not the
    external stylesheet.
    [Session 36: exhibit.php mobile width fix required media query inside inline
    `<style>` block because app.css rules were overridden by later-loading inline styles]
