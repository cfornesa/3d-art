/**
 * Creatrweb 3D Art — P5.js Library Renderer
 *
 * P5.js rendering engine for 2D artwork.
 * Provides a wrapper around P5.js sketches for figure-based rendering.
 */

;(function() {
    'use strict';

    if (typeof window.DataToArt === 'undefined') {
        window.DataToArt = {};
    }

    /**
     * P5Renderer - Handles P5.js scene setup and rendering
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.canvas - Canvas element to render into
     */
    function P5Renderer(options) {
        options = options || {};
        
        this._canvas = options.canvas || null;
        this._figures = [];
        this._p5Instance = null;
        
        this._init();
    }

    /**
     * Initialize P5.js
     */
    P5Renderer.prototype._init = function() {
        if (!this._canvas) {
            return;
        }

        // Store reference to this for p5 callbacks
        const self = this;
        
        // Get container (parent of the placeholder canvas) for p5
        const container = this._canvas.parentNode;
        console.log('[P5] _init called, canvas id:', this._canvas.id, 'container:', container ? container.id || container.tagName : 'null');
        if (!container) {
            console.warn('[P5] No container found for canvas');
            return;
        }
        
        // Check if p5 is loaded, retry if not
        if (typeof p5 === 'undefined' && typeof window.p5 === 'undefined') {
            console.log('[P5] p5 library not loaded yet, setting up retry...');
            // p5 not loaded yet - set up a check mechanism
            if (!this._initInterval) {
                this._initInterval = setInterval(function() {
                    if (typeof p5 !== 'undefined' || typeof window.p5 !== 'undefined') {
                        clearInterval(this._initInterval);
                        this._initInterval = null;
                        this._init();
                    }
                }.bind(this), 100);
            }
            return;
        }
        
        console.log('[P5] p5 library loaded, creating instance');
        
        // Hide the placeholder canvas (p5 will create its own)
        this._canvas.style.display = 'none';
        console.log('[P5] Hiding placeholder canvas');
        
        // Debug: log sizes before createCanvas
        console.log('[P5] Container size:', container.clientWidth, 'x', container.clientHeight);
        console.log('[P5] Placeholder size:', this._canvas.clientWidth, 'x', this._canvas.clientHeight);
        
        // Use placeholder canvas dimensions (it's already sized and visible)
        // Container might have 0 dimensions if layout hasn't settled
        const width = this._canvas.clientWidth || container.clientWidth || 800;
        const height = this._canvas.clientHeight || container.clientHeight || 600;
        console.log('[P5] Using canvas size:', width, 'x', height);
        
        // Create p5 instance that puts its canvas in our container
        // Pass container to p5 constructor so it knows where to put the canvas
        
        this._p5Instance = new p5(function(p) {
            p.setup = function() {
                // dimensions are captured in closure from above
                
                // Create p5 canvas with dimensions and container
                // In p5.js, passing container as 3rd param to createCanvas ensures proper placement
                console.log('[P5] Calling createCanvas(', width, ',', height, ')');
                p.createCanvas(width, height);
                
                // Try to get canvas from different possible locations
                let p5CanvasEl = null;
                if (p.canvas) {
                    if (p.canvas.elt) {
                        p5CanvasEl = p.canvas.elt;
                    } else if (p.canvas instanceof HTMLCanvasElement) {
                        p5CanvasEl = p.canvas;
                    }
                }
                
                // If still not found, look in DOM
                if (!p5CanvasEl && container) {
                    const canvases = container.querySelectorAll('canvas');
                    for (let i = 0; i < canvases.length; i++) {
                        if (canvases[i] !== self._canvas) {
                            p5CanvasEl = canvases[i];
                            break;
                        }
                    }
                }
                
                // Style the p5 canvas if found
                if (p5CanvasEl) {
                    console.log('[P5] Found canvas element:', p5CanvasEl.id || 'no-id');
                    p5CanvasEl.style.display = 'block';
                    p5CanvasEl.style.width = '100%';
                    p5CanvasEl.style.height = '100%';
                    console.log('[P5] Canvas created:', p5CanvasEl.id || 'no-id', 'size:', width, 'x', height);
                } else {
                    console.warn('[P5] No canvas element found after createCanvas - checked p.canvas, p.canvas.elt, and DOM');
                    console.warn('[P5] p.canvas =', p.canvas, 'typeof p.canvas =', typeof p.canvas);
                }
                
                p.frameRate(60);
            };
            
            p.draw = function() {
                try {
                    p.background('#0d0d0d');
                    
                    // Center coordinate system - (0,0) is now at canvas center
                    // Matches behavior of C2 and Three.js renderers
                    p.push();
                    p.translate(container.clientWidth / 2, container.clientHeight / 2);
                    
                    // Always draw figures - p5.js calls draw() continuously
                    if (self._figures.length > 0) {
                        console.log('[P5] Draw called, figures:', self._figures.length);
                    }
                    self._drawFigures(p);
                    
                    p.pop();
                } catch (e) {
                    console.error('[P5] Error in draw():', e.message, e.stack);
                }
            };

            p.windowResized = function() {
                // Use placeholder canvas dimensions for consistency with setup
                const w = self._canvas.clientWidth || container.clientWidth || 800;
                const h = self._canvas.clientHeight || container.clientHeight || 600;
                console.log('[P5] Resizing to:', w, 'x', h);
                p.resizeCanvas(w, h);
            };
        }, container);
    };

    /**
     * Draw all figures
     * @param {p5} p - P5.js instance
     */
    P5Renderer.prototype._drawFigures = function(p) {
        for (let i = 0; i < this._figures.length; i++) {
            const figure = this._figures[i];
            this._drawFigure(p, figure);
        }
    };

    /**
     * Draw a single figure
     * @param {p5} p - P5.js instance
     * @param {Object} figure - Figure data
     */
    P5Renderer.prototype._drawFigure = function(p, figure) {
        if (!figure.visible) return;

        const libraryData = figure.library_data || {};
        
        // Set drawing style
        p.push();
        
        // Translate to position
        p.translate(figure.position.x || 0, figure.position.y || 0);
        
        // Apply rotation
        p.rotate(p.radians(figure.rotation.z || 0));
        
        // Apply scale
        p.scale(figure.scale.x || 1, figure.scale.y || 1);
        
        // Set fill and stroke
        p.fill(figure.color || '#c9922a');
        p.stroke(libraryData.stroke || '#ffffff');
        p.strokeWeight(libraryData.strokeWeight || 1);
        
        // Draw based on type
        const width = libraryData.width || 50;
        const height = libraryData.height || 50;
        const radius = libraryData.radius || 25;
        const points = libraryData.points || 5;
        
        switch (figure.type) {
            case 'rect':
                p.rectMode(p.CENTER);
                p.rect(0, 0, width, height);
                break;
            case 'ellipse':
                p.ellipseMode(p.CENTER);
                p.ellipse(0, 0, width, height);
                break;
            case 'polygon':
                p.ellipseMode(p.CENTER);
                p.ellipse(0, 0, radius * 2, radius * 2);
                break;
            case 'line':
                p.line(-width/2, 0, width/2, 0);
                break;
            case 'point':
                p.ellipseMode(p.CENTER);
                p.ellipse(0, 0, radius, radius);
                break;
            case 'arc':
                p.arc(0, 0, radius * 2, radius * 2, 0, p.radians(libraryData.angle || 180));
                break;
            case 'star':
                p.push();
                p.translate(0, -radius);
                this._drawStar(p, 0, 0, radius, radius * 0.4, points);
                p.pop();
                break;
            case 'triangle':
            default:
                p.triangle(-width/2, height/2, width/2, height/2, 0, -height/2);
                break;
        }
        
        p.pop();
    };

    /**
     * Draw a star shape
     * @param {p5} p - P5.js instance
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} outerRadius - Outer radius
     * @param {number} innerRadius - Inner radius
     * @param {number} points - Number of points
     */
    P5Renderer.prototype._drawStar = function(p, x, y, outerRadius, innerRadius, points) {
        p.beginShape();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = p.TWO_PI * i / (points * 2);
            p.vertex(x + radius * p.cos(angle), y + radius * p.sin(angle));
        }
        p.endShape(p.CLOSE);
    };

    /**
     * Set figures to render
     * @param {Array} figures - Array of figure objects
     */
    P5Renderer.prototype.setFigures = function(figures) {
        this._figures = figures || [];
    };

    /**
     * Update a specific figure
     * @param {Object} figure - Updated figure data
     */
    P5Renderer.prototype.updateFigure = function(figure) {
        // Find and update the figure
        for (let i = 0; i < this._figures.length; i++) {
            if (this._figures[i].id === figure.id) {
                Object.assign(this._figures[i], figure);
                break;
            }
        }
    };

    /**
     * Add a figure
     * @param {Object} figure - Figure to add
     */
    P5Renderer.prototype.addFigure = function(figure) {
        if (!this._figures) {
            this._figures = [];
        }
        this._figures.push(figure);
    };

    /**
     * Remove a figure by ID
     * @param {string} figureId - Figure ID to remove
     */
    P5Renderer.prototype.removeFigure = function(figureId) {
        for (let i = 0; i < this._figures.length; i++) {
            if (this._figures[i].id === figureId) {
                this._figures.splice(i, 1);
                break;
            }
        }
    };

    /**
     * Render the scene (triggers redraw)
     */
    P5Renderer.prototype.render = function() {
        if (this._p5Instance) {
            this._p5Instance.redraw();
        }
    };

    /**
     * Capture canvas as Base64 PNG for thumbnail
     * @param {number} width - Output width
     * @param {number} height - Output height
     * @returns {string} Base64 encoded PNG
     */
    P5Renderer.prototype.captureThumbnail = function(width, height) {
        if (!this._p5Instance) return '';
        
        var canvas = this._p5Instance.canvas;
        var originalWidth = canvas.width;
        var originalHeight = canvas.height;
        
        // Resize canvas for thumbnail
        canvas.width = width;
        canvas.height = height;
        
        // Trigger redraw at new size
        if (this._p5Instance.redraw) {
            this._p5Instance.redraw();
        }
        
        var imageData = canvas.toDataURL('image/png');
        
        // Restore original size
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        
        // Trigger redraw to restore
        if (this._p5Instance.redraw) {
            this._p5Instance.redraw();
        }
        
        return imageData;
    };

    /**
     * Cleanup resources
     */
    P5Renderer.prototype.destroy = function() {
        // Clear retry interval if it exists
        if (this._initInterval) {
            clearInterval(this._initInterval);
            this._initInterval = null;
        }

        if (this._p5Instance) {
            this._p5Instance.remove();
            this._p5Instance = null;
        }
        
        // Restore placeholder canvas display if it was hidden
        if (this._canvas && this._canvas.style) {
            this._canvas.style.display = '';
        }
        
        this._figures = [];
        // Keep _canvas reference for potential re-initialization
        // this._canvas = null;
    };

    /**
     * Get canvas element for export
     * p5.js creates its own canvas element, we need to return that
     * @returns {HTMLCanvasElement} The actual p5 canvas element
     */
    P5Renderer.prototype.getCanvas = function() {
        // Return the p5-created canvas if available, otherwise the placeholder
        if (this._p5Instance && this._p5Instance.canvas && this._p5Instance.canvas.elt) {
            return this._p5Instance.canvas.elt;
        }
        return this._canvas;
    };

    // Public API
    window.DataToArt.P5Renderer = P5Renderer;
})();
