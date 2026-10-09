ResetWorld.define({
  id: 'sommernacht',
  name: { de: 'Sommernacht', en: 'Summer Night' },
  hint: { de: 'Glühwürmchen über der Wiese', en: 'Fireflies over the meadow' },
  sound: 'night',
  ui: 'dark',
  swatch: ['#040818', '#1d2c52', '#d8ff6a'],
  themeColor: '#0e1a3a',
  facts: {
    de: [
      'Glühwürmchen erzeugen ihr Licht fast ganz ohne Wärme.',
      'Am Zirpen der Grillen lässt sich ungefähr die Temperatur ablesen: Je wärmer, desto schneller.',
      'Glühwürmchen blinken in Mustern, an denen sie Partner ihrer eigenen Art erkennen.',
      'In einer klaren, dunklen Nacht kannst du mit bloßem Auge einige Tausend Sterne sehen.',
    ],
    en: [
      'Fireflies make their light with almost no heat at all.',
      'You can roughly tell the temperature from crickets: the warmer it is, the faster they chirp.',
      'Fireflies flash in patterns that help them recognise partners of their own species.',
      'On a clear, dark night you can see a few thousand stars with the naked eye.',
    ],
  },
  build(w) {
    w.sky({ top: 0x040818, mid: 0x0e1a3a, bottom: 0x1d2c52 });
    w.stars({ count: 3200 });
    w.glow({ pos: [-80, 60, -250], color: 0xf3f0d8, size: 22, glow: 6 });
    w.fog(0x101c3a, 0.02);
    w.lights({ ambient: [0x40507a, 0.55], sun: { color: 0xbcc8ff, intensity: 0.5, pos: [-80, 60, -250] } });
    const g = w.terrain({ size: 260, seg: 90, height: 1.5, scale: 0.02, color: 0x1f3326 });
    w.grass({ count: 6500, x: [-24, 24], z: [-35, 10], height: 0.7, colors: [0x2c4a33, 0x335539, 0x27422d], heightAt: g.heightAt, amp: 0.12, speed: 1.2 });
    w.trees({ kind: 'round', count: 26, x: [-110, 110], z: [-130, -45], scale: [1.6, 2.8], heightAt: g.heightAt, crown: [0x0d1520, 0x101b26], trunk: 0x0b0f14 });
    w.trees({ kind: 'round', count: 1, x: [10, 14], z: [-20, -16], scale: [2.6, 2.8], heightAt: g.heightAt, crown: [0x111c28], trunk: 0x0b0f14 });
    w.particles({ count: 170, box: [40, 3, 40], center: [0, 1.3, -10], colors: [0xd8ff6a, 0xfff38a], size: 0.2, opacity: 1, vel: [0.1, 0.05, 0], wobble: 0.5, additive: true, twinkle: 1.3 });
    w.camera({ pos: [0, g.heightAt(0, 10) + 1.4, 10], look: [0, 2, -40], drift: 0.15 });
  },
});
