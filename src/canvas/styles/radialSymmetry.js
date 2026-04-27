/**
 * Radial Symmetry Art Style Module - Kaleidoscope/mirrored patterns
 */
(function() {
  'use strict';
  console.log('[RadialSymmetry] Module loading');
  var MAX_SIZE = 400;

  window.DataToArt = window.DataToArt || {};
  window.DataToArt.RadialSymmetryStyle = {
    maxSize: MAX_SIZE,
    init: function(ctx, w, h, rc) {},
    render: function(ctx, width, height, dataPoints, palette, renderingConfig) {
      var colors = (palette && palette.colors) || ['#c9922a', '#f0ece4', '#8a8580', '#444444'];
      var bg = (palette && palette.background) || '#0d0d0d';
      ctx.save();
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      var cx = width / 2, cy = height / 2;

      // Manual mode: check renderingConfig.manualMode flag set by renderer
      // Data-driven mode: use cx + p.x * width/2 positioning
      var isManualMode = renderingConfig && renderingConfig.manualMode;

      if (isManualMode) {
        // Draw symmetry pattern for each data point (like particleField iterates all points)
        for (var i = 0; i < dataPoints.length; i++) {
          var p = dataPoints[i];
          var manualOpacity = (renderingConfig && renderingConfig.opacity !== undefined) ? renderingConfig.opacity : (p.opacity !== null ? p.opacity : 1);
          var symX = (p.x - 0.5) * width;
          var symY = (p.y - 0.5) * height;
          // Smaller radius since iterating many points instead of one
          var segCount = Math.max(3, Math.floor(((p.size || 0.5) * MAX_SIZE) * 0.01)) || 6;
          this._drawSymmetry(ctx, symX, symY, ((p.size || 0.5) * MAX_SIZE) * 0.1,
              p.rotation || 0, segCount,
              manualOpacity, p.color || colors[i % colors.length], colors);
        }
      } else if (dataPoints && dataPoints.length > 0) {
        // Data-driven: draw symmetry at each data point position
        for (var i = 0; i < Math.min(dataPoints.length, 10); i++) {
          var p = dataPoints[i];
          if (p.x === null || p.y === null) continue;
          var segments = Math.max(3, Math.floor(((p.size || 0.5) * MAX_SIZE) * 0.02)) || 6;
          this._drawSymmetry(ctx, cx + p.x * width/2, cy + p.y * height/2,
              ((p.size || 0.5) * MAX_SIZE) * 0.3, p.rotation || (i * 30), segments,
              p.opacity || 1, colors[i % colors.length], colors);
        }
      }
    },
    _drawSymmetry: function(ctx, x, y, radius, baseRotation, segments, opacity, baseColor, colors) {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(x, y);
      ctx.rotate(baseRotation * Math.PI / 180);

      for (var s = 0; s < segments; s++) {
        ctx.save();
        ctx.rotate((s / segments) * Math.PI * 2);
        this._drawPattern(ctx, radius, colors[s % colors.length]);
        ctx.restore();
      }
      ctx.restore();
    },
    _drawPattern: function(ctx, radius, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radius, -radius * 0.3);
      ctx.lineTo(radius * 0.8, radius * 0.2);
      ctx.lineTo(radius * 0.3, radius * 0.8);
      ctx.lineTo(-radius * 0.2, radius * 0.6);
      ctx.closePath();
      ctx.fill();
    },
    cleanup: function() {}
  };
})();
