/**
 * Normalizer Module
 * Thin wrapper around window.DataToArt.normalize utilities (established in
 * Session 6 renderer.js). Exposes a convenience Normalizer namespace with
 * direct delegation to each normalize method, plus a new normalizeDataset()
 * that batch-processes all columns in a dataset.
 *
 * Dependency: window.DataToArt.normalize (from renderer.js)
 * If missing, all methods degrade to no-ops with DEBUG warnings.
 */
(function() {
  'use strict';

  var DEBUG = window.location.search.indexOf('debug=true') !== -1;

  function log() {
    if (DEBUG) {
      var args = ['[DataToArt.Normalizer]'];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      console.log.apply(console, args);
    }
  }

  function warn() {
    if (DEBUG) {
      var args = ['[DataToArt.Normalizer]'];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      console.warn.apply(console, args);
    }
  }

  // ─── Dependency Check ──────────────────────────────────────────────────────

  var _normalize = null;

  function _ensureNormalize() {
    if (_normalize) return true;
    if (window.DataToArt && window.DataToArt.normalize) {
      _normalize = window.DataToArt.normalize;
      return true;
    }
    warn('window.DataToArt.normalize not found — install renderer.js before normalizer.js');
    return false;
  }

  // ─── No-op Fallbacks ──────────────────────────────────────────────────────

  function _noop() { return { type: 'empty', normalized: [] }; }

  // ─── Public API ────────────────────────────────────────────────────────────

  var Normalizer = {

    /**
     * Normalize a column's values based on detected type.
     * Delegates to window.DataToArt.normalize.column.
     *
     * @param {Array} values - array of raw values
     * @param {string} [typeHint] - optional type hint ("number"|"string"|"boolean"|"date")
     * @returns {Object} { type, normalized }
     */
    column: function(values, typeHint) {
      if (!_ensureNormalize()) {
        warn('column() called without normalize dependency — returning empty');
        return _noop();
      }
      return _normalize.column(values);
    },

    /**
     * Normalize a numeric column (min-max to 0-1).
     * Delegates to window.DataToArt.normalize.numeric.
     *
     * @param {Array} values
     * @returns {Object} { type, normalized, min, max }
     */
    numeric: function(values) {
      if (!_ensureNormalize()) {
        warn('numeric() called without normalize dependency — returning empty');
        return _noop();
      }
      return _normalize.numeric(values);
    },

    /**
     * Normalize a string/categorical column.
     * Delegates to window.DataToArt.normalize.string.
     *
     * @param {Array} values
     * @returns {Object} { type, normalized, categories }
     */
    string: function(values) {
      if (!_ensureNormalize()) {
        warn('string() called without normalize dependency — returning empty');
        return _noop();
      }
      return _normalize.string(values);
    },

    /**
     * Normalize a boolean column (true → 1.0, false → 0.0).
     * Delegates to window.DataToArt.normalize.boolean.
     *
     * @param {Array} values
     * @returns {Object} { type, normalized }
     */
    boolean: function(values) {
      if (!_ensureNormalize()) {
        warn('boolean() called without normalize dependency — returning empty');
        return _noop();
      }
      return _normalize.boolean(values);
    },

    /**
     * Normalize a date column (timestamp min-max to 0-1).
     * Delegates to window.DataToArt.normalize.date.
     *
     * @param {Array} values
     * @returns {Object} { type, normalized, min, max }
     */
    date: function(values) {
      if (!_ensureNormalize()) {
        warn('date() called without normalize dependency — returning empty');
        return _noop();
      }
      return _normalize.date(values);
    },

    /**
     * Detect the predominant type of a column's values.
     * Delegates to window.DataToArt.normalize.detectType.
     *
     * @param {Array} values
     * @returns {string} "number" | "boolean" | "date" | "string"
     */
    detectType: function(values) {
      if (!_ensureNormalize()) {
        warn('detectType() called without normalize dependency — returning "string"');
        return 'string';
      }
      return _normalize.detectType(values);
    },

    /**
     * Batch-normalize all columns in a dataset.
     * Iterates dataset.columns and adds a normalized_values property
     * to each column object. Returns a shallow copy — original dataset
     * is not mutated.
     *
     * @param {Object} dataset - { dataset_id, columns: [{column_name, display_name, data_type, values, sample_values}], row_count }
     * @returns {Object} dataset copy with normalized_values added to each column
     */
    normalizeDataset: function(dataset) {
      if (!dataset || !dataset.columns) {
        warn('normalizeDataset() called with invalid dataset — returning null');
        return null;
      }

      // Shallow copy of dataset to preserve immutability
      var result = {
        dataset_id: dataset.dataset_id,
        row_count: dataset.row_count,
        columns: []
      };

      for (var i = 0; i < dataset.columns.length; i++) {
        var col = dataset.columns[i];
        var values = col.values;

        // Fallback: if values is missing or empty, use sample_values
        if (!values || values.length === 0) {
          if (col.sample_values && col.sample_values.length > 0) {
            // Using sample_values as preview-only data fallback
            // Full dataset values should be provided by API for production use
            values = col.sample_values;
            log('Column "' + col.column_name + '": using sample_values as fallback (preview-only)');
          } else {
            values = [];
          }
        }

        // Normalize the column values
        var normalizedResult;
        if (_ensureNormalize() && values.length > 0) {
          normalizedResult = _normalize.column(values);
        } else {
          normalizedResult = { type: 'empty', normalized: [] };
        }

        // Build column copy with normalized_values added
        result.columns.push({
          column_name: col.column_name,
          display_name: col.display_name || col.column_name,
          data_type: col.data_type || 'unknown',
          values: values,
          sample_values: col.sample_values || [],
          normalized_values: normalizedResult.normalized || []
        });
      }

      log('normalizeDataset() processed ' + result.columns.length + ' columns');
      return result;
    }
  };

  // ─── Expose on Global Namespace ────────────────────────────────────────────

  window.DataToArt = window.DataToArt || {};
  window.DataToArt.Normalizer = Normalizer;

  log('Normalizer module loaded');
})();