/**
 * Palette Picker Module
 * Renders palette selection UI with curated dark-compatible palettes, custom color
 * mode, and background color selector. All palettes tested against #0d0d0d canvas.
 *
 * Visual design per DESIGN.md + CONSTRAINTS.md:
 *   - Surface background #1a1a1a, border #2a2a2a
 *   - Hard offset shadows (4px 4px 0px) for selected state
 *   - No gradients on UI surfaces (C-02)
 *   - Off-white text #f0ece4, accent gold #c9922a, accent teal #4a8fa8
 *   - System-ui for labels, monospace for hex values
 *
 * No external dependencies beyond DOM.
 */
(function() {
  'use strict';

  console.log('[PalettePicker] Module loading');
  var DEBUG = window.location.search.indexOf('debug=true') !== -1;

  function log() {
    if (DEBUG) {
      var args = ['[DataToArt.PalettePicker]'];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      console.log.apply(console, args);
    }
  }

  function warn() {
    if (DEBUG) {
      var args = ['[DataToArt.PalettePicker]'];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      console.warn.apply(console, args);
    }
  }

  // ─── Curated Palettes (dark-compatible, tested against #0d0d0d) ─────────────

  var BUILT_IN_PALETTES = [
    {
      name: 'Inferno',
      description: 'Warm sequential — fire and light',
      colors: ['#000004', '#1f0c48', '#550f6d', '#88226a', '#b63655', '#dd513a', '#f78212', '#fcffa4']
    },
    {
      name: 'Viridis',
      description: 'Cool sequential — nature and depth',
      colors: ['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#d9f0a3']
    },
    {
      name: 'Plasma',
      description: 'Purple-pink — electric and vivid',
      colors: ['#0d0887', '#46039f', '#7201a8', '#9c179e', '#bd3786', '#d8576b', '#ed7953', '#fdb42f']
    },
    {
      name: 'Magma',
      description: 'Purple-black — deep and volcanic',
      colors: ['#000004', '#180f3d', '#440f76', '#721f81', '#9e2f7f', '#cd4076', '#f1605d', '#fea16e']
    },
    {
      name: 'Cividis',
      description: 'Colorblind-friendly — accessible and balanced',
      colors: ['#002051', '#18365f', '#2f4c6d', '#45637a', '#5d7b87', '#769493', '#91afa1', '#aeccaf']
    },
    {
      name: 'Fornesus',
      description: 'Abstract and emotional — from fornesusart.com',
      colors: ['#1c1814', '#c9922a', '#4a8fa8', '#8b4513', '#2f4f4f', '#daa520', '#5f9ea0', '#f0ece4']
    },
    {
      name: 'Monochrome',
      description: 'Grayscale — restraint and structure',
      colors: ['#0d0d0d', '#2a2a2a', '#555555', '#808080', '#aaaaaa', '#d4d4d4', '#e8e8e8', '#ffffff']
    }
  ];

  // ─── Internal State ────────────────────────────────────────────────────────

  var _palette = {
    colors: BUILT_IN_PALETTES[0].colors.slice(),  // copy of Inferno
    background: '#0d0d0d'
  };
  var _mode = 'built-in';   // 'built-in' or 'custom'
  var _selectedIndex = 0;    // which built-in palette is active
  var _customColors = ['#f0ece4']; // default custom palette
  var _onChangeCallback = null;
  var _containerEl = null;

  // ─── Styling Constants ─────────────────────────────────────────────────────

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
    paletteSection: {
      marginBottom: '12px'
    },
    paletteRow: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '6px',
      cursor: 'pointer',
      padding: '4px',
      border: '1px solid transparent',
      borderRadius: '0',
      transition: 'border-color 0.2s ease'
    },
    paletteRowSelected: {
      borderColor: '#c9922a',
      boxShadow: '4px 4px 0px #c9922a'
    },
    paletteName: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '11px',
      color: '#f0ece4',
      width: '70px',
      flexShrink: '0',
      letterSpacing: '0.04em'
    },
    swatchRow: {
      display: 'flex',
      flex: '1',
      gap: '2px'
    },
    swatch: {
      width: '22px',
      height: '22px',
      borderRadius: '0',
      border: '1px solid #2a2a2a'
    },
    toggleButton: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '11px',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: '#f0ece4',
      background: '#242018',
      border: '1px solid #2a2a2a',
      borderRadius: '0',
      padding: '6px 12px',
      cursor: 'pointer',
      marginTop: '4px',
      marginBottom: '8px'
    },
    customSection: {
      marginBottom: '12px',
      paddingLeft: '4px'
    },
    colorRow: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '4px'
    },
    colorInput: {
      width: '30px',
      height: '24px',
      padding: '0',
      border: '1px solid #2a2a2a',
      borderRadius: '0',
      background: '#242018',
      cursor: 'pointer',
      appearance: 'none',
      WebkitAppearance: 'none'
    },
    hexInput: {
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      color: '#f0ece4',
      background: '#242018',
      border: '1px solid #2a2a2a',
      borderRadius: '0',
      padding: '4px 6px',
      width: '80px',
      marginLeft: '6px',
      outline: 'none'
    },
    removeBtn: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '10px',
      color: '#f0ece4',
      background: 'none',
      border: '1px solid #555555',
      borderRadius: '0',
      padding: '2px 6px',
      cursor: 'pointer',
      marginLeft: '6px'
    },
    addBtn: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '11px',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: '#4a8fa8',
      background: 'none',
      border: '1px solid #4a8fa8',
      borderRadius: '0',
      padding: '4px 10px',
      cursor: 'pointer',
      marginTop: '6px'
    },
    bgSection: {
      marginTop: '12px',
      paddingTop: '8px',
      borderTop: '1px solid #2a2a2a'
    },
    bgLabel: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '11px',
      color: '#f0ece4',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginBottom: '6px',
      display: 'block'
    },
    bgRow: {
      display: 'flex',
      alignItems: 'center'
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

  // ─── Helper: Fire Change Callback ──────────────────────────────────────────

  function fireChange() {
    if (_onChangeCallback) {
      _onChangeCallback({
        colors: _palette.colors.slice(),
        background: _palette.background
      });
    }
  }

  // ─── Render Built-in Palette Row ──────────────────────────────────────────

  function renderBuiltInPalette(parentEl, palette, index) {
    var row = document.createElement('div');
    applyStyles(row, STYLES.paletteRow);

    var isSelected = (_mode === 'built-in' && _selectedIndex === index);
    if (isSelected) {
      applyStyles(row, STYLES.paletteRowSelected);
    }

    // Palette name
    var nameEl = document.createElement('span');
    nameEl.textContent = palette.name;
    applyStyles(nameEl, STYLES.paletteName);
    row.appendChild(nameEl);

    // Swatch row
    var swatchRow = document.createElement('div');
    applyStyles(swatchRow, STYLES.swatchRow);

    for (var c = 0; c < palette.colors.length; c++) {
      var swatch = document.createElement('div');
      applyStyles(swatch, STYLES.swatch);
      swatch.style.backgroundColor = palette.colors[c];
      swatch.title = palette.colors[c];
      swatchRow.appendChild(swatch);
    }

    row.appendChild(swatchRow);

    // Click handler to select this palette
    (function(idx) {
      row.addEventListener('click', function() {
        _mode = 'built-in';
        _selectedIndex = idx;
        _palette.colors = BUILT_IN_PALETTES[idx].colors.slice();
        log('Selected built-in palette:', BUILT_IN_PALETTES[idx].name);
        fireChange();
        PalettePicker.render(_containerEl, _palette, _onChangeCallback);
      });
    })(index);

    parentEl.appendChild(row);
  }

  // ─── Render Custom Palette Section ──────────────────────────────────────

  function renderCustomSection(parentEl, isCustomActive) {
    // Toggle button
    var toggleBtn = document.createElement('button');
    toggleBtn.textContent = isCustomActive ? '\u25B2 Custom Palette' : '\u25BC Custom...';
    applyStyles(toggleBtn, STYLES.toggleButton);

    (function() {
      toggleBtn.addEventListener('click', function() {
        if (_mode === 'custom') {
          // Switch back to built-in
          _mode = 'built-in';
          _palette.colors = BUILT_IN_PALETTES[_selectedIndex].colors.slice();
        } else {
          // Switch to custom
          _mode = 'custom';
          _palette.colors = _customColors.slice();
        }
        log('Toggled to mode:', _mode);
        fireChange();
        PalettePicker.render(_containerEl, _palette, _onChangeCallback);
      });
    })();
    parentEl.appendChild(toggleBtn);

    if (!isCustomActive) return;

    // Custom color inputs
    var customSection = document.createElement('div');
    applyStyles(customSection, STYLES.customSection);

    for (var i = 0; i < _customColors.length; i++) {
      (function(colorIdx) {
        var colorRow = document.createElement('div');
        applyStyles(colorRow, STYLES.colorRow);

        // Color picker input
        var colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = _customColors[colorIdx];
        applyStyles(colorInput, STYLES.colorInput);
        colorInput.addEventListener('input', function(e) {
          _customColors[colorIdx] = e.target.value;
          _palette.colors = _customColors.slice();
          fireChange();
        });
        colorRow.appendChild(colorInput);

        // Hex text input
        var hexInput = document.createElement('input');
        hexInput.type = 'text';
        hexInput.value = _customColors[colorIdx];
        hexInput.maxLength = 7;
        applyStyles(hexInput, STYLES.hexInput);
        hexInput.addEventListener('change', function(e) {
          var val = e.target.value.trim();
          // Validate hex format
          if (/^#[0-9a-fA-F]{6}$/.test(val)) {
            _customColors[colorIdx] = val;
            _palette.colors = _customColors.slice();
            fireChange();
          } else {
            // Revert to previous value
            e.target.value = _customColors[colorIdx];
          }
        });
        hexInput.addEventListener('focus', function() {
          hexInput.style.borderColor = '#4a8fa8';
        });
        hexInput.addEventListener('blur', function() {
          hexInput.style.borderColor = STYLES.hexInput.borderColor;
        });
        colorRow.appendChild(hexInput);

        // Remove button (only if more than 2 colors)
        if (_customColors.length > 2) {
          var removeBtn = document.createElement('button');
          removeBtn.textContent = '\u00D7';
          removeBtn.title = 'Remove color';
          applyStyles(removeBtn, STYLES.removeBtn);
          removeBtn.addEventListener('click', function() {
            _customColors.splice(colorIdx, 1);
            _palette.colors = _customColors.slice();
            log('Removed custom color at index', colorIdx);
            fireChange();
            PalettePicker.render(_containerEl, _palette, _onChangeCallback);
          });
          colorRow.appendChild(removeBtn);
        }

        customSection.appendChild(colorRow);
      })(i);
    }

    // Add color button (disabled at 8 colors)
    if (_customColors.length < 8) {
      var addBtn = document.createElement('button');
      addBtn.textContent = '+ Add Color';
      applyStyles(addBtn, STYLES.addBtn);
      addBtn.addEventListener('click', function() {
        if (_customColors.length < 8) {
          _customColors.push('#ffffff');
          _palette.colors = _customColors.slice();
          log('Added custom color, total:', _customColors.length);
          fireChange();
          PalettePicker.render(_containerEl, _palette, _onChangeCallback);
        }
      });
      customSection.appendChild(addBtn);
    }

    parentEl.appendChild(customSection);
  }

  // ─── Render Background Selector ──────────────────────────────────────────

  function renderBackgroundSelector(parentEl) {
    var section = document.createElement('div');
    applyStyles(section, STYLES.bgSection);

    var label = document.createElement('label');
    label.textContent = 'Canvas Background';
    applyStyles(label, STYLES.bgLabel);
    section.appendChild(label);

    var row = document.createElement('div');
    applyStyles(row, STYLES.bgRow);

    var colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = _palette.background;
    applyStyles(colorInput, STYLES.colorInput);
    colorInput.addEventListener('input', function(e) {
      _palette.background = e.target.value;
      log('Background changed to', _palette.background);
      fireChange();
    });
    row.appendChild(colorInput);

    var hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.value = _palette.background;
    hexInput.maxLength = 7;
    applyStyles(hexInput, STYLES.hexInput);
    hexInput.addEventListener('change', function(e) {
      var val = e.target.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        _palette.background = val;
        log('Background changed to', _palette.background);
        fireChange();
      } else {
        e.target.value = _palette.background;
      }
    });
    hexInput.addEventListener('focus', function() {
      hexInput.style.borderColor = '#4a8fa8';
    });
    hexInput.addEventListener('blur', function() {
      hexInput.style.borderColor = STYLES.hexInput.borderColor;
    });
    row.appendChild(hexInput);

    section.appendChild(row);
    parentEl.appendChild(section);
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  var PalettePicker = {

    /**
     * Render palette selection controls into a container element.
     *
     * @param {HTMLElement} containerEl - DOM element to render into
     * @param {Object|null} currentPalette - current palette config { colors: [...], background: '#hex' }
     * @param {Function} onChangeCallback - called with { colors: [...], background: '#hex' } on change
     */
    render: function(containerEl, currentPalette, onChangeCallback) {
      if (!containerEl) {
        warn('render() called without a container element');
        return;
      }

      _containerEl = containerEl;
      _onChangeCallback = onChangeCallback || null;

      // Update internal state from currentPalette
      if (currentPalette && currentPalette.colors) {
        if (_mode === 'built-in') {
          _palette.colors = BUILT_IN_PALETTES[_selectedIndex].colors.slice();
        } else {
          _palette.colors = currentPalette.colors.slice();
        }
      }
      if (currentPalette && currentPalette.background) {
        _palette.background = currentPalette.background;
      }

      // Clear container
      containerEl.innerHTML = '';
      applyStyles(containerEl, STYLES.container);

      // Header
      var header = document.createElement('h3');
      header.textContent = 'Color Palette';
      applyStyles(header, STYLES.header);
      containerEl.appendChild(header);

      // Built-in palettes section
      var paletteSection = document.createElement('div');
      applyStyles(paletteSection, STYLES.paletteSection);

      for (var i = 0; i < BUILT_IN_PALETTES.length; i++) {
        renderBuiltInPalette(paletteSection, BUILT_IN_PALETTES[i], i);
      }

      containerEl.appendChild(paletteSection);

      // Custom palette section
      renderCustomSection(containerEl, _mode === 'custom');

      // Background color selector
      renderBackgroundSelector(containerEl);

      log('render() complete — mode:', _mode, 'selected:', _selectedIndex);
    },

    /**
     * Get the current palette configuration.
     *
     * @returns {Object} { colors: string[], background: string }
     */
    getPalette: function() {
      return {
        colors: _palette.colors.slice(),
        background: _palette.background
      };
    },

    /**
     * Reset to first built-in palette (Inferno) with default background.
     * Re-renders and fires onChangeCallback.
     */
    reset: function() {
      _mode = 'built-in';
      _selectedIndex = 0;
      _palette.colors = BUILT_IN_PALETTES[0].colors.slice();
      _palette.background = '#0d0d0d';
      _customColors = ['#f0ece4'];

      log('reset() — restored to', BUILT_IN_PALETTES[0].name);

      if (_containerEl) {
        PalettePicker.render(_containerEl, _palette, _onChangeCallback);
      }

      fireChange();
    }
  };

  // ─── Expose on Global Namespace ────────────────────────────────────────────

  window.DataToArt = window.DataToArt || {};
  window.DataToArt.PalettePicker = PalettePicker;

  log('PalettePicker module loaded');
})();