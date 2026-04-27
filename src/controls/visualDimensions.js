/**
 * Visual Dimensions Module
 * Explicit user-defined parameters for X, Y, Size, Opacity, Rotation.
 * Decoupled from dataset columns - user sets values directly via sliders.
 * Manual mode uses palette colors only (no explicit color dimension).
 *
 * Output: Object with explicit dimension values passed directly to art styles.
 *
 * Ranges:
 *   X Position: -1 to 1 (normalized)
 *   Y Position: -1 to 1 (normalized)
 *   Size: 0 to maxSize pixels (style-dependent, default 500)
 *   Opacity: 0 to 1
 *   Rotation: 0 to 360 degrees
 *
 * Design per DESIGN.md + CONSTRAINTS.md:
 *   - Surface background #1a1a1a, border #2a2a2a
 *   - System-ui font for labels, monospace for values
 *   - Hard offset shadows (4px 4px 0px) on elevated elements
 *   - No gradients on UI surfaces (C-02)
 *   - Off-white text #f0ece4, accent gold #c9922a
 */
(function() {
  'use strict';

  var DEBUG = window.location.search.indexOf('debug=true') !== -1;

  function log() {
    if (DEBUG) {
      var args = ['[DataToArt.VisualDimensions]'];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      console.log.apply(console, args);
    }
  }

  // ─── Dimension Configuration ────────────────────────────────────────────

  var DIMENSIONS = ['x', 'y', 'size', 'opacity', 'rotation'];

  var DIMENSION_LABELS = {
    x: 'X Position',
    y: 'Y Position',
    size: 'Size',
    opacity: 'Opacity',
    rotation: 'Rotation'
  };

  var DIMENSION_RANGES = {
    x: { min: -1, max: 1, step: 0.01 },
    y: { min: -1, max: 1, step: 0.01 },
    size: { min: 0, max: 500, step: 1 },
    opacity: { min: 0, max: 1, step: 0.01 },
    rotation: { min: 0, max: 360, step: 1 }
  };

  // ─── Internal State ────────────────────────────────────────────────────

  var _values = {
    x: 0,
    y: 0,
    size: 100,
    opacity: 1,
    rotation: 0
  };

  var _maxSize = 500;
  var _onChangeCallback = null;
  var _containerEl = null;
  var _controls = {};

  // ─── Styling Constants ──────────────────────────────────────────────────

  var STYLES = {
    container: {
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '0',
      padding: '16px',
      marginBottom: '12px'
    },
    header: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      fontWeight: '600',
      color: '#c9922a',
      margin: '0 0 16px 0',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px'
    },
    label: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '12px',
      color: '#f0ece4',
      width: '80px',
      textAlign: 'right'
    },
    slider: {
      flex: '1',
      height: '4px',
      background: '#2a2a2a',
      border: '1px solid #444',
      borderRadius: '0',
      cursor: 'pointer'
    },
    valueInput: {
      width: '60px',
      padding: '4px 6px',
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      background: '#242018',
      border: '1px solid #2a2a2a',
      color: '#f0ece4',
      textAlign: 'right'
    },
    button: {
      background: '#1c1814',
      border: '2px solid #c9922a',
      color: '#f0ece4',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      padding: '8px 16px',
      cursor: 'pointer',
      marginTop: '12px'
    }
  };

  function applyStyles(el, styleObj) {
    for (var prop in styleObj) {
      el.style[prop] = styleObj[prop];
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  var VisualDimensions = {
    /**
     * Initialize the VisualDimensions module
     * @param {HTMLElement} containerEl - DOM element to render into
     * @param {Function} onChange - Callback fired when any dimension changes
     * @param {number} maxSize - Maximum size in pixels (default 500)
     */
    init: function(containerEl, onChange, maxSize) {
      _containerEl = containerEl;
      _onChangeCallback = onChange;
      _maxSize = maxSize || 500;
      DIMENSION_RANGES.size.max = _maxSize;

      _buildUI();
      log('Initialized with maxSize:', _maxSize);
    },

    /**
     * Update maxSize (called when art style changes)
     * @param {number} newMaxSize
     */
    setMaxSize: function(newMaxSize) {
      _maxSize = newMaxSize;
      DIMENSION_RANGES.size.max = _maxSize;
      if (_controls.size && _controls.size.slider) {
        _controls.size.slider.max = _maxSize;
      }
      _controls.size.valueInput.max = _maxSize;
      // Clamp current size to new range
      if (_values.size > _maxSize) {
        _values.size = _maxSize;
        if (_controls.size.valueInput) {
          _controls.size.valueInput.value = _maxSize;
        }
        if (_controls.size.slider) {
          _controls.size.slider.value = _maxSize;
        }
        _fireChange();
      }
      log('MaxSize updated to:', _maxSize);
    },

    /**
     * Get current dimension values
     * @returns {Object} Current dimension state
     */
    getValues: function() {
      return {
        x: parseFloat(_values.x),
        y: parseFloat(_values.y),
        size: parseInt(_values.size),
        opacity: parseFloat(_values.opacity),
        rotation: parseInt(_values.rotation)
      };
    },

    /**
     * Set explicit dimension values (for loading saved state, random, etc.)
     * @param {Object} values - Dimension values to set
     */
    setValues: function(values) {
      var changed = false;
      for (var dim in values) {
        if (_values.hasOwnProperty(dim) && _values[dim] !== values[dim]) {
          _values[dim] = values[dim];
          changed = true;
          if (_controls[dim] && _controls[dim].valueInput) {
            _controls[dim].valueInput.value = values[dim];
          }
          if (_controls[dim] && _controls[dim].slider) {
            _controls[dim].slider.value = values[dim];
          }
        }
      }
      if (changed) {
        _fireChange();
      }
    },

    /**
     * Generate random dimension values
     */
    randomize: function() {
      var newValues = {
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        size: Math.floor(Math.random() * _maxSize),
        opacity: Math.random(),
        rotation: Math.floor(Math.random() * 360)
      };
      this.setValues(newValues);
      log('Randomized dimensions:', newValues);
    },

    /**
     * Reset all dimensions to defaults
     */
    reset: function() {
      this.setValues({
        x: 0,
        y: 0,
        size: 100,
        opacity: 1,
        rotation: 0
      });
    },

    /**
     * Center the artwork position only (X/Y) without affecting other dimensions
     */
    center: function() {
      var current = this.getValues();
      this.setValues({
        x: 0,
        y: 0,
        size: current.size,
        opacity: current.opacity,
        rotation: current.rotation
      });
    }
  };

  // ─── UI Building ─────────────────────────────────────────────────────────

  function _buildUI() {
    if (!_containerEl) {
      return;
    }

    // Clear container
    _containerEl.innerHTML = '';
    var header = document.createElement('h3');
    header.textContent = 'Visual Dimensions';
    applyStyles(header, STYLES.header);
    _containerEl.appendChild(header);

    // Create a control row for each dimension
    for (var d = 0; d < DIMENSIONS.length; d++) {
      var dimName = DIMENSIONS[d];
      (function(pdimName) {
        var range = DIMENSION_RANGES[pdimName];

      var row = document.createElement('div');
      applyStyles(row, STYLES.row);

      // Label
      var label = document.createElement('label');
      label.textContent = DIMENSION_LABELS[pdimName];
      label.htmlFor = 'vd-' + pdimName;
      applyStyles(label, STYLES.label);
      row.appendChild(label);

      // Slider
      var slider = document.createElement('input');
      slider.type = 'range';
      slider.id = 'vd-' + pdimName;
      slider.min = range.min;
      slider.max = range.max;
      slider.step = range.step || 1;
      slider.value = _values[pdimName];
      applyStyles(slider, STYLES.slider);

      // Numeric value input
      var valueInput = document.createElement('input');
      valueInput.type = 'number';
      valueInput.min = range.min;
      valueInput.max = range.max;
      valueInput.step = range.step || 1;
      valueInput.value = _values[pdimName];
      applyStyles(valueInput, STYLES.valueInput);

      // Sync slider and input
      var sync = function() {
        var val = parseFloat(slider.value);
        if (pdimName === 'size' || pdimName === 'rotation') {
          val = Math.round(val);
        } else {
          val = parseFloat(val.toFixed(2));
        }
        valueInput.value = val;
        _values[pdimName] = val;
        _fireChange();
      };

      // Slider 'input' event fires continuously during drag
      slider.addEventListener('input', function() {
        valueInput.value = this.value;
        sync();
      });

      valueInput.addEventListener('change', function() {
        var val = parseFloat(this.value);
        if (isNaN(val)) return;
        if (val < range.min) val = range.min;
        if (val > range.max) val = range.max;
        slider.value = val;
        _values[pdimName] = val;
        _fireChange();
      });

      row.appendChild(slider);
      row.appendChild(valueInput);

      // Store references
      _controls[pdimName] = {
        slider: slider,
        valueInput: valueInput
      };

      _containerEl.appendChild(row);
      })(dimName);  // Close IIFE properly with current dimName value
    }  // End of for loop

    // Randomize button
    var randomBtn = document.createElement('button');
    randomBtn.type = 'button';
    randomBtn.textContent = 'Randomize Dimensions';
    applyStyles(randomBtn, STYLES.button);
    randomBtn.addEventListener('click', function() {
      VisualDimensions.randomize();
    });
    _containerEl.appendChild(randomBtn);

    // Center position button
    var centerBtn = document.createElement('button');
    centerBtn.type = 'button';
    centerBtn.textContent = 'Center Position';
    applyStyles(centerBtn, STYLES.button);
    centerBtn.addEventListener('click', function() {
      VisualDimensions.center();
    });
    _containerEl.appendChild(centerBtn);

    log('UI built with dimensions:', DIMENSIONS);
  }

  // ─── Change Handling ────────────────────────────────────────────────────

  function _fireChange() {
    if (_onChangeCallback) {
      _onChangeCallback(VisualDimensions.getValues());
    }
  }

  // ───Expose on Global Namespace ────────────────────────────────────────

  window.DataToArt = window.DataToArt || {};
  window.DataToArt.VisualDimensions = VisualDimensions;

  log('VisualDimensions module loaded');
})();
