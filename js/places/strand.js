ResetWorld.define({
  id: 'strand',
  name: { de: 'Strand', en: 'Beach' },
  hint: { de: 'Wellen, Sand und weiter Horizont', en: 'Waves, sand and an open horizon' },
  sound: 'ocean',
  ui: 'dark',
  swatch: ['#2b3a6b', '#e8826a', '#ffc98a'],
  themeColor: '#e8826a',
  facts: {
    de: [
      'Wellen können Tausende Kilometer über den Ozean reisen, bevor sie an einem Strand brechen.',
      'Der Himmel färbt sich abends rot, weil das Sonnenlicht dann einen besonders langen Weg durch die Luft nimmt.',
      'Ein Teil des weißen Sands an tropischen Stränden stammt von Papageifischen, die Korallen knabbern.',
      'Das Meer bedeckt rund 71 Prozent der Erdoberfläche.',
    ],
    en: [
      'Ocean swells can travel thousands of kilometres before they break on a beach.',
      'Evening skies turn red because sunlight then takes an especially long path through the air.',
      'Some of the white sand on tropical beaches comes from parrotfish nibbling on coral.',
      'The ocean covers about 71 percent of the Earth’s surface.',
    ],
  },
  build(w) {
    const sunset = w.chance(0.65);
    if (sunset) {
      w.sky({ top: 0x283a6b, mid: 0xe8826a, bottom: 0xffc98a });
      w.glow({ pos: [0, 16, -400], color: 0xffa860, size: 60, glow: 4, coreColor: 0xffe2b0 });
      w.fog(0xf0a07a, 0.0042);
      w.lights({ ambient: [0xffd0b0, 0.45], sun: { color: 0xffa060, intensity: 0.9, pos: [0, 8, -100] } });
    } else {
      w.sky({ top: 0x3f7fd0, mid: 0x8fc3ec, bottom: 0xd8ecf7 });
      w.glow({ pos: [140, 210, -380], color: 0xfff6dd, size: 38, glow: 4 });
      w.fog(0xcfe4f2, 0.0032);
      w.lights({ ambient: [0xffffff, 0.6], sun: { color: 0xffffff, intensity: 0.8, pos: [60, 100, -80] } });
    }
    w.water({ size: 820, seg: 110, y: 0, color: sunset ? 0x5a6f9a : 0x2a86b8, emissive: sunset ? 0x3a2430 : 0x0a2a40, specular: sunset ? 0xffc59a : 0xffffff, shininess: 60 });
    const sand = w.terrain({
      size: 220, seg: 90, height: 0.3, scale: 0.08,
      shape: (x, z, n) => -0.6 + Math.max(0, z - 4) * 0.13 + n * 0.25,
      colorAt: (h) => (h < 0.25 ? 0xb89a74 : 0xe6cfa4),
    });
    const palms = { kind: 'palm', heightAt: sand.heightAt, crown: [0x2d5a2a, 0x3b6b30, 0x2a4f26], trunk: 0x8a6a48, scale: [0.9, 1.2] };
    w.trees({ ...palms, count: 2, x: [-15, -9], z: [9, 14] });
    w.trees({ ...palms, count: 2, x: [9, 16], z: [10, 15] });
    w.rocks({ count: 8, x: [-20, 20], z: [5, 12], scale: [0.2, 0.6], colors: [0x8a7c6c, 0x6e655a], heightAt: sand.heightAt });
    w.camera({ pos: [0, sand.heightAt(0, 17) + 1.7, 17], look: [0, 3, -100], drift: 0.2 });
    return sunset ? { ui: 'dark', themeColor: '#e8826a', variant: 'sunset' } : { ui: 'light', themeColor: '#8fc3ec', variant: 'day' };
  },
});
