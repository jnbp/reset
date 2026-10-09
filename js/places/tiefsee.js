ResetWorld.define({
  id: 'tiefsee',
  name: { de: 'Tiefsee', en: 'Deep Sea' },
  hint: { de: 'Leuchtende Quallen im Dunkeln', en: 'Glowing jellyfish in the dark' },
  sound: 'deep',
  ui: 'dark',
  swatch: ['#01040a', '#062033', '#3af0ff'],
  themeColor: '#020a14',
  facts: {
    de: [
      'Rund drei Viertel aller Tiere der Tiefsee erzeugen ihr eigenes Licht.',
      'Quallen gibt es schon seit mehr als 500 Millionen Jahren.',
      'Unterhalb von etwa 1.000 Metern dringt kein Sonnenlicht mehr ins Meer.',
      'Von der Oberfläche des Mars gibt es genauere Karten als vom Meeresboden der Erde.',
    ],
    en: [
      'About three quarters of deep-sea animals make their own light.',
      'Jellyfish have existed for more than 500 million years.',
      'Below about 1,000 metres, no sunlight reaches the ocean at all.',
      'We have more detailed maps of the surface of Mars than of Earth’s seafloor.',
    ],
  },
  build(w) {
    const T = w.THREE;
    w.background(0x01040a);
    w.fog(0x020a14, 0.045);
    w.lights({ ambient: [0x1a3550, 0.4] });
    const hues = [0x3af0ff, 0xc77dff, 0x7b8cff, 0xff7dd8, 0x66ffd1];
    const bellGeo = new T.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const glowTex = new T.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c; })());
    const jellies = [];
    for (let j = 0; j < w.n(15); j++) {
      const col = new T.Color(w.pick(hues)), size = w.rand(0.5, 1.3);
      const group = new T.Group();
      const bell = new T.Mesh(bellGeo, new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35, blending: T.AdditiveBlending, side: T.DoubleSide, depthWrite: false }));
      group.add(bell);
      const halo = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: col, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false }));
      halo.scale.setScalar(3.2); halo.position.y = 0.3; group.add(halo);
      const strands = [];
      for (let s = 0; s < 7; s++) {
        const a = (s / 7) * Math.PI * 2, segs = 14;
        const pos = new Float32Array((segs + 1) * 3);
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
        const line = new T.Line(geo, new T.LineBasicMaterial({ color: col, transparent: true, opacity: 0.45, blending: T.AdditiveBlending, depthWrite: false }));
        group.add(line); strands.push({ pos, geo, a, segs, len: w.rand(2.5, 4.5) });
      }
      group.scale.setScalar(size);
      group.position.set(w.rand(-14, 14), w.rand(-10, 10), w.rand(-30, 2));
      w.add(group);
      jellies.push({ group, bell, strands, ph: w.rand(0, 6), sp: w.rand(1, 1.6), drift: w.rand(-0.15, 0.15) });
    }
    w.onFrame((dt, t) => {
      jellies.forEach((jf) => {
        const pulse = Math.sin(t * jf.sp + jf.ph);
        jf.bell.scale.set(1 - pulse * 0.1, 1 + pulse * 0.15, 1 - pulse * 0.1);
        jf.group.position.y += (0.25 + Math.max(0, pulse) * 0.5) * dt;
        jf.group.position.x += jf.drift * dt;
        if (jf.group.position.y > 14) jf.group.position.y = -14;
        jf.strands.forEach((st) => {
          for (let i = 0; i <= st.segs; i++) {
            const f = i / st.segs, r = 0.75 * (1 - f * 0.3);
            const wave = Math.sin(t * 1.6 + f * 5 + jf.ph + st.a) * 0.25 * f;
            st.pos[i * 3] = Math.cos(st.a) * r + wave;
            st.pos[i * 3 + 1] = -f * st.len;
            st.pos[i * 3 + 2] = Math.sin(st.a) * r + Math.cos(t * 1.3 + f * 4 + st.a) * 0.2 * f;
          }
          st.geo.attributes.position.needsUpdate = true;
        });
      });
    });
    w.particles({ count: 1500, box: [50, 40, 50], center: [0, 0, -10], color: 0x9ab8c8, size: 0.05, opacity: 0.5, vel: [0, -0.25, 0], wobble: 0.15, sprite: 'dot' });
    w.particles({ count: 300, box: [40, 30, 40], center: [0, 0, -10], colors: [0x3af0ff, 0x6a7bff], size: 0.08, opacity: 1, vel: [0, 0.05, 0], wobble: 0.3, additive: true, twinkle: 0.8 });
    w.camera({ pos: [0, 0, 12], look: [0, 0, -10], drift: 0.6, speed: 0.05 });
  },
});
