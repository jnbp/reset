ResetWorld.define({
  id: 'cosmos',
  name: { de: 'Kosmos', en: 'Cosmos' },
  hint: { de: 'Schwerelos zwischen Sternen', en: 'Weightless among the stars' },
  sound: 'cosmos',
  ui: 'dark',
  swatch: ['#03040b', '#24184a', '#7a5cc7'],
  themeColor: '#03040a',
  facts: {
    de: [
      'Das Licht mancher Sterne, die du nachts siehst, ist schon Tausende Jahre unterwegs.',
      'Im Weltall ist es vollkommen still, denn Schall braucht Luft oder Wasser, um sich auszubreiten.',
      'Zwischen den Galaxien ist das All fast völlig leer: im Schnitt etwa ein Atom pro Kubikmeter.',
      'Viele Astronautinnen und Astronauten erzählen vom „Overview-Effekt“: Beim Blick auf die Erde aus dem All schrumpfen Alltagssorgen.',
    ],
    en: [
      'The light from some stars you see at night has been travelling for thousands of years.',
      'Space is completely silent, because sound needs air or water to travel.',
      'Between galaxies, space is almost completely empty: on average about one atom per cubic metre.',
      'Many astronauts describe the “overview effect”: seeing Earth from space makes everyday worries shrink.',
    ],
  },
  build(w) {
    const T = w.THREE;
    w.background(0x02030a);
    w.stars({ count: 1400, size: 1.1 });
    // Stars you slowly glide through
    w.particles({ count: 2600, box: [300, 300, 420], center: [0, 0, -110], colors: [0xffffff, 0xcfe0ff, 0xffe9d0], size: 0.55, opacity: 0.55, vel: [0, 0, 6], spread: 0.5, sprite: 'dot', additive: true });
    // Nebula in a random colour
    const hue = w.rand(0.5, 0.9);
    const neb = new T.Group();
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const cx = cv.getContext('2d'), grad = cx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
    cx.fillStyle = grad; cx.fillRect(0, 0, 128, 128);
    const tex = new T.CanvasTexture(cv);
    for (let i = 0; i < 22; i++) {
      const c = new T.Color().setHSL((hue + w.rand(-0.08, 0.08)) % 1, 0.65, 0.4);
      const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, color: c, transparent: true, opacity: w.rand(0.04, 0.11), blending: T.AdditiveBlending, depthWrite: false }));
      sp.scale.setScalar(w.rand(90, 200));
      sp.position.set(w.rand(-180, 180), w.rand(-90, 90), w.rand(-380, -200));
      neb.add(sp);
    }
    w.add(neb);
    w.onFrame((dt) => { neb.rotation.z += dt * 0.004; });
    w.camera({ pos: [0, 0, 10], look: [0, 0, -100], drift: 0.6, speed: 0.05 });
  },
});
