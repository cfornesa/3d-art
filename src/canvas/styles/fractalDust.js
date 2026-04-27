/**
 * Fractal Dust Art Style Module
 * Visual metaphor: Recursive particle subdivision creating fractal patterns.
 * Uses explicit dimension values in Manual mode, or column-mapped data in Data-driven mode.
 */
(function() {
  'use strict';

  console.log('[FractalDust] Module loading');
  var MAX_SIZE = 300;

  window.DataToArt = window.DataToArt || {};
  window.DataToArt.FractalDustStyle = {
    maxSize: MAX_SIZE,

    init: function(ctx, width, height, renderingConfig) {
      this._ctx = ctx;
      this._width = width;
      this._height = height;
      this._config = renderingConfig || {};
    },

    render: function(ctx, width, height, dataPoints, paletteConfig, renderingConfig) {
      var colors = (paletteConfig && paletteConfig.colors) || ['#c9922a', '#f0ece4', '#8a8580', '#444444'];
      var background = (paletteConfig && paletteConfig.background) || '#0d0d0d';

      // Clear
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width * window.devicePixelRatio, height * window.devicePixelRatio);
      ctx.restore();

      var centerX = width / 2;
      var centerY = height / 2;
      var config = renderingConfig || {};
      var subdivisions = config.subdivisions || 4;
      var density = config.density || 0.5;
      var particleSize = config.particleSize || 2;

      var isManualMode = dataPoints && dataPoints.length === 1 &&
                        dataPoints[0].x !== null && dataPoints[0].y !== null;

      if (isManualMode && dataPoints[0].x !== undefined && dataPoints[0].y !== undefined) {
        // Manual mode: use explicit dimensions
        var p = dataPoints[0];
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
        var size = (p.size || MAX_SIZE) * 0.1;
        // Use renderingConfig.opacity if available (from canvas-level visual dimensions)
        var opacity = (renderingConfig && renderingConfig.opacity !== undefined) 
            ? renderingConfig.opacity 
            : (p.opacity !== null ? p.opacity : 1);
        var rotation = (p.rotation || 0) * Math.PI / 180;
        var color = p.color || colors[0];

        this._renderFractal(ctx, px, py, size, opacity, rotation, color, colors, subdivisions, density, particleSize);
      } else {
        // Data-driven mode
        for (var i = 0; i < Math.min(dataPoints.length, 100); i++) {
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
          var size = ((p.size || 0.5) * MAX_SIZE) * 0.1;
          var opacity = p.opacity || 1;
          var rotation = (p.rotation || 0) * Math.PI / 180;
          var color = colors[i % colors.length];
          var localDensity = density * ((p.size || 0.5) + 0.5);

          this._renderFractal(ctx, px, py, size, opacity, rotation, color, colors, subdivisions, localDensity, particleSize);
        }
      }

      console.log('[FractalDust] Rendered', dataPoints ? dataPoints.length : 0, 'points');
    },

    _renderFractal: function(ctx, x, y, size, opacity, rotation, baseColor, colors, depth, density, particleSize) {
      if (depth <= 0) return;

      ctx.save();
      ctx.globalAlpha = opacity * (1 - depth * 0.2);
      ctx.translate(x, y);
      ctx.rotate(rotation);

      // Draw center particle
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(0, 0, particleSize * (depth + 1), 0, Math.PI * 2);
      ctx.fill();

      // Recursive subdivision
      var angleStep = Math.PI * 2 / 5;
      var offset = size * 0.6;

      for (var i = 0; i < 5; i++) {
        if (Math.random() > density) continue;
        var angle = i * angleStep + Math.random() * 0.2;
        var subX = Math.cos(angle) * offset;
        var subY = Math.sin(angle) * offset;
        var subSize = size * 0.6;
        var subColor = colors[(i + 1) % colors.length];

        this._renderFractal(ctx, subX, subY, subSize, opacity, rotation + angle, subColor, colors, depth - 1, density * 0.8, particleSize);
      }

      ctx.restore();
    },

    cleanup: function() {}
  };
})();
