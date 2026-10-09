ResetWorld.define({
  id: 'gipfel',
  name: { de: 'Berggipfel', en: 'Summit' },
  hint: { de: 'Sonnenaufgang über dem Wolkenmeer', en: 'Sunrise above a sea of clouds' },
  sound: 'wind',
  ui: 'light',
  swatch: ['#3c6fb4', '#f6b48e', '#ffe1c2'],
  themeColor: '#f6b48e',
  facts: {
    de: [
      'Mit jedem Kilometer Höhe wird die Luft im Durchschnitt etwa 6,5 Grad kühler.',
      'Der Himalaya hebt sich noch immer, um einige Millimeter pro Jahr.',
      'Auf dem Gipfel des Everest enthält jeder Atemzug nur etwa ein Drittel des Sauerstoffs wie auf Meereshöhe.',
      'Das Gestein am Gipfel des Everest war einmal Meeresboden: Man findet dort Fossilien von Meerestieren.',
    ],
    en: [
      'On average, the air gets about 6.5 degrees cooler with every kilometre of altitude.',
      'The Himalayas are still rising by a few millimetres every year.',
      'On the summit of Everest, each breath holds only about a third of the oxygen it would at sea level.',
      'The rock at the top of Everest was once seabed: fossils of sea creatures are found there.',
    ],
  },
  build(w) {
    w.sky({ top: 0x3c6fb4, mid: 0xf6b48e, bottom: 0xffe1c2 });
    w.glow({ pos: [-210, 22, -380], color: 0xffc890, size: 55, glow: 4.5, coreColor: 0xfff0d0 });
    w.fog(0xf8cfb0, 0.0028);
    w.lights({ ambient: [0xffe0d0, 0.5], sun: { color: 0xffc090, intensity: 1.0, pos: [-200, 40, -300] } });
    const camZ = 60;
    w.terrain({
      size: 760, seg: 150, scale: 0.006, octaves: 5, flat: true,
      shape: (x, z) => {
        const r = 1 - Math.abs(w.fbm(x * 0.006, z * 0.006, 5));
        const d = Math.hypot(x, z - camZ), f = Math.min(1, Math.max(0, (d - 30) / 70));
        return (Math.pow(r, 3) * 100 - 25) * f - 22 * (1 - f);
      },
      colorAt: (h) => (h > 48 ? 0xf4f1ee : h > 26 ? 0x7b6f6a : 0x5a5450),
    });
    w.clouds({ count: 130, box: [640, 8, 520], center: [0, -2, -150], size: [55, 115], color: [0xffffff, 0xffeedd, 0xffe2d0], opacity: 0.9, drift: [2, 0, 0] });
    w.rocks({ count: 9, x: [-9, 9], z: [camZ - 12, camZ - 6], scale: [2, 4], colors: [0x6d625c, 0x7a6e66], heightAt: () => 9.5 });
    w.camera({ pos: [0, 14, camZ], look: [0, 16, -200], drift: 0.25, speed: 0.08 });
  },
});
