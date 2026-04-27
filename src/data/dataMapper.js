/**
 * Data Mapper Module
 * Transforms raw PHP API responses into the renderer-ready dataset shape.
 * Handles JSON parsing quirks (PHP may encode arrays as JSON strings),
 * column hydration, and sample_values fallback for preview-only data.
 *
 * Dependency: window.DataToArt.Normalizer (from normalizer.js) — optional
 * If Normalizer is missing, mapApiResponse still works but does not
 * add normalized_values.
 */
(function() {
  'use strict';

  var DEBUG = window.location.search.indexOf('debug=true') !== -1;

  function log() {
    if (DEBUG) {
      var args = ['[DataToArt.DataMapper]'];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      console.log.apply(console, args);
    }
  }

  function warn() {
    if (DEBUG) {
      var args = ['[DataToArt.DataMapper]'];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      console.warn.apply(console, args);
    }
  }

  // ─── JSON Parsing Helpers ──────────────────────────────────────────────────

  /**
   * Parse a value that might be a JSON-encoded string or already an object/array.
   * PHP's json_encode on nested arrays can produce double-encoded JSON strings.
   *
   * @param {*} value - the value to parse
   * @param {string} context - description for debug messages
   * @returns {*} parsed value, or original value if parsing fails
   */
  function safeParse(value, context) {
    if (value === null || value === undefined) {
      return value;
    }

    // Already an array or object — no parsing needed
    if (typeof value === 'object') {
      return value;
    }

    // Try to parse string values as JSON
    if (typeof value === 'string') {
      try {
        var parsed = JSON.parse(value);
        // Only accept parsed results that are objects or arrays
        if (typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {
        // Not valid JSON — return as-is
        log('safeParse(' + context + '): string is not valid JSON, keeping as-is');
      }
    }

    return value;
  }

  /**
   * Ensure a value is an array. Wraps non-array values in an array,
   * returns empty array for null/undefined.
   *
   * @param {*} value
   * @returns {Array}
   */
  function ensureArray(value) {
    if (Array.isArray(value)) {
      return value;
    }
    if (value === null || value === undefined) {
      return [];
    }
    return [value];
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  var DataMapper = {

    /**
     * Transform a raw PHP API response into a renderer-ready dataset object.
     *
     * Handles:
     *  - JSON-encoded column values and sample_values (PHP quirk)
     *  - Missing values: falls back to sample_values (preview-only)
     *  - Missing display_name: falls back to column_name
     *  - Missing data_type: defaults to "unknown"
     *
     * @param {Object} apiResponse - raw API response object
     *   Expected shape: { dataset_id: number, columns: [...], row_count: number }
     * @returns {Object|null} normalized dataset object, or null on failure
     */
    mapApiResponse: function(apiResponse) {
      // Input validation
      if (!apiResponse || typeof apiResponse !== 'object') {
        warn('mapApiResponse() called with invalid input — expected object');
        return null;
      }

      if (!apiResponse.dataset_id) {
        warn('mapApiResponse() — missing dataset_id');
        return null;
      }

      if (!apiResponse.columns || !Array.isArray(apiResponse.columns)) {
        warn('mapApiResponse() — missing or invalid columns array');
        return null;
      }

      log('Mapping API response for dataset_id:', apiResponse.dataset_id);

      // Build base dataset object
      var dataset = {
        dataset_id: apiResponse.dataset_id,
        row_count: apiResponse.row_count || 0,
        columns: []
      };

      // Transform each column
      for (var i = 0; i < apiResponse.columns.length; i++) {
        var rawCol = apiResponse.columns[i];

        if (!rawCol || !rawCol.column_name) {
          warn('Skipping invalid column at index', i, ': missing column_name');
          continue;
        }

        // Parse values — might be JSON string from PHP, often undefined for now
        var values = safeParse(rawCol.values, 'column "' + rawCol.column_name + '" values');
        values = ensureArray(values);

        // Parse sample_values — might be JSON string from PHP
        var sampleValues = safeParse(rawCol.sample_values, 'column "' + rawCol.column_name + '" sample_values');
        sampleValues = ensureArray(sampleValues);

        // If API did not provide values, or they are empty, always fall back to sample_values
        var effectiveValues = values;
        if (effectiveValues.length === 0 && sampleValues.length > 0) {
          effectiveValues = sampleValues;
          log('Column "' + rawCol.column_name + '": using sample_values as primary values (preview mode)');
        }

        // Build normalized column object
        var column = {
          column_name: rawCol.column_name,
          display_name: rawCol.display_name || rawCol.column_name,
          data_type: rawCol.data_type || 'unknown',
          values: effectiveValues,
          sample_values: sampleValues
        };

        dataset.columns.push(column);
      }

      // Update row_count if it was zero or missing — derive from columns
      if (dataset.row_count === 0 && dataset.columns.length > 0) {
        // Find the maximum value length across all columns
        for (var c = 0; c < dataset.columns.length; c++) {
          var len = dataset.columns[c].values.length;
          if (len > dataset.row_count) {
            dataset.row_count = len;
          }
        }
      }

      // Optionally add normalized_values via Normalizer
      if (window.DataToArt && window.DataToArt.Normalizer && typeof window.DataToArt.Normalizer.normalizeDataset === 'function') {
        dataset = window.DataToArt.Normalizer.normalizeDataset(dataset);
      }

      log('Mapped dataset:', dataset.dataset_id, 'with', dataset.columns.length, 'columns and', dataset.row_count, 'rows');

      return dataset;
    },

    /**
     * Map a column to a visual dimension key.
     * Used by controls.js to build columnMapping objects.
     *
     * @param {Object} column - column object with column_name property
     * @param {string} dimensionKey - one of: x, y, size, color, opacity, rotation
     * @returns {Object} mapping entry e.g. { x: "population" }
     */
    mapColumnToVisual: function(column, dimensionKey) {
      if (!column || !column.column_name) {
        warn('mapColumnToVisual() called with invalid column');
        return {};
      }
      var mapping = {};
      mapping[dimensionKey] = column.column_name;
      return mapping;
    },

    /**
     * Clean dataset values by filtering out rows with invalid data.
     * For numeric dimensions (x, y, size, etc.), omits rows where values are
     * null, undefined, empty string, NaN, or non-numeric.
     *
     * @param {Object} dataset - dataset with columns array
     * @param {Object} columnMapping - mapping of visual dimensions to column names
     * @returns {Object} cleaned dataset with filtered rows, or original if no numeric mappings
     */
    cleanData: function(dataset, columnMapping) {
      if (!dataset || !dataset.columns || dataset.columns.length === 0) {
        warn('cleanData() called with invalid dataset');
        return dataset;
      }

      if (!columnMapping) {
        // No mappings, nothing to clean
        return dataset;
      }

      // Numeric dimensions that require valid numbers
      var numericDims = ['x', 'y', 'size', 'opacity', 'rotation'];

      // Find which mapped columns need numeric cleaning
      var numericColumns = {};
      for (var i = 0; i < numericDims.length; i++) {
        var dim = numericDims[i];
        var colName = columnMapping[dim];
        if (colName) {
          numericColumns[colName] = true;
        }
      }

      // If no numeric columns mapped, return original
      var colNames = Object.keys(numericColumns);
      if (colNames.length === 0) {
        return dataset;
      }

      // Find the indices of valid rows (where all numeric columns have valid values)
      var rowCount = dataset.row_count || 0;
      var validRowIndices = [];

      for (var rowIdx = 0; rowIdx < rowCount; rowIdx++) {
        var rowIsValid = true;

        for (var c = 0; c < colNames.length; c++) {
          var colName = colNames[c];
          var col = null;

          // Find column by column_name
          for (var j = 0; j < dataset.columns.length; j++) {
            if (dataset.columns[j].column_name === colName) {
              col = dataset.columns[j];
              break;
            }
          }

          if (col && col.values && col.values.length > rowIdx) {
            var val = col.values[rowIdx];
            if (val === null || val === undefined || val === '') {
              rowIsValid = false;
              break;
            }

            // Check if numeric
            var num = parseFloat(val);
            if (isNaN(num) || !isFinite(num)) {
              rowIsValid = false;
              break;
            }
          } else {
            // Missing column or value
            rowIsValid = false;
            break;
          }
        }

        if (rowIsValid) {
          validRowIndices.push(rowIdx);
        }
      }

      // If all rows are valid, return original
      if (validRowIndices.length === rowCount) {
        log('cleanData() — all rows valid, no filtering needed');
        return dataset;
      }

      // If no valid rows, log warning but return dataset
      if (validRowIndices.length === 0) {
        warn('cleanData() — all rows filtered out for numeric dimensions');
        return dataset;
      }

      log('cleanData() — filtering from', rowCount, 'rows to', validRowIndices.length, 'valid rows');

      // Create cleaned dataset by filtering all column values
      var cleanedDataset = {
        dataset_id: dataset.dataset_id,
        row_count: validRowIndices.length,
        columns: []
      };

      for (var k = 0; k < dataset.columns.length; k++) {
        var originalCol = dataset.columns[k];
        var cleanedValues = [];

        for (var v = 0; v < validRowIndices.length; v++) {
          var origIdx = validRowIndices[v];
          if (origIdx < originalCol.values.length) {
            cleanedValues.push(originalCol.values[origIdx]);
          }
        }

        cleanedDataset.columns.push({
          column_name: originalCol.column_name,
          display_name: originalCol.display_name,
          data_type: originalCol.data_type,
          values: cleanedValues,
          sample_values: originalCol.sample_values
        });
      }

      return cleanedDataset;
    }
  };

  // ─── Expose on Global Namespace ────────────────────────────────────────────

  window.DataToArt = window.DataToArt || {};
  window.DataToArt.DataMapper = DataMapper;

  log('DataMapper module loaded');
})();