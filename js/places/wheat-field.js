ResetWorld.define({
  id: 'wheat-field',
  name: { de: 'Weizenfeld', en: 'Wheat Field' },
  hint: { de: 'Goldene Halme im Abendwind', en: 'Golden stalks in the evening breeze' },
  sound: 'meadow',
  ui: 'light',
  swatch: ['#4a6fa8', '#f0b77a', '#e0b860'],
  themeColor: '#f0b77a',
  facts: {
    de: [
      'Weizen wird seit rund 10.000 Jahren angebaut.',
      'Eine Weizenähre trägt meist zwischen 20 und 50 Körner.',
      'Weizen liefert rund ein Fünftel aller Kalorien, die Menschen weltweit essen.',
      'Weltweit wächst Weizen auf mehr Fläche als jede andere Nutzpflanze.',
    ],
    en: [
      'Wheat has been farmed for around 10,000 years.',
      'A single ear of wheat usually carries between 20 and 50 grains.',
      'Wheat provides about a fifth of all the calories people eat worldwide.',
      'Wheat is grown on more land than any other crop in the world.',
    ],
  },
  build(w) {
    w.sky({ top: 0x4a6fa8, mid: 0xf0b77a, bottom: 0xffd59a });
    w.glow({ pos: [-60, 22, -300], color: 0xffd08a, size: 60, glow: 4, coreColor: 0xfff0c8 });
    w.fog(0xf2c48a, 0.012);
    w.lights({ ambient: [0xffe0b0, 0.55], hemi: [0xffe8c0, 0x6a5a30, 0.3], sun: { color: 0xffc070, intensity: 1.0, pos: [-60, 25, -100] } });
    const g = w.terrain({ size: 300, seg: 90, height: 2, scale: 0.012, color: 0xa88544 });
    w.grass({ count: 9000, x: [-40, 40], z: [-60, 9], height: 1.0, width: 0.05, colors: [0xe0b860, 0xd4a94e, 0xeacb7a, 0xc99a40], heightAt: g.heightAt, amp: 0.25, speed: 1.3, freq: 0.08, tilt: 0.1 });
    w.trees({ kind: 'round', count: 1, x: [13, 15], z: [-31, -29], scale: [2.2, 2.3], heightAt: g.heightAt, crown: [0x4a6a30], trunk: 0x4a3828 });
    w.trees({ kind: 'round', count: 32, x: [-200, 200], z: [-220, -140], scale: [1.2, 2], heightAt: g.heightAt, crown: [0x5a6a3a, 0x4d5f33], trunk: 0x4a3828 });
    w.particles({ count: 220, box: [30, 6, 30], center: [0, 2, -6], colors: [0xffe2a0, 0xfff0c8], size: 0.06, opacity: 1, vel: [0.4, 0.05, 0], wobble: 0.3, additive: true, twinkle: 0.6 });
    w.camera({ pos: [0, g.heightAt(0, 10) + 1.5, 10], look: [0, 2, -60], drift: 0.15 });
  },
});
