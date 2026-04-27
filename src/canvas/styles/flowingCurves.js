/**
 * Flowing Curves Art Style Module
 * Visual metaphor: Organic bezier curves flowing across canvas, guided by data.
 *
 * Dimension mappings:
 *   color → stroke color from palette
 *   size  → stroke weight (lineWidth, minWeight-maxWeight from config)
 *   opacity → stroke alpha
 *
 * Curve generation:
 *   curveCount from renderingConfig determines how many curves to draw.
 *   Each curve uses multiple data rows for its control points.
 *   Control points distributed horizontally across canvas at regular x-intervals.
 *   Y positions derived from mapped column or deterministic distribution.
 *
 * Curve structure:
 *   Bezier curves with 4 control points each (start, two intermediates, end).
 *   Control points spaced horizontally across full canvas width.
 *   Y values from data or smoothed interpolation.
 *
 * Fallbacks when dimensions unmapped (null):
 *   color   → each curve gets a palette color by index
 *   size    → default stroke weight from config
 *   opacity → default 0.6 for layered transparency effect
 *
 * Rendering approach:
 *   For each curve: beginPath, moveTo start point, bezierCurveTo with control
 *   points, stroke. No fill — curves are gestural strokes. Overlapping curves
 *   create layered depth.
 */
(function() {
  'use strict';

  var DEBUG = false;
  function log() { if (DEBUG) console.log.apply(console, arguments); }

  var DEFAULTS = {
    curveCount: 5,
    controlPointsPerCurve: 4,  // start + 2 intermediates + end
    padding: 0.05,             // 5% padding on each side
    minWeight: 1,
    maxWeight: 8,
    defaultWeight: 3,
    defaultOpacity: 0.6,
    smoothing: 0.4             // vertical jitter range for fallback Y positions
  };

  /**
   * Simple deterministic pseudo-random based on seed.
   * Returns a value between 0 and 1.
   */
  function seededRandom(seed) {
    var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  /**
   * Compute a fallback Y position for a control point.
   * Uses a deterministic distribution based on curve and point indices.
   */
  function fallbackY(curveIndex, pointIndex, totalCurves, smoothing) {
    // Base position: distribute curves vertically
    var base = totalCurves <= 1 ? 0.5 : curveIndex / (totalCurves - 1);
    // Add deterministic jitter based on point position
    var jitter = (seededRandom(curveIndex * 100 + pointIndex) - 0.5) * smoothing;
    return Math.max(0, Math.min(1, base + jitter));
  }

  window.DataToArt = window.DataToArt || {};
  window.DataToArt.FlowingCurvesStyle = {
    // Maximum size for VisualDimensions module (pixels)
    maxSize: 200,

    /**
     * One-time setup called before first render.
     */
    init: function(ctx, width, height, renderingConfig) {
      log('FlowingCurves init', width, height);
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
        log('FlowingCurves: no data points to render');
        return;
      }

      var padX = width * config.padding;
      var padY = height * config.padding;
      var drawW = width - padX * 2;
      var drawH = height - padY * 2;
      var curveCount = config.curveCount;
      var pointsPerCurve = config.controlPointsPerCurve;
      var weightRange = config.maxWeight - config.minWeight;

      // Each curve consumes pointsPerCurve data rows for control points
      // If not enough data rows, reuse with cycling
      for (var c = 0; c < curveCount; c++) {
        // Build control points for this curve
        var controlPoints = [];
        for (var p = 0; p < pointsPerCurve; p++) {
          var dataIdx = (c * pointsPerCurve + p) % total;
          var pt = dataPoints[dataIdx];

          // X position: evenly spaced across canvas width
          var normX = pointsPerCurve <= 1 ? 0.5 : p / (pointsPerCurve - 1);
          var px;
          var py;
          // Manual mode: origin is at canvas center after renderer transform
          if (renderingConfig && renderingConfig.manualMode) {
            px = (normX - 0.5) * drawW;
            py = ((pt.y !== null ? pt.y : fallbackY(c, p, curveCount, config.smoothing)) - 0.5) * drawH;
          } else {
            // Data-driven mode: top-left origin with padding
            px = padX + normX * drawW;
            py = padY + (pt.y !== null ? pt.y : fallbackY(c, p, curveCount, config.smoothing)) * drawH;
          }

          controlPoints.push({ x: px, y: py });
        }

        // Determine curve-level visual properties from the first control point's data
        var firstPt = dataPoints[(c * pointsPerCurve) % total];

        // Color
        var color;
        if (firstPt.color !== null) {
          var colorIdx = Math.floor(firstPt.color * (colors.length - 1));
          colorIdx = Math.max(0, Math.min(colors.length - 1, colorIdx));
          color = colors[colorIdx];
        } else {
          color = colors[c % colors.length];
        }

        // Stroke weight
        var lineWidth;
        if (firstPt.size !== null) {
          lineWidth = config.minWeight + firstPt.size * weightRange;
        } else {
          lineWidth = config.defaultWeight;
        }

        // Opacity: use renderingConfig.opacity if provided (from canvas-level visual dimensions), else fall back to point opacity
        var alpha;
        if (renderingConfig && renderingConfig.opacity !== undefined) {
          alpha = renderingConfig.opacity;
        } else if (firstPt.opacity !== null) {
          alpha = Math.max(0, Math.min(1, firstPt.opacity));
        } else {
          alpha = config.defaultOpacity;
        }

        // Draw bezier curve
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(controlPoints[0].x, controlPoints[0].y);

        if (controlPoints.length === 4) {
          // Standard cubic bezier
          ctx.bezierCurveTo(
            controlPoints[1].x, controlPoints[1].y,
            controlPoints[2].x, controlPoints[2].y,
            controlPoints[3].x, controlPoints[3].y
          );
        } else if (controlPoints.length === 3) {
          // Quadratic bezier
          ctx.quadraticCurveTo(
            controlPoints[1].x, controlPoints[1].y,
            controlPoints[2].x, controlPoints[2].y
          );
        } else if (controlPoints.length >= 5) {
          // Multi-segment: use bezierCurveTo for each group of 3 intermediate points
          for (var s = 1; s <= controlPoints.length - 3; s += 3) {
            ctx.bezierCurveTo(
              controlPoints[s].x, controlPoints[s].y,
              controlPoints[s + 1].x, controlPoints[s + 1].y,
              controlPoints[Math.min(s + 2, controlPoints.length - 1)].x,
              controlPoints[Math.min(s + 2, controlPoints.length - 1)].y
            );
          }
        } else {
          // 2 points: straight line
          ctx.lineTo(controlPoints[1].x, controlPoints[1].y);
        }

        ctx.stroke();
        ctx.restore();
      }

      log('FlowingCurves rendered', curveCount, 'curves');
    },

    /**
     * Optional cleanup when switching styles.
     */
    cleanup: function() {
      log('FlowingCurves cleanup');
    }
  };
})();
