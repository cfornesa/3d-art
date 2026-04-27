# Dependencies

Creatrweb 3D Art uses a combination of external CDN resources and self-hosted libraries.

---

## CDN Dependencies

External JavaScript libraries loaded from CDN providers. These are loaded dynamically or via `<script>` tags.

| Library | CDN Provider | URL | Purpose | Version |
|---------|-------------|-----|---------|---------|
| Three.js | jsDelivr (Cloudflare) | `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js` | 3D WebGL rendering | r128 |
| P5.js | jsDelivr (npm) | `https://cdn.jsdelivr.net/npm/p5@1.4.2/lib/p5.min.js` | 2D creative coding | v1.4.2 |

**Note:** A-Frame was removed in Session 23. All A-Frame references have been cleaned up.

---

## Self-Hosted Dependencies

Local copies of third-party libraries hosted from this repository.

| Library | File Location | Source | Purpose | Modified |
|---------|------------───|--------|---------|----------|
| OrbitControls | `src/vendor/three/OrbitControls.js` | Three.js r128 examples | Camera controls (orbit, pan, zoom) | No |

**Rationale for Self-Hosting:**
- OrbitControls is a Three.js addon that was not included in the main Three.js CDN build for r128
- Self-hosting ensures availability without external CDN dependency
- Lazy-loaded in ThreeRenderer only when needed
- User selected self-hosted approach over CDN (Session 33)

**Original Source:** https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js

---

## Internal Dependencies

Creatrweb 3D Art modules that depend on external/CDN libraries:

| Internal Module | External Dependencies |
|----------------|---------------------|
| `src/libraries/three.js` | THREE (global), OrbitControls (lazy-loaded) |
| `src/libraries/p5.js` | p5 (global) |
| `src/libraries/c2.js` | None |
| `src/figures/figure-base.js` | None |
| `src/figures/figure-manager.js` | None |
| `src/app.js` | THREE, p5 (loaded dynamically) |

---

## Updating Dependencies

### CDN Libraries
To update Three.js or p5.js versions:
1. Update the CDN URL in all PHP files that include them:
   - `exhibit.php` (embed mode)
   - `studio.php` (dynamic loading in app.js)
2. Update the version in this document
3. Test all functionality with the new version
4. Update CONSTRAINTS.md if architectural changes are needed

### Self-Hosted Libraries
To update OrbitControls:
1. Download the latest version from Three.js examples
2. Save to `src/vendor/three/OrbitControls.js`
3. Verify compatibility (UMD format, uses global THREE namespace)
4. Update the version in this document
5. Test Three.js interactivity

---

## Backup and Recovery

**Self-Hosted Files:**
- All self-hosted files are committed to the repository
- To restore: `git checkout HEAD -- src/vendor/three/OrbitControls.js`

**CDN Fallback:**
- If CDN is unavailable, most functionality will break
- Consider adding local fallback copies of critical CDN libraries
- Three.js and p5.js are essential for rendering

---

## License Notes

All CDN-loaded libraries maintain their original licenses:
- Three.js: MIT License
- P5.js: LGPL-2.1 License

Self-hosted libraries maintain their original licenses:
- OrbitControls: Part of Three.js, MIT License

Creatrweb 3D Art application code: Proprietary (single-owner)
