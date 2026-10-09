ResetWorld.define({
  id: 'unterwasser',
  name: { de: 'Unterwasser', en: 'Underwater' },
  hint: { de: 'Lichtspiel am Meeresgrund', en: 'Dancing light on the seabed' },
  sound: 'underwater',
  ui: 'dark',
  swatch: ['#3fa9c9', '#0b5a7d', '#05324d'],
  themeColor: '#0b5a7d',
  facts: {
    de: [
      'Rund die Hälfte des Sauerstoffs, den du atmest, stammt aus dem Meer.',
      'Unter Wasser breitet sich Schall etwa viermal so schnell aus wie in der Luft.',
      'Manche Wale können sich über Hunderte Kilometer unter Wasser hören.',
      'Korallenriffe bedecken weniger als ein Prozent des Meeresbodens, beherbergen aber rund ein Viertel aller Meeresarten.',
    ],
    en: [
      'About half of the oxygen you breathe comes from the ocean.',
      'Sound travels about four times faster underwater than in air.',
      'Some whales can hear each other across hundreds of kilometres of ocean.',
      'Coral reefs cover less than one percent of the seafloor but are home to about a quarter of all marine species.',
    ],
  },
  build(w) {
    const T = w.THREE;
    w.sky({ top: 0x3fa9c9, mid: 0x0b5a7d, bottom: 0x05324d, below: 0x03253a, exponent: 0.9 });
    w.fog(0x0a4a6a, 0.04);
    w.lights({ ambient: [0x5aa0bd, 0.45], hemi: [0x8fd6f0, 0x0a2a3a, 0.4] });
    const floorY = -6;
    const g = w.terrain({ size: 200, seg: 90, y: floorY, height: 2.5, scale: 0.04, colorAt: (h) => (h > 0.6 ? 0xb8a984 : 0xa49572) });
    // Lichtnetz (Kaustik) auf dem Boden
    const u = { uTime: { value: 0 } };
    g.mesh.material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = u.uTime;
      shader.vertexShader = 'varying vec2 vCaus;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvCaus = (modelMatrix * vec4(transformed, 1.0)).xz;');
      shader.fragmentShader = 'uniform float uTime; varying vec2 vCaus;\n' +
        'float caustic(vec2 p, float t){ p *= 0.32; float c = 0.0; vec2 q = p; for (int i = 0; i < 3; i++) { q += vec2(sin(q.y * 1.7 + t * 0.6), cos(q.x * 1.5 - t * 0.5)) * 0.6; c += 0.5 + 0.5 * sin(q.x * 2.0 + q.y * 2.0); } c /= 3.0; return pow(c, 6.0) * 1.3; }\n' +
        shader.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb += vec3(0.55, 0.85, 0.95) * caustic(vCaus, uTime) * 0.3;');
    };
    w.onFrame((dt, t) => { u.uTime.value = t; });

    w.rocks({ count: 28, x: [-35, 35], z: [-45, 2], scale: [0.4, 1.8], colors: [0x4b5a5e, 0x5a6b6e, 0x3e4b4f], heightAt: g.heightAt });
    w.grass({ count: 450, x: [-30, 30], z: [-40, 2], height: 3, width: 0.25, colors: [0x2f7a4a, 0x3d8a52, 0x5a8a3a], heightAt: g.heightAt, amp: 0.5, speed: 0.8, freq: 0.3, tilt: 0.15 });
    w.particles({ count: 320, box: [40, 30, 40], center: [0, 5, -10], color: 0xcff6ff, size: 0.12, opacity: 0.6, vel: [0, 1.6, 0], wobble: 0.6, wobbleSpeed: 2 });
    w.particles({ count: 900, box: [50, 30, 50], center: [0, 0, -10], color: 0xbfe8f0, size: 0.04, opacity: 0.4, vel: [0.1, -0.1, 0], wobble: 0.2, sprite: 'dot' });
    w.rays({ count: 10, x: [-25, 25], z: [-40, -5], top: 28, length: 50, width: [2, 5], color: 0x9fe8ff, opacity: 0.06, tilt: [0.15, 0.05] });

    // Fischschwärme
    const fishGeo = new T.ConeGeometry(0.09, 0.4, 4).rotateZ(-Math.PI / 2);
    const fishMat = new T.MeshPhongMaterial({ specular: 0x000000, shininess: 0, flatShading: true });
    const schools = [];
    const palette = [[0xd8e4ea, 0xc0d4dc], [0xffb84a, 0xff9a3a], [0x8fd0ff, 0x6ab8ef]];
    for (let s = 0; s < 3; s++) {
      const n = w.n(28), mesh = new T.InstancedMesh(fishGeo, fishMat, n);
      const pal = w.pick(palette);
      const fish = [];
      for (let i = 0; i < n; i++) {
        fish.push([w.rand(0, 1.2), w.rand(-0.8, 0.8), w.rand(-0.6, 0.6), w.rand(0.9, 1.1)]);
        mesh.setColorAt(i, new T.Color(w.pick(pal)));
      }
      w.add(mesh);
      schools.push({ mesh, fish, c: new T.Vector3(w.rand(-12, 12), w.rand(-3, 1), w.rand(-25, -8)), r: w.rand(5, 9), sp: w.rand(0.12, 0.22) * (w.chance(0.5) ? 1 : -1), ph: w.rand(0, 6) });
    }
    const m = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0), p = new T.Vector3(), one = new T.Vector3(1, 1, 1);
    w.onFrame((dt, t) => {
      schools.forEach((s) => {
        s.fish.forEach(([lag, dy, dr, sc], i) => {
          const a = (t * s.sp) + s.ph - lag * Math.sign(s.sp) * 0.3;
          const r = s.r + dr;
          p.set(s.c.x + Math.cos(a) * r, s.c.y + dy + Math.sin(a * 2 + i) * 0.3, s.c.z + Math.sin(a) * r);
          const heading = s.sp > 0 ? a + Math.PI / 2 : a - Math.PI / 2;
          q.setFromAxisAngle(up, -heading);
          m.compose(p, q, one.set(sc, sc, sc));
          s.mesh.setMatrixAt(i, m);
        });
        s.mesh.instanceMatrix.needsUpdate = true;
      });
    });
    w.camera({ pos: [0, -2, 10], look: [0, -2.5, -20], drift: 0.35, speed: 0.07 });
  },
});
