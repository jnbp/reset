/* Reset – 3D world and toolkit for places
 *
 * Each place is a file in js/places/ that calls ResetWorld.define({...}).
 * Inside build(w) the helpers below are available (w.sky, w.terrain, w.trees, w.particles, …).
 * See README.md → "Adding a place".
 */
(function (global) {
  'use strict';
  const THREE = global.THREE;

  /* ---------- Randomness & noise ---------- */
  const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const chance = (p) => Math.random() < p;

  function makeSimplex() {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    const g = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
    const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
    return function (xin, yin) {
      const s = (xin + yin) * F2, i = Math.floor(xin + s), j = Math.floor(yin + s);
      const t = (i + j) * G2, x0 = xin - (i - t), y0 = yin - (j - t);
      const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
      const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
      const ii = i & 255, jj = j & 255;
      const c = (gi, x, y) => { let tt = 0.5 - x * x - y * y; if (tt < 0) return 0; tt *= tt; const gg = g[gi & 7]; return tt * tt * (gg[0] * x + gg[1] * y); };
      return 70 * (c(perm[ii + perm[jj]], x0, y0) + c(perm[ii + i1 + perm[jj + j1]], x1, y1) + c(perm[ii + 1 + perm[jj + 1]], x2, y2));
    };
  }
  let noise2 = makeSimplex();
  const fbm = (x, y, oct = 4) => { let a = 1, f = 1, s = 0, n = 0; for (let i = 0; i < oct; i++) { s += a * noise2(x * f, y * f); n += a; a *= 0.5; f *= 2; } return s / n; };

  /* ---------- Textures (created once, reused) ---------- */
  const texCache = {};
  function canvasTex(key, size, draw) {
    if (texCache[key]) return texCache[key];
    const c = document.createElement('canvas'); c.width = c.height = size;
    draw(c.getContext('2d'), size);
    const t = new THREE.CanvasTexture(c); t.resetKeep = true;
    return (texCache[key] = t);
  }
  const textures = {
    soft: () => canvasTex('soft', 128, (x, s) => {
      const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, s, s);
    }),
    dot: () => canvasTex('dot', 64, (x, s) => {
      const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, s, s);
    }),
    cloud: () => canvasTex('cloud', 256, (x, s) => {
      for (let i = 0; i < 14; i++) {
        const cx = s * (0.25 + Math.random() * 0.5), cy = s * (0.35 + Math.random() * 0.3), r = s * (0.12 + Math.random() * 0.2);
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g; x.fillRect(0, 0, s, s);
      }
    }),
    petal: () => canvasTex('petal', 64, (x, s) => {
      x.translate(s / 2, s / 2); x.rotate(0.6);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, s / 2.4);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, s / 2.6, s / 5, 0, 0, Math.PI * 2); x.fill();
    }),
    flake: () => canvasTex('flake', 64, (x, s) => {
      const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, s, s);
    }),
  };

  /* ---------- State ---------- */
  const places = [];
  let renderer, scene, camera, clock, canvas;
  let frameFns = [], cleanups = [], current = null, elapsed = 0;
  let flashLight = null, flashLevel = 0;
  const low = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || Math.min(innerWidth, innerHeight) < 600;
  const quality = low ? 0.55 : 1;

  /* ---------- Toolkit ---------- */
  const C = (c) => (c instanceof THREE.Color ? c : new THREE.Color(c));

  function makeKit(def) {
    const w = {
      THREE, rand, pick, chance, noise: noise2, fbm, quality, low,
      get scene() { return scene; },
      get camera() { return camera; },
      n: (count) => Math.max(1, Math.round(count * quality)),
      add(...objs) { objs.forEach((o) => scene.add(o)); return objs[0]; },
      onFrame(fn) { frameFns.push(fn); },
      every(minMs, maxMs, fn, firstMs) {
        let id;
        const tick = () => { fn(); id = setTimeout(tick, rand(minMs, maxMs)); };
        id = setTimeout(tick, firstMs != null ? firstMs : rand(minMs, maxMs));
        cleanups.push(() => clearTimeout(id));
      },
      on(name, fn) { if (global.ResetSound) cleanups.push(global.ResetSound.on(name, fn)); },
      soundLive() { return !!global.ResetSound && global.ResetSound.unlocked && !global.ResetSound.muted && global.ResetSound.current === def.sound; },
      background(color) { renderer.setClearColor(C(color), 1); },
      fog(color, density = 0.02) { scene.fog = new THREE.FogExp2(C(color), density); return scene.fog; },
      fogLinear(color, near, far) { scene.fog = new THREE.Fog(C(color), near, far); return scene.fog; },

      lights({ ambient = [0xffffff, 0.4], hemi = null, sun = null } = {}) {
        const out = {};
        if (ambient) { out.ambient = new THREE.AmbientLight(C(ambient[0]), ambient[1]); scene.add(out.ambient); }
        if (hemi) { out.hemi = new THREE.HemisphereLight(C(hemi[0]), C(hemi[1]), hemi[2]); scene.add(out.hemi); }
        if (sun) {
          out.sun = new THREE.DirectionalLight(C(sun.color || 0xffffff), sun.intensity != null ? sun.intensity : 1);
          out.sun.position.set(...(sun.pos || [10, 20, 10]));
          scene.add(out.sun);
        }
        return out;
      },

      // Gradient sky that always surrounds the camera
      sky({ top, mid, bottom, exponent = 0.6, below } = {}) {
        const uniforms = { top: { value: C(top) }, mid: { value: C(mid || top) }, bottom: { value: C(bottom || mid || top) }, below: { value: C(below || bottom || mid || top) }, exponent: { value: exponent } };
        const mat = new THREE.ShaderMaterial({
          uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
          vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
          fragmentShader: [
            'uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; uniform vec3 below; uniform float exponent; varying vec3 vP;',
            'void main(){ float h = normalize(vP).y;',
            ' vec3 c = mix(bottom, mid, smoothstep(0.0, 0.18, h));',
            ' c = mix(c, top, smoothstep(0.12, 1.0, pow(max(h,0.0), exponent)));',
            ' c = mix(below, c, smoothstep(-0.12, 0.0, h));',
            ' gl_FragColor = vec4(c, 1.0); }',
          ].join('\n'),
        });
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(480, 32, 20), mat);
        mesh.renderOrder = -10;
        scene.add(mesh);
        frameFns.push(() => mesh.position.copy(camera.position));
        return { mesh, uniforms };
      },

      stars({ count = 3000, size = 1.6, minY = -0.02, color = 0xffffff, twinkle = true, radius = 420 } = {}) {
        count = w.n(count);
        const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), base = new Float32Array(count);
        const c = C(color);
        for (let i = 0; i < count; i++) {
          let v; do { v = new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)); } while (v.lengthSq() > 1 || v.lengthSq() < 0.01);
          v.normalize(); if (v.y < minY) v.y = -v.y + minY;
          v.multiplyScalar(radius);
          pos.set([v.x, v.y, v.z], i * 3);
          base[i] = Math.pow(Math.random(), 2.5) * 0.9 + 0.1;
          col.set([c.r * base[i], c.g * base[i], c.b * base[i]], i * 3);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const mat = new THREE.PointsMaterial({ size: size * Math.min(devicePixelRatio, 2), sizeAttenuation: false, map: textures.dot(), vertexColors: true, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending });
        const pts = new THREE.Points(geo, mat);
        pts.renderOrder = -9;
        scene.add(pts);
        frameFns.push(() => {
          pts.position.copy(camera.position);
          if (!twinkle) return;
          for (let k = 0; k < 40; k++) {
            const i = Math.floor(Math.random() * count), b = base[i] * rand(0.4, 1.2);
            col[i * 3] = c.r * b; col[i * 3 + 1] = c.g * b; col[i * 3 + 2] = c.b * b;
          }
          geo.attributes.color.needsUpdate = true;
        });
        return pts;
      },

      // Glowing disc: sun, moon, lights
      glow({ pos = [0, 50, -300], color = 0xffffff, size = 40, glow = 3, core = 1, coreColor } = {}) {
        const group = new THREE.Group();
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: textures.soft(), color: C(color), blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true, opacity: 0.6 }));
        halo.scale.setScalar(size * glow);
        group.add(halo);
        if (core) {
          const disc = new THREE.Sprite(new THREE.SpriteMaterial({ map: textures.dot(), color: C(coreColor || color), depthWrite: false, fog: false, transparent: true, opacity: core }));
          disc.scale.setScalar(size);
          group.add(disc);
        }
        group.position.set(...pos);
        group.renderOrder = -8;
        scene.add(group);
        return group;
      },

      // Terrain from noise; shape(x, z, n) shapes the height, colorAt(h, x, z) colours it
      terrain({ size = 200, seg = 100, y = 0, height = 4, scale = 0.03, octaves = 4, color = 0x6a9a50, colorAt = null, shape = null, flat = true, sizeZ } = {}) {
        seg = Math.max(24, Math.round(seg * (low ? 0.7 : 1)));
        const geo = new THREE.PlaneGeometry(size, sizeZ || size, seg, seg);
        geo.rotateX(-Math.PI / 2);
        const heightAt = (x, z) => {
          const n = fbm(x * scale, z * scale, octaves);
          return y + (shape ? shape(x, z, n) : n * height);
        };
        const p = geo.attributes.position;
        const colors = colorAt ? new Float32Array(p.count * 3) : null;
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), z = p.getZ(i), h = heightAt(x, z);
          p.setY(i, h);
          if (colors) { const c = C(colorAt(h - y, x, z)); colors.set([c.r, c.g, c.b], i * 3); }
        }
        if (colors) geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.computeVertexNormals();
        const mat = new THREE.MeshPhongMaterial({ specular: 0x000000, shininess: 0, color: colors ? 0xffffff : C(color), vertexColors: !!colors, flatShading: flat });
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        return { mesh, heightAt };
      },

      // Moving water surface (low poly with highlights)
      water({ size = 400, seg = 90, y = 0, color = 0x2a6f97, specular = 0x666666, shininess = 60, opacity = 1, waves = [[1, 0.3, 0.25, 9, 1], [0.4, 1, 0.18, 6, 1.3], [-0.6, 0.8, 0.08, 3, 2]], flow = [0, 0], sizeZ, emissive = 0x000000 } = {}) {
        seg = Math.round(seg * (low ? 0.6 : 1));
        const geo = new THREE.PlaneGeometry(size, sizeZ || size, seg, seg);
        geo.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshPhongMaterial({ color: C(color), specular: C(specular), shininess, flatShading: true, transparent: opacity < 1, opacity, emissive: C(emissive) });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = y;
        scene.add(mesh);
        const p = geo.attributes.position;
        const bx = new Float32Array(p.count), bz = new Float32Array(p.count);
        for (let i = 0; i < p.count; i++) { bx[i] = p.getX(i); bz[i] = p.getZ(i); }
        const W = waves.map(([dx, dz, amp, len, speed]) => { const l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l, amp, (Math.PI * 2) / len, speed]; });
        frameFns.push((dt, t) => {
          for (let i = 0; i < p.count; i++) {
            const x = bx[i] - flow[0] * t, z = bz[i] - flow[1] * t;
            let h = 0;
            for (let k = 0; k < W.length; k++) { const q = W[k]; h += q[2] * Math.sin((q[0] * x + q[1] * z) * q[3] + t * q[4]); }
            p.setY(i, h);
          }
          p.needsUpdate = true;
        });
        return mesh;
      },

      // Particles: snow, bubbles, pollen, fireflies, sparks, petals …
      particles({ count = 500, box = [40, 20, 40], center = [0, 10, 0], color = 0xffffff, colors = null, size = 0.2, opacity = 0.8, vel = [0, -1, 0], spread = 0.4, wobble = 0, wobbleSpeed = 1, sprite = 'soft', additive = false, attenuate = true, twinkle = 0, follow = false } = {}) {
        count = w.n(count);
        const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
        const speed = new Float32Array(count), phase = new Float32Array(count), baseCol = new Float32Array(count * 3);
        const palette = (colors || [color]).map(C);
        for (let i = 0; i < count; i++) {
          pos[i * 3] = center[0] + rand(-0.5, 0.5) * box[0];
          pos[i * 3 + 1] = center[1] + rand(-0.5, 0.5) * box[1];
          pos[i * 3 + 2] = center[2] + rand(-0.5, 0.5) * box[2];
          speed[i] = 1 + rand(-spread, spread); phase[i] = rand(0, Math.PI * 2);
          const c = pick(palette);
          baseCol.set([c.r, c.g, c.b], i * 3); col.set([c.r, c.g, c.b], i * 3);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const mat = new THREE.PointsMaterial({ size, sizeAttenuation: attenuate, map: textures[sprite](), vertexColors: true, transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
        const pts = new THREE.Points(geo, mat);
        scene.add(pts);
        frameFns.push((dt, t) => {
          const cx = follow ? camera.position.x + center[0] : center[0];
          const cz = follow ? camera.position.z + center[2] : center[2];
          const cy = center[1];
          for (let i = 0; i < count; i++) {
            const k = i * 3, s = speed[i];
            pos[k] += vel[0] * s * dt + (wobble ? Math.sin(t * wobbleSpeed + phase[i]) * wobble * dt : 0);
            pos[k + 1] += vel[1] * s * dt;
            pos[k + 2] += vel[2] * s * dt + (wobble ? Math.cos(t * wobbleSpeed * 0.8 + phase[i]) * wobble * dt : 0);
            if (pos[k] < cx - box[0] / 2) pos[k] += box[0]; else if (pos[k] > cx + box[0] / 2) pos[k] -= box[0];
            if (pos[k + 1] < cy - box[1] / 2) pos[k + 1] += box[1]; else if (pos[k + 1] > cy + box[1] / 2) pos[k + 1] -= box[1];
            if (pos[k + 2] < cz - box[2] / 2) pos[k + 2] += box[2]; else if (pos[k + 2] > cz + box[2] / 2) pos[k + 2] -= box[2];
            if (twinkle) {
              const b = Math.max(0, Math.sin(t * twinkle * s + phase[i]));
              const f = b * b;
              col[k] = baseCol[k] * f; col[k + 1] = baseCol[k + 1] * f; col[k + 2] = baseCol[k + 2] * f;
            }
          }
          geo.attributes.position.needsUpdate = true;
          if (twinkle) geo.attributes.color.needsUpdate = true;
        });
        return pts;
      },

      // Rain as fine streaks
      rain({ count = 3000, box = [60, 30, 60], center = [0, 10, 0], speed = 22, length = 0.7, color = 0xb8cce0, opacity = 0.35, wind = [2, 0], follow = true } = {}) {
        count = w.n(count);
        const pos = new Float32Array(count * 6), sp = new Float32Array(count);
        const dir = new THREE.Vector3(wind[0], -speed, wind[1]).normalize();
        for (let i = 0; i < count; i++) {
          const x = center[0] + rand(-0.5, 0.5) * box[0], y = center[1] + rand(-0.5, 0.5) * box[1], z = center[2] + rand(-0.5, 0.5) * box[2];
          pos.set([x, y, z, x - dir.x * length, y - dir.y * length, z - dir.z * length], i * 6);
          sp[i] = rand(0.8, 1.2);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.LineBasicMaterial({ color: C(color), transparent: true, opacity, depthWrite: false });
        const lines = new THREE.LineSegments(geo, mat);
        scene.add(lines);
        frameFns.push((dt) => {
          const cx = follow ? camera.position.x + center[0] : center[0], cz = follow ? camera.position.z + center[2] : center[2];
          for (let i = 0; i < count; i++) {
            const k = i * 6, s = sp[i] * dt;
            const dx = wind[0] * s, dy = -speed * s, dz = wind[1] * s;
            pos[k] += dx; pos[k + 1] += dy; pos[k + 2] += dz; pos[k + 3] += dx; pos[k + 4] += dy; pos[k + 5] += dz;
            if (pos[k + 1] < center[1] - box[1] / 2) {
              const x = cx + rand(-0.5, 0.5) * box[0], y = center[1] + box[1] / 2, z = cz + rand(-0.5, 0.5) * box[2];
              pos[k] = x; pos[k + 1] = y; pos[k + 2] = z; pos[k + 3] = x - dir.x * length; pos[k + 4] = y - dir.y * length; pos[k + 5] = z - dir.z * length;
            }
          }
          geo.attributes.position.needsUpdate = true;
        });
        return lines;
      },

      // Trees as instanced low-poly shapes: pine, round, blossom, palm
      trees({ count = 40, x = [-30, 30], z = [-40, -5], kind = 'pine', scale = [0.8, 1.4], heightAt = null, trunk = 0x6b4a32, crown = [0x2f6b3a, 0x3d7d44, 0x285c33], avoid = null } = {}) {
        count = w.n(count);
        const spots = [];
        for (let i = 0, tries = 0; i < count && tries < count * 20; tries++) {
          const px = rand(x[0], x[1]), pz = rand(z[0], z[1]);
          if (avoid && avoid(px, pz)) continue;
          spots.push([px, heightAt ? heightAt(px, pz) : 0, pz, rand(scale[0], scale[1]), rand(0, Math.PI * 2)]);
          i++;
        }
        const group = new THREE.Group();
        const crownMat = new THREE.MeshPhongMaterial({ specular: 0x000000, shininess: 0, flatShading: true });
        const trunkMat = new THREE.MeshPhongMaterial({ specular: 0x000000, shininess: 0, color: C(trunk), flatShading: true });
        const palette = crown.map(C);
        const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), v3 = new THREE.Vector3(), e = new THREE.Euler();
        const part = (geo, mat, place) => {
          const inst = new THREE.InstancedMesh(geo, mat, spots.length);
          spots.forEach((sp, i) => {
            const r = place(sp, i);
            e.set(r.rx || 0, sp[4] + (r.ry || 0), r.rz || 0); q.setFromEuler(e);
            v3.set(sp[0] + (r.x || 0) * sp[3], sp[1] + r.y * sp[3], sp[2] + (r.z || 0) * sp[3]);
            s3.set((r.sx || 1) * sp[3], (r.sy || 1) * sp[3], (r.sz || 1) * sp[3]);
            m.compose(v3, q, s3); inst.setMatrixAt(i, m);
            if (mat === crownMat) inst.setColorAt(i, r.color || pick(palette));
          });
          group.add(inst);
        };
        const colors = spots.map(() => pick(palette));
        if (kind === 'pine') {
          part(new THREE.CylinderGeometry(0.1, 0.16, 1.2, 5).translate(0, 0.6, 0), trunkMat, () => ({ y: 0 }));
          [[1.25, 2.2, 1.7], [0.95, 1.9, 2.75], [0.6, 1.4, 3.7]].forEach(([r, h, yy]) => {
            part(new THREE.ConeGeometry(r, h, 7), crownMat, (sp, i) => ({ y: yy, color: colors[i] }));
          });
        } else if (kind === 'round' || kind === 'blossom') {
          part(new THREE.CylinderGeometry(0.12, 0.2, 2.4, 5).translate(0, 1.2, 0), trunkMat, () => ({ y: 0 }));
          const crownGeo = new THREE.IcosahedronGeometry(1.3, 1);
          part(crownGeo, crownMat, (sp, i) => ({ y: 2.9, sx: 1.15, sy: 0.9, sz: 1.1, color: colors[i] }));
          part(crownGeo, crownMat, (sp, i) => ({ y: 3.6, x: 0.5, z: 0.2, sx: 0.75, sy: 0.65, sz: 0.75, color: colors[i] }));
          part(crownGeo, crownMat, (sp, i) => ({ y: 3.3, x: -0.6, z: -0.3, sx: 0.7, sy: 0.6, sz: 0.7, color: colors[i] }));
        } else if (kind === 'palm') {
          part(new THREE.CylinderGeometry(0.12, 0.2, 5, 6).translate(0, 2.5, 0), trunkMat, () => ({ y: 0 }));
          const leaf = new THREE.ConeGeometry(0.35, 3, 4).translate(0, 1.5, 0);
          for (let k = 0; k < 7; k++) {
            part(leaf, crownMat, (sp, i) => ({ y: 4.9, ry: (k / 7) * Math.PI * 2, rz: 1.2 + Math.sin(k * 2.1) * 0.2, sz: 0.25, color: colors[i] }));
          }
        }
        scene.add(group);
        return group;
      },

      rocks({ count = 20, x = [-20, 20], z = [-20, 0], scale = [0.3, 1.2], color = 0x7a7a7a, colors = null, heightAt = null, sink = 0.3, avoid = null } = {}) {
        count = w.n(count);
        const mat = new THREE.MeshPhongMaterial({ specular: 0x000000, shininess: 0, flatShading: true });
        const inst = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), mat, count);
        const palette = (colors || [color]).map(C);
        const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
        for (let i = 0; i < count; i++) {
          let px, pz, tries = 0;
          do { px = rand(x[0], x[1]); pz = rand(z[0], z[1]); } while (avoid && avoid(px, pz) && ++tries < 20);
          const s = rand(scale[0], scale[1]);
          e.set(rand(0, 3), rand(0, 3), rand(0, 3)); q.setFromEuler(e);
          m.compose(new THREE.Vector3(px, (heightAt ? heightAt(px, pz) : 0) + s * (0.5 - sink), pz), q, new THREE.Vector3(s * rand(0.9, 1.5), s * rand(0.5, 0.9), s * rand(0.9, 1.4)));
          inst.setMatrixAt(i, m); inst.setColorAt(i, pick(palette).clone().offsetHSL(0, 0, rand(-0.05, 0.05)));
        }
        scene.add(inst);
        return inst;
      },

      // Material that sways in the wind (grass, wheat, seaweed)
      swayMaterial({ color = 0xffffff, height = 1, amp = 0.15, speed = 1.5, freq = 0.15, side = THREE.DoubleSide } = {}) {
        const mat = new THREE.MeshLambertMaterial({ color: C(color), side });
        const u = { uTime: { value: 0 }, uHeight: { value: height }, uAmp: { value: amp }, uSpeed: { value: speed }, uFreq: { value: freq } };
        mat.onBeforeCompile = (shader) => {
          Object.assign(shader.uniforms, u);
          shader.vertexShader = 'uniform float uTime; uniform float uHeight; uniform float uAmp; uniform float uSpeed; uniform float uFreq;\n' +
            shader.vertexShader.replace('#include <begin_vertex>', [
              '#include <begin_vertex>',
              'float hgt = clamp(position.y / uHeight, 0.0, 1.0);',
              'vec3 ip = vec3(0.0);',
              '#ifdef USE_INSTANCING',
              'ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);',
              '#endif',
              'float sw = sin(uTime * uSpeed + ip.x * uFreq + ip.z * uFreq * 0.7) + 0.45 * sin(uTime * uSpeed * 2.3 + ip.z * uFreq * 2.1);',
              'transformed.x += sw * uAmp * hgt * hgt;',
              'transformed.z += sw * uAmp * 0.4 * hgt * hgt;',
            ].join('\n'));
        };
        frameFns.push((dt, t) => { u.uTime.value = t; });
        return mat;
      },

      grass({ count = 5000, x = [-20, 20], z = [-30, 5], height = 0.6, width = 0.06, colors = [0x4f8a3a, 0x5f9a44, 0x3e7a32], heightAt = null, amp = 0.15, speed = 1.5, freq = 0.2, tilt = 0.25, avoid = null } = {}) {
        count = w.n(count);
        const geo = new THREE.PlaneGeometry(width, height, 1, 4).translate(0, height / 2, 0);
        const p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * (1 - p.getY(i) / height * 0.9));
        const mat = w.swayMaterial({ height, amp, speed, freq });
        const inst = new THREE.InstancedMesh(geo, mat, count);
        const palette = colors.map(C);
        const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
        for (let i = 0; i < count; i++) {
          let px, pz, tries = 0;
          do { px = rand(x[0], x[1]); pz = rand(z[0], z[1]); } while (avoid && avoid(px, pz) && ++tries < 10);
          const s = rand(0.6, 1.4);
          e.set(rand(-tilt, tilt), rand(0, Math.PI * 2), rand(-tilt, tilt)); q.setFromEuler(e);
          m.compose(new THREE.Vector3(px, heightAt ? heightAt(px, pz) : 0, pz), q, new THREE.Vector3(1, s, 1));
          inst.setMatrixAt(i, m); inst.setColorAt(i, pick(palette).clone().offsetHSL(0, 0, rand(-0.04, 0.04)));
        }
        scene.add(inst);
        return inst;
      },

      // Soft clouds or mist made of sprites
      clouds({ count = 60, box = [200, 20, 200], center = [0, 30, -50], size = [30, 60], color = 0xffffff, opacity = 0.8, drift = [1, 0, 0], fog = true, fadeNear = 0 } = {}) {
        count = w.n(count);
        const group = new THREE.Group();
        const items = [];
        for (let i = 0; i < count; i++) {
          const mat = new THREE.SpriteMaterial({ map: textures.cloud(), color: C(Array.isArray(color) ? pick(color) : color), transparent: true, opacity: opacity * rand(0.6, 1), depthWrite: false, fog });
          mat.rotation = rand(0, Math.PI * 2);
          const sp = new THREE.Sprite(mat);
          sp.scale.setScalar(rand(size[0], size[1]));
          sp.position.set(center[0] + rand(-0.5, 0.5) * box[0], center[1] + rand(-0.5, 0.5) * box[1], center[2] + rand(-0.5, 0.5) * box[2]);
          group.add(sp); items.push([sp, rand(0.6, 1.4), mat.opacity]);
        }
        scene.add(group);
        frameFns.push((dt) => {
          for (const [sp, f, o] of items) {
            sp.position.x += drift[0] * f * dt; sp.position.y += drift[1] * f * dt; sp.position.z += drift[2] * f * dt;
            if (fadeNear) {
              const d = sp.position.distanceTo(camera.position) - sp.scale.x * 0.35;
              sp.material.opacity = o * Math.min(1, Math.max(0, (d - fadeNear * 0.3) / fadeNear));
            }
            for (let a = 0; a < 3; a++) {
              const k = 'xyz'[a], c = center[a], h = box[a] / 2;
              if (sp.position[k] > c + h) sp.position[k] -= box[a]; else if (sp.position[k] < c - h) sp.position[k] += box[a];
            }
          }
        });
        return group;
      },

      // Light rays (forest, underwater)
      rays({ count = 8, x = [-15, 15], z = [-25, -5], top = 25, length = 40, width = [1, 3], color = 0xfff1c4, opacity = 0.08, tilt = [0.2, 0.1], sway = 0.03 } = {}) {
        const group = new THREE.Group();
        const mats = [];
        for (let i = 0; i < count; i++) {
          const wd = rand(width[0], width[1]);
          const geo = new THREE.CylinderGeometry(wd * 0.4, wd, length, 12, 1, true).translate(0, -length / 2, 0);
          const mat = new THREE.MeshBasicMaterial({ color: C(color), transparent: true, opacity: opacity * rand(0.5, 1.2), blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(rand(x[0], x[1]), top, rand(z[0], z[1]));
          mesh.rotation.set(tilt[1] + rand(-0.05, 0.05), 0, tilt[0] + rand(-0.05, 0.05));
          group.add(mesh); mats.push([mat, mat.opacity, rand(0, 6), mesh]);
        }
        scene.add(group);
        frameFns.push((dt, t) => mats.forEach(([mat, o, ph, mesh]) => {
          mat.opacity = o * (0.6 + 0.4 * Math.sin(t * 0.3 + ph));
          mesh.rotation.z += Math.sin(t * 0.2 + ph) * sway * dt;
        }));
        return group;
      },

      // Camera with a gentle floating drift
      camera({ pos = [0, 2, 8], look = [0, 1, 0], fov = 60, drift = 0.15, speed = 0.12, move = null } = {}) {
        camera.fov = fov; camera.updateProjectionMatrix();
        const base = new THREE.Vector3(...pos), target = new THREE.Vector3(...look);
        camera.position.copy(base); camera.lookAt(target);
        const ph = rand(0, 10);
        frameFns.push((dt, t) => {
          if (move) { base.x += move[0] * dt; base.y += move[1] * dt; base.z += move[2] * dt; target.x += move[0] * dt; target.y += move[1] * dt; target.z += move[2] * dt; }
          camera.position.set(
            base.x + Math.sin(t * speed + ph) * drift,
            base.y + Math.sin(t * speed * 1.3 + ph) * drift * 0.4,
            base.z + Math.cos(t * speed * 0.7 + ph) * drift * 0.5);
          camera.lookAt(target.x + Math.sin(t * speed * 0.5 + ph) * drift * 0.5, target.y, target.z);
        });
      },

      // short flash of light across the whole scene
      flash(intensity = 2.5, color = 0xdfe8ff) {
        if (!flashLight) { flashLight = new THREE.AmbientLight(0xffffff, 0); scene.add(flashLight); }
        flashLight.color = C(color);
        flashLevel = Math.max(flashLevel, intensity);
      },
    };
    return w;
  }

  /* ---------- Scene management ---------- */

  function dispose() {
    cleanups.forEach((fn) => { try { fn(); } catch (e) {} });
    cleanups = []; frameFns = [];
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      mats.forEach((m) => { if (m.map && !m.map.resetKeep) m.map.dispose(); m.dispose(); });
    });
    while (scene.children.length) scene.remove(scene.children[0]);
    scene.fog = null; flashLight = null; flashLevel = 0;
  }

  function onResize() {
    if (!renderer) return;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }

  // App-driven camera pull (0 = normal, 1 = fully pulled back), applied only while rendering
  const pull = { from: 0, to: 0, t0: 0, dur: 1, value: 0 };
  const ease = (x) => 0.5 - Math.cos(Math.PI * Math.min(1, Math.max(0, x))) / 2;

  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;
    for (let i = 0; i < frameFns.length; i++) frameFns[i](dt, elapsed);
    if (flashLight) { flashLevel *= Math.pow(0.02, dt); flashLight.intensity = flashLevel; }
    pull.value = pull.from + (pull.to - pull.from) * ease((performance.now() - pull.t0) / pull.dur);
    const cfg = (current && current.def.pull) || { back: 7, up: 2.5 };
    const back = pull.value * cfg.back, up = pull.value * cfg.up;
    if (back || up) { camera.translateZ(back); camera.position.y += up; }
    renderer.render(scene, camera);
    if (back || up) { camera.position.y -= up; camera.translateZ(-back); }
  }

  const ResetWorld = {
    places,
    rand, pick,
    define(def) { if (!places.some((p) => p.id === def.id)) places.push(def); },
    get(id) { return places.find((p) => p.id === id); },
    get current() { return current; },
    // Gently pull the camera back (to = 0…1) over `seconds` seconds
    pull(to, seconds = 3, from) {
      pull.from = from != null ? from : pull.value;
      pull.to = to; pull.t0 = performance.now(); pull.dur = Math.max(1, seconds * 1000);
    },
    init(el) {
      canvas = el;
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !low, alpha: false, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio, low ? 1.5 : 2));
      renderer.setSize(innerWidth, innerHeight);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1200);
      clock = new THREE.Clock();
      addEventListener('resize', onResize);
      loop();
    },
    // Builds a place; returns { def, ui, themeColor }
    show(id) {
      const def = this.get(id) || places[0];
      dispose();
      noise2 = makeSimplex();
      elapsed = 0;
      pull.from = pull.to = pull.value = 0;
      renderer.setClearColor(0x000000, 1);
      camera.position.set(0, 2, 8); camera.lookAt(0, 0, 0); camera.fov = 60; camera.updateProjectionMatrix();
      const extra = def.build(makeKit(def)) || {};
      current = { def, ui: extra.ui || def.ui || 'dark', themeColor: extra.themeColor || def.themeColor || '#000000', variant: extra.variant || null };
      return current;
    },
  };

  global.ResetWorld = ResetWorld;
})(window);
