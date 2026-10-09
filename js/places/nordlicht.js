ResetWorld.define({
  id: 'nordlicht',
  name: { de: 'Nordlicht', en: 'Northern Lights' },
  hint: { de: 'Arktische Nacht über verschneiter Ebene', en: 'Arctic night over a snowy plain' },
  sound: 'arctic',
  ui: 'dark',
  swatch: ['#030814', '#0c3a3a', '#38f0a0'],
  themeColor: '#04121f',
  facts: {
    de: [
      'Polarlichter leuchten meist in 100 bis 300 Kilometern Höhe.',
      'Das grüne Leuchten der Polarlichter stammt von Sauerstoffatomen in der oberen Atmosphäre.',
      'Polarlichter gibt es auch auf Jupiter und Saturn.',
      'Die Teilchen, die ein Polarlicht auslösen, kommen von der Sonne und sind oft ein bis drei Tage unterwegs.',
    ],
    en: [
      'Auroras usually glow between 100 and 300 kilometres above the ground.',
      'The green glow of an aurora comes from oxygen atoms in the upper atmosphere.',
      'Auroras also light up the skies of Jupiter and Saturn.',
      'The particles that trigger an aurora come from the Sun and often travel for one to three days.',
    ],
  },
  build(w) {
    const T = w.THREE;
    w.sky({ top: 0x01030a, mid: 0x04121f, bottom: 0x0a2433 });
    w.stars({ count: 3500 });
    w.fog(0x07182a, 0.011);
    w.lights({ ambient: [0x4a6a8a, 0.55], sun: { color: 0x66ffbb, intensity: 0.35, pos: [0, 30, -60] } });

    const pink = w.chance(0.4);
    const mats = [];
    for (let c = 0; c < 3; c++) {
      const geo = new T.PlaneGeometry(280, 60, 160, 1);
      const p = geo.attributes.position, ph = w.rand(0, 6), baseZ = -110 - c * 35;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        p.setZ(i, baseZ + Math.sin(x * 0.018 + ph) * 28);
        p.setY(i, p.getY(i) + 48 + c * 6);
      }
      const mat = new T.ShaderMaterial({
        uniforms: { t: { value: 0 }, c1: { value: new T.Color(0x2bff88) }, c2: { value: new T.Color(pink ? 0xc04cff : 0x2fd3ff) }, k: { value: [1, 0.75, 0.55][c] }, ph: { value: ph } },
        transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending, fog: false,
        vertexShader: [
          'uniform float t; uniform float ph; varying vec2 vUv;',
          'void main(){ vUv = uv; vec3 p = position;',
          ' p.z += sin(p.x * 0.025 + t * 0.15 + ph) * 6.0; p.y += sin(p.x * 0.04 + t * 0.3) * 2.0;',
          ' gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
        ].join('\n'),
        fragmentShader: [
          'uniform float t; uniform float ph; uniform vec3 c1; uniform vec3 c2; uniform float k; varying vec2 vUv;',
          'void main(){ float x = vUv.x; float y = vUv.y;',
          ' float bands = 0.55 + 0.45 * sin(x * 38.0 + t * 0.5 + ph + sin(x * 9.0 - t * 0.25) * 2.5);',
          ' float rays = 0.6 + 0.4 * sin(x * 160.0 + t * 1.5 + sin(x * 23.0) * 4.0);',
          ' float base = smoothstep(0.0, 0.12, y) * pow(1.0 - y, 1.8);',
          ' float edge = smoothstep(0.0, 0.1, x) * smoothstep(1.0, 0.9, x);',
          ' vec3 col = mix(c1, c2, smoothstep(0.25, 0.95, y));',
          ' float a = base * bands * rays * edge * k * 0.9;',
          ' gl_FragColor = vec4(col * a, 1.0); }',
        ].join('\n'),
      });
      mats.push(mat);
      w.add(new T.Mesh(geo, mat));
    }
    w.onFrame((dt, t) => mats.forEach((m) => { m.uniforms.t.value = t; }));

    const g = w.terrain({ size: 420, seg: 90, height: 3, scale: 0.015, colorAt: (h) => (h > 0.8 ? 0xdfe9f5 : 0xc5d6ea) });
    w.trees({ count: 70, x: [-130, 130], z: [-150, -30], scale: [1.5, 3], heightAt: g.heightAt, crown: [0x0e1f22, 0x12282a, 0x0b1a1c], trunk: 0x1a1410 });
    w.particles({ count: 400, box: [60, 20, 60], center: [0, 8, -10], color: 0xffffff, size: 0.08, opacity: 0.6, vel: [0.4, -0.5, 0], wobble: 0.3, sprite: 'flake', follow: true });
    w.camera({ pos: [0, g.heightAt(0, 10) + 2.2, 10], look: [0, 22, -100], fov: 65, drift: 0.2 });
    return { variant: pink ? 'pink' : 'green' };
  },
});
