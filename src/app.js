/**
 * Creatrweb 3D Art — App Entry Point
 * 
 * Orchestrates initialization, library switching, figure management,
 * rendering, API calls, and auth flows for the multi-library art studio.
 * 
 * Dependencies (must load before this file):
 *   - window.DataToArt.FigureBase    (src/figures/figure-base.js)
 *   - window.DataToArt.FigureManager (src/figures/figure-manager.js)
 *   - window.DataToArt.ThreeRenderer  (src/libraries/three.js)
 *   - window.DataToArt.P5Renderer     (src/libraries/p5.js)
 *   - window.DataToArt.C2Renderer     (src/libraries/c2.js)
 *   - THREE, p5 globals (from CDN)
 */
(function() {
  'use strict';

  var DEBUG = window.location.search.indexOf('debug=true') !== -1;

  // ─── Logging Helpers ──────────────────────────────────────────────────

  function log() {
    if (!DEBUG) return;
    var args = ['[Creatrweb3D.App]'];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    console.log.apply(console, args);
  }

  function warn() {
    if (!DEBUG) return;
    var args = ['[Creatrweb3D.App]'];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    console.warn.apply(console, args);
  }

  // ─── Constants ────────────────────────────────────────────────────────

  // A-Frame removed due to persistent full-screen issues
  var VALID_LIBRARIES = ['three', 'p5', 'c2'];
  var MAX_FIGURES = 40;
  var THUMBNAIL_WIDTH = 200;
  var THUMBNAIL_HEIGHT = 200;

  // Figure type options per library
  // A-Frame removed due to persistent full-screen issues
  var FIGURE_TYPES = {
    three: ['box', 'sphere', 'plane', 'cylinder', 'torus', 'cone'],
    p5: ['rect', 'ellipse', 'polygon', 'line', 'point', 'arc', 'star', 'triangle'],
    c2: ['rectangle', 'ellipse', 'line', 'point', 'star', 'polygon']
  };

  // ─── Module State ─────────────────────────────────────────────────────

  var _authState = {
    loggedIn: false,
    username: null
  };

  var _currentArtworkId = null;
  var _currentLibrary = 'three';
  var _figureManager = null;
  var _renderers = {}; // library -> renderer instance
  var _activeRenderer = null;

  // ─── DOM References (populated on init) ───────────────────────────────

  var _canvasRegion;
  var _librarySelect;
  var _figureManagerContainer;
  var _figurePropertiesSection;
  var _figurePropertiesPanel;
  var _errorDisplay;
  var _authStatus;
  var _emptyState;
  var _logoutBtn;
  var _loginForm;

  // Library canvas elements
  var _canvasThree;
  var _canvasP5;
  var _canvasC2;

  // Action buttons
  var _exportBtn;
  var _saveArtworkBtn;
  var _loadArtworkBtn;
  var _newArtworkBtn;
  var _deleteArtworkBtn;

  // Metadata panel
  var _artworkTitleInput;
  var _artworkDescriptionInput;
  var _artworkTagsInput;
  var _artworkIsPublicInput;
  var _artworkIsFeaturedInput;
  var _currentArtworkIdInput;
  var _saveMetadataBtn;
  var _saveMetadataStatus;
  var _metadataDeleteBtn;

  // Figure property inputs
  var _figureNameInput;
  var _figureTypeInput;
  var _figureXInput;
  var _figureYInput;
  var _figureZInput;
  var _figureRotationXInput;
  var _figureRotationYInput;
  var _figureRotationZInput;
  var _figureScaleXInput;
  var _figureScaleYInput;
  var _figureScaleZInput;
  var _figureColorInput;
  var _figureOpacityInput;
  var _figureOpacityValue;

  // Palette controls container
  var _paletteControlsContainer;

  // ─── API Response Handler ─────────────────────────────────────────────

  function handleResponse(response) {
    if (!response.ok) {
      return response.json().then(function(data) {
        throw new Error(data.error || 'Request failed (HTTP ' + response.status + ')');
      });
    }
    return response.json();
  }

  // ─── Error / Status Display ──────────────────────────────────────────

  function _showError(message) {
    if (DEBUG) console.error('[Creatrweb3D.App]', message);
    _errorDisplay.textContent = message;
    _errorDisplay.className = 'dta-error dta-visible';
    setTimeout(function() {
      _errorDisplay.className = 'dta-error';
    }, 5000);
  }

  function _showStatus(message) {
    log('Status:', message);
    _errorDisplay.textContent = message;
    _errorDisplay.className = 'dta-status dta-visible';
    setTimeout(function() {
      _errorDisplay.className = 'dta-status';
    }, 3000);
  }

  function _showEmptyState() {
    if (_emptyState) {
      _emptyState.className = 'dta-visible';
    }
  }

  function _hideEmptyState() {
    if (_emptyState) {
      _emptyState.className = '';
    }
  }

  // ─── Auth UI State ────────────────────────────────────────────────────

  function _updateAuthUI() {
    var authSection = document.getElementById('dta-auth-section');
    if (!authSection) return;

    if (_authState.loggedIn) {
      authSection.classList.add('dta-auth-logged-in');
      if (_authStatus) {
        _authStatus.textContent = 'Logged in as ' + _authState.username;
      }
      var authSummary = document.getElementById('dta-auth-summary');
      if (authSummary) {
        authSummary.textContent = 'Logged in as ' + _authState.username;
      }
    } else {
      authSection.classList.remove('dta-auth-logged-in');
      if (_authStatus) {
        _authStatus.textContent = '';
      }
      var authSummary2 = document.getElementById('dta-auth-summary');
      if (authSummary2) {
        authSummary2.textContent = 'Account';
      }
    }
  }

  // ─── Auth: Login Form Display ────────────────────────────────────────

  function _showLoginForm() {
    if (_loginForm) _loginForm.style.display = '';
    if (_authStatus) _authStatus.textContent = '';
  }

  // ─── Auth: Login ──────────────────────────────────────────────────────

  function _onLoginSubmit(e) {
    e.preventDefault();

    var email = document.getElementById('dta-login-email').value.trim();
    var password = document.getElementById('dta-login-password').value;

    if (!email || !password) {
      _showError('Email and password are required');
      return;
    }

    log('Logging in:', email);

    fetch('api/auth/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    })
    .then(handleResponse)
    .then(function(data) {
      if (data.success) {
        _authState.loggedIn = true;
        _authState.username = data.username;
        _updateAuthUI();
        _showStatus('Logged in as ' + _authState.username);
        if (_loginForm) _loginForm.reset();
      } else {
        _showError(data.error || 'Login failed');
      }
    })
    .catch(function(err) {
      _showError(err.message || 'Login failed');
    });
  }

  // ─── Auth: Logout ──────────────────────────────────────────────────

  function _onLogoutClick(e) {
    e.preventDefault();

    log('Logging out...');

    fetch('api/auth/logout.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(handleResponse)
    .then(function(data) {
      if (data.success) {
        _authState.loggedIn = false;
        _authState.username = null;
        _updateAuthUI();
        _showStatus('Logged out');
        if (_loginForm) _loginForm.reset();
        setTimeout(function() {
          window.location.href = '/index.php';
        }, 1000);
      } else {
        _showError(data.error || 'Logout failed');
      }
    })
    .catch(function(err) {
      _showError(err.message || 'Logout failed');
    });
  }

  // ─── Library Switching ───────────────────────────────────────────────

  /**
   * Switch to a different rendering library
   * @param {string} library - Library name (three, p5, c2)
   */
  function _switchLibrary(library) {
    if (VALID_LIBRARIES.indexOf(library) === -1) {
      warn('Invalid library:', library);
      return;
    }

    if (_currentLibrary === library) {
      return; // Already using this library
    }

    log('Switching library from', _currentLibrary, 'to', library);

    // Stop and destroy current renderer
    if (_activeRenderer) {
      if (_activeRenderer.destroy) {
        _activeRenderer.destroy();
      }
      _activeRenderer = null;
    }

    _currentLibrary = library;

    // Hide all canvas containers
    if (_canvasThree) _canvasThree.style.display = 'none';
    if (_canvasP5) _canvasP5.style.display = 'none';
    if (_canvasC2) _canvasC2.style.display = 'none';

    // Show selected canvas container
    var canvasEl;
    switch (library) {
      case 'three':
        if (_canvasThree) {
          _canvasThree.style.display = 'block';
          canvasEl = _canvasThree;
        }
        break;
      case 'p5':
        if (_canvasP5) {
          _canvasP5.style.display = 'block';
          canvasEl = _canvasP5;
        }
        break;
      case 'c2':
        if (_canvasC2) {
          _canvasC2.style.display = 'block';
          canvasEl = _canvasC2;
        }
        break;
    }

    // Update FigureManager library
    if (_figureManager) {
      _figureManager.setLibrary(library);
    }

    // Update figure type dropdown options
    _updateFigureTypeOptions();

    // Create and initialize new renderer, then sync figures
    if (canvasEl) {
      _createRenderer(library, canvasEl, function() {
        _syncFiguresToRenderer();
        _showStatus('Switched to ' + _getLibraryLabel(library));
      });
    } else {
      _syncFiguresToRenderer();
      _showStatus('Switched to ' + _getLibraryLabel(library));
    }
  }

  /**
   * Get human-readable label for a library
   * @param {string} library - Library name
   * @returns {string} Label
   */
  function _getLibraryLabel(library) {
    var labels = {
      'three': 'Three.js (3D)',
      'p5': 'P5.js (2D Creative Coding)',
      'c2': 'C2 (2D Canvas)'
    };
    return labels[library] || library;
  }

  /**
   * Track which external library scripts have been loaded
   */
  var _loadedLibraries = {};

  /**
   * Dynamically load a library's CDN script
   * @param {string} library - Library name ('three', 'p5')
   * @param {Function} callback - Called after script loads
   */
  function _loadLibraryScript(library, callback) {
    if (_loadedLibraries[library]) {
      callback();
      return;
    }

    var script;
    switch (library) {
      case 'three':
        script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        break;
      case 'p5':
        script = document.createElement('script');
        // Cloudflare CDN has issues in some environments, using jsDelivr
        script.src = 'https://cdn.jsdelivr.net/npm/p5@1.4.2/lib/p5.min.js';
        break;
      case 'c2':
        // C2 has no external CDN dependency
        _loadedLibraries[library] = true;
        callback();
        return;
      default:
        callback();
        return;
    }

    script.onload = function() {
      _loadedLibraries[library] = true;
      log('Loaded library script:', library);
      callback();
    };

    script.onerror = function() {
      warn('Failed to load library script:', library);
      callback(); // Continue anyway, renderer will handle missing library
    };

    document.head.appendChild(script);
  }

  /**
   * Actually create the renderer (called after script is loaded)
   * @param {string} library - Library name
   * @param {HTMLElement} canvasEl - Canvas/container element
   */
  function _doCreateRenderer(library, canvasEl) {
    var RendererClass;
    switch (library) {
      case 'three':
        RendererClass = window.DataToArt.ThreeRenderer;
        break;
      case 'p5':
        RendererClass = window.DataToArt.P5Renderer;
        break;
      case 'c2':
        RendererClass = window.DataToArt.C2Renderer;
        break;
      default:
        return;
    }

    if (!RendererClass) {
      warn('Renderer class not found for library:', library);
      _showError('Renderer for ' + library + ' not available');
      return;
    }

    try {
      // All libraries now use 'canvas' option
      var options = { canvas: canvasEl };
      _activeRenderer = new RendererClass(options);
      _renderers[library] = _activeRenderer;
      log('Created renderer for', library);
    } catch (e) {
      warn('Failed to create renderer for', library, ':', e.message);
      _showError('Failed to initialize ' + library + ' renderer: ' + e.message);
    }
  }

  /**
   * Create a renderer instance for a library
   * Loads external scripts dynamically if needed
   * @param {string} library - Library name
   * @param {HTMLElement} canvasEl - Canvas/container element
   * @param {Function} callback - Optional callback when renderer is ready
   */
  function _createRenderer(library, canvasEl, callback) {
    // Load external library script if needed (Three.js, p5.js), then create renderer
    var needsExternalScript = (library === 'three' || library === 'p5');
    
    function complete() {
      _doCreateRenderer(library, canvasEl);
      if (callback) callback();
    }
    
    if (needsExternalScript && !_loadedLibraries[library]) {
      // First time loading this library - load script, then create renderer
      _loadLibraryScript(library, complete);
      return;
    }
    
    // Script already loaded or no external script needed (c2)
    complete();
  }

  // ─── Figure Manager Setup ────────────────────────────────────────────

  /**
   * Initialize FigureManager with DOM container and change handler
   */
  function _initFigureManager() {
    if (!_figureManagerContainer) {
      warn('Figure manager container not found');
      return;
    }

    _figureManager = new window.DataToArt.FigureManager({
      container: _figureManagerContainer,
      library: _currentLibrary,
      onChange: _onFigureManagerChange.bind(this)
    });

    log('FigureManager initialized');

    // Update type dropdown
    _updateFigureTypeOptions();
  }

  /**
   * Handle FigureManager change events
   * @param {Object} event - Change event with action and data
   */
  function _onFigureManagerChange(event) {
    log('FigureManager change:', event.action);

    switch (event.action) {
      case 'add':
      case 'remove':
      case 'update':
      case 'reorder':
      case 'clear':
      case 'load':
        _syncFiguresToRenderer();
        _updateDeleteButtonVisibility();
        break;

      case 'select':
        _onFigureSelected(event.figureId);
        _updateDeleteButtonVisibility();
        break;

      case 'library_change':
        _switchLibrary(event.library);
        break;
    }

    // Hide empty state when figures exist
    if (_figureManager.count() > 0) {
      _hideEmptyState();
    } else {
      _showEmptyState();
    }
  }

  /**
   * Sync figures from FigureManager to active renderer
   */
  function _syncFiguresToRenderer() {
    if (!_activeRenderer || !_figureManager) return;

    var figures = _figureManager.getAll();
    
    if (_activeRenderer.setFigures) {
      _activeRenderer.setFigures(figures);
    }

    if (_activeRenderer.render) {
      _activeRenderer.render();
    }

    log('Synced', figures.length, 'figures to renderer');
  }

  /**
   * Handle figure selection - populate properties panel
   * @param {string} figureId - Selected figure ID
   */
  function _onFigureSelected(figureId) {
    log('Figure selected:', figureId);

    var figure = _figureManager.get(figureId);

    if (!figure) {
      // No figure selected - hide panel
      if (_figurePropertiesSection) {
        _figurePropertiesSection.style.display = 'none';
      }
      return;
    }

    // Show and populate properties panel
    if (_figurePropertiesSection) {
      _figurePropertiesSection.style.display = 'block';
      _figurePropertiesSection.open = true;
    }

    // Populate inputs
    if (_figureNameInput) _figureNameInput.value = figure.name || '';
    if (_figureTypeInput) _figureTypeInput.value = figure.type || '';
    if (_figureXInput) _figureXInput.value = figure.position.x || 0;
    if (_figureYInput) _figureYInput.value = figure.position.y || 0;
    if (_figureZInput) _figureZInput.value = figure.position.z || 0;
    if (_figureRotationXInput) _figureRotationXInput.value = figure.rotation.x || 0;
    if (_figureRotationYInput) _figureRotationYInput.value = figure.rotation.y || 0;
    if (_figureRotationZInput) _figureRotationZInput.value = figure.rotation.z || 0;
    if (_figureScaleXInput) _figureScaleXInput.value = figure.scale.x || 1;
    if (_figureScaleYInput) _figureScaleYInput.value = figure.scale.y || 1;
    if (_figureScaleZInput) _figureScaleZInput.value = figure.scale.z || 1;
    if (_figureColorInput) _figureColorInput.value = figure.color || '#c9922a';
    if (_figureOpacityInput) _figureOpacityInput.value = figure.opacity !== undefined ? figure.opacity : 1;
    if (_figureOpacityValue) _figureOpacityValue.textContent = (figure.opacity !== undefined ? figure.opacity : 1).toFixed(1);
  }

  // ─── Property Panel Binding ──────────────────────────────────────────

  /**
   * Set up bidirectional binding for property panel inputs
   */
  function _initPropertyBinding() {
    // Name
    if (_figureNameInput) {
      _figureNameInput.addEventListener('input', function() {
        var selected = _figureManager.getSelectedFigure();
        if (selected) {
          selected.name = this.value;
          _figureManager.update(selected.id, { name: this.value });
        }
      });
    }

    // Type
    if (_figureTypeInput) {
      _figureTypeInput.addEventListener('change', function() {
        var selected = _figureManager.getSelectedFigure();
        if (selected && selected.type !== this.value) {
          selected.type = this.value;
          _figureManager.update(selected.id, { type: this.value });
        }
      });
    }

    // Position X, Y, Z
    var positionFields = [
      { input: _figureXInput, property: 'x', group: 'position' },
      { input: _figureYInput, property: 'y', group: 'position' },
      { input: _figureZInput, property: 'z', group: 'position' }
    ];

    positionFields.forEach(function(field) {
      if (field.input) {
        field.input.addEventListener('input', function() {
          var selected = _figureManager.getSelectedFigure();
          if (selected) {
            selected.position[field.property] = parseFloat(this.value) || 0;
            _figureManager.update(selected.id, { position: selected.position });
          }
        });
      }
    });

    // Rotation X, Y, Z
    var rotationFields = [
      { input: _figureRotationXInput, property: 'x', group: 'rotation' },
      { input: _figureRotationYInput, property: 'y', group: 'rotation' },
      { input: _figureRotationZInput, property: 'z', group: 'rotation' }
    ];

    rotationFields.forEach(function(field) {
      if (field.input) {
        field.input.addEventListener('input', function() {
          var selected = _figureManager.getSelectedFigure();
          if (selected) {
            selected.rotation[field.property] = parseFloat(this.value) || 0;
            _figureManager.update(selected.id, { rotation: selected.rotation });
          }
        });
      }
    });

    // Scale X, Y, Z
    var scaleFields = [
      { input: _figureScaleXInput, property: 'x', group: 'scale' },
      { input: _figureScaleYInput, property: 'y', group: 'scale' },
      { input: _figureScaleZInput, property: 'z', group: 'scale' }
    ];

    scaleFields.forEach(function(field) {
      if (field.input) {
        field.input.addEventListener('input', function() {
          var selected = _figureManager.getSelectedFigure();
          if (selected) {
            selected.scale[field.property] = parseFloat(this.value) || 1;
            _figureManager.update(selected.id, { scale: selected.scale });
          }
        });
      }
    });

    // Color
    if (_figureColorInput) {
      _figureColorInput.addEventListener('input', function() {
        var selected = _figureManager.getSelectedFigure();
        if (selected) {
          selected.color = this.value;
          _figureManager.update(selected.id, { color: this.value });
        }
      });
    }

    // Opacity
    if (_figureOpacityInput) {
      _figureOpacityInput.addEventListener('input', function() {
        var selected = _figureManager.getSelectedFigure();
        if (selected) {
          selected.opacity = parseFloat(this.value) || 1;
          _figureManager.update(selected.id, { opacity: selected.opacity });
          if (_figureOpacityValue) {
            _figureOpacityValue.textContent = parseFloat(this.value).toFixed(1);
          }
        }
      });
    }
  }

  /**
   * Update figure type dropdown options based on current library
   */
  function _updateFigureTypeOptions() {
    if (!_figureTypeInput || !_currentLibrary) return;

    var types = FIGURE_TYPES[_currentLibrary] || [];
    var currentValue = _figureTypeInput.value;

    _figureTypeInput.innerHTML = '';
    for (var i = 0; i < types.length; i++) {
      var opt = document.createElement('option');
      opt.value = types[i];
      opt.textContent = types[i];
      _figureTypeInput.appendChild(opt);
    }

    // Restore selection if still valid
    if (types.indexOf(currentValue) !== -1) {
      _figureTypeInput.value = currentValue;
    } else if (types.length > 0) {
      _figureTypeInput.value = types[0];
    }
  }

  // ─── Artwork Save/Load ────────────────────────────────────────────────

  /**
   * Save current artwork state + metadata to database
   */
  function _onSaveArtworkClick() {
    // Check we have a renderer and figures
    if (!_activeRenderer || !_figureManager) {
      _showError('Renderer or figure manager not initialized');
      return;
    }

    // Get metadata from inputs
    var title = _artworkTitleInput ? _artworkTitleInput.value.trim() : '';
    var description = _artworkDescriptionInput ? _artworkDescriptionInput.value.trim() : '';
    var tags = _artworkTagsInput ? _artworkTagsInput.value.trim() : '';
    var isPublic = _artworkIsPublicInput ? (_artworkIsPublicInput.checked ? 1 : 0) : 0;
    var isFeatured = _artworkIsFeaturedInput ? (_artworkIsFeaturedInput.checked ? 1 : 0) : 0;

    if (!title) {
      _showError('Please enter a title for your artwork');
      return;
    }

    // Get figures from FigureManager
    var figures = _figureManager.save();
    var libraryConfig = {}; // Placeholder for library-specific config

    // Capture thumbnail from active renderer
    var thumbnailData = '';
    if (_activeRenderer && _activeRenderer.captureThumbnail) {
      try {
        thumbnailData = _activeRenderer.captureThumbnail(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
        log('Thumbnail captured:', thumbnailData ? 'YES (' + thumbnailData.length + ' chars)' : 'NO');
      } catch (e) {
        log('Failed to capture thumbnail:', e.message);
      }
    }

    // Build payload
    var payload = {
      library: _currentLibrary,
      figures: figures,
      palette_config: {}, // Placeholder - integrate with palette picker
      library_config: libraryConfig,
      title: title,
      description: description || null,
      tags: tags || null,
      is_public: isPublic,
      is_featured: isFeatured,
      thumbnail_data: thumbnailData
    };

    var method = 'POST';
    var url = 'api/artwork.php';

    if (_currentArtworkId) {
      method = 'PATCH';
      url = 'api/artwork.php?id=' + encodeURIComponent(_currentArtworkId);
      log('Updating existing artwork ID:', _currentArtworkId);
    } else {
      log('Creating new artwork');
    }

    log('Saving artwork with library:', _currentLibrary, 'figures:', figures.length);

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(handleResponse)
    .then(function(data) {
      if (data.success) {
        _showStatus('Artwork saved with ID: ' + data.artwork_id);
        _currentArtworkId = data.artwork_id;
        if (_currentArtworkIdInput) {
          _currentArtworkIdInput.value = data.artwork_id;
        }
        log('Artwork saved with ID:', data.artwork_id);
        _updateDeleteButtonVisibility();
      } else {
        _showError(data.error || 'Failed to save artwork');
      }
    })
    .catch(function(err) {
      _showError(err.message || 'Failed to save artwork');
    });
  }

  /**
   * Load artwork by ID and restore state
   * @param {number} artworkId - Artwork ID to load
   */
  function _loadArtworkById(artworkId) {
    log('Loading artwork ID:', artworkId);

    fetch('api/artwork.php?id=' + encodeURIComponent(artworkId))
    .then(handleResponse)
    .then(function(data) {
      if (data.success && data.artwork) {
        var artwork = data.artwork;
        log('Loaded artwork:', artwork);

        // Load metadata
        _currentArtworkId = artwork.id;
        if (_currentArtworkIdInput) _currentArtworkIdInput.value = artwork.id;
        if (_artworkTitleInput) _artworkTitleInput.value = artwork.title || '';
        if (_artworkDescriptionInput) _artworkDescriptionInput.value = artwork.description || '';
        if (_artworkTagsInput) _artworkTagsInput.value = artwork.tags || '';
        if (_artworkIsPublicInput) _artworkIsPublicInput.checked = (artwork.is_public === 1);
        if (_artworkIsFeaturedInput) _artworkIsFeaturedInput.checked = (artwork.is_featured === 1);

        // Clear figures first to avoid showing wrong figures during library switch
        if (_figureManager) {
          _figureManager.clear();
        }

        // Switch to artwork's library FIRST (ensures correct renderer exists)
        if (artwork.library && VALID_LIBRARIES.indexOf(artwork.library) !== -1) {
          _switchLibrary(artwork.library);
        }

        // Then load figures into FigureManager (will trigger sync to active renderer)
        if (_figureManager && artwork.figures) {
          try {
            // artwork.figures may already be an object (API decodes JSON) or a string
            var parsedFigures = typeof artwork.figures === 'string'
                ? JSON.parse(artwork.figures)
                : artwork.figures;
            if (Array.isArray(parsedFigures)) {
              _figureManager.load(parsedFigures, artwork.library);
            } else {
              log('Figures is not an array, type:', typeof parsedFigures, parsedFigures);
              _figureManager.clear();
            }
          } catch (e) {
            log('Failed to parse figures:', e.message);
            _figureManager.clear();
          }
        }

        // Load library config if available
        if (artwork.library_config) {
          try {
            // Placeholder for library config handling
            log('Library config loaded:', artwork.library_config);
          } catch (e) {
            log('Failed to parse library config:', e.message);
          }
        }

        // Load palette config if available
        if (artwork.palette_config) {
          try {
            // Placeholder for palette config handling
            log('Palette config loaded:', artwork.palette_config);
          } catch (e) {
            log('Failed to parse palette config:', e.message);
          }
        }

        _showStatus('Loaded artwork: ' + artwork.title);
        _hideEmptyState();
        _updateDeleteButtonVisibility();
      }
    })
    .catch(function(err) {
      _showError(err.message || 'Failed to load artwork');
    });
  }

  /**
   * Delete currently loaded artwork
   */
  function _onDeleteArtworkClick() {
    if (!_currentArtworkId) {
      _showError('No artwork loaded — nothing to delete');
      return;
    }

    var title = _artworkTitleInput ? _artworkTitleInput.value.trim() : 'this artwork';
    if (!confirm('Are you sure you want to delete "' + title + '"? This cannot be undone.')) {
      return;
    }

    log('Deleting artwork ID:', _currentArtworkId);

    fetch('api/artwork.php?id=' + encodeURIComponent(_currentArtworkId), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(handleResponse)
    .then(function(data) {
      log('Artwork deleted:', data);
      _showStatus('Artwork deleted');
      _clearArtworkMetadata();
      _updateDeleteButtonVisibility();
      // Clear figures
      if (_figureManager) {
        _figureManager.clear();
      }
      _showEmptyState();
    })
    .catch(function(err) {
      _showError(err.message || 'Failed to delete artwork');
    });
  }

  /**
   * Clear metadata panel
   */
  function _clearArtworkMetadata() {
    if (_artworkTitleInput) _artworkTitleInput.value = '';
    if (_artworkDescriptionInput) _artworkDescriptionInput.value = '';
    if (_artworkTagsInput) _artworkTagsInput.value = '';
    if (_artworkIsPublicInput) _artworkIsPublicInput.checked = false;
    if (_artworkIsFeaturedInput) _artworkIsFeaturedInput.checked = false;
    if (_currentArtworkIdInput) _currentArtworkIdInput.value = '';
    _currentArtworkId = null;
    _updateDeleteButtonVisibility();
    // Clear figures
    if (_figureManager) {
      _figureManager.clear();
    }
  }

  /**
   * Handle "New Artwork" button - reset to fresh state
   */
  function _onNewArtworkClick() {
    log('Starting new artwork');
    _clearArtworkMetadata();
    _showEmptyState();
    // Keep current library selection
  }

  /**
   * Show artwork list modal
   */
  function _onLoadArtworkClick() {
    log('Loading artwork list...');

    fetch('api/artwork.php')
    .then(handleResponse)
    .then(function(data) {
      if (data.success && data.artworks && data.artworks.length > 0) {
        _showArtworkListModal(data.artworks);
      } else {
        _showError('No artworks found to load');
      }
    })
    .catch(function(err) {
      _showError(err.message || 'Failed to load artwork list');
    });
  }

  /**
   * Display modal to select an artwork to load
   * @param {Array} artworks - List of artwork objects
   */
  function _showArtworkListModal(artworks) {
    var modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 2000; display: flex; align-items: center; justify-content: center;';

    var content = document.createElement('div');
    content.style.cssText = 'background: #242018; padding: 24px; border: 2px solid #c9922a; box-shadow: 4px 4px 0px #000000; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto;';

    var titleEl = document.createElement('h2');
    titleEl.textContent = 'Select Artwork to Load';
    titleEl.style.cssText = 'color: #c9922a; margin-bottom: 16px; font-size: 16px;';
    content.appendChild(titleEl);

    var list = document.createElement('ul');
    list.style.cssText = 'list-style: none; padding: 0; margin: 0;';

    artworks.forEach(function(artwork) {
      var item = document.createElement('li');
      item.style.cssText = 'margin-bottom: 8px;';

      var btn = document.createElement('button');
      btn.textContent = artwork.title + ' (ID: ' + artwork.id + ', ' + (artwork.library || 'unknown') + ')';
      btn.style.cssText = 'width: 100%; padding: 8px 12px; background: #1c1814; color: #f0ece4; border: 1px solid #333; font-family: system-ui; font-size: 13px; cursor: pointer; text-align: left;';
      btn.addEventListener('click', function() {
        _loadArtworkById(artwork.id);
        document.body.removeChild(modal);
      });

      item.appendChild(btn);
      list.appendChild(item);
    });

    content.appendChild(list);
    modal.appendChild(content);

    modal.addEventListener('click', function(event) {
      if (event.target === modal) {
        document.body.removeChild(modal);
      }
    });

    var closeHandler = function(event) {
      if (event.key === 'Escape') {
        if (modal.parentNode) {
          document.body.removeChild(modal);
        }
        document.removeEventListener('keydown', closeHandler);
      }
    };
    document.addEventListener('keydown', closeHandler);

    document.body.appendChild(modal);
  }

  /**
   * Update delete button visibility based on whether artwork is loaded
   */
  function _updateDeleteButtonVisibility() {
    var hasArtwork = !!_currentArtworkId;
    if (_deleteArtworkBtn) {
      _deleteArtworkBtn.style.display = hasArtwork ? '' : 'none';
    }
    if (_metadataDeleteBtn) {
      _metadataDeleteBtn.style.display = hasArtwork ? '' : 'none';
    }
  }

  /**
   * Export current canvas as PNG
   */
  function _onExportClick() {
    if (!_activeRenderer) {
      _showError('No active renderer');
      return;
    }

    var canvasEl = _activeRenderer.getCanvas ? _activeRenderer.getCanvas() : null;
    
    if (!canvasEl) {
      _showError('No canvas available for export');
      return;
    }

    if (!canvasEl) {
      _showError('No canvas available for export');
      return;
    }

    // DEBUG: Log export details
    log('[Export] canvasEl:', canvasEl);
    log('[Export] canvasEl.width:', canvasEl.width, 'height:', canvasEl.height);
    log('[Export] canvasEl.style.display:', canvasEl.style ? canvasEl.style.display : 'N/A');
    log('[Export] activeRenderer:', _activeRenderer ? _activeRenderer.constructor.name : 'N/A');
    log('[Export] figures count:', _activeRenderer && _activeRenderer._figures ? _activeRenderer._figures.length : 0);

    // Force render if method exists
    if (_activeRenderer && _activeRenderer.render) {
      _activeRenderer.render();
    }

    var filename = 'artwork-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.png';

    try {
      var dataUrl = canvasEl.toDataURL('image/png');
      log('[Export] dataUrl length:', dataUrl ? dataUrl.length : 0);
      
      var link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      _showStatus('Exported ' + filename);
    } catch (e) {
      log('[Export] Error:', e.message, e.stack);
      _showError('Export failed: ' + e.message);
    }
  }

  // ─── Metadata Save ────────────────────────────────────────────────────

  function _saveArtworkMetadata() {
    var title = _artworkTitleInput ? _artworkTitleInput.value.trim() : '';
    var description = _artworkDescriptionInput ? _artworkDescriptionInput.value.trim() : '';
    var tags = _artworkTagsInput ? _artworkTagsInput.value.trim() : '';
    var isPublic = _artworkIsPublicInput ? _artworkIsPublicInput.checked : false;
    var isFeatured = _artworkIsFeaturedInput ? _artworkIsFeaturedInput.checked : false;

    if (!title) {
      _showError('Title is required');
      return;
    }

    var artworkId = _currentArtworkIdInput ? _currentArtworkIdInput.value : null;

    var data = {
      title: title,
      description: description || null,
      tags: tags || null,
      is_public: isPublic ? 1 : 0,
      is_featured: isFeatured ? 1 : 0
    };

    var url, method;
    if (artworkId) {
      url = 'api/artwork.php?id=' + encodeURIComponent(artworkId);
      method = 'PATCH';
    } else {
      _showError('Please save the artwork first');
      return;
    }

    log('Saving artwork metadata for ID:', artworkId);

    if (_saveMetadataStatus) {
      _saveMetadataStatus.textContent = 'Saving…';
      _saveMetadataStatus.className = 'dta-status dta-visible';
    }

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(handleResponse)
    .then(function(data) {
      log('Metadata saved:', data);
      if (_saveMetadataStatus) {
        _saveMetadataStatus.textContent = 'Metadata saved!';
        _saveMetadataStatus.className = 'dta-status dta-visible';
        setTimeout(function() {
          _saveMetadataStatus.className = 'dta-status';
        }, 3000);
      }
      _showStatus('Artwork metadata saved');
    })
    .catch(function(err) {
      _showError(err.message || 'Failed to save metadata');
      if (_saveMetadataStatus) {
        _saveMetadataStatus.textContent = '';
        _saveMetadataStatus.className = 'dta-status';
      }
    });
  }

  // ─── Initialization ───────────────────────────────────────────────────

  function init() {
    log('Initializing Creatrweb 3D Art App…');

    // Grab DOM references
    _canvasRegion = document.getElementById('dta-canvas-region');
    _errorDisplay = document.getElementById('dta-error-display');
    _authStatus = document.getElementById('dta-auth-status');
    _emptyState = document.getElementById('dta-empty-state');
    _logoutBtn = document.getElementById('dta-logout-btn');
    _loginForm = document.getElementById('dta-login-form');

    _librarySelect = document.getElementById('dta-library-select');
    _figureManagerContainer = document.getElementById('dta-figure-manager-container');
    _figurePropertiesSection = document.getElementById('dta-figure-properties-section');
    _figurePropertiesPanel = document.getElementById('dta-figure-properties-panel');

    _canvasThree = document.getElementById('dta-canvas-three');
    _canvasP5 = document.getElementById('dta-canvas-p5');
    _canvasC2 = document.getElementById('dta-canvas-c2');

    _exportBtn = document.getElementById('dta-export-btn');
    _saveArtworkBtn = document.getElementById('dta-save-artwork-btn');
    _loadArtworkBtn = document.getElementById('dta-load-artwork-btn');
    _newArtworkBtn = document.getElementById('dta-new-artwork-btn');
    _deleteArtworkBtn = document.getElementById('dta-delete-artwork-btn');

    _artworkTitleInput = document.getElementById('dta-artwork-title');
    _artworkDescriptionInput = document.getElementById('dta-artwork-description');
    _artworkTagsInput = document.getElementById('dta-artwork-tags');
    _artworkIsPublicInput = document.getElementById('dta-artwork-is-public');
    _artworkIsFeaturedInput = document.getElementById('dta-artwork-is-featured');
    _currentArtworkIdInput = document.getElementById('dta-current-artwork-id');
    _saveMetadataBtn = document.getElementById('dta-save-metadata-btn');
    _saveMetadataStatus = document.getElementById('dta-save-status');
    _metadataDeleteBtn = document.getElementById('dta-delete-artwork-btn');

    // Figure property inputs
    _figureNameInput = document.getElementById('dta-figure-name');
    _figureTypeInput = document.getElementById('dta-figure-type');
    _figureXInput = document.getElementById('dta-figure-x');
    _figureYInput = document.getElementById('dta-figure-y');
    _figureZInput = document.getElementById('dta-figure-z');
    _figureRotationXInput = document.getElementById('dta-figure-rotation-x');
    _figureRotationYInput = document.getElementById('dta-figure-rotation-y');
    _figureRotationZInput = document.getElementById('dta-figure-rotation-z');
    _figureScaleXInput = document.getElementById('dta-figure-scale-x');
    _figureScaleYInput = document.getElementById('dta-figure-scale-y');
    _figureScaleZInput = document.getElementById('dta-figure-scale-z');
    _figureColorInput = document.getElementById('dta-figure-color');
    _figureOpacityInput = document.getElementById('dta-figure-opacity');
    _figureOpacityValue = document.getElementById('dta-figure-opacity-value');

    _paletteControlsContainer = document.getElementById('dta-palette-controls');

    // Validate critical elements
    if (!_canvasThree && !_canvasP5 && !_canvasC2) {
      console.error('[Creatrweb3D.App] No library canvas elements found');
      return;
    }

    if (!_librarySelect) {
      console.error('[Creatrweb3D.App] Library select element not found');
      return;
    }

    if (!_figureManagerContainer) {
      console.error('[Creatrweb3D.App] Figure manager container not found');
      return;
    }

    // Populate auth state from PHP-rendered attributes
    var sidebarEl = document.getElementById('dta-sidebar');
    if (sidebarEl) {
      var isAuthenticated = sidebarEl.dataset.authenticated === '1';
      var hasUsername = sidebarEl.dataset.username && sidebarEl.dataset.username.length > 0;
      if (isAuthenticated || hasUsername) {
        _authState.loggedIn = true;
        _authState.username = sidebarEl.dataset.username ||
                              sidebarEl.dataset.email ||
                              'Owner';
      }
    }
    _updateAuthUI();

    // Show login form for non-authenticated users on index.php
    if (_loginForm && !_authState.loggedIn && window.location.pathname.indexOf('studio.php') === -1) {
      _showLoginForm();
    }

    // Get initial library from select
    _currentLibrary = _librarySelect.value || 'three';

    // Initialize FigureManager
    _initFigureManager();

    // Initialize renderer for default library
    // We need to call _switchLibrary with _currentLibrary set to null temporarily
    // to force it to run the full initialization
    var initialLib = _currentLibrary;
    _currentLibrary = null; // Temporarily clear to force _switchLibrary to run
    _switchLibrary(initialLib);

    // Initialize property binding
    _initPropertyBinding();

    // Wire event listeners
    if (_librarySelect) {
      _librarySelect.addEventListener('change', function() {
        _switchLibrary(this.value);
      });
    }

    if (_exportBtn) {
      _exportBtn.addEventListener('click', _onExportClick);
    }

    if (_saveArtworkBtn) {
      _saveArtworkBtn.addEventListener('click', _onSaveArtworkClick);
    }

    if (_loadArtworkBtn) {
      _loadArtworkBtn.addEventListener('click', _onLoadArtworkClick);
    }

    if (_newArtworkBtn) {
      _newArtworkBtn.addEventListener('click', _onNewArtworkClick);
    }

    if (_deleteArtworkBtn) {
      _deleteArtworkBtn.addEventListener('click', _onDeleteArtworkClick);
    }

    if (_saveMetadataBtn) {
      _saveMetadataBtn.addEventListener('click', _saveArtworkMetadata);
    }

    // Auth form submissions
    if (_loginForm) {
      _loginForm.addEventListener('submit', _onLoginSubmit);
    }

    // Logout button
    if (_logoutBtn) {
      _logoutBtn.addEventListener('click', _onLogoutClick);
    }

    // Handle metadata delete button
    if (_metadataDeleteBtn) {
      _metadataDeleteBtn.addEventListener('click', _onDeleteArtworkClick);
    }

    // Set initial empty state
    _showEmptyState();

    log('App initialized');
  }

  /**
   * Get the canvas element for a library
   * @param {string} library - Library name
   * @returns {HTMLElement|null} Canvas/container element
   */
  function _getCanvasForLibrary(library) {
    switch (library) {
      case 'three': return _canvasThree;
      case 'p5': return _canvasP5;
      case 'c2': return _canvasC2;
      default: return null;
    }
  }

  // ─── Expose on Global Namespace ──────────────────────────────────────

  window.DataToArt = window.DataToArt || {};
  window.DataToArt.App = {
    init: init,
    showError: _showError,
    showStatus: _showStatus,
    showEmptyState: _showEmptyState,
    hideEmptyState: _hideEmptyState
  };

  // ─── Auto-Initialize on DOMContentLoaded ────────────────────────────

  function startInit() {
    // Use setTimeout to ensure CSS layout is computed
    setTimeout(init, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInit);
  } else {
    startInit();
  }

  log('App module loaded');
})();
