/**
 * Column Mapper Module
 * Renders column-to-dimension mapping UI as instrument-like controls.
 * Provides dropdowns for six visual dimensions (x, y, size, color, opacity, rotation)
 * populated from dataset columns. Fires onChangeCallback with complete mapping
 * on every user interaction.
 *
 * Visual design per DESIGN.md + CONSTRAINTS.md:
 *   - Surface background #1a1a1a, border #2a2a2a
 *   - System-ui font for labels, monospace for data values
 *   - Hard offset shadows (4px 4px 0px) on elevated elements
 *   - No gradients on UI surfaces (C-02)
 *   - Off-white text #f0ece4, accent gold #c9922a
 *
 * No external dependencies beyond DOM.
 */
(function() {
  'use strict';

  var DEBUG = window.location.search.indexOf('debug=true') !== -1;

  function log() {
    if (DEBUG) {
      var args = ['[DataToArt.ColumnMapper]'];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      console.log.apply(console, args);
    }
  }

  function warn() {
    if (DEBUG) {
      var args = ['[DataToArt.ColumnMapper]'];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      console.warn.apply(console, args);
    }
  }

  // ─── Visual Dimensions (fixed set per renderer contract) ───────────────────

  var DIMENSIONS = ['x', 'y', 'size', 'color', 'opacity', 'rotation'];

  var DIMENSION_LABELS = {
    x: 'X Position',
    y: 'Y Position',
    size: 'Size',
    color: 'Color',
    opacity: 'Opacity',
    rotation: 'Rotation'
  };

  // ─── Internal State ────────────────────────────────────────────────────────

  var _mapping = {
    x: null,
    y: null,
    size: null,
    color: null,
    opacity: null,
    rotation: null
  };

  var _onChangeCallback = null;
  var _containerEl = null;

  // ─── Styling Constants ─────────────────────────────────────────────────────

  // C-02: no gradients. Hard offset shadows only.
  // DESIGN.md: surface #1a1a1a, border #2a2a2a, text #f0ece4, accent #c9922a

  var STYLES = {
    container: {
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '0',
      padding: '16px',
      marginBottom: '12px'
    },
    header: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '13px',
      fontWeight: '600',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: '#c9922a',
      marginBottom: '12px',
      marginTop: '0',
      borderBottom: '1px solid #2a2a2a',
      paddingBottom: '8px'
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '8px'
    },
    label: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '12px',
      color: '#f0ece4',
      width: '100px',
      flexShrink: '0',
      textTransform: 'uppercase',
      letterSpacing: '0.06em'
    },
    select: {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#f0ece4',
      background: '#242018',
      border: '1px solid #2a2a2a',
      borderRadius: '0',
      padding: '6px 8px',
      flex: '1',
      cursor: 'pointer',
      appearance: 'none',
      WebkitAppearance: 'none',
      MozAppearance: 'none',
      outline: 'none'
    },
    selectFocus: {
      borderColor: '#c9922a',
      boxShadow: '4px 4px 0px #c9922a'
    }
  };

  // ─── Helper: Apply Styles ─────────────────────────────────────────────────

  function applyStyles(el, styleObj) {
    for (var prop in styleObj) {
      if (styleObj.hasOwnProperty(prop)) {
        el.style[prop] = styleObj[prop];
      }
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  var ColumnMapper = {

    /**
     * Render column-to-dimension mapping controls into a container element.
     *
     * @param {HTMLElement} containerEl - DOM element to render into
     * @param {Object|null} dataset - dataset object with columns array, or null
     * @param {Object} currentMapping - current dimension assignments e.g. { x: "col_name" }
     * @param {Function} onChangeCallback - called with full mapping object on any change
     */
    render: function(containerEl, dataset, currentMapping, onChangeCallback) {
      if (!containerEl) {
        warn('render() called without a container element');
        return;
      }

      _containerEl = containerEl;
      _onChangeCallback = onChangeCallback || null;

      // Update internal mapping from currentMapping
      if (currentMapping && typeof currentMapping === 'object') {
        for (var i = 0; i < DIMENSIONS.length; i++) {
          var dim = DIMENSIONS[i];
          _mapping[dim] = currentMapping[dim] || null;
        }
      }

      // Clear container
      containerEl.innerHTML = '';

      // Apply container styles
      applyStyles(containerEl, STYLES.container);

      // Create header
      var header = document.createElement('h3');
      header.textContent = 'Visual Dimensions';
      applyStyles(header, STYLES.header);
      containerEl.appendChild(header);

      // Build column options from dataset
      var columnOptions = [];
      if (dataset && dataset.columns && Array.isArray(dataset.columns)) {
        for (var c = 0; c < dataset.columns.length; c++) {
          var col = dataset.columns[c];
          var displayName = col.display_name || col.column_name;
          columnOptions.push({
            value: col.column_name,
            label: displayName + ' (' + (col.data_type || 'unknown') + ')'
          });
        }
      }

      // Create a row for each visual dimension
      for (var d = 0; d < DIMENSIONS.length; d++) {
        var dimName = DIMENSIONS[d];
        var row = document.createElement('div');
        applyStyles(row, STYLES.row);

        // Label
        var label = document.createElement('label');
        label.textContent = DIMENSION_LABELS[dimName];
        label.setAttribute('for', 'dta-dim-' + dimName);
        applyStyles(label, STYLES.label);
        row.appendChild(label);

        // Select dropdown
        var select = document.createElement('select');
        select.id = 'dta-dim-' + dimName;
        select.setAttribute('data-dimension', dimName);
        applyStyles(select, STYLES.select);

        // Blank option
        var blankOpt = document.createElement('option');
        blankOpt.value = '';
        blankOpt.textContent = '\u2014 none \u2014';
        select.appendChild(blankOpt);

        // Column options
        for (var k = 0; k < columnOptions.length; k++) {
          var opt = document.createElement('option');
          opt.value = columnOptions[k].value;
          opt.textContent = columnOptions[k].label;
          select.appendChild(opt);
        }

        // Pre-select current mapping
        if (_mapping[dimName]) {
          select.value = _mapping[dimName];
        }

        // Change listener
        (function(dimension, selectEl) {
          selectEl.addEventListener('change', function() {
            _mapping[dimension] = selectEl.value || null;
            log('Dimension', dimension, 'mapped to', _mapping[dimension] || '(none)');
            if (_onChangeCallback) {
              _onChangeCallback(ColumnMapper.getMapping());
            }
          });

          // Focus/blur for instrument feel (hard offset shadow on focus, C-02 compliant)
          selectEl.addEventListener('focus', function() {
            applyStyles(selectEl, STYLES.selectFocus);
          });
          selectEl.addEventListener('blur', function() {
            selectEl.style.borderColor = STYLES.select.borderColor;
            selectEl.style.boxShadow = 'none';
          });
        })(dimName, select);

        row.appendChild(select);
        containerEl.appendChild(row);
      }

      log('render() complete —', columnOptions.length, 'columns available,', DIMENSIONS.length, 'dimensions');
    },

    /**
     * Get the current column mapping.
     *
     * @returns {Object} mapping object e.g. { x: "population", y: null, ... }
     */
    getMapping: function() {
      // Return a copy to prevent external mutation
      var copy = {};
      for (var i = 0; i < DIMENSIONS.length; i++) {
        copy[DIMENSIONS[i]] = _mapping[DIMENSIONS[i]];
      }
      return copy;
    },

    /**
     * Reset all dimension assignments to null and re-render.
     * Fires onChangeCallback with empty mapping.
     */
    reset: function() {
      for (var i = 0; i < DIMENSIONS.length; i++) {
        _mapping[DIMENSIONS[i]] = null;
      }

      // Re-render if we have a container
      if (_containerEl) {
        // Reset all selects to blank option
        var selects = _containerEl.querySelectorAll('select[data-dimension]');
        for (var s = 0; s < selects.length; s++) {
          selects[s].value = '';
        }
      }

      log('reset() — all dimensions cleared');

      if (_onChangeCallback) {
        _onChangeCallback(ColumnMapper.getMapping());
      }
    }
  };

  // ─── Expose on Global Namespace ────────────────────────────────────────────

  window.DataToArt = window.DataToArt || {};
  console.log('[ColumnMapper] Defining window.DataToArt.ColumnMapper');
  window.DataToArt.ColumnMapper = ColumnMapper;

  log('ColumnMapper module loaded');
})();