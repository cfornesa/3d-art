/**
 * Radial Wave Art Style Module
 * Visual metaphor: Concentric pulsing waves emanating from center point.
 * Uses explicit dimension values in Manual mode, or column-mapped data in Data-driven mode.
 *
 * In Manual mode: Single wave centered at (x,y) with size as amplitude
 * In Data-driven mode: Multiple particles create wave interference patterns
 *
 * Design per DESIGN.md + CONSTRAINTS.md:
 *   - Hard offset shadows (4px 4px 0px) on elevated elements
 *   - No gradients on UI surfaces (C-02)
 *   - Canvas output exempt from gradient constraint
 */
(function() {
  'use strict';

  console.log('[RadialWave] Module loading');

  // Maximum size for VisualDimensions module (pixels)
  var MAX_SIZE = 500;

  // Default rendering config
  var DEFAULTS = {
    waveCount: 3,
    waveOpacity: 0.3,
    pulseSpeed: 0.5,
    strokeWidth: 1
  };

  /**
   * Radial Wave Art Style
   */
  window.DataToArt = window.DataToArt || {};
  window.DataToArt.RadialWaveStyle = {
    maxSize: MAX_SIZE,

    /**
     * One-time setup called before first render.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width - canvas pixel width
     * @param {number} height - canvas pixel height
     * @param {Object} renderingConfig
     */
    init: function(ctx, width, height, renderingConfig) {
      this._ctx = ctx;
      this._width = width;
      this._height = height;
      this._config = renderingConfig || {};
      this._time = 0;
    },

    /**
     * Main rendering function.
     * In Manual mode: renders waves based on explicit x, y, size dimensions.
     * In Data-driven mode: renders waves for each data point.
     *
     * @param {CanvasRenderingContext2D} ctx - Canvas context (may differ from init)
     * @param {number} width - canvas CSS width
     * @param {number} height - canvas CSS height
     * @param {Array} dataPoints - Array of normalized data point objects
     * @param {Object} paletteConfig - { colors: ["#hex"], background: "#hex" }
     * @param {Object} renderingConfig - style-specific options
     */
    render: function(ctx, width, height, dataPoints, paletteConfig, renderingConfig) {
      var config = renderingConfig || {};
      var colors = (paletteConfig && paletteConfig.colors) || ['#c9922a', '#f0ece4', '#8a8580', '#444444', '#1c1814'];
      var background = (paletteConfig && paletteConfig.background) || '#0d0d0d';

      var centerX = width / 2;
      var centerY = height / 2;
      var maxRadius = Math.sqrt(width * width + height * height) / 2;

      // Clear with background
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width * window.devicePixelRatio, height * window.devicePixelRatio);
      ctx.restore();

      var waveCount = config.waveCount || DEFAULTS.waveCount;
      var waveOpacity = config.waveOpacity || DEFAULTS.waveOpacity;

      // Determine if we're in Manual mode (single explicit point) or Data-driven mode
      var isManualMode = dataPoints && dataPoints.length === 1 &&
                        dataPoints[0].x !== null && dataPoints[0].y !== null;

      if (isManualMode && dataPoints[0].x !== undefined && dataPoints[0].y !== undefined) {
        // Manual mode: use explicit dimensions for single wave source
        var point = dataPoints[0];
        var waveX;
        var waveY;
        // Manual mode: canvas origin is at center after renderer transform
        if (renderingConfig && renderingConfig.manualMode) {
          waveX = (point.x - 0.5) * width;
          waveY = (point.y - 0.5) * height;
        } else {
          waveX = centerX + (point.x * width / 2);
          waveY = centerY + (point.y * height / 2);
        }
        var amplitude = (point.size || 0) * maxRadius * 0.5;
        // Use renderingConfig.opacity if provided (from canvas-level visual dimensions), else fall back to point opacity
        var manualOpacity = (renderingConfig && renderingConfig.opacity !== undefined) ? renderingConfig.opacity : (point.opacity || 1);

        // Draw concentric waves from the explicit position
        for (var w = 0; w < waveCount; w++) {
          var radius = amplitude * (w + 1) * 1.5;
          var opacity = waveOpacity / (w + 1);
          var colorIndex = w % colors.length;

          ctx.globalAlpha = opacity * manualOpacity;
          ctx.strokeStyle = colors[colorIndex];
          ctx.lineWidth = config.strokeWidth || DEFAULTS.strokeWidth + w * 0.5;

          // Pulsing animation based on rotation (used as time in manual mode)
          var pulseOffset = (point.rotation || 0) / 360 * Math.PI * 2 * (w + 1);
          var currentRadius = radius * (0.8 + 0.2 * Math.cos(pulseOffset));

          ctx.beginPath();
          ctx.arc(waveX, waveY, currentRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

      } else {
        // Data-driven mode: create waves from each data point
        var waveIndex = 0;
        for (var i = 0; i < dataPoints.length; i++) {
          var p = dataPoints[i];
          if (p.x === null || p.y === null) continue;

          var px;
          var py;
          // Manual mode: canvas origin is at center after renderer transform
          if (renderingConfig && renderingConfig.manualMode) {
            px = (p.x - 0.5) * width;
            py = (p.y - 0.5) * height;
          } else {
            px = centerX + (p.x * width / 2);
            py = centerY + (p.y * height / 2);
          }
          var size = p.size || 0.5;
          var amplitude = size * maxRadius * 0.3;
          var opacity = (p.opacity !== null && p.opacity !== undefined) ? p.opacity : 1;
          var colorIndex = i % colors.length;

          for (var w = 0; w < waveCount; w++) {
            var radius = amplitude * (w + 1) * 1.5;
            var waveOpacity = opacity * (config.waveOpacity || DEFAULTS.waveOpacity) / (w + 1);

            ctx.globalAlpha = waveOpacity;
            ctx.strokeStyle = colors[colorIndex];
            ctx.lineWidth = config.strokeWidth || DEFAULTS.strokeWidth + w * 0.5;

            // Pulsing animation
            var pulseOffset = waveIndex * 0.2 + w * 0.3;
            var currentRadius = radius * (0.8 + 0.2 * Math.cos(pulseOffset));

            ctx.beginPath();
            ctx.arc(px, py, currentRadius, 0, Math.PI * 2);
            ctx.stroke();

            waveIndex++;
          }
        }
        ctx.globalAlpha = 1;
      }

      console.log('[RadialWave] Rendered', dataPoints ? dataPoints.length : 0, 'points');
    },

    /**
     * Optional cleanup when switching styles.
     */
    cleanup: function() {
      // Nothing to clean up
    }
  };
})();
