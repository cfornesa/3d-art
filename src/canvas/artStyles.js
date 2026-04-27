/**
 * Art Styles Registry
 * Maintains an internal registry of available art style modules.
 * Three built-in styles are auto-registered on load if available.
 *
 * Style Module Interface:
 *   {
 *     init: function(ctx, width, height, renderingConfig) {},
 *     render: function(ctx, width, height, dataPoints, paletteConfig, renderingConfig) {},
 *     cleanup: function() {} // optional
 *   }
 *
 * dataPoints structure (per point):
 *   { x: 0-1|null, y: 0-1|null, size: 0-1|null, color: 0-1|null, opacity: 0-1|null, rotation: 0-1|null }
 */
(function() {
  'use strict';

  var DEBUG = false;
  function log() { if (DEBUG) console.log.apply(console, arguments); }
  console.log('[ArtStyles] Module loading');

  var registry = {};

  /**
   * Explicitly register the three built-in styles.
   * Safe to call multiple times — idempotent.
   * Exposed as public API for delayed/batched registration scenarios.
   */
  function registerBuiltinStyles() {
    if (window.DataToArt && window.DataToArt.ParticleFieldStyle) {
      registry['particleField'] = window.DataToArt.ParticleFieldStyle;
      log('ArtStyles: registered particleField');
    }
    if (window.DataToArt && window.DataToArt.GeometricGridStyle) {
      registry['geometricGrid'] = window.DataToArt.GeometricGridStyle;
      log('ArtStyles: registered geometricGrid');
    }
    if (window.DataToArt && window.DataToArt.FlowingCurvesStyle) {
      registry['flowingCurves'] = window.DataToArt.FlowingCurvesStyle;
      log('ArtStyles: registered flowingCurves');
    }
    // New Session 27 styles
    if (window.DataToArt && window.DataToArt.RadialWaveStyle) {
      registry['radialWave'] = window.DataToArt.RadialWaveStyle;
      log('ArtStyles: registered radialWave');
    }
    if (window.DataToArt && window.DataToArt.FractalDustStyle) {
      registry['fractalDust'] = window.DataToArt.FractalDustStyle;
      log('ArtStyles: registered fractalDust');
    }
    if (window.DataToArt && window.DataToArt.NeuralFlowStyle) {
      registry['neuralFlow'] = window.DataToArt.NeuralFlowStyle;
      log('ArtStyles: registered neuralFlow');
    }
    if (window.DataToArt && window.DataToArt.PixelMosaicStyle) {
      registry['pixelMosaic'] = window.DataToArt.PixelMosaicStyle;
      log('ArtStyles: registered pixelMosaic');
    }
    if (window.DataToArt && window.DataToArt.VoronoiCellsStyle) {
      registry['voronoiCells'] = window.DataToArt.VoronoiCellsStyle;
      log('ArtStyles: registered voronoiCells');
    }
    if (window.DataToArt && window.DataToArt.RadialSymmetryStyle) {
      registry['radialSymmetry'] = window.DataToArt.RadialSymmetryStyle;
      log('ArtStyles: registered radialSymmetry');
    }
    if (window.DataToArt && window.DataToArt.TimeSeriesStyle) {
      registry['timeSeries'] = window.DataToArt.TimeSeriesStyle;
      log('ArtStyles: registered timeSeries');
    }
    if (window.DataToArt && window.DataToArt.HeatMapStyle) {
      registry['heatMap'] = window.DataToArt.HeatMapStyle;
      log('ArtStyles: registered heatMap');
    }
    if (window.DataToArt && window.DataToArt.ScatterMatrixStyle) {
      registry['scatterMatrix'] = window.DataToArt.ScatterMatrixStyle;
      log('ArtStyles: registered scatterMatrix');
    }
    if (window.DataToArt && window.DataToArt.BarCodeStyle) {
      registry['barCode'] = window.DataToArt.BarCodeStyle;
      log('ArtStyles: registered barCode');
    }
  }

  // Auto-register at load time (existing behavior for forward compatibility)
  registerBuiltinStyles();
  console.log('[ArtStyles] Auto-registration complete. Registered styles:', Object.keys(registry).join(', ') || 'none');

  window.DataToArt = window.DataToArt || {};
  window.DataToArt.ArtStyles = {

    /**
     * Retrieve a registered style module by key.
     * @param {string} styleKey
     * @returns {Object} style module with init/render/[cleanup] methods
     * @throws {Error} if styleKey is not registered
     */
    getStyle: function(styleKey) {
      if (!registry[styleKey]) {
        throw new Error('ArtStyles: unknown style "' + styleKey + '". Registered: ' + Object.keys(registry).join(', '));
      }
      return registry[styleKey];
    },

    /**
     * List all registered style keys.
     * @returns {string[]}
     */
    listStyles: function() {
      return Object.keys(registry);
    },

    /**
     * Register a new style module.
     * @param {string} styleKey
     * @param {Object} styleModule - must implement at least init() and render()
     */
    registerStyle: function(styleKey, styleModule) {
      if (!styleModule || typeof styleModule.init !== 'function' || typeof styleModule.render !== 'function') {
        throw new Error('ArtStyles: style module must implement init() and render() methods');
      }
      registry[styleKey] = styleModule;
      log('ArtStyles: registered style "' + styleKey + '"');
    },

    /**
     * Re-scan the global namespace for built-in styles.
     * Call this if styles weren't available at load time.
     */
    registerBuiltinStyles: registerBuiltinStyles
  };
})();
