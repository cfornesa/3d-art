/**
 * Creatrweb 3D Art — Figure Manager
 *
 * Core figure CRUD and layer management for library-based rendering.
 * Manages up to 40 figures per artwork with layer-based controls.
 */

;(function() {
    'use strict';

    if (typeof window.DataToArt === 'undefined') {
        window.DataToArt = {};
    }

    const MAX_FIGURES = 40;

    /**
     * Figure Manager constructor
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.container - DOM container for figure list
     * @param {Function} options.onChange - Callback when figures change
     */
    function FigureManager(options) {
        options = options || {};
        
        this._container = options.container || null;
        this._onChange = options.onChange || function() {};
        this._figures = [];
        this._selectedFigureId = null;
        this._library = options.library || 'three';
        
        this._init();
    }

    /**
     * Initialize Figure Manager
     */
    FigureManager.prototype._init = function() {
        if (this._container) {
            this._createUI();
        }
    };

    /**
     * Create figure list and controls UI
     */
    FigureManager.prototype._createUI = function() {
        // Container for figure list
        this._figureList = document.createElement('div');
        this._figureList.className = 'dta-figure-list';
        
        // Add/remove controls
        this._controls = document.createElement('div');
        this._controls.className = 'dta-figure-controls';
        
        // Add button
        this._addBtn = document.createElement('button');
        this._addBtn.className = 'dta-btn dta-btn-primary';
        this._addBtn.textContent = 'Add Figure';
        this._addBtn.addEventListener('click', this._onAddFigure.bind(this));
        this._controls.appendChild(this._addBtn);
        
        // Figure count display
        this._countDisplay = document.createElement('span');
        this._countDisplay.className = 'dta-figure-count';
        this._controls.appendChild(this._countDisplay);
        
        this._container.appendChild(this._controls);
        this._container.appendChild(this._figureList);
        
        this._updateCountDisplay();
    };

    /**
     * Update figure count display (X/40)
     */
    FigureManager.prototype._updateCountDisplay = function() {
        if (this._countDisplay) {
            this._countDisplay.textContent = this._figures.length + '/' + MAX_FIGURES + ' figures';
        }
    };

    /**
     * Handle add figure button click
     */
    FigureManager.prototype._onAddFigure = function() {
        if (this._figures.length >= MAX_FIGURES) {
            // Cannot add more than 40 figures
            if (window.DataToArt && window.DataToArt.App && window.DataToArt.App.showError) {
                window.DataToArt.App.showError('Maximum ' + MAX_FIGURES + ' figures reached');
            }
            return;
        }
        
        // Create a new default figure
        const newFigure = this.createDefaultFigure();
        this.add(newFigure);
        
        // Select the new figure for editing
        this.select(newFigure.id);
    };

    /**
     * Create a default figure based on current library
     * @returns {Object} New figure with defaults
     */
    FigureManager.prototype.createDefaultFigure = function() {
        const defaults = {
            three: { type: 'box', library_data: { castShadow: true, receiveShadow: true } },
            p5: { type: 'rect', library_data: { mode: 'center' } },
            c2: { type: 'rectangle', library_data: { fill: true, stroke: true } },
        };
        
        const libraryDefaults = defaults[this._library] || defaults.three;
        
        return window.DataToArt.FigureBase.create({
            type: libraryDefaults.type,
            name: 'Figure ' + (this._figures.length + 1),
            color: '#c9922a',
            library_data: libraryDefaults.library_data,
        });
    };

    /**
     * Add a figure to the manager
     * @param {Object} figure - Figure to add
     * @returns {Object} Added figure
     */
    FigureManager.prototype.add = function(figure) {
        if (this._figures.length >= MAX_FIGURES) {
            throw new Error('Maximum ' + MAX_FIGURES + ' figures reached');
        }
        
        if (!window.DataToArt.FigureBase.validate(figure)) {
            throw new Error('Invalid figure object');
        }
        
        // Ensure unique ID
        const existingIds = this._figures.map(f => f.id);
        if (existingIds.indexOf(figure.id) !== -1) {
            figure = window.DataToArt.FigureBase.clone(figure);
        }
        
        this._figures.push(figure);
        this._sortByLayer();
        this._updateCountDisplay();
        this._updateUI();
        this._onChange({ action: 'add', figure: figure });
        
        return figure;
    };

    /**
     * Remove a figure by ID
     * @param {string} figureId - ID of figure to remove
     * @returns {Object|null} Removed figure or null
     */
    FigureManager.prototype.remove = function(figureId) {
        const index = this._findIndexById(figureId);
        
        if (index === -1) {
            return null;
        }
        
        const removed = this._figures.splice(index, 1)[0];
        
        // Clear selection if removed figure was selected
        if (this._selectedFigureId === figureId) {
            this._selectedFigureId = null;
        }
        
        this._updateCountDisplay();
        this._updateUI();
        this._onChange({ action: 'remove', figureId: figureId, figure: removed });
        
        return removed;
    };

    /**
     * Update a figure by ID
     * @param {string} figureId - ID of figure to update
     * @param {Object} updates - Properties to update
     * @returns {Object|null} Updated figure or null
     */
    FigureManager.prototype.update = function(figureId, updates) {
        const index = this._findIndexById(figureId);
        
        if (index === -1) {
            return null;
        }
        
        const figure = this._figures[index];
        Object.assign(figure, updates);
        
        this._sortByLayer();
        this._updateUI();
        this._onChange({ action: 'update', figureId: figureId, figure: figure, updates: updates });
        
        return figure;
    };

    /**
     * Find index of figure by ID
     * @param {string} figureId - Figure ID to find
     * @returns {number} Index or -1 if not found
     */
    FigureManager.prototype._findIndexById = function(figureId) {
        for (let i = 0; i < this._figures.length; i++) {
            if (this._figures[i].id === figureId) {
                return i;
            }
        }
        return -1;
    };

    /**
     * Get figure by ID
     * @param {string} figureId - Figure ID
     * @returns {Object|null} Figure or null
     */
    FigureManager.prototype.get = function(figureId) {
        const index = this._findIndexById(figureId);
        return index !== -1 ? this._figures[index] : null;
    };

    /**
     * Get all figures
     * @returns {Array} Array of all figures
     */
    FigureManager.prototype.getAll = function() {
        return this._figures.slice(); // Return copy
    };

    /**
     * Get figure count
     * @returns {number} Number of figures
     */
    FigureManager.prototype.count = function() {
        return this._figures.length;
    };

    /**
     * Select a figure for editing
     * @param {string} figureId - Figure ID to select
     */
    FigureManager.prototype.select = function(figureId) {
        this._selectedFigureId = figureId;
        this._updateUI();
        this._onChange({ action: 'select', figureId: figureId });
    };

    /**
     * Get selected figure ID
     * @returns {string|null} Selected figure ID
     */
    FigureManager.prototype.getSelected = function() {
        return this._selectedFigureId;
    };

    /**
     * Get selected figure
     * @returns {Object|null} Selected figure
     */
    FigureManager.prototype.getSelectedFigure = function() {
        return this.get(this._selectedFigureId);
    };

    /**
     * Duplicate a figure
     * @param {string} figureId - Figure ID to duplicate
     * @returns {Object|null} New cloned figure or null
     */
    FigureManager.prototype.duplicate = function(figureId) {
        const figure = this.get(figureId);
        if (!figure) {
            return null;
        }
        
        if (this._figures.length >= MAX_FIGURES) {
            throw new Error('Maximum ' + MAX_FIGURES + ' figures reached');
        }
        
        const cloned = window.DataToArt.FigureBase.clone(figure);
        return this.add(cloned);
    };

    /**
     * Move figure up in layer order (higher layer = on top)
     * @param {string} figureId - Figure ID to move
     */
    FigureManager.prototype.moveUp = function(figureId) {
        const index = this._findIndexById(figureId);
        if (index === -1 || index >= this._figures.length - 1) {
            return;
        }
        
        // Swap with next figure
        const temp = this._figures[index];
        this._figures[index] = this._figures[index + 1];
        this._figures[index + 1] = temp;
        
        // Update layer values
        this._figures[index].layer = index;
        this._figures[index + 1].layer = index + 1;
        
        this._sortByLayer();
        this._updateUI();
        this._onChange({ action: 'reorder', figureId: figureId });
    };

    /**
     * Move figure down in layer order
     * @param {string} figureId - Figure ID to move
     */
    FigureManager.prototype.moveDown = function(figureId) {
        const index = this._findIndexById(figureId);
        if (index === -1 || index <= 0) {
            return;
        }
        
        // Swap with previous figure
        const temp = this._figures[index];
        this._figures[index] = this._figures[index - 1];
        this._figures[index - 1] = temp;
        
        // Update layer values
        this._figures[index].layer = index;
        this._figures[index - 1].layer = index - 1;
        
        this._sortByLayer();
        this._updateUI();
        this._onChange({ action: 'reorder', figureId: figureId });
    };

    /**
     * Set layer order explicitly
     * @param {string} figureId - Figure ID
     * @param {number} layer - New layer value
     */
    FigureManager.prototype.setLayer = function(figureId, layer) {
        const figure = this.get(figureId);
        if (figure && figure.layer !== layer) {
            figure.layer = layer;
            this._sortByLayer();
            this._updateUI();
            this._onChange({ action: 'reorder', figureId: figureId });
        }
    };

    /**
     * Sort figures by layer order
     */
    FigureManager.prototype._sortByLayer = function() {
        this._figures.sort(function(a, b) {
            return a.layer - b.layer;
        });
    };

    /**
     * Toggle figure visibility
     * @param {string} figureId - Figure ID
     */
    FigureManager.prototype.toggleVisibility = function(figureId) {
        const figure = this.get(figureId);
        if (figure) {
            figure.visible = !figure.visible;
            this._updateUI();
            this._onChange({ action: 'update', figureId: figureId, figure: figure, updates: { visible: figure.visible } });
        }
    };

    /**
     * Set current library
     * @param {string} library - Library name (three, p5, c2)
     */
    FigureManager.prototype.setLibrary = function(library) {
        if (this._library !== library) {
            this._library = library;
            this._updateUI();
            this._onChange({ action: 'library_change', library: library });
        }
    };

    /**
     * Get current library
     * @returns {string} Current library
     */
    FigureManager.prototype.getLibrary = function() {
        return this._library;
    };

    /**
     * Clear all figures
     */
    FigureManager.prototype.clear = function() {
        this._figures = [];
        this._selectedFigureId = null;
        this._updateCountDisplay();
        this._updateUI();
        this._onChange({ action: 'clear' });
    };

    /**
     * Load figures from array
     * @param {Array} figures - Array of figure objects
     * @param {string} library - Library to use
     */
    FigureManager.prototype.load = function(figures, library) {
        this.clear();
        
        if (library) {
            this._library = library;
        }
        
        if (figures && Array.isArray(figures)) {
            // Validate and add each figure
            for (let i = 0; i < figures.length; i++) {
                if (window.DataToArt.FigureBase.validate(figures[i])) {
                    this._figures.push(figures[i]);
                }
            }
            this._sortByLayer();
        }
        
        this._updateCountDisplay();
        this._updateUI();
        this._onChange({ action: 'load', figures: figures, library: library });
    };

    /**
     * Get figures as array for saving
     * @returns {Array} Array of figure objects
     */
    FigureManager.prototype.save = function() {
        return this._figures.slice(); // Return copy
    };

    /**
     * Update UI to reflect current state
     */
    FigureManager.prototype._updateUI = function() {
        if (!this._figureList) return;
        
        // Clear existing list
        this._figureList.innerHTML = '';
        
        // Create list items for each figure
        for (let i = 0; i < this._figures.length; i++) {
            const figure = this._figures[i];
            this._createFigureItem(figure, i);
        }
    };

    /**
     * Create a list item for a figure
     * @param {Object} figure - Figure data
     * @param {number} index - Index in array
     */
    FigureManager.prototype._createFigureItem = function(figure, index) {
        const item = document.createElement('div');
        item.className = 'dta-figure-item';
        item.dataset.figureId = figure.id;
        
        const name = document.createElement('span');
        name.className = 'dta-figure-name';
        name.textContent = figure.name + ' (' + figure.type + ')';
        name.title = figure.name + ' (' + figure.type + ')';
        
        const visibility = document.createElement('span');
        visibility.className = 'dta-figure-visibility';
        visibility.textContent = figure.visible ? '👁️' : '👁️‍🗨️';
        visibility.title = figure.visible ? 'Visible' : 'Hidden';
        visibility.addEventListener('click', this._onToggleVisibility.bind(this, figure.id));
        
        const layer = document.createElement('span');
        layer.className = 'dta-figure-layer';
        layer.textContent = 'Layer: ' + figure.layer;
        
        const selectBtn = document.createElement('button');
        selectBtn.className = 'dta-btn dta-btn-small';
        selectBtn.textContent = 'Edit';
        selectBtn.addEventListener('click', this._onSelect.bind(this, figure.id));
        
        const duplicateBtn = document.createElement('button');
        duplicateBtn.className = 'dta-btn dta-btn-small';
        duplicateBtn.textContent = 'Duplicate';
        duplicateBtn.addEventListener('click', this._onDuplicate.bind(this, figure.id));
        
        const upBtn = document.createElement('button');
        upBtn.className = 'dta-btn dta-btn-small';
        upBtn.textContent = '↑';
        upBtn.title = 'Move Up';
        upBtn.addEventListener('click', this._onMoveUp.bind(this, figure.id));
        
        const downBtn = document.createElement('button');
        downBtn.className = 'dta-btn dta-btn-small';
        downBtn.textContent = '↓';
        downBtn.title = 'Move Down';
        downBtn.addEventListener('click', this._onMoveDown.bind(this, figure.id));
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'dta-btn dta-btn-small dta-btn-danger';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', this._onRemove.bind(this, figure.id));
        
        const actions = document.createElement('div');
        actions.className = 'dta-figure-actions';
        actions.appendChild(selectBtn);
        actions.appendChild(duplicateBtn);
        actions.appendChild(upBtn);
        actions.appendChild(downBtn);
        actions.appendChild(removeBtn);
        
        item.appendChild(name);
        item.appendChild(visibility);
        item.appendChild(layer);
        item.appendChild(actions);
        
        // Highlight selected figure
        if (this._selectedFigureId === figure.id) {
            item.classList.add('dta-figure-item-selected');
        }
        
        this._figureList.appendChild(item);
    };

    // Event handlers
    FigureManager.prototype._onSelect = function(figureId) {
        this.select(figureId);
    };

    FigureManager.prototype._onRemove = function(figureId) {
        if (confirm('Are you sure you want to delete this figure?')) {
            this.remove(figureId);
        }
    };

    FigureManager.prototype._onDuplicate = function(figureId) {
        this.duplicate(figureId);
    };

    FigureManager.prototype._onMoveUp = function(figureId) {
        this.moveUp(figureId);
    };

    FigureManager.prototype._onMoveDown = function(figureId) {
        this.moveDown(figureId);
    };

    FigureManager.prototype._onToggleVisibility = function(figureId) {
        this.toggleVisibility(figureId);
    };

    // Public API
    window.DataToArt.FigureManager = FigureManager;
})();
