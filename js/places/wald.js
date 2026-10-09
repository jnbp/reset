ResetWorld.define({
  id: 'wald',
  name: { de: 'Wald am Morgen', en: 'Morning Forest' },
  hint: { de: 'Sonnenstrahlen zwischen den Bäumen', en: 'Sunbeams between the trees' },
  sound: 'forest',
  ui: 'light',
  swatch: ['#9cc6e6', '#f3e2c0', '#5f8f45'],
  themeColor: '#f3e2c0',
  facts: {
    de: [
      'Bäume können über ihre Wurzeln und feine Pilzgeflechte Nährstoffe miteinander austauschen.',
      'Waldluft enthält Duftstoffe der Bäume, sogenannte Terpene.',
      'Die ältesten Bäume der Erde sind fast 5.000 Jahre alt.',
      'Ein großer Laubbaum kann an einem Sommertag mehrere Hundert Liter Wasser verdunsten.',
    ],
    en: [
      'Trees can share nutrients through their roots and fine networks of fungi.',
      'Forest air is full of scent compounds released by trees, called terpenes.',
      'The oldest trees on Earth are almost 5,000 years old.',
      'A large broadleaf tree can release several hundred litres of water on a summer day.',
    ],
  },
  build(w) {
    w.sky({ top: 0x9cc6e6, mid: 0xf3e2c0, bottom: 0xf7d9a8 });
    w.fog(0xe9d9b8, 0.022);
    w.lights({ ambient: [0xfff2d8, 0.55], hemi: [0xfff4dd, 0x3d5a2e, 0.45], sun: { color: 0xffd89a, intensity: 0.8, pos: [-30, 20, -40] } });
    const g = w.terrain({ size: 220, seg: 90, height: 1.6, scale: 0.04, colorAt: (h, x, z) => (w.noise(x * 0.1, z * 0.1) > 0 ? 0x5c8a42 : 0x6a9a4b) });
    const path = (x) => Math.abs(x) < 2.8;
    w.trees({ kind: 'pine', count: 60, x: [-50, 50], z: [-90, -6], scale: [1.2, 2.2], heightAt: g.heightAt, avoid: path, crown: [0x2f5d36, 0x3a6c3e, 0x2a5232] });
    w.trees({ kind: 'round', count: 45, x: [-50, 50], z: [-80, -6], scale: [1.1, 1.8], heightAt: g.heightAt, avoid: path, crown: [0x5e8f3e, 0x6f9e48, 0x4f7d36], trunk: 0x5a4532 });
    w.grass({ count: 4500, x: [-18, 18], z: [-25, 9], height: 0.45, colors: [0x5c8f3e, 0x6ea048, 0x4e7f36], heightAt: g.heightAt, amp: 0.08 });
    w.particles({ count: 420, box: [30, 10, 30], center: [0, 3, -8], colors: [0xffe2a0, 0xfff0c8], size: 0.08, opacity: 1, vel: [0.2, 0.05, 0], wobble: 0.3, additive: true, twinkle: 0.7 });
    w.rays({ count: 10, x: [-22, 22], z: [-45, -10], top: 30, length: 48, color: 0xfff1c4, opacity: 0.07, tilt: [0.35, 0.1] });
    w.camera({ pos: [0, g.heightAt(0, 10) + 1.7, 10], look: [0, 2.5, -30], drift: 0.18 });
  },
});
