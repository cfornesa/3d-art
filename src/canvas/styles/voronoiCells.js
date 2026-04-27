/**
 * Voronoi Cells Art Style Module - Polygonal Voronoi diagram
 */
(function() {
  'use strict';
  console.log('[VoronoiCells] Module loading');
  var MAX_SIZE = 400;

  window.DataToArt = window.DataToArt || {};
  window.DataToArt.VoronoiCellsStyle = {
    maxSize: MAX_SIZE,
    init: function(ctx, w, h, rc) {},
    render: function(ctx, width, height, dataPoints, palette, renderingConfig) {
      var colors = (palette && palette.colors) || ['#c9922a', '#f0ece4', '#8a8580', '#444444', '#1c1814'];
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
        // Collect all data points and draw ONE cohesive Voronoi diagram
        // Position relative to transformed origin (0,0 = canvas center)
        var points = [];
        for (var i = 0; i < Math.min(dataPoints.length, 30); i++) {
          var p = dataPoints[i];
          var px = (p.x - 0.5) * width;
          var py = (p.y - 0.5) * height;
          points.push({
            x: px,
            y: py,
            color: p.color !== null ? colors[Math.floor(p.color * (colors.length - 1))] : colors[i % colors.length],
            size: p.size || 0.5
          });
        }
        // Draw cohesive Voronoi from all collected points
        this._drawVoronoiFromPoints(ctx, width, height, points, dataPoints, palette, renderingConfig);
      } else if (dataPoints && dataPoints.length > 0) {
        // Data-driven: draw voronoi at each data point position
        var points = [];
        for (var i = 0; i < Math.min(dataPoints.length, 20); i++) {
          var p = dataPoints[i];
          if (p.x === null || p.y === null) continue;
          var ptX = cx + p.x * width/2;
          var ptY = cy + p.y * height/2;
          points.push({
            x: ptX,
            y: ptY,
            color: colors[i % colors.length]
          });
        }
        this._drawVoronoiFromPoints(ctx, width, height, points, dataPoints, palette, renderingConfig);
      }
    },
    _drawVoronoi: function(ctx, w, h, cx, cy, radius, count, opacity, baseColor, colors) {
      var points = [];
      for (var i = 0; i < count; i++) {
        var angle = (i / count) * Math.PI * 2;
        var r = radius * (0.7 + Math.random() * 0.3);
        points.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          color: colors[i % colors.length]
        });
      }
      this._drawVoronoiFromPoints(ctx, w, h, points, {}, {colors: colors}, {});
      ctx.globalAlpha = opacity;
    },
    _drawVoronoiFromPoints: function(ctx, w, h, points, dataPoints, palette, rc) {
      var colors = (palette && palette.colors) || ['#c9922a', '#f0ece4', '#8a8580'];
      var bg = (palette && palette.background) || '#0d0d0d';

      // Simple voronoi approximation: draw cells by finding nearest points
      var img = ctx.getImageData(0, 0, w, h);
      var data = img.data;

      // Sample full canvas relative to transformed origin (0,0 = canvas center)
      for (var y = -h/2; y < h/2; y += 4) {
        for (var x = -w/2; x < w/2; x += 4) {
          var nearestDist = Infinity;
          var nearestColor = colors[0];
          for (var i = 0; i < points.length; i++) {
            var dx = x - points[i].x;
            var dy = y - points[i].y;
            var dist = dx * dx + dy * dy;
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestColor = points[i].color || colors[i % colors.length];
            }
          }
          // Draw a small rect at this position
          ctx.fillStyle = nearestColor;
          ctx.fillRect(x, y, 4, 4);
        }
      }
    },
    cleanup: function() {}
  };
})();
