# PROMPTS.md

<!-- Moving forward, all prompts must be recorded according to the agent's logic to ensure continuity even after instances of compaction or other interruptions. -->

## Prompt 1: Sample Prompt
- Details: Specific details relevant to the prompt.
- Scope: The scope of changes according to the user's prompt/request.
- Plan: A short paragraph with specific implementation details associated with the prompt.
- Success: A short paragraph with specific details about what success means for implementing this prompt.

## Prompt 2: Session 27 - Studio Architecture Overhaul
- Details: Session 27 consists of UI changes to studio.php (remove Render button, add mode toggle), replacement of dropdown controls with numerical range sliders (X[-1,1], Y[-1,1], Size[0-Npx], Opacity[0,1], Rotation[0-360°]), replacement of Color dropdown with color swatch, decoupling Visual Dimensions from dataset columns, adding Random functionality, and implementing 10 new art style options.
- Scope: Files affected: studio.php, src/app.js, src/controls/controls.js, src/controls/columnMapper.js, src/controls/visualDimensions.js (NEW), src/canvas/renderer.js, src/canvas/artStyles.js, src/canvas/styles/particleField.js, src/canvas/styles/geometricGrid.js, src/canvas/styles/flowingCurves.js, plus 10 new style files (radialWave.js, fractalDust.js, neuralFlow.js, pixelMosaic.js, voronoiCells.js, radialSymmetry.js, timeSeries.js, heatMap.js, scatterMatrix.js, barCode.js).
- Plan: Implement hybrid Manual/Data-driven mode architecture. Create VisualDimensions module with IIFE pattern providing range sliders and color swatch controls. Integrate mode switching into Controls and App. Add explicit dimensions rendering path to Renderer that converts explicit dimension values into synthetic data points. Create 10 new art style modules each with init(), render(), cleanup(), and maxSize properties. Register all 13 styles in artStyles.js. Add maxSize to existing 3 styles. Update script load order in studio.php.
- Success: Studio interface has no Render button, mode toggle switches between Manual and Data-driven modes, Visual Dimensions panel uses sliders/swatches instead of column dropdowns, all 13 styles render correctly in both modes, Random button generates valid dimension values, Data-driven mode maintains backward compatibility, style change updates Size slider max via maxSize, and all functionality works without console errors.

## Prompt 3: Session 27 Bug Fix - Missing Variable Declarations (App + Controls)
- Details: Console error chain: First `Uncaught ReferenceError: _modeManualRadio is not defined` at app.js:771, then after fixing that, `Uncaught ReferenceError: _visualContainer is not defined` at controls.js:217. Mode toggle radio variables (`_modeManualRadio`, `_modeDataRadio`) in app.js and visual dimensions container variable (`_visualContainer`) in controls.js were added during Session 27 but never declared with `var` in their respective module scopes. In strict mode, assigning to undeclared variables throws ReferenceError, preventing initialization.
- Scope: src/app.js (add `_modeManualRadio` and `_modeDataRadio` declarations), src/controls/controls.js (add `_visualContainer` declaration).
- Plan: Add missing `var` declarations in the DOM references section of app.js and internal state section of controls.js to match their later assignments.
- Success: Browser console shows no ReferenceError, both app and controls modules initialize completely, studio.php creative elements become fully functional.

## Prompt 4: Session 27 Bug Fix - heatMap.js Undefined Variable
- Details: After fixing variable declarations in app.js and controls.js, rendering now attempts but fails with `Uncaught ReferenceError: bg is not defined` at heatMap.js:90:32. In the `_drawGradient` method, line `gradient.addColorStop(1, bg || '#0d0d0d');` references variable `bg` which is only defined in the parent `render` function scope, not in `_drawGradient`'s scope. The `bg` variable (background color from palette) was pulled from palette in render() but not passed to the internal _drawGradient method.
- Scope: src/canvas/styles/heatMap.js
- Plan: Replace `bg || '#0d0d0d'` with hardcoded default `'#0d0d0d'` in _drawGradient method, since background color is already handled by the palette system separately. This is the simplest fix that removes the undefined reference.
- Success: heatMap.js renders without ReferenceError, Manual mode rendering works for all 13 styles.

## Prompt 5: Session 28 - Existing Artwork Rendering Architectural Fix
- Details: User reported studio.php does not render even existing artworks correctly. Root cause analysis revealed hybrid mode architecture missing database schema support for Manual mode. Three critical issues: (1) artworks table missing mode and visual_dimensions columns, (2) styleKeyForId map incomplete (only IDs 1-3), (3) save/load flow not persisting mode or visualDimensions state.
- Scope: src/app.js (save/load mode + visualDimensions, styleKeyForId map, fetch .catch()), MySQL (ALTER TABLE artworks + UPDATE migration).
- Plan: OPTION 1: Add mode VARCHAR(10) and visual_dimensions JSON columns to artworks table. Extend styleKeyForId to include all 13 styles. Update save payload to include mode and visualDimensions. Update load to restore both. Add .catch() on all fetch calls.
- Success: Existing Data-driven artworks render correctly, Manual mode artworks save/reload with dimensions intact, all 13 styles load correctly, browser console clean of unhandled promise errors.

## Prompt 6: Session 28 - Manual Mode Rendering and Panel Fix
- Details: User reported that Manual mode (manual dimensions toggle) renders very little (only 1-2 particles/points) and the Visual Dimensions control panel with sliders is missing. Rendering should produce meaningful output equivalent to Data-Driven mode with a dataset, and the panel with X/Y position, Size, Opacity, Rotation, and Color controls must be visible in Manual mode.
- Scope: src/canvas/renderer.js (fixed renderUsingExplicitDimensions to generate 30 data points), src/controls/controls.js (mode support with VisualDimensions integration, show/hide panels), src/app.js (mode toggle wiring, null checks for missing DOM elements), studio.php (DOM element verification).
- Plan: Add renderUsingExplicitDimensions method to Renderer that generates multiple data points for each style. Add _currentMode state and setMode/getMode methods to Controls. Create and initialize VisualDimensions panel in Manual mode. Wire mode radio toggle in app.js. Add null checks for DOM elements not present in studio.php (_uploadInput, _renderBtn, etc.). Fix canvas willReadFrequently warning.
- Success: Manual mode shows Visual Dimensions panel with all sliders and color swatch. Manual mode renders 30+ data points for meaningful visualization. Mode toggle correctly shows/hides Manual (VisualDimensions) vs Data-driven (ColumnMapper) panels. No console errors. Both modes render all 13 art styles correctly.

## Prompt 7: New Artwork Button Event Listener Fix (2026-04-25)
- Details: The "New Artwork" button in studio.php did nothing when clicked. Root cause: _newArtworkBtn DOM element was referenced in app.js (line 976) but no event listener was ever attached. All other buttons (Save, Load, Delete) had handlers wired in init() but New Artwork was missing.
- Scope: src/app.js (add _onNewArtworkClick handler function, wire event listener in init())
- Plan: Create _onNewArtworkClick handler that clears _currentArtworkId, clears hidden input, calls _clearArtworkMetadata(), calls Controls.reset(), and shows status message. Wire the listener in init() after other button listeners using the null-check pattern if (_newArtworkBtn).
- Success: Clicking "New Artwork" clears artwork ID, clears metadata fields, resets canvas to defaults, hides delete button, and next save creates a new artwork (POST) not updates existing (PATCH). Status message confirms action.

## Prompt 8: PHP Logical OR Bug Fix in exhibit.php (2026-04-25)
- Details: User reported that artwork titles display as "1" instead of the actual title in exhibit.php. The problematic code uses PHP's `||` (logical OR) operator which returns a boolean (true/false), not the first truthy value like JavaScript. User wants "Untitled" to appear for both null AND empty string titles.
- Scope: exhibit.php - Fix 6 occurrences of `||` used for default value fallbacks (lines 99, 100, 133, 135, 325, 332)
- Plan: Replace all instances of `$var || 'default'` with `!empty($var) ? $var : 'default'` to properly handle both null and empty string cases. The `!empty()` check returns false for null, empty strings, and other falsy values.
- Success: Artwork titles display correctly in exhibit.php, "Untitled" fallback works for missing or empty titles, no other functionality affected.
