/**
 * Geometric Grid Art Style Module
 * Visual metaphor: Tiled geometric cells with data-driven variation.
 *
 * Dimension mappings:
 *   color    → palette index for cell fill
 *   size     → scale factor for shape within cell (0 = empty, 1 = fills cell)
 *   opacity  → cell fill alpha
 *   rotation → shape rotation in degrees (0-360 mapped from 0-1)
 *
 * Grid calculation:
 *   gridCols and gridRows from renderingConfig
 *   Cell width = canvas.width / gridCols
 *   Cell height = canvas.height / gridRows
 *   Data rows map to grid cells sequentially (left-to-right, top-to-bottom)
 *
 * Supported shapes (renderingConfig.shape):
 *   "rectangle" (default), "circle", "diamond", "triangle"
 *
 * Fallbacks when dimensions unmapped (null):
 *   color    → sequential palette cycling
 *   size     → default 0.7 (partial fill looks intentional)
 *   opacity  → default 1.0
 *   rotation → no rotation (0 degrees)
 */
(function() {
  'use strict';

  var DEBUG = false;
  function log() { if (DEBUG) console.log.apply(console, arguments); }

  var DEFAULTS = {
    gridCols: 10,
    gridRows: 10,
    cellPadding: 4,       // pixels of padding within each cell
    shape: 'rectangle',   // "rectangle", "circle", "diamond", "triangle"
    defaultSize: 0.7,
    defaultOpacity: 1.0,
    defaultRotation: 0    // degrees
  };

  /**
   * Draw a rectangle centered at (cx, cy) with given half-widths.
   */
  function drawRectangle(ctx, cx, cy, hw, hh) {
    ctx.fillRect(cx - hw, cy - hh, hw * 2, hh * 2);
  }

  /**
   * Draw a circle centered at (cx, cy) with given radius.
   */
  function drawCircle(ctx, cx, cy, hw, hh) {
    var radius = Math.min(hw, hh);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
    ctx.fill();
  }

  /**
   * Draw a diamond (rotated square) centered at (cx, cy).
   */
  function drawDiamond(ctx, cx, cy, hw, hh) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draw a triangle centered at (cx, cy).
   */
  function drawTriangle(ctx, cx, cy, hw, hh) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - hh);
    ctx.lineTo(cx + hw, cy + hh);
    ctx.lineTo(cx - hw, cy + hh);
    ctx.closePath();
    ctx.fill();
  }

  var SHAPE_DRAWERS = {
    rectangle: drawRectangle,
    circle: drawCircle,
    diamond: drawDiamond,
    triangle: drawTriangle
  };

  window.DataToArt = window.DataToArt || {};
  window.DataToArt.GeometricGridStyle = {
    // Maximum size for VisualDimensions module (pixels)
    maxSize: 300,

    /**
     * One-time setup called before first render.
     */
    init: function(ctx, width, height, renderingConfig) {
      log('GeometricGrid init', width, height);
    },

    /**
     * Main rendering function.
     */
    render: function(ctx, width, height, dataPoints, paletteConfig, renderingConfig) {
      var config = {};
      var key;
      for (key in DEFAULTS) {
        if (DEFAULTS.hasOwnProperty(key)) {
          config[key] = DEFAULTS[key];
        }
      }
      for (key in renderingConfig) {
        if (renderingConfig.hasOwnProperty(key)) {
          config[key] = renderingConfig[key];
        }
      }

      var colors = paletteConfig.colors || ['#f0ece4'];
      var total = dataPoints.length;
      if (total === 0) {
        log('GeometricGrid: no data points to render');
        return;
      }

      var cellW = width / config.gridCols;
      var cellH = height / config.gridRows;
      var pad = config.cellPadding;
      var drawFn = SHAPE_DRAWERS[config.shape] || SHAPE_DRAWERS.rectangle;

      var maxCells = config.gridCols * config.gridRows;
      var renderCount = Math.min(total, maxCells);

      // Manual mode: check renderingConfig.manualMode flag set by renderer
      var isManualMode = renderingConfig && renderingConfig.manualMode;

      for (var i = 0; i < renderCount; i++) {
        var pt = dataPoints[i];
        var col, row, cx, cy;

        if (isManualMode) {
          // In manual mode, use data point's x,y to determine grid position
          // Data points have x,y in range [0,1], map to centered grid coordinates
          var normX = pt.x !== null ? pt.x : (i % config.gridCols) / config.gridCols;
          var normY = pt.y !== null ? pt.y : Math.floor(i / config.gridCols) / config.gridRows;
          // Convert to centered canvas coordinates
          cx = (normX - 0.5) * width;
          cy = (normY - 0.5) * height;
        } else {
          // Data-driven mode: use sequential index for grid position
          col = i % config.gridCols;
          row = Math.floor(i / config.gridCols);
          cx = col * cellW + cellW / 2;
          cy = row * cellH + cellH / 2;
        }

        // Available half-widths within padded cell
        var maxHW = (cellW / 2) - pad;
        var maxHH = (cellH / 2) - pad;
        if (maxHW <= 0 || maxHH <= 0) continue;

        // Size: scale factor 0-1
        var scale;
        if (pt.size !== null) {
          scale = Math.max(0, Math.min(1, pt.size));
        } else {
          scale = config.defaultSize;
        }

        var hw = maxHW * scale;
        var hh = maxHH * scale;

        // Color
        var color;
        if (pt.color !== null) {
          var colorIdx = Math.floor(pt.color * (colors.length - 1));
          colorIdx = Math.max(0, Math.min(colors.length - 1, colorIdx));
          color = colors[colorIdx];
        } else {
          color = colors[i % colors.length];
        }

        // Opacity: use renderingConfig.opacity if provided (from canvas-level visual dimensions), else fall back to point opacity
        var alpha;
        if (renderingConfig && renderingConfig.opacity !== undefined) {
          alpha = renderingConfig.opacity;
        } else if (pt.opacity !== null) {
          alpha = Math.max(0, Math.min(1, pt.opacity));
        } else {
          alpha = config.defaultOpacity;
        }

        // Rotation
        var rotation;
        if (pt.rotation !== null) {
          rotation = pt.rotation * 360; // 0-1 mapped to 0-360 degrees
        } else {
          rotation = config.defaultRotation;
        }

        // Draw
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;

        if (rotation !== 0) {
          ctx.translate(cx, cy);
          ctx.rotate(rotation * Math.PI / 180);
          ctx.translate(-cx, -cy);
        }

        // Zero-size = empty cell (skip drawing)
        if (scale > 0.01) {
          drawFn(ctx, cx, cy, hw, hh);
        }

        ctx.restore();
      }

      log('GeometricGrid rendered', renderCount, 'cells');
    },

    /**
     * Optional cleanup when switching styles.
     */
    cleanup: function() {
      log('GeometricGrid cleanup');
    }
  };
})();
