ResetWorld.define({
  id: 'white-room',
  name: { de: 'White Room', en: 'White Room' },
  hint: { de: 'Klare Formen, nichts lenkt ab', en: 'Clear shapes, nothing to distract' },
  sound: 'room',
  ui: 'light',
  swatch: ['#ffffff', '#f3f3f1', '#d9d9e6'],
  themeColor: '#f3f3f1',
  facts: {
    de: [
      'In schalltoten Räumen ist es so still, dass man den eigenen Herzschlag hören kann.',
      'Weiße Flächen werfen fast das gesamte Licht aller Farben zurück.',
      'Weißes Licht ist eine Mischung aus allen Farben des Regenbogens.',
      'Wenn du nichts tust, schaltet dein Gehirn in ein Ruhenetzwerk, in dem oft neue Ideen entstehen.',
    ],
    en: [
      'Anechoic rooms are so quiet that you can hear your own heartbeat.',
      'White surfaces reflect almost all light of every colour.',
      'White light is a mix of every colour of the rainbow.',
      'When you do nothing, your brain switches to a resting network where new ideas often appear.',
    ],
  },
  build(w) {
    const T = w.THREE;
    w.background(0xf3f3f1);
    w.fogLinear(0xf3f3f1, 14, 46);
    w.lights({ ambient: [0xffffff, 0.75], sun: { color: 0xffffff, intensity: 0.45, pos: [-5, 8, 3] } });
    const pl = new T.PointLight(0xffffff, 0.5); pl.position.set(5, 5, 5); w.add(pl);
    const floor = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshStandardMaterial({ color: 0xe8e8e6, roughness: 0.4 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -5; w.add(floor);
    const tints = [0xffffff, 0xf1e7ff, 0xe5f3ff, 0xfff0e6, 0xe9fff4];
    const shapes = [
      () => new T.TorusKnotGeometry(w.rand(0.6, 1.6), w.rand(0.12, 0.3), 120, 16),
      () => new T.IcosahedronGeometry(w.rand(0.6, 1.3), 0),
      () => new T.TorusGeometry(w.rand(0.7, 1.4), w.rand(0.1, 0.25), 16, 60),
    ];
    for (let i = 0; i < 11; i++) {
      const mesh = new T.Mesh(w.pick(shapes)(), new T.MeshStandardMaterial({ color: w.pick(tints), metalness: 0.1, roughness: 0.25, flatShading: w.chance(0.3) }));
      mesh.position.set(w.rand(-9, 9), w.rand(-3, 4), w.rand(-10, 4));
      const rs = w.rand(0.05, 0.15), fs = w.rand(0.1, 0.3), fa = w.rand(0.5, 1.5), y0 = mesh.position.y, ph = w.rand(0, 6);
      w.onFrame((dt, t) => { mesh.rotation.x += dt * rs; mesh.rotation.y += dt * rs * 0.5; mesh.position.y = y0 + Math.sin(t * fs + ph) * fa; });
      w.add(mesh);
    }
    w.camera({ pos: [0, 0, 15], look: [0, 0, 0], drift: 0.6, speed: 0.08 });
  },
});
