/**
 * Data Manager Module
 * Handles dataset listing, upload, and deletion for data.php
 */
(function() {
  'use strict';

  var DEBUG = window.location.search.indexOf('debug=true') !== -1;

  function log() {
    if (!DEBUG) return;
    var args = ['[DataManager]'];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    console.log.apply(console, args);
  }

  // ── DOM References ────────────────────────────────────────────────────

  var _uploadInput;
  var _datasetList;
  var _uploadStatus;
  var _errorDisplay;

  // ── Initialization ──────────────────────────────────────────────────

  function init() {
    log('Initializing Data Manager…');

    _uploadInput = document.getElementById('dta-file-upload');
    _datasetList = document.getElementById('dta-dataset-list');
    _uploadStatus = document.getElementById('dta-upload-status');
    _errorDisplay = document.getElementById('dta-error-display');

    if (!_uploadInput || !_datasetList) {
      log('Required DOM elements not found');
      return;
    }

    // Load existing datasets
    fetchDatasets();

    // Wire up upload handler
    _uploadInput.addEventListener('change', handleFileUpload);

    log('Data Manager initialized');
  }

  // ── Helper Functions ───────────────────────────────────────────────────

  function showError(message) {
    if (DEBUG) console.error('[DataManager]', message);
    if (_errorDisplay) {
      _errorDisplay.textContent = message;
      _errorDisplay.className = 'dta-error dta-visible';
      setTimeout(function() {
        _errorDisplay.className = 'dta-error';
      }, 5000);
    }
  }

  function showStatus(message) {
    log('Status:', message);
    if (_errorDisplay) {
      _errorDisplay.textContent = message;
      _errorDisplay.className = 'dta-status dta-visible';
      setTimeout(function() {
        _errorDisplay.className = 'dta-status';
      }, 3000);
    }
  }

  function updateUploadStatus(message) {
    if (_uploadStatus) {
      _uploadStatus.textContent = message;
    }
  }

  // ── API Response Handler ─────────────────────────────────────────────

  function handleResponse(response) {
    if (!response.ok) {
      return response.json().then(function(data) {
        throw new Error(data.error || 'Request failed (HTTP ' + response.status + ')');
      });
    }
    return response.json();
  }

  // ── Fetch and Display Datasets ────────────────────────────────────────

  function fetchDatasets() {
    log('Fetching datasets…');
    updateUploadStatus('');

    fetch('api/datasets.php', { credentials: 'include' })
      .then(handleResponse)
      .then(function(data) {
        if (data.success && data.datasets && Array.isArray(data.datasets)) {
          renderDatasetCards(data.datasets);
          log('Rendered', data.datasets.length, 'datasets');
        } else {
          renderDatasetCards([]);
        }
      })
      .catch(function(err) {
        showError(err.message || 'Failed to load datasets');
        renderDatasetCards([]);
      });
  }

  function renderDatasetCards(datasets) {
    if (!_datasetList) return;

    if (datasets.length === 0) {
      _datasetList.innerHTML = '<p style="color: #8a8580; font-size: 13px;">No datasets yet. Upload a CSV, TSV, or XLSX file to begin.</p>';
      return;
    }

    var html = '';
    for (var i = 0; i < datasets.length; i++) {
      var ds = datasets[i];
      html += renderDatasetCard(ds);
    }
    _datasetList.innerHTML = html;

    // Wire up delete buttons
    var deleteButtons = _datasetList.querySelectorAll('.dta-dataset-delete');
    for (var j = 0; j < deleteButtons.length; j++) {
      deleteButtons[j].addEventListener('click', handleDeleteClick);
    }
  }

  function renderDatasetCard(dataset) {
    return '\n' +
      '<div class="dta-dataset-card" data-dataset-id="' + dataset.id + '">\n' +
      '  <div class="dta-dataset-info">\n' +
      '    <span class="dta-dataset-name">' + escapeHtml(dataset.source_name || 'Untitled') + '</span>\n' +
      '    <span class="dta-dataset-meta">' + (dataset.row_count || 0) + ' rows</span>\n' +
      '  </div>\n' +
      '  <button class="dta-dataset-delete" data-dataset-id="' + dataset.id + '" data-dataset-name="' + escapeHtml(dataset.source_name || 'Untitled') + '" aria-label="Delete dataset" title="Delete">🗑️</button>\n' +
      '</div>';
  }

  // ── File Upload ──────────────────────────────────────────────────────

  function handleFileUpload(e) {
    var file = e.target.files[0];
    if (!file) return;

    log('Uploading file:', file.name);
    updateUploadStatus('Uploading…');

    var formData = new FormData();
    formData.append('file', file);

    fetch('api/upload.php', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })
    .then(handleResponse)
    .then(function(data) {
      if (data.success) {
        log('Upload complete — dataset_id:', data.dataset_id);
        updateUploadStatus('✓ Upload complete: ' + (data.source_name || file.name));
        showStatus('File uploaded successfully');
        // Refresh dataset list
        fetchDatasets();
      } else {
        showError(data.error || 'Upload failed');
        updateUploadStatus('✗ Upload failed');
      }
    })
    .catch(function(err) {
      showError(err.message || 'Upload failed');
      updateUploadStatus('✗ Upload failed');
    });

    // Reset file input so the same file can be re uploaded
    e.target.value = '';
  }

  // ── Delete Dataset ────────────────────────────────────────────────────

  function handleDeleteClick(e) {
    var datasetId = e.currentTarget.dataset.datasetId;
    var datasetName = e.currentTarget.dataset.datasetName;
    
    log('Delete clicked for dataset:', datasetId, datasetName);
    showDeleteConfirmation(datasetId, datasetName);
  }

  function showDeleteConfirmation(datasetId, datasetName) {
    // Remove any existing modal
    var existingModal = document.getElementById('dta-delete-modal');
    if (existingModal) {
      existingModal.parentNode.removeChild(existingModal);
    }

    // Create modal
    var modal = document.createElement('div');
    modal.id = 'dta-delete-modal';
    modal.className = 'dta-delete-modal dta-visible';
    modal.innerHTML = '\n' +
      '      <div class="dta-delete-modal-content">\n' +
      '        <h3>Delete Dataset?</h3>\n' +
      '        <p>You are about to delete<br><strong style="color:#f0ece4;">"' + escapeHtml(datasetName) + '"</strong><br><small style="color:#8a8580;">This cannot be undone.</small></p>\n' +
      '        <div class="dta-delete-modal-buttons">\n' +
      '          <button class="dta-btn-cancel" onclick="dismissDeleteModal()">Cancel</button>\n' +
      '          <button class="dta-btn-confirm" onclick="confirmDelete(' + datasetId + ')">Delete</button>\n' +
      '        </div>\n' +
      '      </div>';

    document.body.appendChild(modal);

    // Focus cancel button for keyboard accessibility
    var cancelBtn = modal.querySelector('.dta-btn-cancel');
    if (cancelBtn) cancelBtn.focus();

    // Close on Escape
    var escapeHandler = function(event) {
      if (event.key === 'Escape') {
        dismissDeleteModal();
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // Store reference for cleanup
    modal._escapeHandler = escapeHandler;

    // Expose dismiss function globally for onclick handlers
    window.dismissDeleteModal = function() {
      if (modal && modal.parentNode) {
        document.removeEventListener('keydown', modal._escapeHandler);
        modal.parentNode.removeChild(modal);
      }
    };

    // Expose confirm function globally
    window.confirmDelete = function(id) {
      actualDeleteDataset(id);
      dismissDeleteModal();
    };
  }

  function actualDeleteDataset(datasetId) {
    log('Deleting dataset:', datasetId);
    showStatus('Deleting dataset…');

    fetch('api/datasets.php?id=' + encodeURIComponent(datasetId), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
    .then(handleResponse)
    .then(function(data) {
      if (data.success) {
        showStatus('Dataset deleted successfully');
        // Refresh dataset list
        fetchDatasets();
        log('Dataset deleted');
      } else {
        showError(data.error || 'Failed to delete dataset');
      }
    })
    .catch(function(err) {
      showError(err.message || 'Failed to delete dataset');
    });
  }

  // ── Utility Functions ────────────────────────────────────────────────

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ── Auto-Initialize ────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for external access if needed
  window.DataToArt = window.DataToArt || {};
  window.DataToArt.DataManager = {
    fetchDatasets: fetchDatasets
  };

  log('Data Manager module loaded');
})();
