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

**Note:** Pruned selectively for Creatrweb 3D Art retrofit (2026-06-XX). Removed entries specific to deprecated data-driven architecture. Kept general principles that remain valid.

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
    tension is a confirmed structural principle for the Studio — the generative
    canvas is always the dominant visual zone and all controls are secondary
    instruments arranged around it, not a feature checklist.
    [Confirmed during Derived Identity review, 2026-04-23.]

2026-04-23 · CONSTRAINT · Server-side file sanitization is
    non-negotiable for any user-provided input — validation, size limits,
    and content scanning must occur before processing.
    [Recorded as C-04 in CONSTRAINTS.md, 2026-04-23.Updated for Creatrweb 3D Art: 
    Now applies to figure configuration input and any user text fields.]

2026-04-23 · ARCHITECTURE · The global namespace pattern (`window.DataToArt`)
    with IIFE-wrapped modules and script load order dependency remains valid
    for the new library-based architecture.
    [Implementable in src/libraries/* and src/figures/* with same pattern]

2026-04-23 · DESIGN · Canvas rendering is synchronous by default with
    animation opt-in — rendering is intentional and user-triggered, no ambient
    or auto-playing canvas output.
    [Still applies to library renderers in Creatrweb 3D Art]

2026-04-23 · ARCHITECTURE · Data normalization principle remains valid
    for figure property processing — detect value types, apply appropriate
    transformations, handle null/undefined gracefully.
    [Principle applies to library-agnostic figure base properties]

2026-04-23 · DESIGN · The sidebar layout (canvas ~65%, controls ~35%)
    implements the "atelier workstation" metaphor — canvas as hero, controls as
    instruments arranged beside it, not in a feature checklist.
    [Still valid for Creatrweb 3D Art studio.php layout]

2026-04-23 · DESIGN · Canvas frame uses neutral border that recedes rather
    than asserts itself — warmer colors compete with the gold sidebar accent;
    the gallery-wall metaphor benefits from a border that recedes.
    [Implemented in css/app.css, Session 9, 2026-04-23.Still valid.]

2026-04-23 · DESIGN · The border-left accent pattern on control groups
    (3px gold #c9922a) is a reusable "instrument frame" convention that
    requires no HTML changes — any future sidebar section can adopt it
    for visual grouping.
    [Still valid for new library/figure controls in Creatrweb 3D Art]

2026-04-24 · ARCHITECTURE · Private closure variables in IIFE modules are
    inaccessible to other modules — cross-module state must be exposed as
    public object properties when accessed by external code.
    [General JS principle still applies to new modules]

2026-04-24 · ARCHITECTURE · RESTful endpoint separation principle remains valid
    — single resource CRUD at artwork.php, collection queries at artworks.php.
    [Architecture pattern still used in Creatrweb 3D Art]

2026-04-24 · WORKFLOW · Additive changes must maintain graceful empty states
    — all pages show friendly messages when no data exists.
    [Still applies to portfolio/exhibit pages for gallery display]

2026-04-24 · DESIGN · Public pages extend dark atelier identity consistently
    — same color palette, hard offset shadows, no gradients, system fonts only.
    [Still applies to portfolio.php, exhibit.php in Creatrweb 3D Art]

2026-04-24 · ARCHITECTURE · User confirmation required for irreversible
    decisions — database schema changes provided as comments for manual
    execution, not executed automatically.
    [Principle still applies to schema migration for Creatrweb 3D Art]

2026-04-24 · WORKFLOW · JS-PHP state passing requires explicit reliability checks
    — always provide a fallback for critical state detection when primary
    attribute may be empty.
    [Principle still applies to library selection and artwork loading]

2026-04-24 · ARCHITECTURE · Public asset URLs must be passed to frontend JS via
    PHP-echoed config variables — never hardcode paths that differ between
    development and production environments.
    [Principle still critical for thumbnail URLs and asset paths]

2026-04-24 · WORKFLOW · Regression diagnosis must trace state propagation
    through the full stack — PHP session → HTML data attributes → JS initialization
    → CSS class toggles → DOM visibility.
    [General debugging principle still valid]

2026-04-24 · ARCHITECTURE · The global namespace pattern enables
    cross-module method chaining for multi-step operations.
    [Pattern still valid for library renderers and figure manager]

2026-04-25 · BLOCKER · The existing DELETE handler at api/artwork.php
    is fully functional with ownership verification — frontend features can be
    added without any backend changes.
    [Principle still applies; DELETE handler will be reused]

2026-04-26 · DESIGN · Mobile CSS breakpoints should consolidate fixes into
    existing media queries — the 768px breakpoint serves multiple pages
    with consistent mobile behavior.
    [Still applies to mobile layout for studio.php controls]

2026-04-26 · WORKFLOW · CSS specificity issues should be resolved by
    appending to shared styles first; only escalate to !important or inline
    overrides if conflicts persist.
    [General CSS principle still valid]

2026-06-XX · ARCHITECTURE · Library abstraction layer enables framework-agnostic figure management — users select library per artwork, but figure operations (add/remove/reorder) work consistently across all libraries via common interface.
    [Creatrweb 3D Art retrofit: A-Frame, Three.js, P5, C2 share common figure base properties]

2026-06-XX · ARCHITECTURE · Figure count is capped at 40 as a hard limit based on browser performance constraints — rendering 40+ Three.js objects or P5 shapes causes frame rate degradation on mid-range devices.
    [Creatrweb 3D Art retrofit: User changed from 20 to 40 figure limit, hard-coded enforcement]

2026-06-XX · DESIGN · Layer-based figure management treats each figure as a discreet composable unit — visibility toggles, reordering, and duplication operations apply to individual figures rather than the entire artwork.
    [Creatrweb 3D Art retrofit: User confirmed layer-based approach with show/hide/reorder/duplicate]

2026-06-XX · WORKFLOW · Complete architectural pivot requires comprehensive deprecation of data-driven features — removing data upload, column mapping, and dataset management in favor of direct figure configuration represents a fundamental shift from data-visualization to direct-creation tool.
    [Creatrweb 3D Art retrofit: User confirmed complete replacement of data features with library-based rendering]

2026-06-XX · ARCHITECTURE · p5.js animation loop calls `draw()` continuously at 60fps by default. When using p5 for non-animated rendering, either use `noLoop()` and call `redraw()` when needed, OR always draw all content in the draw function. Using a guard flag like `_needsRedraw` will cause content to disappear on the second frame when the background clears.
    [Session 31: Fixed P5 rendering issue by removing _needsRedraw guard, enabling continuous drawing]

2026-06-XX · ARCHITECTURE · For coordinate system consistency across renderers, all libraries should share the same convention: position (0, 0, 0) is at the visual center of the canvas. C2 achieves this with `ctx.translate(clientWidth/2, clientHeight/2)`, Three.js with camera positioning, and P5.js with `p.translate(width/2, height/2)`. Using LOGICAL dimensions (clientWidth/clientHeight) ensures DPR consistency across renderers.
    [Session 31: Added P5 coordinate centering to match C2 and Three.js behavior]

---

## Removed Entries (Archived)
*The following entries were removed as they related to deprecated data-driven architecture:*
- 2026-04-23 · ARCHITECTURE · Opencode Zen free model dependency notes (C-05/C-06)
- 2026-04-23 · ARCHITECTURE · C-04 sanitization pipeline specifics
- 2026-04-23 · ARCHITECTURE · Canvas renderer normalization details
- 2026-04-23 · DESIGN · Canvas rendering animation model
- 2026-04-23 · ARCHITECTURE · App entry point IIFE pattern (kept general principle)
- 2026-04-23 · ARCHITECTURE · Dataset list client-side filtering
- 2026-04-24 · ARCHITECTURE · Defense-in-depth data cleaning
- 2026-04-24 · ARCHITECTURE · Single-owner app positioning details
- 2026-04-24 · ARCHITECTURE · Phase 2 auth integration
- 2026-04-24 · WORKFLOW · Empty states as first-class UX (kept principle)
- 2026-04-24 · ARCHITECTURE · RESTful endpoint separation (kept principle)
- 2026-04-24 · WORKFLOW · Additive changes empty states (kept principle)
- 2026-04-24 · DESIGN · Public pages dark atelier (kept principle)
- 2026-04-25 · ARCHITECTURE · Save/update branching
- 2026-04-25 · ARCHITECTURE · Style ID mapping
- 2026-04-25 · WORKFLOW · State persistence
- 2026-04-25 · ARCHITECTURE · Mode and dimension persistence
- 2025-XX-XX · PROCESS · Rule 8 and Rule 1 entries
- Various Manual mode, data-driven mode, and Canvas-specific entries

2026-06-XX · ARCHITECTURE · Three.js WebGLRenderer.setSize(width, height, updateStyle) with updateStyle=true (default) sets canvas.style.width/height to the provided dimensions. When used with device-pixel dimensions (from canvas.width/height attributes), this overwrites external CSS with incorrect values, causing display corruption. Lesson: Always use clientWidth/clientHeight for CSS dimensions, and pass updateStyle=false when temporary size changes should not affect display CSS.

2026-06-XX · ARCHITECTURE · Three.js animation loop must be explicitly started via `start()` method — unlike p5.js which auto-renders in draw() loop, Three.js WebGLRenderer requires explicit animation loop initialization for continuous rendering and user interaction response.

2026-06-XX · ARCHITECTURE · Canvas/renderer resize operations must restore original dimensions AND re-render content — failing to re-render after size restoration leaves display in inconsistent state, causing blank or garbled canvas after operations like thumbnail capture.

2026-06-XX · ARCHITECTURE · Common interface methods must respect all parameters — when `captureThumbnail(width, height)` ignored dimensions, P5.js and C2 produced oversized thumbnails while Three.js correctly resized, causing inconsistent thumbnail display in gallery.

2026-06-XX · ARCHITECTURE · Embed mode script paths must use absolute paths (/src/...) not relative (src/...) — relative paths break when embed.php is loaded from subdirectories or iframes, causing infinite "Loading..." state as dependencies never resolve.

2026-06-XX · ARCHITECTURE · Three.js exhibit views must include camera controls (OrbitControls) — user explicitly requires interactive 3D exploration in all contexts (studio, exhibit regular, embed). Lazy-loading from self-hosted src/vendor/three/OrbitControls.js ensures compatibility across all Three.js loading patterns.

2026-06-XX · ARCHITECTURE · Exhibit.php must re-render artwork from configuration, not display thumbnails — per C-25 and C-26, thumbnails are for gallery pages only. Canvas rendering in exhibit provides live, potentially interactive artwork viewing.

2026-06-XX · ARCHITECTURE · Lazy-loaded scripts must use absolute paths even as fallback — relative paths in dynamic script loading (e.g., via document.createElement('script')) resolve relative to the current page, not the script's location, causing failures in iframe/subdirectory contexts. Always use leading slash for vendor scripts.

2026-06-XX · DEBUGGING · When a subsystem has multiple loading paths (proactive include vs lazy fallback), missing resources in one path can silently defeat the other — exhibit.php embed mode missed OrbitControls inclusion, and three.js lazy loading used relative path, compounding the failure. Fix: ensure both paths work independently.

2026-06-XX · SECURITY · JSON data embedded in JavaScript inside `<script>` tags must use JSON_HEX_TAG flag to prevent `</script>` in data from prematurely closing the script tag. Using `json_encode($data, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP)` ensures all HTML-sensitive characters are hex-escaped, preventing XSS and syntax errors.

2026-06-XX · BROWSER · Canvas elements require `pointer-events: auto` CSS for mouse/touch interaction to work. Without this, canvas appears visible but ignores all pointer input. This is particularly important for Three.js with OrbitControls and any interactive canvas rendering.

2026-06-XX · UX · Embed mode loading/error message elements should be hidden by default (`display: none`) and only shown explicitly when errors occur. The primary content (canvas) should be visible immediately, with loading states as overlays, not blocking the layout.

*Full removed entries available in git history or docs/archive/ if needed.*

---

<!-- The agent holds the brush. You choose what gets painted. 
     This document is how you tell the agent what you see. -->
