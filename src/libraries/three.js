/**
 * Creatrweb 3D Art — Three.js Library Renderer
 *
 * Three.js rendering engine for 3D artwork.
 * Supports various 3D figure types: box, sphere, plane, cylinder, torus, etc.
 */

;(function() {
    'use strict';

    if (typeof window.DataToArt === 'undefined') {
        window.DataToArt = {};
    }

    /**
     * ThreeRenderer - Handles Three.js scene setup and rendering
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.canvas - Canvas element to render into
     */
    function ThreeRenderer(options) {
        options = options || {};
        
        this._canvas = options.canvas || null;
        this._scene = null;
        this._camera = null;
        this._renderer = null;
        this._figures = [];
        this._animationId = null;
        this._needsRender = true;
        
        this._init();
        this.start();
    }

    /**
     * Initialize Three.js scene
     */
    ThreeRenderer.prototype._init = function() {
        if (!this._canvas || typeof THREE === 'undefined') {
            return;
        }

        // Scene
        this._scene = new THREE.Scene();
        this._scene.background = new THREE.Color('#0d0d0d');

        // Camera
        const aspect = this._canvas.clientWidth / this._canvas.clientHeight;
        this._camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this._camera.position.set(0, 0, 5);
        this._camera.lookAt(0, 0, 0);

        // Renderer
        this._renderer = new THREE.WebGLRenderer({
            canvas: this._canvas,
            antialias: true,
            alpha: false,
        });
        this._renderer.setSize(this._canvas.clientWidth, this._canvas.clientHeight);
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.sortObjects = true;

        // Lighting
        const ambientLight = new THREE.AmbientLight('#ffffff', 0.5);
        this._scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight('#ffffff', 0.8);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this._scene.add(directionalLight);

        // Grid helper
        const gridHelper = new THREE.GridHelper(10, 10, '#333333', '#333333');
        this._scene.add(gridHelper);

        // Axes helper
        const axesHelper = new THREE.AxesHelper(3);
        this._scene.add(axesHelper);

        // Initialize OrbitControls for interactivity
        this._initOrbitControls();

        // Handle resize
        window.addEventListener('resize', this._onResize.bind(this));
    };

    /**
     * Initialize OrbitControls for camera interaction
     * Lazy-loads OrbitControls.js if not already available
     */
    ThreeRenderer.prototype._initOrbitControls = function() {
        // Check if OrbitControls is already available (loaded via CDN or self-hosted)
        if (typeof THREE.OrbitControls !== 'undefined') {
            this._controls = new THREE.OrbitControls(this._camera, this._renderer.domElement);
            this._controls.enableDamping = true;
            this._controls.dampingFactor = 0.05;
            this._controls.screenSpacePanning = false;
            this._controls.minDistance = 1;
            this._controls.maxDistance = 100;
        } else {
            // Lazy-load self-hosted OrbitControls from vendor directory
            this._loadOrbitControls();
        }
    };

    /**
     * Dynamically load OrbitControls from self-hosted file
     */
    ThreeRenderer.prototype._loadOrbitControls = function() {
        var self = this;
        var script = document.createElement('script');
        script.src = '/src/vendor/three/OrbitControls.js';
        script.onload = function() {
            // OrbitControls should now be available on THREE namespace
            self._initOrbitControls();
        };
        script.onerror = function() {
            console.warn('[ThreeRenderer] Failed to load OrbitControls from src/vendor/three/OrbitControls.js');
        };
        document.head.appendChild(script);
    };

    /**
     * Handle window resize
     */
    ThreeRenderer.prototype._onResize = function() {
        if (!this._camera || !this._renderer) return;

        const width = this._canvas.clientWidth;
        const height = this._canvas.clientHeight;

        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();
        
        this._renderer.setSize(width, height);
        this._needsRender = true;
    };

    /**
     * Create a Three.js object from figure data
     * @param {Object} figure - Figure data
     * @returns {THREE.Object3D} Three.js object
     */
    ThreeRenderer.prototype._createObject = function(figure) {
        const libraryData = figure.library_data || {};
        const color = new THREE.Color(figure.color || '#c9922a');
        const opacity = parseFloat(figure.opacity);
        const finalOpacity = !isNaN(opacity) ? opacity : 1.0;

        // If fully transparent, return null so object isn't created
        // Use exact comparison to avoid hiding objects that shouldn't be hidden
        if (finalOpacity === 0) {
            return null;
        }

        // Use different rendering paths based on opacity:
        // - opacity === 1.0: opaque rendering (transparent: false, depthWrite: true)
        // - 0 < opacity < 1.0: transparent rendering (transparent: true, depthWrite: false)
        const isFullyOpaque = finalOpacity === 1.0;
        const material = new THREE.MeshStandardMaterial({
            color: color,
            transparent: !isFullyOpaque,
            opacity: finalOpacity,
            depthWrite: isFullyOpaque,
        });
        
        // CRITICAL: Mark material as needing update for opacity/transparency changes
        material.needsUpdate = true;

        let object;
        const size = libraryData.size || { x: 1, y: 1, z: 1 };

        switch (figure.type) {
            case 'sphere':
                object = new THREE.Mesh(
                    new THREE.SphereGeometry(
                        size.x || 1,
                        libraryData.segments || 32,
                        libraryData.segments || 32
                    ),
                    material
                );
                break;

            case 'box':
            default:
                object = new THREE.Mesh(
                    new THREE.BoxGeometry(
                        size.x || 1,
                        size.y || 1,
                        size.z || 1
                    ),
                    material
                );
                break;

            case 'plane':
                object = new THREE.Mesh(
                    new THREE.PlaneGeometry(
                        size.x || 5,
                        size.y || 5
                    ),
                    material
                );
                object.rotation.x = -Math.PI / 2;
                break;

            case 'cylinder':
                object = new THREE.Mesh(
                    new THREE.CylinderGeometry(
                        size.x || 1,
                        size.y || 1,
                        size.z || 2,
                        libraryData.segments || 32
                    ),
                    material
                );
                break;

            case 'torus':
                object = new THREE.Mesh(
                    new THREE.TorusGeometry(
                        size.x || 1,
                        size.y || 0.4,
                        libraryData.segments || 16,
                        libraryData.segments || 48
                    ),
                    material
                );
                break;

            case 'cone':
                object = new THREE.Mesh(
                    new THREE.ConeGeometry(
                        size.x || 1,
                        size.y || 2,
                        libraryData.segments || 32
                    ),
                    material
                );
                object.position.y = size.y / 2;
                break;
        }

        if (object) {
            object.position.set(
                figure.position.x || 0,
                figure.position.y || 0,
                figure.position.z || 0
            );
            object.rotation.set(
                THREE.MathUtils.degToRad(figure.rotation.x || 0),
                THREE.MathUtils.degToRad(figure.rotation.y || 0),
                THREE.MathUtils.degToRad(figure.rotation.z || 0)
            );
            object.scale.set(
                figure.scale.x || 1,
                figure.scale.y || 1,
                figure.scale.z || 1
            );

            object.visible = figure.visible !== false;

            // Set renderOrder based on layer for proper transparency sorting
            // Higher layer = on top = higher renderOrder = renders later
            object.renderOrder = figure.layer || 0;

            // Custom library data
            if (libraryData.castShadow) {
                object.castShadow = true;
            }
            if (libraryData.receiveShadow) {
                object.receiveShadow = true;
            }
        }

        // Mark as figure object for cleanup
        if (object) {
            object.userData.isFigure = true;
        }

        return object;
    };

    /**
     * Update figure in scene
     * @param {Object} figure - Figure data
     * @param {THREE.Object3D} object - Existing Three.js object
     */
    ThreeRenderer.prototype._updateObject = function(figure, object) {
        if (!object) return;

        const color = new THREE.Color(figure.color || '#c9922a');
        const opacity = parseFloat(figure.opacity);
        const finalOpacity = !isNaN(opacity) ? opacity : 1.0;

        // Hide object if fully transparent
        // Use exact comparison to avoid hiding objects that shouldn't be hidden
        if (finalOpacity === 0) {
            object.visible = false;
            return;
        }

        // Show object if it was hidden due to opacity
        if (figure.visible !== false) {
            object.visible = true;
        }

        // Update material
        // Use different rendering paths based on opacity:
        // - opacity === 1.0: opaque rendering (transparent: false, depthWrite: true)
        // - 0 < opacity < 1.0: transparent rendering (transparent: true, depthWrite: false)
        if (object.material) {
            const isFullyOpaque = finalOpacity === 1.0;
            object.material.color.set(color);
            object.material.transparent = !isFullyOpaque;
            object.material.opacity = finalOpacity;
            object.material.depthWrite = isFullyOpaque;
            object.material.needsUpdate = true;
        }

        // Update transforms
        object.position.set(
            figure.position.x || 0,
            figure.position.y || 0,
            figure.position.z || 0
        );
        object.rotation.set(
            THREE.MathUtils.degToRad(figure.rotation.x || 0),
            THREE.MathUtils.degToRad(figure.rotation.y || 0),
            THREE.MathUtils.degToRad(figure.rotation.z || 0)
        );
        object.scale.set(
            figure.scale.x || 1,
            figure.scale.y || 1,
            figure.scale.z || 1
        );

        object.visible = figure.visible !== false;

        // Update renderOrder based on layer for proper transparency sorting
        object.renderOrder = figure.layer || 0;
    };

    /**
     * Set figures to render
     * @param {Array} figures - Array of figure objects
     */
    ThreeRenderer.prototype.setFigures = function(figures) {
        // Clear existing objects
        this._clearScene();

        this._figures = figures || [];

        // Create new objects
        for (let i = 0; i < this._figures.length; i++) {
            const figure = this._figures[i];
            const object = this._createObject(figure);
            if (object) {
                this._scene.add(object);
                this._objects = this._objects || {};
                this._objects[figure.id] = object;
            }
        }

        this._needsRender = true;
    };

    /**
     * Update a specific figure
     * @param {Object} figure - Updated figure data
     */
    ThreeRenderer.prototype.updateFigure = function(figure) {
        if (!this._objects || !this._objects[figure.id]) return;

        this._updateObject(figure, this._objects[figure.id]);
        this._needsRender = true;
    };

    /**
     * Add a figure
     * @param {Object} figure - Figure to add
     */
    ThreeRenderer.prototype.addFigure = function(figure) {
        if (!this._figures) {
            this._figures = [];
            this._objects = {};
        }

        this._figures.push(figure);
        const object = this._createObject(figure);
        if (object) {
            this._scene.add(object);
            this._objects[figure.id] = object;
        }
        this._needsRender = true;
    };

    /**
     * Remove a figure by ID
     * @param {string} figureId - Figure ID to remove
     */
    ThreeRenderer.prototype.removeFigure = function(figureId) {
        if (!this._objects || !this._objects[figureId]) return;

        const object = this._objects[figureId];
        this._scene.remove(object);
        delete this._objects[figureId];

        // Remove from figures array
        for (let i = 0; i < this._figures.length; i++) {
            if (this._figures[i].id === figureId) {
                this._figures.splice(i, 1);
                break;
            }
        }

        this._needsRender = true;
    };

    /**
     * Clear all figures from scene
     */
    ThreeRenderer.prototype._clearScene = function() {
        if (!this._scene) return;

        // Remove all figure objects (keep lights and helpers)
        const toRemove = [];
        this._scene.traverse(function(node) {
            if (node.userData.isFigure) {
                toRemove.push(node);
            }
        });

        for (let i = 0; i < toRemove.length; i++) {
            this._scene.remove(toRemove[i]);
        }

        this._figures = [];
        this._objects = {};
    };

    /**
     * Render the scene
     */
    ThreeRenderer.prototype.render = function() {
        if (!this._renderer || !this._scene || !this._camera) return;

        this._renderer.render(this._scene, this._camera);
        this._needsRender = false;
    };

    /**
     * Start animation loop (if needed)
     */
    ThreeRenderer.prototype.start = function() {
        this._stop();
        this._animate();
    };

    /**
     * Stop animation loop
     */
    ThreeRenderer.prototype._stop = function() {
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }
    };

    /**
     * Animation loop
     */
    ThreeRenderer.prototype._animate = function() {
        this._animationId = requestAnimationFrame(this._animate.bind(this));
        
        // Update OrbitControls if available (required for damping)
        if (this._controls) {
            this._controls.update();
        }
        
        if (this._needsRender) {
            this._needsRender = false;
            this.render();
        }
    };

    /**
     * Cleanup resources
     */
    ThreeRenderer.prototype.destroy = function() {
        this._stop();
        
        if (this._renderer) {
            this._renderer.dispose();
        }
        
        if (this._scene) {
            this._clearScene();
        }
        
        this._scene = null;
        this._camera = null;
        this._renderer = null;
        this._figures = [];
        this._objects = {};
    };

    /**
     * Get canvas element
     * @returns {HTMLElement} Canvas element
     */
    ThreeRenderer.prototype.getCanvas = function() {
        return this._canvas;
    };

    /**
     * Capture canvas as Base64 PNG for thumbnail
     * @param {number} width - Output width (CSS pixels)
     * @param {number} height - Output height (CSS pixels)
     * @returns {string} Base64 encoded PNG
     */
    ThreeRenderer.prototype.captureThumbnail = function(width, height) {
        if (!this._renderer) return '';

        // Store CSS display size (CSS pixels, not device pixels)
        // This prevents inline CSS style corruption when using setSize
        const cssWidth = this._canvas.clientWidth;
        const cssHeight = this._canvas.clientHeight;
        const originalPixelRatio = this._renderer.getPixelRatio();

        // Temporarily resize drawing buffer for thumbnail
        // Pass false to avoid modifying canvas CSS style
        this._renderer.setSize(width, height, false);
        this._renderer.setPixelRatio(1);
        this.render();

        const imageData = this._canvas.toDataURL('image/png');

        // Restore original CSS display size and pixel ratio
        // Pass false to avoid CSS style modification
        this._renderer.setSize(cssWidth, cssHeight, false);
        this._renderer.setPixelRatio(originalPixelRatio);
        this.render();
        this._needsRender = true;

        return imageData;
    };

    // Public API
    window.DataToArt.ThreeRenderer = ThreeRenderer;
})();
