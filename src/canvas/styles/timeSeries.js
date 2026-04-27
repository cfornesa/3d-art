/**
 * Time Series Art Style Module - Animated flowing data particles
 */
(function() {
  'use strict';
  console.log('[TimeSeries] Module loading');
  var MAX_SIZE = 500;

  window.DataToArt = window.DataToArt || {};
  window.DataToArt.TimeSeriesStyle = {
    maxSize: MAX_SIZE,
    init: function(ctx, w, h, rc) {
      this._lastTime = Date.now();
    },
    render: function(ctx, width, height, dataPoints, palette, renderingConfig) {
      var colors = (palette && palette.colors) || ['#c9922a', '#f0ece4', '#8a8580'];
      var bg = (palette && palette.background) || '#0d0d0d';
      var now = Date.now();
      var elapsed = (now - (this._lastTime || now)) / 1000;
      this._lastTime = now;

      ctx.save();
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      var cx = width / 2, cy = height / 2;

      // Manual mode: check renderingConfig.manualMode flag set by renderer
      // Data-driven mode: use cx + p.x * width/2 positioning
      var isManualMode = renderingConfig && renderingConfig.manualMode;

      if (isManualMode) {
        // Draw particle flow for each data point (like particleField iterates all points)
        for (var i = 0; i < dataPoints.length; i++) {
          var p = dataPoints[i];
          var manualOpacity = (renderingConfig && renderingConfig.opacity !== undefined) ? renderingConfig.opacity : (p.opacity !== null ? p.opacity : 1);
          var flowX = (p.x - 0.5) * width;
          var flowY = (p.y - 0.5) * height;
          // Smaller size since iterating many points instead of one
          this._drawParticleFlow(ctx, width, height, flowX, flowY,
              ((p.size || 0.5) * MAX_SIZE) * 0.02, elapsed, manualOpacity, (p.rotation || 0) + (i * 15), p.color || colors[i % colors.length], colors);
        }
      } else if (dataPoints && dataPoints.length > 0) {
        // Data-driven: draw particle flows at each data point position
        for (var i = 0; i < Math.min(dataPoints.length, 40); i++) {
          var p = dataPoints[i];
          if (p.x === null || p.y === null) continue;
          var size = ((p.size || 0.5) * MAX_SIZE) * 0.05;
          var flowX = cx + p.x * width/2;
          var flowY = cy + p.y * height/2;
          this._drawParticleFlow(ctx, width, height, flowX, flowY,
              size, elapsed, p.opacity || 1, (p.rotation || 0) + (i * 15), colors[i % colors.length], colors);
        }
      }
    },
    _drawParticleFlow: function(ctx, w, h, x, y, size, elapsed, opacity, baseRotation, baseColor, colors) {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(x, y);
      ctx.rotate(baseRotation * Math.PI / 180);

      var particleCount = Math.floor(size * 50) + 10;
      var angleOffset = elapsed * 0.5;

      for (var i = 0; i < particleCount; i++) {
        var angle = (i / particleCount) * Math.PI * 2 + angleOffset;
        var distance = size * (0.5 + Math.sin(elapsed + i * 0.2) * 0.5);
        var px = Math.cos(angle) * distance;
        var py = Math.sin(angle) * distance;
        var particleSize = size * 0.2 * (0.5 + Math.random() * 0.5);
        var trailLength = i / particleCount;

        ctx.fillStyle = colors[Math.floor(i * colors.length / particleCount) % colors.length];
        ctx.beginPath();
        ctx.arc(px, py, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
    cleanup: function() {}
  };
})();
