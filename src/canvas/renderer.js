/**
 * Canvas Renderer
 * Main rendering engine for the Creatrweb Data Art.
 *
 * Responsibilities:
 *   - Canvas initialization, sizing, and high-DPI handling
 *   - Responsive resize via ResizeObserver (fallback to window resize)
 *   - Data normalization (column-to-visual dimension mapping)
 *   - Style delegation via artStyles registry
 *   - PNG export via canvas.toBlob()
 *   - Animation control (opt-in only via renderingConfig.animate)
 *
 * Usage:
 *   var renderer = new window.DataToArt.Renderer(canvasElement, options);
 *   renderer.render(dataset, columnMapping, paletteConfig, renderingConfig, styleKey);
 *   renderer.exportPNG('my-artwork.png');
 */
(function() {
  'use strict';

  var DEBUG = false;
  function log() { if (DEBUG) console.log.apply(console, arguments); }

  var DEFAULT_BACKGROUND = '#0d0d0d';

  /**
   * Visual dimension keys that the renderer recognizes.
   */
  var VISUAL_DIMENSIONS = ['x', 'y', 'size', 'color', 'opacity', 'rotation'];

  // ─── Data Normalization ────────────────────────────────────────────────────

  /**
   * Detect the predominant data type of a column's values array.
   * @param {Array} values
   * @returns {string} "number" | "boolean" | "date" | "string"
   */
  function detectColumnType(values) {
    var numCount = 0;
    var boolCount = 0;
    var dateCount = 0;
    var checked = 0;
    var sampleSize = Math.min(values.length, 50);

    for (var i = 0; i < values.length && checked < sampleSize; i++) {
      var v = values[i];
      if (v === null || v === undefined || v === '') continue;
      checked++;

      // Boolean check
      if (v === true || v === false || v === 'true' || v === 'false' ||
          v === 'yes' || v === 'no' || v === '1' || v === '0') {
        boolCount++;
        continue;
      }

      // Date check (ISO-like strings)
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
        var parsed = Date.parse(v);
        if (!isNaN(parsed)) {
          dateCount++;
          continue;
        }
      }

      // Number check
      var n = parseFloat(v);
      if (!isNaN(n) && isFinite(n)) {
        numCount++;
        continue;
      }

      // If none matched, it's a string — short-circuit
      return 'string';
    }

    // Priority: string > number > date > boolean
    // But we already short-circuited on string, so check others
    if (numCount > checked * 0.5) return 'number';
    if (dateCount > checked * 0.5) return 'date';
    if (boolCount > checked * 0.5) return 'boolean';
    return 'string';
  }

  /**
   * Normalize a numeric column to 0-1 range (min-max normalization).
   * Handles edge case where max === min (all values → 0.5).
   * @param {Array} values
   * @returns {Object} { type: "number", normalized: Float64Array, min: number, max: number }
   */
  function normalizeNumeric(values) {
    var len = values.length;
    var nums = new Float64Array(len);
    var min = Infinity;
    var max = -Infinity;

    // First pass: parse and find min/max
    for (var i = 0; i < len; i++) {
      var v = values[i];
      if (v === null || v === undefined || v === '') {
        nums[i] = NaN;
        continue;
      }
      var n = parseFloat(v);
      if (isNaN(n) || !isFinite(n)) {
        nums[i] = NaN;
        continue;
      }
      nums[i] = n;
      if (n < min) min = n;
      if (n > max) max = n;
    }

    // Second pass: normalize
    var range = max - min;
    var normalized = new Array(len);
    for (var j = 0; j < len; j++) {
      if (isNaN(nums[j])) {
        normalized[j] = null;
      } else if (range === 0) {
        normalized[j] = 0.5;
      } else {
        normalized[j] = (nums[j] - min) / range;
      }
    }

    return { type: 'number', normalized: normalized, min: min, max: max };
  }

  /**
   * Normalize a string/categorical column.
   * Each unique value maps to a sequential index, normalized to 0-1.
   * @param {Array} values
   * @returns {Object} { type: "string", normalized: Array, categories: string[] }
   */
  function normalizeString(values) {
    var len = values.length;
    var uniqueSet = {};
    var uniqueList = [];

    // Collect unique values in encounter order
    for (var i = 0; i < len; i++) {
      var v = values[i];
      if (v === null || v === undefined || v === '') continue;
      var s = String(v);
      if (!uniqueSet.hasOwnProperty(s)) {
        uniqueSet[s] = uniqueList.length;
        uniqueList.push(s);
      }
    }

    // Normalize: index / (totalCategories - 1) or 0.5 if single category
    var normalized = new Array(len);
    var catCount = uniqueList.length;
    for (var j = 0; j < len; j++) {
      var val = values[j];
      if (val === null || val === undefined || val === '') {
        normalized[j] = null;
      } else {
        var idx = uniqueSet[String(val)];
        normalized[j] = catCount <= 1 ? 0.5 : idx / (catCount - 1);
      }
    }

    return { type: 'string', normalized: normalized, categories: uniqueList };
  }

  /**
   * Normalize a boolean column.
   * true → 1.0, false → 0.0, null/undefined → null
   * @param {Array} values
   * @returns {Object} { type: "boolean", normalized: Array }
   */
  function normalizeBoolean(values) {
    var len = values.length;
    var normalized = new Array(len);

    for (var i = 0; i < len; i++) {
      var v = values[i];
      if (v === null || v === undefined || v === '') {
        normalized[i] = null;
      } else if (v === true || v === 'true' || v === 'yes' || v === '1') {
        normalized[i] = 1.0;
      } else {
        normalized[i] = 0.0;
      }
    }

    return { type: 'boolean', normalized: normalized };
  }

  /**
   * Normalize a date column.
   * Converts to timestamp, then min-max normalizes to 0-1.
   * @param {Array} values
   * @returns {Object} { type: "date", normalized: Array, min: number, max: number }
   */
  function normalizeDate(values) {
    var len = values.length;
    var timestamps = new Array(len);
    var min = Infinity;
    var max = -Infinity;

    for (var i = 0; i < len; i++) {
      var v = values[i];
      if (v === null || v === undefined || v === '') {
        timestamps[i] = NaN;
        continue;
      }
      var t = (v instanceof Date) ? v.getTime() : Date.parse(String(v));
      if (isNaN(t)) {
        timestamps[i] = NaN;
        continue;
      }
      timestamps[i] = t;
      if (t < min) min = t;
      if (t > max) max = t;
    }

    var range = max - min;
    var normalized = new Array(len);
    for (var j = 0; j < len; j++) {
      if (isNaN(timestamps[j])) {
        normalized[j] = null;
      } else if (range === 0) {
        normalized[j] = 0.5;
      } else {
        normalized[j] = (timestamps[j] - min) / range;
      }
    }

    return { type: 'date', normalized: normalized, min: min, max: max };
  }

  /**
   * Sanitize a normalized value to ensure no NaN/Infinity/undefined values.
   * Returns null for invalid values, otherwise returns the value clamped to [0, 1].
   *
   * @param {number} value - normalized value (should be 0-1)
   * @returns {number|null} sanitized value or null
   */
  function sanitizeNormalizedValue(value) {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return null;
    }
    // Clamp to [0, 1] for safety
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }

  /**
   * Sanitize a normalized array, replacing NaN/Infinity/undefined with null.
   *
   * @param {Array} normalized - array of normalized values
   * @returns {Array} sanitized array
   */
  function sanitizeNormalizedArray(normalized) {
    if (!normalized || !Array.isArray(normalized)) {
      return [];
    }
    var result = new Array(normalized.length);
    for (var i = 0; i < normalized.length; i++) {
      result[i] = sanitizeNormalizedValue(normalized[i]);
    }
    return result;
  }

  /**
   * Normalize a column's values based on detected type.
   * @param {Array} values
   * @returns {Object} with .normalized array (0-1 or null per element)
   */
  function normalizeColumn(values) {
    if (!values || values.length === 0) {
      return { type: 'empty', normalized: [] };
    }

    var type = detectColumnType(values);
    switch (type) {
      case 'number': return normalizeNumeric(values);
      case 'boolean': return normalizeBoolean(values);
      case 'date': return normalizeDate(values);
      case 'string':
      default: return normalizeString(values);
    }
  }

  // ─── Renderer Constructor ──────────────────────────────────────────────────

  /**
   * @param {HTMLCanvasElement} canvasElement
   * @param {Object} [options] - { debounceMs: 150 }
   */
  function Renderer(canvasElement, options) {
    if (!canvasElement || !canvasElement.getContext) {
      throw new Error('Renderer: invalid canvas element');
    }

    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d', { willReadFrequently: true });
    this.options = options || {};
    this.debounceMs = this.options.debounceMs || 150;

    // Internal state
    this._dpr = window.devicePixelRatio || 1;
    this._container = canvasElement.parentElement;
    this._lastRenderArgs = null;  // cached for re-render on resize
    this._resizeTimer = null;
    this._animationId = null;
    this._destroyed = false;

    // Initial sizing
    this._setupResizeHandling();
    this._resize();
  }

  // ─── Private Methods ───────────────────────────────────────────────────────

  /**
   * Set up responsive resize handling.
   * Uses ResizeObserver if available, falls back to window resize event.
   */
  Renderer.prototype._setupResizeHandling = function() {
    var self = this;

    if (window.ResizeObserver && this._container) {
      this._resizeObserver = new ResizeObserver(function() {
        self._debouncedResize();
      });
      this._resizeObserver.observe(this._container);
    } else {
      this._resizeHandler = function() {
        self._debouncedResize();
      };
      window.addEventListener('resize', this._resizeHandler);
    }
  };

  /**
   * Debounced resize to prevent excessive redraws.
   */
  Renderer.prototype._debouncedResize = function() {
    var self = this;
    if (this._resizeTimer) {
      clearTimeout(this._resizeTimer);
    }
    this._resizeTimer = setTimeout(function() {
      self._resize();
      self._resizeTimer = null;
    }, this.debounceMs);
  };

  /**
   * Resize canvas to match container, handling high-DPI displays.
   */
  Renderer.prototype._resize = function() {
    if (this._destroyed) return;

    var container = this._container;
    var cssWidth, cssHeight;

    if (container) {
      cssWidth = container.clientWidth;
      cssHeight = container.clientHeight;
    } else {
      cssWidth = this.canvas.clientWidth || this.canvas.width;
      cssHeight = this.canvas.clientHeight || this.canvas.height;
    }

    if (cssWidth === 0 || cssHeight === 0) {
      log('Renderer: container has zero dimensions, skipping resize');
      return;
    }

    this._dpr = window.devicePixelRatio || 1;

    // CSS dimensions
    this.canvas.style.width = cssWidth + 'px';
    this.canvas.style.height = cssHeight + 'px';

    // Internal pixel dimensions (scaled by DPR)
    this.canvas.width = Math.round(cssWidth * this._dpr);
    this.canvas.height = Math.round(cssHeight * this._dpr);

    // Scale context to match DPR
    this.ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);

    log('Renderer resized to', cssWidth, 'x', cssHeight, '(pixelRatio:', this._dpr + ')');

    // Re-render if we have cached data
    if (this._lastRenderArgs) {
      var args = this._lastRenderArgs;
      this._doRender(args.dataset, args.columnMapping, args.paletteConfig, args.renderingConfig, args.styleKey);
    }
  };

  /**
   * Find a column by name in the dataset's columns array.
   * @param {Object} dataset
   * @param {string} columnName
   * @returns {Object|null} column object with .values array
   */
  Renderer.prototype._findColumn = function(dataset, columnName) {
    if (!dataset || !dataset.columns) return null;
    for (var i = 0; i < dataset.columns.length; i++) {
      if (dataset.columns[i].column_name === columnName) {
        return dataset.columns[i];
      }
    }
    return null;
  };

  /**
   * Transform a dataset into dataPoints array for the style module.
   * Handles normalization of each mapped column and sanitizes NaN/Infinity.
   *
   * @param {Object} dataset - { columns: [...], row_count: N }
   * @param {Object} columnMapping - { x: "colName", y: "colName", ... }
   * @returns {Array} dataPoints array
   */
  Renderer.prototype._prepareDataPoints = function(dataset, columnMapping) {
    var rowCount = dataset.row_count || 0;
    if (rowCount === 0) return [];

    // Normalize each mapped column and sanitize
    var normalizedDims = {};
    for (var d = 0; d < VISUAL_DIMENSIONS.length; d++) {
      var dim = VISUAL_DIMENSIONS[d];
      var colName = columnMapping[dim];

      if (colName) {
        var col = this._findColumn(dataset, colName);
        if (col && col.values) {
          var normalized = normalizeColumn(col.values).normalized;
          // Sanitize to remove NaN/Infinity/undefined
          normalizedDims[dim] = sanitizeNormalizedArray(normalized);
        } else {
          normalizedDims[dim] = null;
        }
      } else {
        normalizedDims[dim] = null;
      }
    }

    // Assemble dataPoints
    var dataPoints = new Array(rowCount);
    for (var i = 0; i < rowCount; i++) {
      var point = {};
      for (var k = 0; k < VISUAL_DIMENSIONS.length; k++) {
        var key = VISUAL_DIMENSIONS[k];
        if (normalizedDims[key] && i < normalizedDims[key].length) {
          // Final guard: ensure value is valid
          var val = normalizedDims[key][i];
          point[key] = (val !== null && val !== undefined && !isNaN(val) && isFinite(val)) ? val : null;
        } else {
          point[key] = null;
        }
      }
      dataPoints[i] = point;
    }

    return dataPoints;
  };

  /**
   * Execute the actual render pipeline.
   * @private
   */
  Renderer.prototype._doRender = function(dataset, columnMapping, paletteConfig, renderingConfig, styleKey) {
    var styleModule;
    try {
      styleModule = window.DataToArt.ArtStyles.getStyle(styleKey);
    } catch (e) {
      log('Renderer error:', e.message);
      return;
    }

    var cssWidth = this.canvas.width / this._dpr;
    var cssHeight = this.canvas.height / this._dpr;

    // Clear canvas
    this.clear(paletteConfig.background);

    // Prepare data points
    var dataPoints = this._prepareDataPoints(dataset, columnMapping);

    // Init style (called before each render — styles should be idempotent)
    styleModule.init(this.ctx, cssWidth, cssHeight, renderingConfig || {});

    // Render
    styleModule.render(this.ctx, cssWidth, cssHeight, dataPoints, paletteConfig || {}, renderingConfig || {});

    log('Renderer: render complete with style "' + styleKey + '"');
  };

  // ─── Public Methods ────────────────────────────────────────────────────────

  /**
   * Render artwork from dataset.
   *
   * @param {Object} dataset - { columns: [{column_name, values, type}], row_count: N }
   * @param {Object} columnMapping - { x: "colName", y: "colName", size: "colName", ... }
   * @param {Object} paletteConfig - { colors: ["#hex", ...], background: "#hex" (optional) }
   * @param {Object} renderingConfig - style-specific config merged with defaults
   * @param {string} styleKey - "particleField" | "geometricGrid" | "flowingCurves"
   */
  Renderer.prototype.render = function(dataset, columnMapping, paletteConfig, renderingConfig, styleKey) {
    if (this._destroyed) {
      log('Renderer: cannot render, renderer is destroyed');
      return;
    }

    // Cancel any in-progress animation
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }

    // Cache render arguments for re-render on resize
    this._lastRenderArgs = {
      dataset: dataset,
      columnMapping: columnMapping || {},
      paletteConfig: paletteConfig || {},
      renderingConfig: renderingConfig || {},
      styleKey: styleKey
    };

    var rc = renderingConfig || {};

    if (rc.animate) {
      // Animated rendering: use requestAnimationFrame
      var self = this;
      var frameCount = 0;
      var maxFrames = rc.maxFrames || 300; // safety limit

      function animateFrame() {
        if (self._destroyed || frameCount >= maxFrames) return;
        self._doRender(dataset, columnMapping || {}, paletteConfig || {}, rc, styleKey);
        frameCount++;
        self._animationId = requestAnimationFrame(animateFrame);
      }

      this._animationId = requestAnimationFrame(animateFrame);
    } else {
      // Synchronous rendering (default)
      this._doRender(dataset, columnMapping || {}, paletteConfig || {}, rc, styleKey);
    }
  };

  /**
   * Render artwork using explicit dimension values (Manual mode).
   * Bypasses dataset-based normalization and creates data points directly.
   *
   * @param {Object} explicitDimensions - { x: -1..1, y: -1..1, size: pixels, opacity: 0..1, rotation: 0..360, color: hex }
   * @param {Object} paletteConfig - { colors: ["#hex", ...], background: "#hex" (optional) }
   * @param {Object} renderingConfig - style-specific config merged with defaults
   * @param {string} styleKey - style identifier
   */
  Renderer.prototype.renderUsingExplicitDimensions = function(explicitDimensions, paletteConfig, renderingConfig, styleKey) {
    if (this._destroyed) {
      log('Renderer: cannot render, renderer is destroyed');
      return;
    }

    var styleModule;
    try {
      styleModule = window.DataToArt.ArtStyles.getStyle(styleKey);
    } catch (e) {
      console.error('[Renderer] Error getting style "' + styleKey + '":', e.message,
                    '. Available styles:', window.DataToArt.ArtStyles.listStyles().join(', '));
      log('Renderer error:', e.message);
      return;
    }

    var cssWidth = this.canvas.width / this._dpr;
    var cssHeight = this.canvas.height / this._dpr;

    // Clear canvas
    this.clear(paletteConfig ? paletteConfig.background : DEFAULT_BACKGROUND);

    // Get style module and ensure it's initialized
    if (typeof styleModule.init === 'function') {
      styleModule.init(this.ctx, this.canvas.width, this.canvas.height, renderingConfig || {});
    }

    // Generate multiple data points for meaningful rendering
    // Different styles need different data structures
    var dataPoints = [];
    var colors = (paletteConfig && paletteConfig.colors) || ['#c9922a', '#f0ece4', '#8a8580', '#444444', '#1c1814'];
    var bg = (paletteConfig && paletteConfig.background) || DEFAULT_BACKGROUND;
    
    // Normalize explicit dimensions to 0-1 range to match data-driven mode format
    // Note: Manual mode uses palette colors only (no explicit color dimension)
    var normX = ((explicitDimensions.x || 0) + 1) / 2;  // -1..1 -> 0..1
    var normY = ((explicitDimensions.y || 0) + 1) / 2;  // -1..1 -> 0..1
    var normSize = (explicitDimensions.size || 100) / 500;  // 0..500 -> 0..1
    var normOpacity = explicitDimensions.opacity !== undefined ? explicitDimensions.opacity : 1;  // already 0..1
    var normRotation = (explicitDimensions.rotation || 0) / 360;  // 0..360 -> 0..1

    // Use palette colors only for Manual mode data points
    var modifiedPalette = paletteConfig || {};
    if (!modifiedPalette.colors) {
      modifiedPalette.colors = colors;
    }

    // Use a reasonable default set of data points based on the style
    var numPoints = 30;  // Default number of points

    // Save context and apply canvas-level transformations for visual dimensions
    // This applies transforms uniformly across ALL art styles
    this.ctx.save();

    // Calculate canvas center offset from explicit dimensions
    // normX/normY of 0.5 = center (no shift), lower/higher shifts artwork
    var translateX = (normX - 0.5) * cssWidth;
    var translateY = (normY - 0.5) * cssHeight;

    // Scale factor: 0..1 maps to 0.5..2.0, with default size=100 mapping to ~1.0
    var scaleFactor = 0.5 + normSize * 1.5;  // 0.5 to 2.0

    // Rotation in radians
    var rotationRad = normRotation * Math.PI * 2;

    // Apply transformations in correct order: translate -> rotate -> scale
    this.ctx.translate(cssWidth / 2 + translateX, cssHeight / 2 + translateY);
    this.ctx.rotate(rotationRad);
    this.ctx.scale(scaleFactor, scaleFactor);

    // Pass opacity via renderingConfig so art styles apply it (they manage their own ctx.globalAlpha)
    var renderConfig = Object.assign({}, renderingConfig || {});
    renderConfig.opacity = normOpacity;
    // Flag for art styles to use centered coordinate system (origin is at canvas center after transform)
    renderConfig.manualMode = true;
    // Pass normalized offset values so styles can position relative to canvas center
    renderConfig.normX = normX;
    renderConfig.normY = normY;

    switch(styleKey) {
      case 'particleField':
      case 'geometricGrid':
      case 'flowingCurves':
      case 'radialWave':
      case 'fractalDust':
      case 'neuralFlow':
      case 'pixelMosaic':
      case 'radialSymmetry':
      case 'heatMap':
      case 'scatterMatrix':
      case 'barCode':
        // Generate a grid of points centered at (0.5, 0.5)
        // Canvas transforms now handle position/size/rotation/opacity
        var cols = Math.ceil(Math.sqrt(numPoints));
        var rows = Math.ceil(numPoints / cols);

        for (var i = 0; i < numPoints; i++) {
          var col = i % cols;
          var row = Math.floor(i / cols);

          // Calculate grid position centered at 0.5, 0.5
          var gridX = (col / (cols - 1 || 1)) - 0.5;  // -0.5 to 0.5
          var gridY = (row / (rows - 1 || 1)) - 0.5;  // -0.5 to 0.5

          // Data points centered around (0.5, 0.5) - transforms handle position
          var x = 0.5 + gridX * 0.6;
          var y = 0.5 + gridY * 0.6;

          // Size: base size for data points (transforms handle scaling)
          var pointSize = 0.5;  // neutral size, canvas scale handles overall size

          dataPoints.push({
            x: x,
            y: y,
            size: pointSize,
            color: null,
            opacity: null,  // null signals "use renderingConfig.opacity" in art styles
            rotation: 0  // canvas rotation handles rotation
          });
        }
        break;

      case 'voronoiCells':
        // Voronoi needs scattered points for cells
        for (var i = 0; i < numPoints; i++) {
          // Generate random spread centered around (0.5, 0.5)
          var gridX = (Math.random() - 0.5) * 0.8;
          var gridY = (Math.random() - 0.5) * 0.8;
          dataPoints.push({
            x: 0.5 + gridX,
            y: 0.5 + gridY,
            size: 0.5,
            color: null,
            opacity: null,
            rotation: 0
          });
        }
        modifiedPalette.colors = modifiedPalette.colors || colors;
        break;

      case 'timeSeries':
        // Time series needs sequential data
        for (var i = 0; i < numPoints; i++) {
          var t = i / (numPoints - 1 || 1);  // 0..1
          // Spread along X axis, oscillate on Y, centered at (0.5, 0.5)
          dataPoints.push({
            x: 0.5 + (t - 0.5) * 0.8,
            y: 0.5 + Math.sin(t * Math.PI * 2) * 0.2,
            size: 0.5,
            color: null,
            opacity: null,
            rotation: 0
          });
        }
        break;

      default:
        // Fallback: create a centered grid of points
        var defaultCols = Math.max(1, Math.ceil(Math.sqrt(numPoints)));
        var defaultRows = Math.ceil(numPoints / defaultCols);

        for (var i = 0; i < numPoints; i++) {
          var col = i % defaultCols;
          var row = Math.floor(i / defaultCols);
          // Center around 0.5, 0.5
          var gridX = (col / (defaultCols - 1 || 1)) - 0.5;
          var gridY = (row / (defaultRows - 1 || 1)) - 0.5;
          dataPoints.push({
            x: 0.5 + gridX * 0.6,
            y: 0.5 + gridY * 0.6,
            size: 0.5,
            color: null,
            opacity: null,
            rotation: 0
          });
        }
    }

    // Call the style's render function
    styleModule.render(
      this.ctx,
      cssWidth,
      cssHeight,
      dataPoints,
      modifiedPalette,
      renderConfig
    );

    // Restore context to remove transforms
    this.ctx.restore();

    log('Rendered explicit dimensions for style:', styleKey);
  };

  /**
   * Resize the canvas to match its container and re-render if data is cached.
   */
  Renderer.prototype.resize = function() {
    this._resize();
  };

  /**
   * Clear the canvas, filling with background color.
   * @param {string} [background] - hex color, defaults to #0d0d0d
   */
  Renderer.prototype.clear = function(background) {
    var cssWidth = this.canvas.width / this._dpr;
    var cssHeight = this.canvas.height / this._dpr;

    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform for full pixel clear
    this.ctx.fillStyle = (background && background.background) ? background.background :
                         (typeof background === 'string' ? background : DEFAULT_BACKGROUND);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  };

  /**
   * Export the current canvas as a PNG file download.
   * Uses canvas.toBlob() for better memory efficiency with large canvases.
   *
   * @param {string} [filename="artwork.png"] - download filename
   */
  Renderer.prototype.exportPNG = function(filename) {
    var name = filename || 'artwork.png';
    if (!/\.png$/i.test(name)) {
      name = name + '.png';
    }

    this.canvas.toBlob(function(blob) {
      if (!blob) {
        log('Renderer: toBlob returned null — export failed');
        return;
      }
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(function() {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }, 'image/png');
  };

  /**
   * Destroy the renderer, cleaning up event listeners and state.
   */
  Renderer.prototype.destroy = function() {
    this._destroyed = true;

    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }

    if (this._resizeTimer) {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = null;
    }

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    } else if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }

    this._lastRenderArgs = null;
    this.canvas = null;
    this.ctx = null;
    this._container = null;

    log('Renderer: destroyed');
  };

  // ─── Expose on Global Namespace ────────────────────────────────────────────

  window.DataToArt = window.DataToArt || {};
  window.DataToArt.Renderer = Renderer;

  // Also expose normalization utilities for potential use by other modules
  window.DataToArt.normalize = {
    column: normalizeColumn,
    numeric: normalizeNumeric,
    string: normalizeString,
    boolean: normalizeBoolean,
    date: normalizeDate,
    detectType: detectColumnType
  };
})();
