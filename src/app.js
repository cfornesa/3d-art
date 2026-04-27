/**
 * App Entry Point
 * Orchestrates initialization, event wiring, API calls, and auth flows.
 * Exposes window.DataToArt.App for external access if needed.
 *
 * Dependencies (must load before this file):
 *   - window.DataToArt.Controls   (controls.js)
 *   - window.DataToArt.ArtStyles  (artStyles.js)
 *   - window.DataToArt.DataMapper (dataMapper.js)
 */
(function() {
  'use strict';

  var DEBUG = window.location.search.indexOf('debug=true') !== -1;

  // ─── Logging Helpers ──────────────────────────────────────────────────

  function log() {
    if (!DEBUG) return;
    var args = ['[DataToArt.App]'];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    console.log.apply(console, args);
  }

  function warn() {
    if (!DEBUG) return;
    var args = ['[DataToArt.App]'];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    console.warn.apply(console, args);
  }

  // ─── Module State ─────────────────────────────────────────────────────

  var _datasetCache = null;   // Cached dataset list from datasets.php
  var _authState = {
    loggedIn: false,
    username: null
  };
  var _currentArtworkId = null;  // Currently loaded/saved artwork ID

  // ─── DOM References (populated on init) ───────────────────────────────

  var _canvasEl;
  var _controlsEl;
  var _uploadInput;
  var _datasetSelect;
  var _styleSelect;
  var _renderBtn;
  var _exportBtn;
  var _saveArtworkBtn;
  var _loadArtworkBtn;
  var _newArtworkBtn;
  var _deleteArtworkBtn;
  var _errorDisplay;
  var _authStatus;
  var _emptyState;
  var _logoutBtn;
  var _loginForm;
  var _modeManualRadio;
  var _modeDataRadio;

  // Metadata panel references
  var _artworkTitleInput;
  var _artworkDescriptionInput;
  var _artworkTagsInput;
  var _artworkIsPublicInput;
  var _artworkIsFeaturedInput;
  var _currentArtworkIdInput;
  var _saveMetadataBtn;
  var _saveMetadataStatus;
  var _metadataDeleteBtn;

  // ─── CSS Class Names ──────────────────────────────────────────────────

  var CLASS_VISIBLE = 'dta-visible';
  var CLASS_ACTIVE  = 'active';

  // ─── API Response Handler ─────────────────────────────────────────────

  /**
   * Standard fetch response handler. Rejects on non-OK responses
   * with the server's error message if available.
   */
  function handleResponse(response) {
    if (!response.ok) {
      return response.json().then(function(data) {
        throw new Error(data.error || 'Request failed (HTTP ' + response.status + ')');
      });
    }
    return response.json();
  }

  // ─── Error / Status Display ──────────────────────────────────────────

  /**
   * Show an error message inline. Auto-hides after 5 seconds.
   */
  function _showError(message) {
    if (DEBUG) console.error('[DataToArt.App]', message);
    _errorDisplay.textContent = message;
    _errorDisplay.className = 'dta-error dta-visible';
    setTimeout(function() {
      _errorDisplay.className = 'dta-error';
    }, 5000);
  }

  /**
   * Show a success/status message inline with teal accent.
   * Auto-hides after 3 seconds.
   */
  function _showStatus(message) {
    log('Status:', message);
    _errorDisplay.textContent = message;
    _errorDisplay.className = 'dta-status dta-visible';
    setTimeout(function() {
      _errorDisplay.className = 'dta-status';
    }, 3000);
  }

  // ─── Empty State helpers ────────────────────────────────────────────

  function _showEmptyState() {
    if (_emptyState) {
      _emptyState.className = CLASS_VISIBLE;
    }
  }

  function _hideEmptyState() {
    if (_emptyState) {
      _emptyState.className = '';
    }
  }

  // ─── Auth UI State ──────────────────────────────────────────────────

  /**
   * Update the auth panel UI based on current _authState.
   * Adds/removes .dta-auth-logged-in on #dta-auth-section and updates
   * status text, summary text, and logout button visibility.
   */
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

  // ─── Style Label Helper ───────────────────────────────────────────────

  /**
   * Human-readable labels for style keys.
   * Falls back to key itself for unknown styles.
   */
  var STYLE_LABELS = {
    particleField: 'Particle Field',
    geometricGrid: 'Geometric Grid',
    flowingCurves: 'Flowing Curves'
  };

  function styleLabel(key) {
    return STYLE_LABELS[key] || key;
  }

  // ─── Dataset List ─────────────────────────────────────────────────────

  /**
   * Fetch the dataset list from the API and populate the <select>.
   * Caches the result for client-side filtering in loadDataset().
   */
  function loadDatasetList() {
    log('Fetching dataset list…');
    fetch('api/datasets.php')
      .then(handleResponse)
      .then(function(data) {
        if (!data.datasets || !Array.isArray(data.datasets)) {
          _showError('Invalid dataset list response');
          return;
        }

        _datasetCache = data.datasets;
        log('Received', data.datasets.length, 'datasets');

        // Remember current selection
        var prevValue = _datasetSelect.value;

        // Clear and repopulate
        _datasetSelect.innerHTML = '<option value="">— Select a dataset —</option>';
        for (var i = 0; i < data.datasets.length; i++) {
          var ds = data.datasets[i];
          var opt = document.createElement('option');
          opt.value = ds.id;
          opt.textContent = ds.source_name + ' (' + ds.row_count + ' rows)';
          _datasetSelect.appendChild(opt);
        }

        // Restore selection if still valid
        if (prevValue) {
          var hasPrev = false;
          for (var i = 0; i < data.datasets.length; i++) {
            if (String(data.datasets[i].id) === String(prevValue)) {
              hasPrev = true;
              break;
            }
          }
          if (hasPrev) {
            _datasetSelect.value = prevValue;
          } else if (data.datasets.length > 0) {
            _datasetSelect.value = String(data.datasets[0].id);
          }
        } else if (data.datasets.length > 0) {
          _datasetSelect.value = String(data.datasets[0].id);
        }
      })
      .catch(function(err) {
        // 401 means not logged in — silently offer login
        if (err.message && err.message.indexOf('401') !== -1) {
          log('Auth required for dataset list');
          return;
        }
        _showError(err.message || 'Failed to load datasets');
      });
  }

  // ─── Load a Single Dataset ────────────────────────────────────────────

  /**
   * Load a specific dataset by ID. Refetches the dataset list to ensure
   * fresh data, finds the target dataset, maps it via DataMapper,
   * and passes it to Controls.loadDataset().
   */
  function loadDataset(datasetId) {
    if (!datasetId) return;

    log('Loading dataset', datasetId);

    fetch('api/datasets.php')
      .then(handleResponse)
      .then(function(data) {
        if (!data.datasets || !Array.isArray(data.datasets)) {
          _showError('Invalid dataset response');
          return;
        }

        for (var i = 0; i < data.datasets.length; i++) {
          if (String(data.datasets[i].id) === String(datasetId)) {
            var dataset = data.datasets[i];
            break;
          }
        }

        if (!dataset) {
          _showError('Dataset not found (ID: ' + datasetId + ')');
          return;
        }

        // Transform via DataMapper
        var mapped = window.DataToArt.DataMapper.mapApiResponse({
          dataset_id: dataset.id,
          columns: dataset.columns,
          row_count: dataset.row_count
        });

        if (!mapped) {
          _showError('Failed to map dataset');
          return;
        }

        // Load into Controls
        window.DataToArt.Controls.loadDataset(mapped);
        log('Dataset loaded:', dataset.source_name);

        // Hide empty state when dataset loads
        _hideEmptyState();
      })
      .catch(function(err) {
        _showError(err.message || 'Failed to load dataset');
      });
  }

  // ─── Auth: Login Form Display ──────────────────────────────────────────

  function _showLoginForm() {
    if (_loginForm) _loginForm.style.display = '';
    // Clear auth status when switching modes
    if (_authStatus) _authStatus.textContent = '';
  }

  // ─── Auth: Register (disabled) ────────────────────────────────────────

  function _onRegisterSubmit(e) {
    // Registration is disabled - this should never be called but handle gracefully
    if (e) e.preventDefault();
    _showError('Registration is disabled. Owner access only.');
  }

  // ─── Auth: Login ──────────────────────────────────────────────────────

  function _onLoginSubmit(e) {
    e.preventDefault();

    var email    = document.getElementById('dta-login-email').value.trim();
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
        // Refresh dataset list for user-owned datasets
        loadDatasetList();
      } else {
        _showError(data.error || 'Login failed');
      }
    })
    .catch(function(err) {
      _showError(err.message || 'Login failed');
    });
  }

  // ─── Auth: Logout ────────────────────────────────────────────────────

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
        // Refresh dataset list to show only preloaded datasets
        loadDatasetList();
        // Redirect to home page after logout
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

  // ─── File Upload ──────────────────────────────────────────────────────

  function _onFileUpload(e) {
    var file = e.target.files[0];
    if (!file) return;

    log('Uploading file:', file.name);

    var formData = new FormData();
    formData.append('file', file);

    _showStatus('Uploading…');

    fetch('api/upload.php', {
      method: 'POST',
      body: formData
    })
    .then(handleResponse)
    .then(function(data) {
      if (data.success) {
        log('Upload complete — dataset_id:', data.dataset_id);
        _showStatus('File uploaded: ' + (data.source_name || file.name));

        // Refresh dataset list, then auto-select and load the new dataset
        fetch('api/datasets.php')
          .then(handleResponse)
          .then(function(listData) {
            if (listData.datasets && Array.isArray(listData.datasets)) {
              _datasetCache = listData.datasets;
              _datasetSelect.innerHTML = '<option value="">— Select a dataset —</option>';
              for (var i = 0; i < listData.datasets.length; i++) {
                var ds = listData.datasets[i];
                var opt = document.createElement('option');
                opt.value = ds.id;
                opt.textContent = ds.source_name + ' (' + ds.row_count + ' rows)';
                _datasetSelect.appendChild(opt);
              }
              _datasetSelect.value = String(data.dataset_id);
              loadDataset(data.dataset_id);
            }
          })
          .catch(function() {
            // List refresh failed — still try to load the dataset directly
            loadDataset(data.dataset_id);
          });
      } else {
        _showError(data.error || 'Upload failed');
      }
    })
    .catch(function(err) {
      _showError(err.message || 'Upload failed');
    });

    // Reset file input so the same file can be re-uploaded
    e.target.value = '';
  }

  // ─── Metadata Helpers ───────────────────────────────────────────────

  /**
   * Save artwork metadata via PATCH to api/artwork.php
   * Creates a new artwork if no ID exists, updates if ID exists.
   */
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
      // Update existing artwork
      url = 'api/artwork.php?id=' + encodeURIComponent(artworkId);
      method = 'PATCH';
    } else {
      // This shouldn't happen for now - metadata is only saved for existing artworks
      // For future: we could create a new artwork with default config
      _showError('Please render and save the artwork first');
      return;
    }

    log('Saving artwork metadata for ID:', artworkId);

    // Update save status
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

  /**
   * Load artwork by ID and populate metadata panel
   */
  function _loadArtworkMetadata(artworkId) {
    if (!artworkId) {
      // Clear metadata panel
      if (_artworkTitleInput) _artworkTitleInput.value = '';
      if (_artworkDescriptionInput) _artworkDescriptionInput.value = '';
      if (_artworkTagsInput) _artworkTagsInput.value = '';
      if (_artworkIsPublicInput) _artworkIsPublicInput.checked = false;
      if (_artworkIsFeaturedInput) _artworkIsFeaturedInput.checked = false;
      if (_currentArtworkIdInput) _currentArtworkIdInput.value = '';
      _currentArtworkId = null;
      return;
    }

    log('Loading artwork metadata for ID:', artworkId);

    fetch('api/artwork.php?id=' + encodeURIComponent(artworkId))
    .then(handleResponse)
    .then(function(data) {
      if (data.success && data.artwork) {
        var a = data.artwork;
        log('Loaded artwork:', a);

        _currentArtworkId = a.id;
        if (_currentArtworkIdInput) _currentArtworkIdInput.value = a.id;
        if (_artworkTitleInput) _artworkTitleInput.value = a.title || '';
        if (_artworkDescriptionInput) _artworkDescriptionInput.value = a.description || '';
        if (_artworkTagsInput) _artworkTagsInput.value = a.tags || '';
        if (_artworkIsPublicInput) _artworkIsPublicInput.checked = (a.is_public === 1 || a.is_public === true);
        if (_artworkIsFeaturedInput) _artworkIsFeaturedInput.checked = (a.is_featured === 1 || a.is_featured === true);

        _showStatus('Loaded artwork metadata');
      }
    })
    .catch(function(err) {
      log('Failed to load artwork:', err.message);
      // Clear fields on error
      _clearArtworkMetadata();
    });
  }

  /**
   * Handle "New Artwork" button click - reset to fresh canvas state.
   * Clears artwork identity so next save creates a new artwork (not updates existing).
   */
  function _onNewArtworkClick() {
    log('Starting new artwork');

    // Clear artwork ID so save creates new, not updates
    // (Also clears hidden input to prevent stale data display)
    _currentArtworkId = null;
    if (_currentArtworkIdInput) {
      _currentArtworkIdInput.value = '';
    }

    // Clear metadata fields (title, description, tags, checkboxes)
    // This also calls _updateDeleteButtonVisibility() to hide delete button
    _clearArtworkMetadata();

    // Reset controls - clears canvas, resets column mapping, restores palette,
    // resets style to 'particleField', cancels debounced renders
    if (window.DataToArt && window.DataToArt.Controls) {
      window.DataToArt.Controls.reset();
    }

    // Show status to confirm action
    _showStatus('New artwork started - canvas reset');
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
    // Update delete button visibility
    _updateDeleteButtonVisibility();
    // Reset Controls to clear any loaded artwork state
    // window.DataToArt.Controls.reset();
  }

  /**
   * Save the current artwork state (from Controls) to the database
   * This creates a new artwork record with all current settings + metadata
   */
  function _onSaveArtworkClick() {
    // Check if there's a dataset loaded
    if (!window.DataToArt || !window.DataToArt.Controls || !window.DataToArt.Controls._currentDataset) {
      _showError('No data loaded — please upload or select a dataset and render first');
      return;
    }

    // Get current state from Controls
    var controls = window.DataToArt.Controls;
    var columnMapping = controls._currentColumnMapping || {};
    var paletteConfig = controls._currentPaletteConfig || {};
    var renderingConfig = controls._currentRenderingConfig || {};
    var styleKey = controls._currentStyleKey || '';
    var dataset = controls._currentDataset;
    var currentMode = controls.getMode ? controls.getMode() : 'manual';
    var visualDimensions = controls._currentVisualDimensions || null;

    // Get metadata from inputs
    var title = _artworkTitleInput ? _artworkTitleInput.value.trim() : '';
    var description = _artworkDescriptionInput ? _artworkDescriptionInput.value.trim() : '';
    var tags = _artworkTagsInput ? _artworkTagsInput.value.trim() : '';
    var isPublic = _artworkIsPublicInput ? (_artworkIsPublicInput.checked ? 1 : 0) : 0;
    var isFeatured = _artworkIsFeaturedInput ? (_artworkIsFeaturedInput.checked ? 1 : 0) : 0;

    // Look up dataset_id from the dataset
    var datasetId = dataset ? dataset.dataset_id : null;

    // Look up art_style_id from styleKey
    // Map camelCase JavaScript styleKey to database art_styles.id
    // Database style_keys use underscore_case, but JavaScript uses camelCase
    var styleIdMap = {
      'particleField': 1,
      'geometricGrid': 2,
      'flowingCurves': 3,
      'radialWave': 4,
      'fractalDust': 5,
      'neuralFlow': 6,
      'pixelMosaic': 7,
      'voronoiCells': 8,
      'radialSymmetry': 9,
      'timeSeries': 10,
      'heatMap': 11,
      'scatterMatrix': 12,
      'barCode': 13
    };
    var artStyleId = styleIdMap[styleKey] || null;

    if (!artStyleId) {
      _showError('Could not determine art style ID');
      return;
    }

    if (!title) {
      _showError('Please enter a title for your artwork');
      return;
    }

    // Build payload for api/artwork.php
    // Branch on existing artwork ID: PATCH for updates, POST for new
    var method = 'POST';
    var url = 'api/artwork.php';
    
    if (_currentArtworkId) {
      method = 'PATCH';
      url = 'api/artwork.php?id=' + encodeURIComponent(_currentArtworkId);
      log('Updating existing artwork ID:', _currentArtworkId);
    } else {
      log('Creating new artwork');
    }

    var payload = {
      art_style_id: artStyleId,
      title: title,
      description: description || null,
      tags: tags || null,
      dataset_id: datasetId,
      column_mapping: columnMapping,
      palette_config: paletteConfig,
      rendering_config: renderingConfig,
      is_public: isPublic,
      is_featured: isFeatured
    };

    // For Manual mode, include mode and visual dimensions
    if (currentMode === 'manual') {
      payload.mode = 'manual';
      // Remove color from visualDimensions if present (Manual mode uses palette only)
      var vd = visualDimensions || {};
      var cleanVD = {
        x: vd.x !== undefined ? vd.x : 0,
        y: vd.y !== undefined ? vd.y : 0,
        size: vd.size !== undefined ? vd.size : 100,
        opacity: vd.opacity !== undefined ? vd.opacity : 1,
        rotation: vd.rotation !== undefined ? vd.rotation : 0
      };
      payload.visual_dimensions = cleanVD;
    }

    // Capture thumbnail from canvas
    var canvasEl = _canvasEl || document.getElementById('dta-canvas');
    if (canvasEl) {
      try {
        var thumbnailData = canvasEl.toDataURL('image/png');
        payload.thumbnail_data = thumbnailData;
        log('Thumbnail captured:', thumbnailData ? 'YES (' + thumbnailData.length + ' chars)' : 'NO');
      } catch (e) {
        log('Failed to capture thumbnail:', e.message);
      }
    }

    log('Saving artwork with method:', method, 'payload:', payload);

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(handleResponse)
    .then(function(data) {
      if (data.success) {
        _showStatus('Artwork saved with ID: ' + data.artwork_id);
        // Store the ID for future metadata updates
        _currentArtworkId = data.artwork_id;
        if (_currentArtworkIdInput) {
          _currentArtworkIdInput.value = data.artwork_id;
        }
        log('Artwork saved with ID:', data.artwork_id);
        // Update delete button visibility since we now have a saved artwork
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
   * Show a list of user's artworks to load
   */
  function _onLoadArtworkClick() {
    log('Loading artwork list…');

    fetch('api/artwork.php')
    .then(handleResponse)
    .then(function(data) {
      if (data.success && data.artworks && data.artworks.length > 0) {
        // Show a simple modal with artwork choices
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
   * Show or hide the delete artwork buttons.
   * The main delete button in the button row and the metadata panel button
   * are shown only when an artwork is loaded (_currentArtworkId is set).
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
   * Delete the currently loaded artwork after user confirmation.
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
    })
    .catch(function(err) {
      _showError(err.message || 'Failed to delete artwork');
    });
  }

  /**
   * Display a modal to select an artwork to load
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
      btn.textContent = artwork.title + ' (ID: ' + artwork.id + ')';
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

    // Close on background click
    modal.addEventListener('click', function(event) {
      if (event.target === modal) {
        document.body.removeChild(modal);
      }
    });

    // Close on Escape
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
   * Load a specific artwork by ID
   */
  function _loadArtworkById(artworkId) {
    log('Loading artwork ID:', artworkId);

    fetch('api/artwork.php?id=' + encodeURIComponent(artworkId))
    .then(handleResponse)
    .then(function(data) {
      if (data.success && data.artwork) {
        var artwork = data.artwork;
        log('Loaded artwork:', artwork);

        // Load metadata into panel
        _currentArtworkId = artwork.id;
        if (_currentArtworkIdInput) _currentArtworkIdInput.value = artwork.id;
        if (_artworkTitleInput) _artworkTitleInput.value = artwork.title || '';
        if (_artworkDescriptionInput) _artworkDescriptionInput.value = artwork.description || '';
        if (_artworkTagsInput) _artworkTagsInput.value = artwork.tags || '';
        if (_artworkIsPublicInput) _artworkIsPublicInput.checked = (artwork.is_public === 1);
        if (_artworkIsFeaturedInput) _artworkIsFeaturedInput.checked = (artwork.is_featured === 1);

        // Load dataset if available
        if (artwork.dataset_id) {
          loadDataset(artwork.dataset_id);
        } else {
          // No dataset means this was saved in Manual mode
          log('Loading Manual mode artwork - no dataset_id');
          window.DataToArt.Controls._currentDataset = null;
        }

        // Set the correct mode based on artwork
        var mode = artwork.mode || (artwork.dataset_id ? 'data' : 'manual');
        if (mode === 'manual') {
          window.DataToArt.Controls.setMode('manual');
          // Ensure manual mode radio is checked
          if (_modeManualRadio) _modeManualRadio.checked = true;
          if (_modeDataRadio) _modeDataRadio.checked = false;
        } else {
          window.DataToArt.Controls.setMode('data');
          if (_modeManualRadio) _modeManualRadio.checked = false;
          if (_modeDataRadio) _modeDataRadio.checked = true;
        }

        // Restore mapping and palette config to Controls
        var controls = window.DataToArt && window.DataToArt.Controls;
        
        // Map database art_styles.id to camelCase styleKey
        var styleKeyForId = {
          1: 'particleField',
          2: 'geometricGrid', 
          3: 'flowingCurves',
          4: 'radialWave',
          5: 'fractalDust',
          6: 'neuralFlow',
          7: 'pixelMosaic',
          8: 'voronoiCells',
          9: 'radialSymmetry',
          10: 'timeSeries',
          11: 'heatMap',
          12: 'scatterMatrix',
          13: 'barCode'
        };
        
        if (controls) {
          // Update style first (some styles need this before render)
          if (artwork.art_style_id) {
            var styleKey = styleKeyForId[artwork.art_style_id] || 'particleField';
            controls.setStyle(styleKey);
            _styleSelect.value = styleKey;
          }

          if (artwork.dataset_id) {
            controls.loadDataset(controls._currentDataset);
          }

          // Update mapping
          if (artwork.column_mapping) {
            controls._currentColumnMapping = artwork.column_mapping;
          }
          // Update palette
          if (artwork.palette_config) {
            controls._currentPaletteConfig = artwork.palette_config;
          }
          // Update rendering config
          if (artwork.rendering_config) {
            controls._currentRenderingConfig = artwork.rendering_config;
          }

          // For Manual mode artworks, restore visual dimensions
          if (artwork.visual_dimensions) {
            controls._currentVisualDimensions = artwork.visual_dimensions;
            if (controls.VisualDimensions && controls.VisualDimensions.setValues) {
              controls.VisualDimensions.setValues(artwork.visual_dimensions);
            }
          }

          // Re-render with restored state
          controls.triggerRender();
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

  // ─── Initialization ───────────────────────────────────────────────────

  function init() {
    log('Initializing Data-to-Art App…');

    // Grab DOM references
    _canvasEl      = document.getElementById('dta-canvas');
    _controlsEl    = document.getElementById('dta-controls');
    _uploadInput   = document.getElementById('dta-file-upload');
    _datasetSelect = document.getElementById('dta-dataset-select');
    _styleSelect   = document.getElementById('dta-style-select');
    _renderBtn     = document.getElementById('dta-render-btn');
    _exportBtn     = document.getElementById('dta-export-btn');
    _saveArtworkBtn = document.getElementById('dta-save-artwork-btn');
    _loadArtworkBtn = document.getElementById('dta-load-artwork-btn');
    _newArtworkBtn = document.getElementById('dta-new-artwork-btn');
    _deleteArtworkBtn = document.getElementById('dta-delete-artwork-btn');
    _errorDisplay  = document.getElementById('dta-error-display');
    _authStatus    = document.getElementById('dta-auth-status');
    _emptyState    = document.getElementById('dta-empty-state');
    _logoutBtn     = document.getElementById('dta-logout-btn');
    _loginForm     = document.getElementById('dta-login-form');
    _modeManualRadio = document.getElementById('dta-mode-manual');
    _modeDataRadio   = document.getElementById('dta-mode-data');

    // Metadata panel references
    _artworkTitleInput       = document.getElementById('dta-artwork-title');
    _artworkDescriptionInput = document.getElementById('dta-artwork-description');
    _artworkTagsInput        = document.getElementById('dta-artwork-tags');
    _artworkIsPublicInput     = document.getElementById('dta-artwork-is-public');
    _artworkIsFeaturedInput   = document.getElementById('dta-artwork-is-featured');
    _currentArtworkIdInput    = document.getElementById('dta-current-artwork-id');
    _saveMetadataBtn         = document.getElementById('dta-save-metadata-btn');
    _saveMetadataStatus      = document.getElementById('dta-save-status');
    _metadataDeleteBtn       = document.getElementById('dta-delete-artwork-btn');

    // Populate auth state from PHP-rendered attributes on sidebar
    // studio.php: data-authenticated="1" and data-username="..."
    // index.php: may have data-username if logged in via modal
    //
    // Auth detection strategy:
    // 1. Check data-authenticated="1" explicitly (studio.php sets this when PHP auth passes)
    // 2. Fall back to non-empty data-username for index.php compatibility
    var sidebarEl = document.getElementById('dta-sidebar');
    if (sidebarEl) {
      var isAuthenticated = sidebarEl.dataset.authenticated === '1';
      var hasUsername = sidebarEl.dataset.username && sidebarEl.dataset.username.length > 0;
      if (isAuthenticated || hasUsername) {
        _authState.loggedIn = true;
        // Use username if available, otherwise derive from email session or default
        _authState.username = sidebarEl.dataset.username ||
                              sidebarEl.dataset.email ||
                              'Owner';
      }
    }
    _updateAuthUI();

    // Only show login form for index.php modal — studio.php handles visibility via CSS
    // (studio.php redirects unauthenticated users, so login form should never be needed there)
    if (_loginForm && !_authState.loggedIn && window.location.pathname.indexOf('studio.php') === -1) {
      _showLoginForm();
    }

    // Validate critical DOM elements
    if (!_canvasEl || !_controlsEl) {
      console.error('[DataToArt.App] Missing required DOM elements (#dta-canvas, #dta-controls)');
      return;
    }

    // Initialize Controls module
    window.DataToArt.Controls.init(_canvasEl, _controlsEl, {
      styleKey: 'particleField',
      renderingConfig: { animate: false }
    });

    // Sync mode with radio button state
    if (_modeManualRadio && _modeManualRadio.checked) {
      window.DataToArt.Controls.setMode('manual');
    } else if (_modeDataRadio && _modeDataRadio.checked) {
      window.DataToArt.Controls.setMode('data');
    }

    // Trigger initial render with default dimensions
    window.DataToArt.Controls.triggerRender();

    // Populate style selector
    // Attempt immediate population and schedule a defensive retry in case
    // style modules haven't executed yet (race condition protection).
    function populateStyles() {
      if (!window.DataToArt || !window.DataToArt.ArtStyles) return;
      // Explicitly re-scan global namespace for any newly-available styles
      window.DataToArt.ArtStyles.registerBuiltinStyles();
      var styles = window.DataToArt.ArtStyles.listStyles();
      _styleSelect.innerHTML = '<option value="">— Select art style —</option>';
      for (var i = 0; i < styles.length; i++) {
        var opt = document.createElement('option');
        opt.value = styles[i];
        opt.textContent = styleLabel(styles[i]);
        _styleSelect.appendChild(opt);
      }
      // Default to first available style
      if (styles.length > 0) {
        _styleSelect.value = styles[0];
      }
      return styles.length;
    }

    var styleCount = populateStyles();

    // Defensive: if registry was empty, retry after a short delay to handle
    // scripts that may not have executed before artStyles.js ran.
    if (styleCount === 0) {
      setTimeout(function() {
        log('Style registry was empty — retrying population...');
        var count = populateStyles();
        if (count === 0) {
          warn('Style registry still empty after retry. Style modules may not be attaching to window.DataToArt correctly.');
        } else {
          log('Style population retry succeeded:', count, 'styles loaded');
        }
      }, 150);
    }

    // Wire event listeners
    if (_uploadInput) {
      _uploadInput.addEventListener('change', _onFileUpload);
    }

    _datasetSelect.addEventListener('change', function() {
      var datasetId = _datasetSelect.value;
      if (datasetId) {
        loadDataset(datasetId);
      }
    });

    _styleSelect.addEventListener('change', function() {
      var styleKey = _styleSelect.value;
      if (styleKey) {
        window.DataToArt.Controls.setStyle(styleKey);
      }
    });

    // Mode toggle listeners
    if (_modeManualRadio && _modeDataRadio) {
      _modeManualRadio.addEventListener('change', function() {
        if (this.checked) {
          window.DataToArt.Controls.setMode('manual');
          window.DataToArt.Controls.triggerRender();
        }
      });
      _modeDataRadio.addEventListener('change', function() {
        if (this.checked) {
          window.DataToArt.Controls.setMode('data');
          window.DataToArt.Controls.triggerRender();
        }
      });
    }

    if (_renderBtn) {
      _renderBtn.addEventListener('click', function() {
        window.DataToArt.Controls.triggerRender();
      });
    }

    if (_exportBtn) {
      _exportBtn.addEventListener('click', function() {
        var filename = 'artwork-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.png';
        // In Manual mode, we can export without a dataset
        // In Data-Driven mode, still need a dataset
        if (window.DataToArt.Controls.getMode() === 'data' && !window.DataToArt.Controls._currentDataset) {
          _showError('No data loaded — upload or select a dataset first');
          return;
        }
        window.DataToArt.Controls.triggerExport(filename);
        _showStatus('Exporting ' + filename + '…');
      });
    }

    // Auth form submissions
    if (_loginForm) {
      _loginForm.addEventListener('submit', _onLoginSubmit);
    }

    // Logout button
    if (_logoutBtn) {
      _logoutBtn.addEventListener('click', _onLogoutClick);
    }

    // Metadata save button
    if (_saveMetadataBtn) {
      _saveMetadataBtn.addEventListener('click', _saveArtworkMetadata);
    }

    // Save Artwork button (saves entire artwork with metadata)
    if (_saveArtworkBtn) {
      _saveArtworkBtn.addEventListener('click', _onSaveArtworkClick);
    }

    // Load Artwork button (shows list of existing artworks)
    if (_loadArtworkBtn) {
      _loadArtworkBtn.addEventListener('click', _onLoadArtworkClick);
    }

    // Delete Artwork button
    if (_deleteArtworkBtn) {
      _deleteArtworkBtn.addEventListener('click', _onDeleteArtworkClick);
    }

    // New Artwork button (resets canvas to fresh state)
    if (_newArtworkBtn) {
      _newArtworkBtn.addEventListener('click', _onNewArtworkClick);
    }

    // Fetch initial dataset list
    loadDatasetList();

    // After datasets load, auto-load the selected one (if any)
    // Add this in init(), after loadDatasetList(), via a slight delay:
    setTimeout(function() {
      var val = _datasetSelect.value;
      if (val) {
        loadDataset(val);
      }
    }, 200);

    // Don't show empty state in Manual mode since we render defaults
    // Only show it in Data-Driven mode with no dataset
    // The render call above will populate the canvas

    log('App initialized');
  }

  // ─── Expose on Global Namespace ────────────────────────────────────────

  window.DataToArt = window.DataToArt || {};
  window.DataToArt.App = {
    init: init,
    showError: _showError,
    showStatus: _showStatus,
    showEmptyState: _showEmptyState,
    hideEmptyState: _hideEmptyState
  };

  // ─── Auto-Initialize on DOMContentLoaded ────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  log('App module loaded');
})();