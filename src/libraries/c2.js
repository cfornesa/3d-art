/**
 * Creatrweb 3D Art — C2 Library Renderer
 *
 * C2 (Construct 2) rendering engine for 2D artwork.
 * Provides a simple 2D canvas renderer as a placeholder for C2 integration.
 * 
 * Note: Actual C2 integration would require the C2 runtime library.
 * This is a canvas-based implementation that mimics C2's 2D rendering approach.
 */

;(function() {
    'use strict';

    if (typeof window.DataToArt === 'undefined') {
        window.DataToArt = {};
    }

    /**
     * C2Renderer - Handles 2D canvas rendering
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.canvas - Canvas element to render into
     */
    function C2Renderer(options) {
        options = options || {};
        
        this._canvas = options.canvas || null;
        this._ctx = null;
        this._figures = [];
        this._dpr = window.devicePixelRatio || 1;
        
        this._init();
    }

    /**
     * Initialize canvas
     */
    C2Renderer.prototype._init = function() {
        if (!this._canvas) return;

        this._ctx = this._canvas.getContext('2d');
        this._resize();
        
        window.addEventListener('resize', this._onResize.bind(this));
    };

    /**
     * Handle resize
     */
    C2Renderer.prototype._onResize = function() {
        this._resize();
        this._needsRedraw = true;
    };

    /**
     * Resize canvas
     */
    C2Renderer.prototype._resize = function() {
        if (!this._canvas || !this._ctx) return;

        const clientWidth = this._canvas.clientWidth;
        const clientHeight = this._canvas.clientHeight;
        const width = clientWidth * this._dpr;
        const height = clientHeight * this._dpr;
        
        if (this._canvas.width !== width || this._canvas.height !== height) {
            this._canvas.width = width;
            this._canvas.height = height;
            this._canvas.style.width = clientWidth + 'px';
            this._canvas.style.height = clientHeight + 'px';
            
            // Reset transform to identity, then scale by DPR
            this._ctx.setTransform(1, 0, 0, 1, 0, 0);
            this._ctx.scale(this._dpr, this._dpr);
        }
        
        this._needsRedraw = true;
    };

    /**
     * Draw all figures
     */
    C2Renderer.prototype._drawAll = function() {
        try {
            if (!this._ctx || !this._canvas) return;

            // Clear entire canvas
            this._ctx.fillStyle = '#0d0d0d';
            this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

            // Center the coordinate system - (0,0) is now at canvas center
            // Use LOGICAL (CSS) dimensions for translation
            // Even though context is scaled by DPR in _resize(), the translation
            // values are in logical coordinates and will be scaled appropriately
            this._ctx.save();
            this._ctx.translate(this._canvas.clientWidth / 2, this._canvas.clientHeight / 2);

            // Draw each figure
            console.log('[C2] Drawing', this._figures.length, 'figures');
            for (let i = 0; i < this._figures.length; i++) {
                this._drawFigure(this._figures[i]);
            }

            this._ctx.restore();
        } catch (e) {
            console.error('[C2] Error in _drawAll():', e.message, e.stack);
        }
    };

    /**
     * Draw a single figure
     * @param {Object} figure - Figure data
     */
    C2Renderer.prototype._drawFigure = function(figure) {
        if (!figure.visible) return;

        // Skip rendering if opacity is 0 (fully transparent)
        // Use exact comparison to avoid hiding objects that shouldn't be hidden
        const opacity = parseFloat(figure.opacity);
        if (!isNaN(opacity) && opacity === 0) return;

        const ctx = this._ctx;
        const libraryData = figure.library_data || {};

        ctx.save();
        
        // Translate to position
        ctx.translate(figure.position.x || 0, figure.position.y || 0);
        
        // Apply rotation
        if (figure.rotation.z) {
            ctx.rotate(figure.rotation.z * Math.PI / 180);
        }
        
        // Apply scale
        ctx.scale(figure.scale.x || 1, figure.scale.y || 1);
        
        // Set fill and stroke
        ctx.fillStyle = figure.color || '#c9922a';
        ctx.strokeStyle = libraryData.stroke || '#ffffff';
        ctx.lineWidth = libraryData.strokeWidth || 1;
        
        // Global alpha for opacity
        const opacity = parseFloat(figure.opacity);
        ctx.globalAlpha = !isNaN(opacity) ? opacity : 1.0;
        
        // Draw based on type
        const width = libraryData.width || 50;
        const height = libraryData.height || 50;
        const radius = libraryData.radius || 25;
        const points = libraryData.points || 5;
        
        // Center drawing at origin
        ctx.translate(-width/2, -height/2);
        
        if (libraryData.fill !== false) {
            ctx.fillStyle = figure.color || '#c9922a';
        }
        
        // Normalize type names for compatibility
        const type = figure.type || '';
        const normalizedType = type === 'rect' ? 'rectangle' : type;
        
        switch (normalizedType) {
            case 'rectangle':
                ctx.beginPath();
                ctx.rect(0, 0, width, height);
                if (libraryData.fill !== false) ctx.fill();
                if (libraryData.stroke !== false) ctx.stroke();
                break;
            case 'ellipse':
                ctx.beginPath();
                ctx.ellipse(width/2, height/2, width/2, height/2, 0, 0, Math.PI * 2);
                if (libraryData.fill !== false) ctx.fill();
                if (libraryData.stroke !== false) ctx.stroke();
                break;
            case 'line':
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(width, height);
                ctx.stroke();
                break;
            case 'point':
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'star':
                this._drawStar(0, 0, radius, radius * 0.4, points);
                if (libraryData.fill !== false) ctx.fill();
                if (libraryData.stroke !== false) ctx.stroke();
                break;
            case 'polygon':
                ctx.beginPath();
                for (let j = 0; j < points; j++) {
                    const angle = (j / points) * Math.PI * 2 - Math.PI / 2;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (j === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                if (libraryData.fill !== false) ctx.fill();
                if (libraryData.stroke !== false) ctx.stroke();
                break;
            default:
                // Default: draw rectangle
                ctx.beginPath();
                ctx.rect(0, 0, width, height);
                if (libraryData.fill !== false) ctx.fill();
                if (libraryData.stroke !== false) ctx.stroke();
                break;
        }
        
        ctx.restore();
    };

    /**
     * Draw a star shape
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} outerRadius - Outer radius
     * @param {number} innerRadius - Inner radius
     * @param {number} points - Number of points
     */
    C2Renderer.prototype._drawStar = function(x, y, outerRadius, innerRadius, points) {
        const ctx = this._ctx;
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = i * Math.PI / points - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
    };

    /**
     * Set figures to render
     * @param {Array} figures - Array of figure objects
     */
    C2Renderer.prototype.setFigures = function(figures) {
        this._figures = figures || [];
        this._needsRedraw = true;
        this._drawAll();
    };

    /**
     * Update a specific figure
     * @param {Object} figure - Updated figure data
     */
    C2Renderer.prototype.updateFigure = function(figure) {
        for (let i = 0; i < this._figures.length; i++) {
            if (this._figures[i].id === figure.id) {
                Object.assign(this._figures[i], figure);
                this._needsRedraw = true;
                this._drawAll();
                break;
            }
        }
    };

    /**
     * Add a figure
     * @param {Object} figure - Figure to add
     */
    C2Renderer.prototype.addFigure = function(figure) {
        if (!this._figures) {
            this._figures = [];
        }
        this._figures.push(figure);
        this._needsRedraw = true;
        this._drawAll();
    };

    /**
     * Remove a figure by ID
     * @param {string} figureId - Figure ID to remove
     */
    C2Renderer.prototype.removeFigure = function(figureId) {
        for (let i = 0; i < this._figures.length; i++) {
            if (this._figures[i].id === figureId) {
                this._figures.splice(i, 1);
                this._needsRedraw = true;
                this._drawAll();
                break;
            }
        }
    };

    /**
     * Render the scene
     */
    C2Renderer.prototype.render = function() {
        this._drawAll();
    };

    /**
     * Capture canvas as Base64 PNG for thumbnail
     * @param {number} width - Output width
     * @param {number} height - Output height
     * @returns {string} Base64 encoded PNG
     */
    C2Renderer.prototype.captureThumbnail = function(width, height) {
        if (!this._canvas || !this._ctx) return '';
        
        var originalWidth = this._canvas.width;
        var originalHeight = this._canvas.height;
        
        // Store current content
        var imageDataTemp = this._ctx.getImageData(0, 0, originalWidth, originalHeight);
        
        // Resize canvas for thumbnail
        this._canvas.width = width;
        this._canvas.height = height;
        
        // Clear and draw scaled content
        this._ctx.clearRect(0, 0, width, height);
        this._ctx.drawImage(
            // Create a temporary canvas to draw the image data
            (function() {
                var tempCanvas = document.createElement('canvas');
                tempCanvas.width = originalWidth;
                tempCanvas.height = originalHeight;
                var tempCtx = tempCanvas.getContext('2d');
                tempCtx.putImageData(imageDataTemp, 0, 0);
                return tempCanvas;
            })(),
            0, 0, width, height
        );
        
        var imageData = this._canvas.toDataURL('image/png');
        
        // Restore original size and content
        this._canvas.width = originalWidth;
        this._canvas.height = originalHeight;
        this._ctx.putImageData(imageDataTemp, 0, 0);
        
        return imageData;
    };

    /**
     * Cleanup resources
     */
    C2Renderer.prototype.destroy = function() {
        if (this._ctx) {
            this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        }
        this._ctx = null;
        this._figures = [];
    };

    /**
     * Get canvas element
     * @returns {HTMLElement} Canvas element
     */
    C2Renderer.prototype.getCanvas = function() {
        return this._canvas;
    };

    // Public API
    window.DataToArt.C2Renderer = C2Renderer;
})();
