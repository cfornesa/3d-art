/**
 * Controls Module
 * Top-level coordinator for the entire control surface. Manages application state,
 * initializes sub-modules (ColumnMapper, PalettePicker, Renderer), and orchestrates
 * debounced render triggers.
 *
 * Architecture: Direct Reference Pattern (Option A from plan)
 * Controls.js holds direct references to sub-modules and calls their methods
 * directly. Each interaction immediately updates internal state and triggers a
 * 150ms debounced render.
 *
 * Dependencies (must load before this file):
 *   - window.DataToArt.Renderer       (renderer.js)
 *   - window.DataToArt.ColumnMapper   (columnMapper.js)
 *   - window.DataToArt.PalettePicker (palettePicker.js)
 *   - window.DataToArt.ArtStyles      (artStyles.js)
 */
(function() {
  'use strict';

  var DEBUG = window.location.search.indexOf('debug=true') !== -1;

  function log() {
    if (DEBUG) {
      var args = ['[DataToArt.Controls]'];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      console.log.apply(console, args);
    }
  }

  function warn() {
    if (DEBUG) {
      var args = ['[DataToArt.Controls]'];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      console.warn.apply(console, args);
    }
  }

  var DEBOUNCE_MS = 150;
  var DEFAULT_STYLE_KEY = 'particleField';
  var DEFAULT_PALETTE_COLORS = ['#000004', '#1f0c48', '#550f6d', '#88226a', '#b63655', '#dd513a', '#f78212', '#fcffa4'];
  var DEFAULT_BACKGROUND = '#0d0d0d';

  // ─── Internal State ────────────────────────────────────────────────────────

  var _canvasEl = null;
  var _controlsEl = null;
  var _renderer = null;
  var _columnContainer = null;
  var _paletteContainer = null;
  var _visualContainer = null;

  var _currentMode = 'manual'; // 'manual' or 'data'

  var _debounceTimer = null;

  // ─── Debounced Render ──────────────────────────────────────────────────────

  /**
   * Trigger a debounced render. Cancels any pending render and schedules
   * a new one after DEBOUNCE_MS milliseconds. Prevents renderer thrashing
   * during rapid UI changes (e.g. dragging a color picker).
   */
  function _triggerRenderDebounced() {
    if (_debounceTimer) {
      clearTimeout(_debounceTimer);
    }
    _debounceTimer = setTimeout(function() {
      Controls.triggerRender();
      _debounceTimer = null;
    }, DEBOUNCE_MS);
  }

  // ─── Change Handlers ─────────────────────────────────────────────────────

  /**
   * Called by ColumnMapper when a dimension mapping changes.
   * Receives the complete mapping object (not a delta).
   */
  function _onMappingChange(newMapping) {
    Controls._currentColumnMapping = newMapping;
    log('Column mapping changed:', JSON.stringify(newMapping));
    _triggerRenderDebounced();
  }

  /**
   * Called by PalettePicker when colors or background change.
   * Receives the complete palette config object.
   */
  function _onPaletteChange(newPalette) {
    Controls._currentPaletteConfig = newPalette;
    log('Palette config changed:', JSON.stringify(newPalette));
    _triggerRenderDebounced();
  }

  /**
   * Called by VisualDimensions when any dimension slider changes.
   * Receives the complete dimensions object.
   */
  function _onVisualDimensionsChange(newDimensions) {
    Controls._currentVisualDimensions = newDimensions;
    log('Visual dimensions changed:', JSON.stringify(newDimensions));
    _triggerRenderDebounced();
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  var Controls = {
    _currentDataset: null,
    _currentColumnMapping: null,
    _currentPaletteConfig: null,
    _currentRenderingConfig: null,
    _currentStyleKey: null,
    _currentVisualDimensions: null,

    /**
     * Set the dimension mode (manual vs data-driven)
     * @param {string} mode - 'manual' or 'data'
     */
    setMode: function(mode) {
      if (mode !== 'manual' && mode !== 'data') {
        warn('Controls.setMode() — invalid mode:', mode);
        return;
      }
      _currentMode = mode;

      // Show/hide panels based on mode
      if (_columnContainer) {
        _columnContainer.style.display = (mode === 'data') ? 'block' : 'none';
      }
      if (_visualContainer) {
        _visualContainer.style.display = (mode === 'manual') ? 'block' : 'none';
      }

      log('Mode set to:', mode);
    },

    /**
     * Get current mode
     * @returns {string} 'manual' or 'data'
     */
    getMode: function() {
      return _currentMode;
    },

    /**
     * Initialize the controls system. Validates dependencies, creates
     * sub-module containers, and initializes the Renderer.
     *
     * @param {HTMLCanvasElement} canvasElement - the canvas to render into
     * @param {HTMLElement} controlsContainerElement - DOM element for control panels
     * @param {Object} [options] - configuration overrides
     * @param {Object} [options.renderingConfig] - initial rendering config
     * @param {string} [options.styleKey] - initial art style key
     * @param {Object} [options.rendererOptions] - options passed to Renderer constructor
     */
    init: function(canvasElement, controlsContainerElement, options) {
      options = options || {};

      // Validate dependencies
      if (!window.DataToArt || !window.DataToArt.Renderer) {
        warn('Controls.init() — window.DataToArt.Renderer not found. Install renderer.js before controls.js.');
        return;
      }
      if (!window.DataToArt || !window.DataToArt.ColumnMapper) {
        warn('Controls.init() — window.DataToArt.ColumnMapper not found. Install columnMapper.js before controls.js.');
        return;
      }
      if (!window.DataToArt || !window.DataToArt.PalettePicker) {
        warn('Controls.init() — window.DataToArt.PalettePicker not found. Install palettePicker.js before controls.js.');
        return;
      }

      _canvasEl = canvasElement;
      _controlsEl = controlsContainerElement;

      log('Initializing Controls...');

      // Initialize state from options
      Controls._currentRenderingConfig = options.renderingConfig || { animate: false };
      Controls._currentStyleKey = options.styleKey || DEFAULT_STYLE_KEY;
      Controls._currentColumnMapping = {
        x: null,
        y: null,
        size: null,
        color: null,
        opacity: null,
        rotation: null
      };
      Controls._currentPaletteConfig = {
        colors: DEFAULT_PALETTE_COLORS.slice(),
        background: DEFAULT_BACKGROUND
      };

      // Initialize VisualDimensions with default values (no color - uses palette only)
      Controls._currentVisualDimensions = {
        x: 0, y: 0, size: 100, opacity: 1, rotation: 0
      };

      // Initialize Renderer
      _renderer = new window.DataToArt.Renderer(canvasElement, options.rendererOptions);

      // Create sub-module containers
      // VisualDimensions and ColumnMapper are toggled based on mode;
      // placing both dimension controls first ensures they occupy the same position
      _visualContainer = document.createElement('div');
      _visualContainer.id = 'dta-visual-dimensions';
      _controlsEl.appendChild(_visualContainer);

      _columnContainer = document.createElement('div');
      _columnContainer.id = 'dta-column-mapper';
      _controlsEl.appendChild(_columnContainer);

      _paletteContainer = document.createElement('div');
      _paletteContainer.id = 'dta-palette-picker';
      _controlsEl.appendChild(_paletteContainer);

      // Initialize ColumnMapper (no dataset loaded yet)
      window.DataToArt.ColumnMapper.render(
        _columnContainer,
        null,
        Controls._currentColumnMapping,
        _onMappingChange
      );

      // Initialize PalettePicker
      window.DataToArt.PalettePicker.render(
        _paletteContainer,
        Controls._currentPaletteConfig,
        _onPaletteChange
      );

      // Initialize VisualDimensions
      if (window.DataToArt && window.DataToArt.VisualDimensions) {
        window.DataToArt.VisualDimensions.init(
          _visualContainer,
          _onVisualDimensionsChange,
          500  // default maxSize
        );
      } else {
        warn('window.DataToArt.VisualDimensions not found');
      }

      // Set up debounced render trigger
      _debounceTimer = null;

      // Default to manual mode if app.js doesn't set it
      if (!window.DataToArt.Controls.getMode()) {
        Controls.setMode('manual');
      }

      // Clear canvas with default background
      _renderer.clear(DEFAULT_BACKGROUND);

      log('Controls initialized — style:', Controls._currentStyleKey);
    },

    /**
     * Load a dataset and re-render columnMapper controls.
     * Triggers a debounced render.
     *
     * @param {Object} dataset - dataset object with columns array
     */
    loadDataset: function(dataset) {
      if (!dataset || !dataset.columns || !Array.isArray(dataset.columns)) {
        warn('loadDataset() called with invalid dataset');
        return;
      }

      Controls._currentDataset = dataset;
      log('Dataset loaded:', dataset.dataset_id, dataset.columns.length, 'columns,', dataset.row_count, 'rows');

      // Re-render ColumnMapper with new dataset
      if (_columnContainer && window.DataToArt && window.DataToArt.ColumnMapper) {
        window.DataToArt.ColumnMapper.render(
          _columnContainer,
          dataset,
          Controls._currentColumnMapping,
          _onMappingChange
        );
      }

      _triggerRenderDebounced();
    },

    /**
     * Change the current art style and trigger a debounced render.
     *
     * @param {string} styleKey - style key registered with ArtStyles
     */
    setStyle: function(styleKey) {
      if (!styleKey) {
        warn('setStyle() called with empty styleKey');
        return;
      }

      // Validate styleKey exists
      if (window.DataToArt && window.DataToArt.ArtStyles) {
        try {
          window.DataToArt.ArtStyles.getStyle(styleKey);
        } catch (e) {
          warn('setStyle() — invalid styleKey "' + styleKey + '":', e.message);
          return;
        }
      }

      Controls._currentStyleKey = styleKey;
      log('Style changed to:', styleKey);
      _triggerRenderDebounced();
    },

    /**
     * Update rendering configuration. Merges the provided config
     * into the current config (shallow merge) and triggers debounced render.
     *
     * @param {Object} rc - rendering config overrides
     */
    setRenderingConfig: function(rc) {
      if (!rc || typeof rc !== 'object') {
        warn('setRenderingConfig() called with invalid config');
        return;
      }

      // Shallow merge
      for (var key in rc) {
        if (rc.hasOwnProperty(key)) {
          Controls._currentRenderingConfig[key] = rc[key];
        }
      }

      log('Rendering config updated');
      _triggerRenderDebounced();
    },

    /**
    * Trigger an immediate render with current state.
    * Called by the debounced wrapper after the timeout.
    */
    triggerRender: function() {
      if (!_renderer) {
        warn('triggerRender() — renderer not initialized');
        return;
      }

      var mode = Controls.getMode();

      if (mode === 'manual') {
        // Manual mode: use explicit VisualDimensions values
        if (!Controls._currentVisualDimensions) {
          log('triggerRender() — no visual dimensions set in manual mode, using defaults');
          Controls._currentVisualDimensions = { x: 0, y: 0, size: 100, opacity: 1, rotation: 0 };
        }

        log('Rendering (Manual mode) — style:', Controls._currentStyleKey, 
            'dimensions:', JSON.stringify(Controls._currentVisualDimensions));

        _renderer.renderUsingExplicitDimensions(
          Controls._currentVisualDimensions,
          Controls._currentPaletteConfig,
          Controls._currentRenderingConfig,
          Controls._currentStyleKey
        );
      } else {
        // Data-driven mode: use dataset and column mapping
        if (!Controls._currentDataset) {
          log('triggerRender() — no dataset loaded in data-driven mode, using default visual dimensions');
          var defaultDimensions = { x: 0, y: 0, size: 100, opacity: 1, rotation: 0 };
          _renderer.renderUsingExplicitDimensions(
            defaultDimensions,
            Controls._currentPaletteConfig,
            Controls._currentRenderingConfig,
            Controls._currentStyleKey
          );
          return;
        }

        log('Rendering (Data-driven mode) — style:', Controls._currentStyleKey, 
            'mapping:', JSON.stringify(Controls._currentColumnMapping));

        // Clean data: filter out rows with invalid numeric values for mapped dimensions
        var cleanedDataset = Controls._currentDataset;
        if (window.DataToArt && window.DataToArt.DataMapper && typeof window.DataToArt.DataMapper.cleanData === 'function') {
          cleanedDataset = window.DataToArt.DataMapper.cleanData(Controls._currentDataset, Controls._currentColumnMapping);
          var rowsRemoved = Controls._currentDataset.row_count - (cleanedDataset.row_count || 0);
          if (rowsRemoved > 0) {
            log('Data cleaning removed ' + rowsRemoved + ' rows with invalid mapped values');
          }
        }

        _renderer.render(
          cleanedDataset,
          Controls._currentColumnMapping,
          Controls._currentPaletteConfig,
          Controls._currentRenderingConfig,
          Controls._currentStyleKey
        );
      }
    },

    /**
     * Export the current canvas as a PNG file download.
     *
     * @param {string} [filename] - download filename, defaults to 'artwork.png'
     */
    triggerExport: function(filename) {
      if (!_renderer) {
        warn('triggerExport() — renderer not initialized');
        return;
      }

      // In Manual mode, we can export even without a dataset
      // In Data-Driven mode without a dataset, use default rendering
      if (Controls.getMode() === 'data' && !Controls._currentDataset) {
        warn('triggerExport() — no dataset loaded in data-driven mode, nothing to export');
        return;
      }

      log('Exporting PNG as', filename || 'artwork.png');
      _renderer.exportPNG(filename);
    },

    /**
     * Reset all controls and state to defaults. Clears the canvas.
     */
    reset: function() {
      log('Resetting all controls');

      Controls._currentDataset = null;
      Controls._currentColumnMapping = {
        x: null,
        y: null,
        size: null,
        color: null,
        opacity: null,
        rotation: null
      };
      Controls._currentPaletteConfig = {
        colors: DEFAULT_PALETTE_COLORS.slice(),
        background: DEFAULT_BACKGROUND
      };
      Controls._currentRenderingConfig = { animate: false };
      Controls._currentStyleKey = DEFAULT_STYLE_KEY;

      // Reset sub-modules
      if (window.DataToArt && window.DataToArt.ColumnMapper) {
        window.DataToArt.ColumnMapper.reset();
      }
      if (window.DataToArt && window.DataToArt.PalettePicker) {
        window.DataToArt.PalettePicker.reset();
      }

      // Clear canvas
      if (_renderer) {
        _renderer.clear(DEFAULT_BACKGROUND);
      }

      // Cancel any pending debounced render
      if (_debounceTimer) {
        clearTimeout(_debounceTimer);
        _debounceTimer = null;
      }
    }
  };

  // ─── Expose on Global Namespace ────────────────────────────────────────────

  window.DataToArt = window.DataToArt || {};
  window.DataToArt.Controls = Controls;

  log('Controls module loaded');
})();