/**
 * Particle Field Art Style Module
 * Visual metaphor: Field of glowing particles drifting through data space.
 *
 * Dimension mappings:
 *   x       → horizontal position (0-1 mapped to canvas width with padding)
 *   y       → vertical position (0-1 mapped to canvas height with padding)
 *   size    → particle radius (minSize-maxSize from config)
 *   color   → palette index selection (0-1 maps to palette.length indices)
 *   opacity → alpha value (0-1 mapped to minOpacity-maxOpacity)
 *
 * Fallbacks when dimensions unmapped (null):
 *   x       → deterministic grid layout based on row index
 *   y       → deterministic vertical distribution based on row index
 *   size    → default to config.defaultSize or mean of min/max
 *   color   → cycle through palette sequentially
 *   opacity → default to config.defaultOpacity (0.8)
 */
(function() {
  'use strict';

  console.log('[ParticleField] Module loading');
  var DEBUG = false;
  function log() { if (DEBUG) console.log.apply(console, arguments); }

  var DEFAULTS = {
    padding: 0.05,          // 5% padding on each side
    minSize: 2,             // minimum particle radius in pixels
    maxSize: 20,            // maximum particle radius in pixels
    defaultSize: null,      // if null, uses mean of min/max
    defaultOpacity: 0.8,
    minOpacity: 0.1,
    maxOpacity: 1.0,
    glowEnabled: true,      // subtle glow via shadowBlur (C-03 exempt)
    glowBlur: 8
  };

  /**
   * Compute a deterministic grid position for a row index when x is not mapped.
   * Distributes points evenly across the canvas width.
   */
  function fallbackX(index, total) {
    if (total <= 1) return 0.5;
    return index / (total - 1);
  }

  /**
   * Compute a deterministic vertical position for a row index when y is not mapped.
   * Distributes points evenly across the canvas height.
   */
  function fallbackY(index, total) {
    if (total <= 1) return 0.5;
    return index / (total - 1);
  }

  window.DataToArt = window.DataToArt || {};
  window.DataToArt.ParticleFieldStyle = {
    // Maximum size for VisualDimensions module (pixels)
    maxSize: 40,

    /**
     * One-time setup called before first render.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width - canvas pixel width
     * @param {number} height - canvas pixel height
     * @param {Object} renderingConfig
     */
    init: function(ctx, width, height, renderingConfig) {
      log('ParticleField init', width, height);
      // No persistent state needed; rendering is stateless per call
    },

    /**
     * Main rendering function.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width - canvas pixel width
     * @param {number} height - canvas pixel height
     * @param {Array} dataPoints - array of {x, y, size, color, opacity, rotation}
     * @param {Object} paletteConfig - { colors: [...], background: "#hex" }
     * @param {Object} renderingConfig - merged defaults + user overrides
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
        log('ParticleField: no data points to render');
        return;
      }

      var padX = width * config.padding;
      var padY = height * config.padding;
      var drawW = width - padX * 2;
      var drawH = height - padY * 2;
      var sizeRange = config.maxSize - config.minSize;
      var defaultSizeVal = config.defaultSize !== null ? config.defaultSize : (config.minSize + config.maxSize) / 2;
      var opacityRange = config.maxOpacity - config.minOpacity;

      // Save context state for glow restoration
      var prevShadowBlur = ctx.shadowBlur;
      var prevShadowColor = ctx.shadowColor;

      for (var i = 0; i < total; i++) {
        var pt = dataPoints[i];

        // X and Y positions
        var normX = pt.x !== null ? pt.x : fallbackX(i, total);
        var normY = pt.y !== null ? pt.y : fallbackY(i, total);
        var px;
        var py;
        // Manual mode: origin is at canvas center after renderer transform
        if (renderingConfig && renderingConfig.manualMode) {
          px = (normX - 0.5) * drawW;
          py = (normY - 0.5) * drawH;
        } else {
          // Data-driven mode: top-left origin with padding
          px = padX + normX * drawW;
          py = padY + normY * drawH;
        }

        // Size
        var radius;
        if (pt.size !== null) {
          radius = config.minSize + pt.size * sizeRange;
        } else {
          radius = defaultSizeVal;
        }

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
        alpha = config.minOpacity + pt.opacity * opacityRange;
      } else {
        alpha = config.defaultOpacity;
      }

        // Draw particle
        ctx.save();
        ctx.globalAlpha = alpha;

        if (config.glowEnabled) {
          ctx.shadowBlur = config.glowBlur;
          ctx.shadowColor = color;
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2, true);
        ctx.fill();

        ctx.restore();
      }

      // Restore context state
      ctx.shadowBlur = prevShadowBlur;
      ctx.shadowColor = prevShadowColor;
      log('ParticleField rendered', total, 'particles');
    },

    /**
     * Optional cleanup when switching styles.
     */
    cleanup: function() {
      log('ParticleField cleanup');
    }
  };
})();
