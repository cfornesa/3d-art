/**
 * Creatrweb 3D Art — DEPRECATED Style
 *
 * This style is deprecated as part of the Creatrweb 3D Art retrofit.
 * The 13 Canvas-based art styles have been replaced by library-based renderers.
 * All artwork is now created through direct figure configuration with library selection.
 *
 * DO NOT USE - Functionality replaced by src/libraries/*
 */

// DEPRECATED: Throw error if this module is loaded
if (typeof window !== 'undefined') {
    throw new Error('Canvas art styles are deprecated. Creatrweb 3D Art uses library-based rendering: aframe, three, p5, c2. See src/libraries/');
}
module.exports = {};
