ResetWorld.define({
  id: 'stadtregen',
  name: { de: 'Regennacht', en: 'Rainy City Night' },
  hint: { de: 'Stadtlichter hinter nassem Glas', en: 'City lights behind wet glass' },
  sound: 'city',
  ui: 'dark',
  swatch: ['#07090f', '#1b2340', '#ffb46b'],
  themeColor: '#0d1220',
  facts: {
    de: [
      'Der Geruch nach Regen hat einen Namen: Petrichor.',
      'Regentropfen sind nicht tropfenförmig, sondern beim Fallen eher rund und unten abgeflacht.',
      'Ein Regentropfen fällt je nach Größe mit etwa 10 bis 30 km/h.',
      'In einer hell erleuchteten Großstadt sind nachts oft nur noch ein paar Dutzend Sterne zu sehen.',
    ],
    en: [
      'The smell of rain has a name: petrichor.',
      'Raindrops aren’t teardrop-shaped; as they fall they are round and slightly flattened underneath.',
      'Depending on its size, a raindrop falls at about 10 to 30 km/h.',
      'In a brightly lit city, often only a few dozen stars are visible at night.',
    ],
  },
  build(w) {
    const T = w.THREE;
    w.background(0x07090f);
    w.fog(0x0d1220, 0.0095);
    const camY = 25;
    // Fassaden mit zufällig beleuchteten Fenstern
    const facade = () => {
      const c = document.createElement('canvas'); c.width = 64; c.height = 128;
      const x = c.getContext('2d');
      x.fillStyle = '#0b0e16'; x.fillRect(0, 0, 64, 128);
      for (let yy = 4; yy < 124; yy += 8) for (let xx = 4; xx < 60; xx += 8) {
        if (Math.random() < 0.32) { x.fillStyle = w.pick(['#ffcf8a', '#ffe1b0', '#f7b267', '#bcd7ff', '#fff2d6']); x.globalAlpha = w.rand(0.5, 1); x.fillRect(xx, yy, 4, 5); }
      }
      const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
    };
    const texs = [facade(), facade(), facade(), facade()];
    for (let i = 0; i < w.n(70); i++) {
      const wd = w.rand(8, 22), ht = w.rand(25, 100), dp = w.rand(8, 20);
      const tex = w.pick(texs).clone(); tex.needsUpdate = true; tex.repeat.set(wd / 16, ht / 32);
      const b = new T.Mesh(new T.BoxGeometry(wd, ht, dp), new T.MeshBasicMaterial({ map: tex }));
      b.position.set(w.rand(-170, 170), ht / 2 - 25, w.rand(-260, -70));
      w.add(b);
    }
    // Lichterkreise (Bokeh) und Autolichter auf der Straße
    const bokeh = w.particles({ count: 90, box: [70, 30, 40], center: [0, camY - 6, -40], colors: [0xffb46b, 0xff6b6b, 0x6bb8ff, 0xffe3a3], size: 5, opacity: 0.32, vel: [0, 0, 0], additive: true, twinkle: 0.25 });
    bokeh.material.opacity = 0.35;
    w.particles({ count: 40, box: [240, 0.5, 1], center: [0, -6, -62], color: 0xfff1d0, size: 2.2, opacity: 0.6, vel: [9, 0, 0], spread: 0.3, additive: true });
    w.particles({ count: 40, box: [240, 0.5, 1], center: [0, -6, -66], color: 0xff4a3a, size: 2.2, opacity: 0.6, vel: [-9, 0, 0], spread: 0.3, additive: true });
    w.rain({ count: 2500, box: [90, 70, 60], center: [0, camY - 10, -40], speed: 20, color: 0x8aa0c0, opacity: 0.18, wind: [1, 0], follow: false });
    // Tropfen auf der Scheibe direkt vor dir
    w.particles({ count: 260, box: [7, 4.5, 0.01], center: [0, camY, 4.2], colors: [0xbfd3ff, 0xffe3c0], size: 0.045, opacity: 0.55, vel: [0, -0.06, 0], spread: 0.95, sprite: 'dot' });
    w.camera({ pos: [0, camY, 6], look: [0, camY - 6, -100], drift: 0.05, speed: 0.05 });
  },
});
