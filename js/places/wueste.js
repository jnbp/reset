ResetWorld.define({
  id: 'wueste',
  name: { de: 'Wüste', en: 'Desert' },
  hint: { de: 'Endlose Dünen, warmes Licht', en: 'Endless dunes, warm light' },
  sound: 'desert',
  ui: 'light',
  swatch: ['#4f8fd6', '#f5cc94', '#e2b072'],
  themeColor: '#f5cc94',
  facts: {
    de: [
      'Nur etwa ein Fünftel aller Wüsten der Erde ist von Sand bedeckt.',
      'Manche Dünen können brummen: Rutscht Sand ab, entsteht ein tiefer, singender Ton.',
      'Die Sahara ist ungefähr so groß wie die USA.',
      'Vor einigen Tausend Jahren war die Sahara grün, mit Seen, Flüssen und Grasland.',
    ],
    en: [
      'Only about a fifth of the world’s deserts are covered in sand.',
      'Some dunes can hum: when sand slides down, it makes a deep, singing tone.',
      'The Sahara is roughly the size of the United States.',
      'A few thousand years ago the Sahara was green, with lakes, rivers and grassland.',
    ],
  },
  build(w) {
    const night = w.chance(0.35);
    if (night) {
      w.sky({ top: 0x050b1e, mid: 0x15224a, bottom: 0x283a66 });
      w.stars({ count: 4000 });
      w.glow({ pos: [-120, 90, -320], color: 0xe8eeff, size: 24, glow: 5 });
      w.fog(0x1a2747, 0.006);
      w.lights({ ambient: [0x6a7fb5, 0.45], sun: { color: 0xaabfff, intensity: 0.5, pos: [-120, 90, -320] } });
    } else {
      w.sky({ top: 0x4f8fd6, mid: 0xf5cc94, bottom: 0xf9dfb4 });
      w.glow({ pos: [180, 55, -350], color: 0xfff0c8, size: 50, glow: 4 });
      w.fog(0xf2d3a2, 0.006);
      w.lights({ ambient: [0xffe2c0, 0.5], sun: { color: 0xffd9a0, intensity: 1.0, pos: [150, 50, -200] } });
    }
    const g = w.terrain({
      size: 620, seg: 160, scale: 0.01, octaves: 3, flat: false, color: night ? 0xb9a58a : 0xe2b072,
      shape: (x, z, n) => (1 - Math.abs(Math.sin(x * 0.03 + w.noise(x * 0.008, z * 0.008) * 2.5 + z * 0.008))) * 8 + n * 4,
    });
    w.particles({ count: 700, box: [60, 2, 60], center: [0, g.heightAt(0, 20) + 0.6, 0], color: night ? 0xc9c0b0 : 0xf3d9a8, size: 0.05, opacity: 0.5, vel: [3, 0, 0.5], wobble: 0.4, sprite: 'dot', follow: true });
    w.camera({ pos: [0, g.heightAt(0, 20) + 2.2, 20], look: [0, 4, -100], drift: 0.2 });
    return night ? { ui: 'dark', themeColor: '#15224a', variant: 'night' } : { ui: 'light', themeColor: '#f5cc94', variant: 'day' };
  },
});
