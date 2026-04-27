# CONSTRAINTS.md

<!-- GOVERNANCE
     This file records non-negotiable rules that apply to this project.
     Constraints are permanent until explicitly lifted by the owner.
     Each entry includes: CONSTRAINT (the rule), SCOPE (what it applies to),
     and SET (when and why it was established).

     Do not move taste preferences here from DESIGN.md unless they
     have become technical requirements. Do not record model routing
     preferences here — those belong in DECISIONS.md.
     
     Constraints are permanent until explicitly lifted by the owner.
     When a constraint is lifted, mark it LIFTED with date and reason
     rather than deleting it, so the decision history is preserved. -->

---

## Active Constraints

---

### C-01 · No External Network Requests for Typography

**CONSTRAINT:** No web fonts may be loaded. All typography must use the
system-UI stack (`system-ui, -apple-system, BlinkMacSystemFont`) for UI
and body copy, and Courier New / monospace for data readouts and metadata.
No `@font-face` declarations, no Google Fonts imports, no external CDN
font requests of any kind.

**SCOPE:** All pages, components, and views across the entire application.

**SET:** 2026-04-23 · Inherited from established design practice across
prior projects (creatrweb.com, open.creatrweb.com). Eliminates FOUT,
external network dependency, and privacy surface from font CDNs.

---

### C-02 · Prohibited UI Visual Patterns

**CONSTRAINT:** The following visual patterns must never appear on any
UI surface in this application:
- Gradients (decorative or background — UI surfaces only; see C-03 for exemption)
- Soft drop shadows (all shadows must use hard offset pattern: `4px 4px 0px`)
- Stock photography
- Blur-heavy hero or background sections
- Icon libraries or SVG icon imports (Unicode symbols preferred)
- Auto-playing media of any kind
- Emoji used as ornament or navigation
- Any visual language identifiable as SaaS product design

**SCOPE:** All UI surfaces, layouts, components, and pages.

**SET:** 2026-04-23 · Derived from confirmed Declared Preferences in
DESIGN.md. Non-negotiable design identity constraint.

---

### C-03 · Canvas Output Exemption from Visual Constraints

**CONSTRAINT:** The no-gradient and no-soft-shadow rules in C-02 apply
exclusively to UI surfaces. User-generated canvas output is fully exempt —
the generative art renderer may produce any visual output the user
configures, including gradients, soft edges, and complex color blending.
No visual constraint from C-02 may be applied to or enforced on canvas
render output.

**SCOPE:** HTML5 Canvas rendering layer only.

**SET:** 2026-04-23 · Established to prevent C-02 from being
misapplied to the generative output, which is user-controlled content,
not UI chrome.

---

### C-04 · Server-Side File Upload Sanitization

**CONSTRAINT:** All user-uploaded files (CSV, TSV, XLSX) must be
sanitized server-side before any parsing, processing, or database write
occurs. Sanitization must include: MIME type validation, file size limits,
extension allowlist enforcement, and content scanning before normalization.
No raw user file content may be written to the database or passed to the
canvas renderer without passing through the normalization pipeline.

**SCOPE:** PHP file upload handler and all data ingest paths.

**SET:** 2026-04-23 · Required to prevent malicious file injection,
SQL injection via uploaded data, and unexpected schema breaks in the
normalization pipeline.

---

### C-05 · Opencode Zen Free Model Instability

**CONSTRAINT:** No application feature, architectural decision, or
session plan may depend on a specific Opencode Zen free model being
available. Free Zen models (including Nemotron 3 Super Free, Ling 2.6
Flash Free, Big Pickle, MiniMax M2.5 Free) are time-limited offerings
whose availability may change between sessions without notice. All work
assigned to free Zen models must be substitutable with another model
from the available stack without breaking the build plan.

**SCOPE:** All model routing decisions and session plans involving
Opencode Zen free tier.

**SET:** 2026-04-23 · Established based on Opencode Zen documentation
confirming free model availability is time-limited and subject to change.

---

### C-06 · Opencode Zen Prompt Data Notice

**CONSTRAINT:** Personal user data and sensitive content must not be
submitted through Opencode Zen free models during development. Free Zen
models may collect prompt data for model improvement purposes. All
prompts sent through free Zen models must contain only non-sensitive
development content (code, schema, queries) — never real user data,
credentials, or private project content.

**SCOPE:** All development sessions using Opencode Zen free tier models.

**SET:** 2026-04-23 · Established based on Opencode Zen free tier
data collection terms.

---

### C-07 · Login API Session Keys

**CONSTRAINT:** The login API (`api/auth/login.php`) sets `$_SESSION['user_id']` and `$_SESSION['email']` but does not set `$_SESSION['username']`. Auth detection must not depend on `$_SESSION['username']` being populated — use `data-authenticated` attribute or `$_SESSION['email']` as fallback.

**SCOPE:** Auth state detection in app.js, studio.php data attribute population.

**SET:** 2026-04-24 · Session 17 — discovered during auth panel regression investigation.

---

### C-11 · Artwork Mode Persistence

**CONSTRAINT:** Artwork state must persist both mode (manual/data-driven) and all visual dimensions (X, Y, Size, Opacity, Rotation, Color) for Manual mode artworks. The database schema must support storing and retrieving these values to ensure artwork fidelity across save/load cycles.

**SCOPE:** Database schema (artworks table), save/load operations in src/app.js, Controls and VisualDimensions modules.

**SET:** 2026-04-25 · Session 28 — Hybrid mode architecture requires explicit mode tracking. Without this constraint, Manual mode artworks lose their explicit dimension state.

---

### C-12 · Bidirectional Style Identification

**CONSTRAINT:** Style identification must be bidirectional (styleKey ⇄ database ID) for save and load operations. The mapping between database art_style_id and JavaScript styleKey must be complete and consistent to ensure artworks load with the correct style regardless of which direction is used for lookup.

**SCOPE:** src/app.js save and load functions, art_styles database table.

**SET:** 2026-04-25 · Session 28 — Incomplete styleKeyForId map (only IDs 1-3) caused new style artworks (IDs 4-13) to load with wrong style.

---

### C-13 · Manual Mode Data Point Rendering

**CONSTRAINT:** Manual mode must generate sufficient data points (minimum 30) for meaningful art style rendering. Single or very few data points result in minimal visual output that does not represent the intended aesthetic for any art style.

**SCOPE:** src/canvas/renderer.js renderUsingExplicitDimensions method, all Manual mode rendering paths.

**SET:** 2026-04-25 · Session 28 — Initial implementation generated only 1 data point, causing "very little rendering" output. Art styles expect multiple points to produce meaningful visualizations.

---

### C-14 · VisualDimensions Panel Visibility

**CONSTRAINT:** VisualDimensions panel (with sliders for X, Y, Size, Opacity, Rotation, and Color swatch) must be visible and functional in Manual mode. This panel is the primary control interface for Manual mode and must not be hidden or missing.

**SCOPE:** src/controls/controls.js (VisualDimensions integration, setMode), src/controls/visualDimensions.js (UI creation).

**SET:** 2026-04-25 · Session 28 — VisualDimensions module existed but was not integrated into Controls, causing the panel to be missing from the Manual mode interface.

---

### C-15 · Mode Toggle Panel Visibility

**CONSTRAINT:** Mode toggle must correctly show/hide appropriate control panels — VisualDimensions for Manual mode, ColumnMapper for Data-Driven mode. Only the relevant panel should be visible at any time.

**SCOPE:** src/controls/controls.js setMode method, CSS display property management.

**SET:** 2026-04-25 · Session 28 — Mode toggle UI existed in studio.php but lacked JavaScript support to show/hide panels based on mode selection.

---

### C-16 · DOM Element Null Safety

**CONSTRAINT:** All DOM element references in shared JavaScript modules (app.js, controls.js) must handle missing elements gracefully with null checks. Pages like studio.php and index.php have different DOM structures but share the same JavaScript files.

**SCOPE:** src/app.js (DOM reference event listeners), src/controls/controls.js (panel display logic).

**SET:** 2026-04-25 · Session 28 — App.js referenced elements like dta-file-upload, dta-render-btn, dta-logout-btn that don't exist in studio.php, causing ReferenceError and preventing initialization.

---

### C-17 · Manual Mode Dimension Normalization

**CONSTRAINT:** Manual mode must normalize explicit dimensions to 0-1 range to match data-driven mode contract. All art styles expect visual dimension values in 0-1 normalized format from data-driven mode, and Manual mode must produce compatible data points to ensure consistent rendering across all styles.

**SCOPE:** src/canvas/renderer.js renderUsingExplicitDimensions method, all Manual mode dimension processing.

**SET:** 2026-06-25 · Session 22 — Dimensions were not properly normalized: X/Y values could be outside 0-1 range, Size was divided by canvas dimensions making it microscopic, Color was passed as hex string where styles expected 0-1 palette index, Rotation format was inconsistent. Normalization ensures Manual mode data points match data-driven mode format.

---

### C-18 · Grid Generation Bounds

**CONSTRAINT:** Grid generation in Manual mode must center around explicit position without producing out-of-bounds coordinates. Generated data points must remain within or near the 0-1 normalized range to be properly interpreted by all art styles.

**SCOPE:** src/canvas/renderer.js grid generation in renderUsingExplicitDimensions method.

**SET:** 2026-06-25 · Session 22 — Previous offset calculation (col/(cols-1) * 0.8 - 0.4) could push points to -0.4 to 1.4 range when combined with explicit position. Centered grid approach with controlled spread (±0.3) keeps points within reasonable bounds.

---

### C-19 · Thumbnail Generation Requirements

**CONSTRAINT:** Thumbnail generation requires both canvas.toDataURL() without security errors and a writable thumbnails directory. The canvas must not be tainted by cross-origin images, and the server must have write permissions to public/assets/thumbnails/ for thumbnail PNG files to be saved successfully.

**SCOPE:** src/app.js save handler (thumbnail capture), api/artwork.php (thumbnail processing), public/assets/thumbnails/ directory.

**SET:** 2026-06-25 · Session 22 — Thumbnails were not being produced because frontend wasn't capturing canvas and sending thumbnail_data. Even with capture, canvas taint or missing directory would prevent success.

---

### C-20 · JavaScript Syntax Validation

**CONSTRAINT:** All search/replace operations on JavaScript files using multi-line blocks must be validated with `node -c <file>` before proceeding to the next file modification. This prevents orphan braces, mismatched parentheses, and other structural errors from being committed.

**SCOPE:** All JavaScript files modified via search_replace tool.

**SET:** 2025-XX-XX · Session 23 — Syntax error introduced in visualDimensions.js via orphan closing brace after removing if/else block. Error only caught after user reported VisualDimensions pane disappeared. Post-fix validation prevents recurrence.

---

### C-21 · Pre-write Self-Check

**CONSTRAINTS:** Before any file write (search_replace or write_file), perform the pre-write check: (1) verify not in Irreversible Decisions table, (2) confirm no public API contract modification without docs/api.md update, (3) confirm no new dependencies without docs/dependencies.md update, (4) validate Rule 1 assumption has been surfaced. Log any skipped checks as unresolved checkpoints in DECISIONS.md.

**SCOPE:** All file write operations.

**SET:** 2025-XX-XX · Session 23 — Pre-write check skipped entirely, leading to multiple Rule violations. Formalizing as mandatory step.

---

### C-22 · Mandatory Documentation Updates

**CONSTRAINT:** Every session that modifies code must update DECISIONS.md with implementation details, assumptions surfaced, and self-evaluation. Each new constraint discovered must be added to CONSTRAINTS.md. MEMORY.md entries must be proposed for durable lessons before session end.

**SCOPE:** All implementation sessions resulting in code changes.

**SET:** 2025-XX-XX · Session 23 — DECISIONS.md and CONSTRAINTS.md not updated during session; MEMORY.md not proposed before final response. Required post-session cleanup.