// Three.js interactive vector globe — embeddable React-friendly version.
//
// Adapted from the standalone globe_module/src/main.js. The original mounted to
// window-sized DOM; this one is container-sized, cleans up listeners + GL
// resources on dispose, exposes lookup-by-ISO-A2 for the Flag Game quiz, and
// distinguishes single-tap (select) from double-tap (confirm). Country geometry
// is still fetched at runtime from public CDNs — Natural Earth first because it
// carries ISO_A2 codes we can match to flags.json, world-atlas as fallback.

import * as THREE from 'three';
import earcut from 'earcut';

// Natural Earth GeoJSON carries ISO_A2 codes on every feature, so it maps
// directly to flags.json `code` without a lookup table. We try jsDelivr first
// (CDN, cached, fast) and fall back to the raw GitHub source.
const NATURAL_EARTH_URLS = [
    'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson',
    'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson',
];

const R = 2;
const MAX_PIXEL_RATIO = 2;
const DOUBLE_TAP_MS = 500;
const CLICK_MOVE_THRESHOLD = 8;
const CAM_Z_DEFAULT = 6.4;
// CAM_Z_FOCUS lives in GlobeQuiz.js — different screens may want different
// focus zooms, so the caller passes it in via flyToIso2({ zoom }).
const FOCUS_DUR_MS  = 380; // smooth slide-in feels snappy but not jarring

// CSS custom properties scoped under [data-theme]. Read at construct + on
// applyTheme() so the globe re-tints when the host app toggles dark/light.
function readPalette(rootEl) {
    const s = getComputedStyle(rootEl || document.documentElement);
    const hex = (name, fallback) => {
        const raw = s.getPropertyValue(name).trim();
        if (!raw) return new THREE.Color(fallback);
        try { return new THREE.Color(raw); } catch (_) { return new THREE.Color(fallback); }
    };
    return {
        ocean:         hex('--globe-ocean',         '#B8E0E6'),
        oceanEmit:     hex('--globe-ocean-emit',    '#8FC9D1'),
        oceanSpec:     hex('--globe-ocean-spec',    '#E5F5F8'),
        land:          hex('--globe-land',          '#FFC247'),
        landEmit:      hex('--globe-land-emit',     '#C98A12'),
        landHover:     hex('--globe-land-hover',    '#FFD978'),
        landHoverEmit: hex('--globe-land-hover-emit','#D9931A'),
        border:        hex('--globe-border',        '#5B5677'),
        highlight:     hex('--globe-highlight',     '#5B5BF6'),
        correct:       hex('--globe-correct',       '#19C37D'),
        correctEmit:   hex('--globe-correct-emit',  '#0E7A4F'),
        wrong:         hex('--globe-wrong',         '#FF5C6C'),
        wrongEmit:     hex('--globe-wrong-emit',    '#8E2230'),
        atmosphere:    hex('--globe-atmosphere',    '#5B5BF6'),
        ambLight:      hex('--globe-amb-light',     '#FFE9C2'),
        keyLight:      hex('--globe-key-light',     '#FFFFFF'),
        rimLight:      hex('--globe-rim-light',     '#8A8CFF'),
    };
}

function llToVec3(lon, lat, radius) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

// Earcut produces correct triangulation in lon/lat space, but once we project
// the vertices onto the sphere, long edges between distant verts dip below the
// ocean sphere and large interior triangles disappear. Recursively split until
// every edge spans at most `maxEdgeRad` radians, re-projecting midpoints onto
// the sphere.
function subdivideToSphere(positions, indices, radius, maxEdgeRad) {
    const cache = new Map();
    const out = [];
    const r2 = radius * radius;

    const angDist = (a, b) => {
        const dot =
            (positions[a*3]   * positions[b*3] +
             positions[a*3+1] * positions[b*3+1] +
             positions[a*3+2] * positions[b*3+2]) / r2;
        return Math.acos(Math.max(-1, Math.min(1, dot)));
    };

    const midOnSphere = (a, b) => {
        const key = a < b ? `${a}_${b}` : `${b}_${a}`;
        const hit = cache.get(key);
        if (hit !== undefined) return hit;
        let x = (positions[a*3]   + positions[b*3])   * 0.5;
        let y = (positions[a*3+1] + positions[b*3+1]) * 0.5;
        let z = (positions[a*3+2] + positions[b*3+2]) * 0.5;
        const s = radius / Math.hypot(x, y, z);
        x *= s; y *= s; z *= s;
        const idx = positions.length / 3;
        positions.push(x, y, z);
        cache.set(key, idx);
        return idx;
    };

    const MAX_DEPTH = 5;
    const stack = [];
    for (let i = 0; i < indices.length; i += 3) {
        stack.push(indices[i], indices[i+1], indices[i+2], 0);
    }
    while (stack.length) {
        const depth = stack.pop();
        const c = stack.pop(), b = stack.pop(), a = stack.pop();
        if (depth >= MAX_DEPTH ||
            Math.max(angDist(a, b), angDist(b, c), angDist(c, a)) <= maxEdgeRad) {
            out.push(a, b, c);
            continue;
        }
        const ab = midOnSphere(a, b);
        const bc = midOnSphere(b, c);
        const ca = midOnSphere(c, a);
        stack.push(a,  ab, ca, depth + 1);
        stack.push(ab, b,  bc, depth + 1);
        stack.push(ca, bc, c,  depth + 1);
        stack.push(ab, bc, ca, depth + 1);
    }
    return out;
}

function ringToPoints(ring, radius) {
    return ring.map(([lon, lat]) => llToVec3(lon, lat, radius));
}

function buildCountryGeometry(polygons, radius) {
    const positions = [];
    const indices = [];

    for (const poly of polygons) {
        if (!poly.length || !poly[0] || poly[0].length < 4) continue;

        const flat = [];
        const holeIndices = [];

        for (let r = 0; r < poly.length; r++) {
            const ring = poly[r];
            if (!ring || ring.length < 4) continue;
            if (r > 0) holeIndices.push(flat.length / 2);
            for (let i = 0; i < ring.length - 1; i++) {
                flat.push(ring[i][0], ring[i][1]);
            }
        }
        if (flat.length < 6) continue;

        const tris = earcut(flat, holeIndices.length ? holeIndices : undefined);
        const vertexOffset = positions.length / 3;

        for (let i = 0; i < flat.length; i += 2) {
            const v = llToVec3(flat[i], flat[i + 1], radius);
            positions.push(v.x, v.y, v.z);
        }
        for (const idx of tris) indices.push(idx + vertexOffset);
    }

    const refined = subdivideToSphere(positions, indices, radius, Math.PI / 60);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(refined);
    geo.computeVertexNormals();
    return geo;
}

// Natural Earth's properties vary slightly between dataset versions; pick the
// best ISO_A2 we can find. ISO_A2_EH ("includes disputed") fills in some -99
// holes (France, Norway, Kosovo). Returns null if nothing usable.
function extractIso2(props) {
    if (!props) return null;
    const candidates = [props.ISO_A2_EH, props.iso_a2_eh, props.ISO_A2, props.iso_a2, props.WB_A2, props.wb_a2];
    for (const raw of candidates) {
        if (typeof raw === 'string') {
            const v = raw.trim().toUpperCase();
            if (v && v !== '-99' && v.length === 2) return v;
        }
    }
    return null;
}

function extractName(props) {
    return props?.ADMIN || props?.admin || props?.NAME || props?.name || props?.name_long || props?.NAME_LONG || 'Unknown';
}

class Globe {
    constructor(container, opts = {}) {
        this.container = container;
        this.opts = opts;
        this.onSelect = opts.onSelect || (() => {});
        this.onConfirm = opts.onConfirm || (() => {});
        this.onReady = opts.onReady || (() => {});
        this.onError = opts.onError || (() => {});

        this.palette = readPalette(document.documentElement);
        this.countryMeshes = [];
        this.byIso2 = new Map();
        this.selected = null;
        this.highlightLines = [];
        this.lockedState = null;  // 'correct' | 'wrong' | null — disables hover-select
        this.disposed = false;

        // Camera + scene init
        const w = container.clientWidth || 600;
        const h = container.clientHeight || 600;
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
        this.renderer.setSize(w, h, false);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.display = 'block';
        this.renderer.domElement.style.touchAction = 'none';
        container.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
        this.camera.position.set(0, 0, CAM_Z_DEFAULT);

        this.ambLight = new THREE.AmbientLight(this.palette.ambLight, 0.55);
        this.keyLight = new THREE.DirectionalLight(this.palette.keyLight, 1.25);
        this.keyLight.position.set(5, 3, 5);
        this.rimLight = new THREE.DirectionalLight(this.palette.rimLight, 0.5);
        this.rimLight.position.set(-5, -2, -4);
        this.scene.add(this.ambLight, this.keyLight, this.rimLight);

        this.globeGroup = new THREE.Group();
        this.scene.add(this.globeGroup);

        this.oceanMat = new THREE.MeshPhongMaterial({
            color: this.palette.ocean,
            emissive: this.palette.oceanEmit,
            shininess: 22,
            specular: this.palette.oceanSpec,
        });
        this.oceanMesh = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 96), this.oceanMat);
        this.globeGroup.add(this.oceanMesh);

        this.atmosphereMat = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.BackSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: { c: { value: this.palette.atmosphere.clone() } },
            vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
            fragmentShader: `varying vec3 vN; uniform vec3 c; void main(){ float i = pow(0.62 - dot(vN, vec3(0,0,1.0)), 3.0); gl_FragColor = vec4(c, clamp(i,0.0,1.0)*0.9); }`,
        });
        this.atmosphereMesh = new THREE.Mesh(new THREE.SphereGeometry(R * 1.13, 64, 64), this.atmosphereMat);
        this.globeGroup.add(this.atmosphereMesh);

        // Shared materials cloned per-country so we can repaint individual
        // countries without touching the rest.
        this.matLandTemplate = new THREE.MeshPhongMaterial({
            color: this.palette.land, emissive: this.palette.landEmit,
            shininess: 4, side: THREE.DoubleSide,
        });
        this.matBorder = new THREE.LineBasicMaterial({ color: this.palette.border, transparent: true, opacity: 0.9 });
        this.matHighlight = new THREE.LineBasicMaterial({ color: this.palette.highlight });

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        // Pointer + rotation state
        this.isDown = false;
        this.lastPointer = { x: 0, y: 0 };
        this.downPointer = null;
        this.downTime = 0;
        this.lastTapTime = 0;
        this.lastTapTarget = null;
        this.rotV = { x: 0, y: 0 };
        this.rot = { x: 0.35, y: -1.4 };
        this.activePointers = new Map();
        this.pinchStart = null;
        // Auto-spin would drift the target away from the player's tap; off so
        // the globe holds still until they grab it.
        this.autoSpin = false;

        this._bindEvents();
        this._startLoop();
    }

    _bindEvents() {
        const c = this.renderer.domElement;
        this._onPointerDown = (e) => {
            try { c.setPointerCapture(e.pointerId); } catch (_) { /* not always supported */ }
            this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (this.activePointers.size === 1) {
                this.isDown = true;
                this.downPointer = { x: e.clientX, y: e.clientY };
                this.downTime = Date.now();
                this.lastPointer = { x: e.clientX, y: e.clientY };
            } else if (this.activePointers.size === 2) {
                const pts = [...this.activePointers.values()];
                this.pinchStart = {
                    dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
                    z: this.camera.position.z,
                };
                this.isDown = false; // pinch suppresses rotate
            }
        };

        this._onPointerMove = (e) => {
            if (!this.activePointers.has(e.pointerId)) return;
            this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (this.activePointers.size === 2 && this.pinchStart) {
                const pts = [...this.activePointers.values()];
                const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                const ratio = d > 0 ? this.pinchStart.dist / d : 1;
                this.camera.position.z = Math.max(3.1, Math.min(9, this.pinchStart.z * ratio));
                return;
            }
            if (!this.isDown) return;
            const dx = e.clientX - this.lastPointer.x;
            const dy = e.clientY - this.lastPointer.y;
            this.lastPointer = { x: e.clientX, y: e.clientY };
            // Sensitivity scales with current zoom: when zoomed in, a 1-pixel
            // drag should nudge the globe less so countries don't whip past
            // the player's finger. Base is tuned down from 0.005 so casual
            // scrolls don't fling the globe around.
            const zoomFactor = this.camera.position.z / CAM_Z_DEFAULT;
            const sens = 0.0032 * zoomFactor;
            this.rotV.y = dx * sens;
            this.rotV.x = dy * sens;
            this.rot.y += this.rotV.y;
            this.rot.x += this.rotV.x;
            this.rot.x = Math.max(-1.2, Math.min(1.2, this.rot.x));
        };

        this._onPointerUp = (e) => {
            try { c.releasePointerCapture(e.pointerId); } catch (_) {}
            const start = this.downPointer;
            const wasMultiTouch = this.activePointers.size > 1;
            this.activePointers.delete(e.pointerId);
            if (this.activePointers.size < 2) this.pinchStart = null;
            if (this.activePointers.size === 0) this.isDown = false;
            if (!start || wasMultiTouch) { this.downPointer = null; return; }
            const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
            const elapsed = Date.now() - this.downTime;
            this.downPointer = null;
            if (moved > CLICK_MOVE_THRESHOLD || elapsed > 500) return;

            // Raycast to find the hit mesh
            const rect = c.getBoundingClientRect();
            this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            this.raycaster.setFromCamera(this.pointer, this.camera);
            const hits = this.raycaster.intersectObjects(this.countryMeshes, false);
            const hit = hits.length ? hits[0].object : null;
            const now = Date.now();
            const isDoubleTap =
                hit && this.lastTapTarget === hit && now - this.lastTapTime <= DOUBLE_TAP_MS;
            this.lastTapTime = now;
            this.lastTapTarget = hit;

            if (this.lockedState) return; // ignore taps during answer reveal

            if (!hit) {
                this._clearSelection();
                return;
            }
            if (isDoubleTap) {
                this._select(hit);
                this.onConfirm(hit.userData.iso2, hit.userData.name);
            } else {
                this._select(hit);
                this.onSelect(hit.userData.iso2, hit.userData.name);
            }
        };

        this._onWheel = (e) => {
            e.preventDefault();
            this.camera.position.z = Math.max(3.1, Math.min(9, this.camera.position.z + e.deltaY * 0.0022));
        };

        c.addEventListener('pointerdown', this._onPointerDown);
        c.addEventListener('pointermove', this._onPointerMove);
        c.addEventListener('pointerup',   this._onPointerUp);
        c.addEventListener('pointercancel', this._onPointerUp);
        c.addEventListener('wheel', this._onWheel, { passive: false });

        // Resize via ResizeObserver: the React layout may animate or change
        // around the canvas, so window resize alone isn't enough.
        if (typeof ResizeObserver !== 'undefined') {
            this._ro = new ResizeObserver(() => this.resize());
            this._ro.observe(this.container);
        }
        this._onWindowResize = () => this.resize();
        window.addEventListener('resize', this._onWindowResize);
    }

    _startLoop() {
        const tick = () => {
            if (this.disposed) return;
            this._raf = requestAnimationFrame(tick);
            if (this.activePointers.size === 0) {
                this.rotV.x *= 0.94; this.rotV.y *= 0.94;
                this.rot.y += this.rotV.y;
                this.rot.x += this.rotV.x;
                if (this.autoSpin && !this.selected && !this.lockedState) this.rot.y += 0.0006;
            }
            this.globeGroup.rotation.x = this.rot.x;
            this.globeGroup.rotation.y = this.rot.y;
            this.renderer.render(this.scene, this.camera);
        };
        tick();
    }

    resize() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (w === 0 || h === 0) return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h, false);
    }

    applyTheme() {
        this.palette = readPalette(document.documentElement);
        this.oceanMat.color.copy(this.palette.ocean);
        this.oceanMat.emissive.copy(this.palette.oceanEmit);
        this.oceanMat.specular.copy(this.palette.oceanSpec);
        this.atmosphereMat.uniforms.c.value.copy(this.palette.atmosphere);
        this.matBorder.color.copy(this.palette.border);
        this.matHighlight.color.copy(this.palette.highlight);
        this.ambLight.color.copy(this.palette.ambLight);
        this.keyLight.color.copy(this.palette.keyLight);
        this.rimLight.color.copy(this.palette.rimLight);

        for (const m of this.countryMeshes) {
            // Don't restomp meshes currently displaying correct/wrong feedback.
            if (m.userData.colorState === 'correct') {
                m.material.color.copy(this.palette.correct);
                m.material.emissive.copy(this.palette.correctEmit);
            } else if (m.userData.colorState === 'wrong') {
                m.material.color.copy(this.palette.wrong);
                m.material.emissive.copy(this.palette.wrongEmit);
            } else if (m === this.selected) {
                m.material.color.copy(this.palette.landHover);
                m.material.emissive.copy(this.palette.landHoverEmit);
            } else {
                m.material.color.copy(this.palette.land);
                m.material.emissive.copy(this.palette.landEmit);
            }
        }
    }

    async load() {
        let features = null;
        let lastErr = null;
        for (const url of NATURAL_EARTH_URLS) {
            try {
                const raw = await fetch(url).then(r => {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.json();
                });
                if (raw && raw.type === 'FeatureCollection' && Array.isArray(raw.features)) {
                    features = raw.features;
                    break;
                }
            } catch (e) {
                lastErr = e;
            }
        }
        if (!features) {
            this.onError(lastErr || new Error('Failed to load country geometry.'));
            return;
        }
        if (this.disposed) return;
        this._buildFeatures(features);
        this.onReady({ countryCount: this.countryMeshes.length });
    }

    _buildFeatures(features) {
        const meshLift = R * 1.004;
        const borderLift = R * 1.006;
        for (const feat of features) {
            const g = feat.geometry;
            if (!g) continue;
            const props = feat.properties || {};
            const name = extractName(props);
            const iso2 = extractIso2(props);
            let polys = [];
            if (g.type === 'Polygon') polys = [g.coordinates];
            else if (g.type === 'MultiPolygon') polys = g.coordinates;
            else continue;

            const mesh = new THREE.Mesh(buildCountryGeometry(polys, meshLift), this.matLandTemplate.clone());
            mesh.userData = { name, iso2, borders: [], colorState: null };
            this.globeGroup.add(mesh);
            this.countryMeshes.push(mesh);
            if (iso2) this.byIso2.set(iso2, mesh);

            for (const poly of polys) {
                for (const ring of poly) {
                    if (!ring || ring.length < 2) continue;
                    const geo = new THREE.BufferGeometry().setFromPoints(ringToPoints(ring, borderLift));
                    const line = new THREE.Line(geo, this.matBorder);
                    mesh.userData.borders.push(line);
                    this.globeGroup.add(line);
                }
            }
        }
    }

    _clearSelection() {
        if (!this.selected) return;
        const m = this.selected;
        if (m.userData.colorState === null) {
            m.material.color.copy(this.palette.land);
            m.material.emissive.copy(this.palette.landEmit);
        }
        this.highlightLines.forEach(l => this.globeGroup.remove(l));
        this.highlightLines = [];
        this.selected = null;
    }

    _select(mesh) {
        if (mesh === this.selected) return;
        this._clearSelection();
        this.selected = mesh;
        if (mesh.userData.colorState === null) {
            mesh.material.color.copy(this.palette.landHover);
            mesh.material.emissive.copy(this.palette.landHoverEmit);
        }
        mesh.userData.borders.forEach(src => {
            const hl = new THREE.Line(src.geometry, this.matHighlight);
            hl.scale.setScalar(1.001);
            this.highlightLines.push(hl);
            this.globeGroup.add(hl);
        });
    }

    // Public: paint a country with the correct/wrong reveal colour. Pass null
    // colorState to clear. Locked state suppresses further user selection.
    paintCountry(iso2, colorState) {
        const mesh = iso2 ? this.byIso2.get(iso2) : null;
        if (!mesh) return;
        mesh.userData.colorState = colorState;
        if (colorState === 'correct') {
            mesh.material.color.copy(this.palette.correct);
            mesh.material.emissive.copy(this.palette.correctEmit);
        } else if (colorState === 'wrong') {
            mesh.material.color.copy(this.palette.wrong);
            mesh.material.emissive.copy(this.palette.wrongEmit);
        } else {
            mesh.material.color.copy(mesh === this.selected ? this.palette.landHover : this.palette.land);
            mesh.material.emissive.copy(mesh === this.selected ? this.palette.landHoverEmit : this.palette.landEmit);
        }
    }

    setLocked(state) {
        this.lockedState = state || null;
    }

    // Core fly: tween the globe rotation so a unit-length world direction `c`
    // faces the camera, optionally zooming `camera.position.z` at the same time.
    //
    // The math: Three.js applies Euler rotation as Rx * Ry * Rz to a child
    // position. Constraining Rz=0, solving Rx(α) * Ry(β) * c = (0,0,1) gives
    // β = atan2(-cx, cz), α = atan2(cy, √(cx²+cz²)).
    _flyToDirection(c, opts = {}) {
        const { duration = FOCUS_DUR_MS, zoom = null } = opts;
        if (!c || c.lengthSq() === 0) return;
        const dir = c.clone().normalize();
        const targetY = Math.atan2(-dir.x, dir.z);
        const targetX = THREE.MathUtils.clamp(
            Math.atan2(dir.y, Math.sqrt(dir.x * dir.x + dir.z * dir.z)),
            -1.2, 1.2
        );
        const startX = this.rot.x;
        const startY = this.rot.y;
        // Shortest angular path on Y (avoid the long way around).
        let dy = targetY - startY;
        dy = ((dy + Math.PI) % (2 * Math.PI)) - Math.PI;
        const startZ = this.camera.position.z;
        const targetZ = zoom == null ? startZ : zoom;
        // Cancel any in-flight fly so the new tween isn't racing the old one.
        this._flyToken = (this._flyToken || 0) + 1;
        const myToken = this._flyToken;
        const t0 = performance.now();
        const ease = (t) => 1 - Math.pow(1 - t, 3);
        const step = () => {
            if (this.disposed || this._flyToken !== myToken) return;
            const t = Math.min(1, (performance.now() - t0) / duration);
            const k = ease(t);
            this.rot.x = startX + (targetX - startX) * k;
            this.rot.y = startY + dy * k;
            this.camera.position.z = startZ + (targetZ - startZ) * k;
            this.rotV.x = 0;
            this.rotV.y = 0;
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    // Fly so a country's centroid faces the camera.
    flyToIso2(iso2, opts = {}) {
        const mesh = this.byIso2.get(iso2);
        if (!mesh) return;
        mesh.geometry.computeBoundingBox();
        const c = new THREE.Vector3();
        mesh.geometry.boundingBox.getCenter(c);
        this._flyToDirection(c, opts);
    }

    // Fly so an arbitrary (lat, lon) point faces the camera — used for the
    // Hint button (rotate toward the continent without revealing the country).
    flyToLatLon(lat, lon, opts = {}) {
        this._flyToDirection(llToVec3(lon, lat, 1), opts);
    }

    // Tween the camera back out to the default zoom (rotation stays put).
    resetCamera(duration = FOCUS_DUR_MS) {
        const startZ = this.camera.position.z;
        if (Math.abs(startZ - CAM_Z_DEFAULT) < 0.01) return;
        this._flyToken = (this._flyToken || 0) + 1;
        const myToken = this._flyToken;
        const t0 = performance.now();
        const ease = (t) => 1 - Math.pow(1 - t, 3);
        const step = () => {
            if (this.disposed || this._flyToken !== myToken) return;
            const t = Math.min(1, (performance.now() - t0) / duration);
            const k = ease(t);
            this.camera.position.z = startZ + (CAM_Z_DEFAULT - startZ) * k;
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    // Bulk reset of any prior correct/wrong paints. Called between questions.
    clearAllPaints() {
        for (const m of this.countryMeshes) {
            if (m.userData.colorState) {
                m.userData.colorState = null;
                m.material.color.copy(this.palette.land);
                m.material.emissive.copy(this.palette.landEmit);
            }
        }
        this._clearSelection();
    }

    getAvailableIso2() {
        return [...this.byIso2.keys()];
    }

    dispose() {
        if (this.disposed) return;
        this.disposed = true;
        if (this._raf) cancelAnimationFrame(this._raf);
        const c = this.renderer.domElement;
        c.removeEventListener('pointerdown', this._onPointerDown);
        c.removeEventListener('pointermove', this._onPointerMove);
        c.removeEventListener('pointerup',   this._onPointerUp);
        c.removeEventListener('pointercancel', this._onPointerUp);
        c.removeEventListener('wheel', this._onWheel);
        if (this._ro) this._ro.disconnect();
        window.removeEventListener('resize', this._onWindowResize);

        // Dispose Three.js GPU resources.
        for (const m of this.countryMeshes) {
            m.geometry.dispose();
            m.material.dispose();
            for (const l of m.userData.borders) l.geometry.dispose();
        }
        this.countryMeshes = [];
        this.byIso2.clear();
        this.oceanMesh.geometry.dispose();
        this.oceanMat.dispose();
        this.atmosphereMesh.geometry.dispose();
        this.atmosphereMat.dispose();
        this.matBorder.dispose();
        this.matHighlight.dispose();
        this.matLandTemplate.dispose();
        this.renderer.dispose();
        if (c.parentNode) c.parentNode.removeChild(c);
    }
}

export default Globe;
