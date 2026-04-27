/**
 * Creatrweb 3D Art — Figure Base
 *
 * Base figure properties and common interface for all figure types.
 * Each library (three, p5, c2) can extend this with library-specific properties.
 */

;(function() {
    'use strict';

    if (typeof window.DataToArt === 'undefined') {
        window.DataToArt = {};
    }

    /**
     * Generate a unique figure ID
     * @returns {string} Unique ID in format 'fig_' + timestamp + random
     */
    function generateFigureId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return 'fig_' + timestamp + random;
    }

    /**
     * Create a new base figure with common properties
     * @param {Object} options - Figure options
     * @param {string} options.type - Figure type (e.g., 'box', 'sphere', 'plane')
     * @param {string} options.name - User-friendly name
     * @param {Object} options.position - {x, y, z} position
     * @param {Object} options.rotation - {x, y, z} rotation in degrees
     * @param {Object} options.scale - {x, y, z} scale
     * @param {string} options.color - Hex color code
     * @param {number} options.opacity - Opacity 0-1
     * @param {boolean} options.visible - Visibility
     * @param {number} options.layer - Layer order (0 = bottom)
     * @param {Object} options.library_data - Library-specific data
     * @returns {Object} Figure object with common properties
     */
    function createFigure(options) {
        options = options || {};
        
        return {
            id: options.id || generateFigureId(),
            type: options.type || 'box',
            name: options.name || 'Untitled Figure',
            position: options.position || { x: 0, y: 0, z: 0 },
            rotation: options.rotation || { x: 0, y: 0, z: 0 },
            scale: options.scale || { x: 1, y: 1, z: 1 },
            color: options.color || '#c9922a',
            opacity: options.opacity !== undefined ? options.opacity : 1.0,
            visible: options.visible !== undefined ? options.visible : true,
            layer: options.layer !== undefined ? options.layer : 0,
            library_data: options.library_data || {},
        };
    }

    /**
     * Validate figure object has all required properties
     * @param {Object} figure - Figure to validate
     * @returns {boolean} True if valid
     */
    function validateFigure(figure) {
        if (!figure || typeof figure !== 'object') {
            return false;
        }
        
        const required = ['id', 'type', 'name', 'position', 'rotation', 'scale', 'color', 'visible', 'layer'];
        for (let i = 0; i < required.length; i++) {
            if (!(required[i] in figure)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Clone a figure
     * @param {Object} figure - Figure to clone
     * @returns {Object} Cloned figure with new ID
     */
    function cloneFigure(figure) {
        const cloned = JSON.parse(JSON.stringify(figure));
        cloned.id = generateFigureId();
        cloned.name = cloned.name + ' (copy)';
        return cloned;
    }

    // Public API
    window.DataToArt.FigureBase = {
        generateId: generateFigureId,
        create: createFigure,
        validate: validateFigure,
        clone: cloneFigure,
    };
})();
