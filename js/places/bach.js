ResetWorld.define({
  id: 'bach',
  name: { de: 'Bergbach', en: 'Mountain Stream' },
  hint: { de: 'Klares Wasser zwischen Steinen', en: 'Clear water between the stones' },
  sound: 'stream',
  ui: 'light',
  swatch: ['#8fbfe3', '#d7e9ef', '#3f7f8f'],
  themeColor: '#d7e9ef',
  facts: {
    de: [
      'Fließendes Wasser schleift kantige Steine über Jahrtausende zu runden Kieseln.',
      'Kalte, schnelle Bergbäche enthalten so viel Sauerstoff, dass dort Forellen leben können.',
      'Nur rund 3 Prozent des Wassers auf der Erde sind Süßwasser.',
      'Das Wasser in einem Bach kann vorher jahrzehntelang als Grundwasser durch das Gestein gesickert sein.',
    ],
    en: [
      'Over thousands of years, flowing water grinds sharp stones into smooth pebbles.',
      'Cold, fast mountain streams hold so much oxygen that trout can live in them.',
      'Only about 3 percent of the water on Earth is fresh water.',
      'The water in a stream may have seeped through rock as groundwater for decades before reaching it.',
    ],
  },
  build(w) {
    w.sky({ top: 0x8fbfe3, mid: 0xd7e9ef, bottom: 0xe8f0ea });
    w.fog(0xd9e6dc, 0.02);
    w.lights({ ambient: [0xffffff, 0.55], hemi: [0xe6f2ff, 0x3b5a2e, 0.45], sun: { color: 0xfff1d6, intensity: 0.7, pos: [20, 40, 10] } });
    const center = (z) => Math.sin(z * 0.05) * 4;
    const dist = (x, z) => Math.abs(x - center(z));
    const g = w.terrain({
      size: 240, seg: 120, scale: 0.05, octaves: 3,
      shape: (x, z, n) => { const d = dist(x, z); return -1 + Math.min(Math.max(d - 3, 0), 10) * 0.45 + Math.max(0, d - 13) * 0.15 + n * 1.4 * Math.min(1, d / 8); },
      colorAt: (h) => (h < -0.2 ? 0x7a7466 : h < 1.2 ? 0x6e8f4e : 0x5a8040),
    });
    w.water({ size: 16, sizeZ: 240, seg: 60, y: -0.55, color: 0x4f8f9a, specular: 0xffffff, shininess: 90, waves: [[0, 1, 0.05, 1.2, 3], [1, 0.3, 0.04, 0.8, 4], [-0.5, 1, 0.03, 0.5, 5]], flow: [0, 1.5], opacity: 0.92 });
    w.rocks({ count: 30, x: [-7, 7], z: [-70, 9], scale: [0.3, 0.9], colors: [0x8b8f8c, 0x7a7e7a, 0x9a9a92], heightAt: g.heightAt, sink: 0.45, avoid: (x, z) => dist(x, z) > 4 });
    w.rocks({ count: 30, x: [-20, 20], z: [-70, 9], scale: [0.4, 1.4], colors: [0x8b8f8c, 0x7a7e7a], heightAt: g.heightAt, avoid: (x, z) => dist(x, z) < 4 || dist(x, z) > 9 });
    w.trees({ kind: 'pine', count: 60, x: [-60, 60], z: [-120, 2], scale: [1.2, 2.2], heightAt: g.heightAt, avoid: (x, z) => dist(x, z) < 10, crown: [0x2f5d36, 0x3a6c3e, 0x2a5232] });
    w.trees({ kind: 'round', count: 30, x: [-60, 60], z: [-110, 0], scale: [1, 1.7], heightAt: g.heightAt, avoid: (x, z) => dist(x, z) < 10, crown: [0x5e8f3e, 0x6f9e48] });
    w.grass({ count: 3500, x: [-22, 22], z: [-40, 10], height: 0.5, colors: [0x5c8f3e, 0x6ea048, 0x4e7f36], heightAt: g.heightAt, avoid: (x, z) => dist(x, z) < 5, amp: 0.1 });
    w.clouds({ count: 14, box: [20, 1.5, 120], center: [0, 0.6, -50], size: [6, 12], color: 0xffffff, opacity: 0.18, drift: [0, 0, 0.6] });
    w.camera({ pos: [center(12) - 0.5, 1.3, 12], look: [0, 0.2, -30], drift: 0.15 });
  },
});
