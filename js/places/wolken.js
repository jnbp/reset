ResetWorld.define({
  id: 'wolken',
  name: { de: 'Über den Wolken', en: 'Above the Clouds' },
  hint: { de: 'Langsam durch weiche Wolken gleiten', en: 'Gliding slowly through soft clouds' },
  sound: 'sky',
  ui: 'light',
  swatch: ['#3d82d6', '#8cc0ef', '#ffffff'],
  themeColor: '#8cc0ef',
  facts: {
    de: [
      'Eine durchschnittliche Haufenwolke wiegt rund 500 Tonnen.',
      'Wolken bestehen nicht aus Dampf, sondern aus winzigen Wassertröpfchen oder Eiskristallen.',
      'Eine Gewitterwolke kann über 15 Kilometer hoch werden.',
      'Wolken wirken weiß, weil ihre Tröpfchen alle Farben des Lichts gleich stark streuen.',
    ],
    en: [
      'An average cumulus cloud weighs around 500 tonnes.',
      'Clouds aren’t made of steam but of tiny water droplets or ice crystals.',
      'A thundercloud can tower more than 15 kilometres high.',
      'Clouds look white because their droplets scatter all colours of light equally.',
    ],
  },
  build(w) {
    const golden = w.chance(0.35);
    const sky = golden ? { top: 0x5a6fb0, mid: 0xf2b8a0, bottom: 0xffdcc0 } : { top: 0x3d82d6, mid: 0x8cc0ef, bottom: 0xcfe6fa };
    w.sky(sky);
    w.glow({ pos: [110, 55, -300], color: golden ? 0xffc8a0 : 0xfff8e0, size: 45, glow: 5 });
    w.fog(sky.bottom, 0.0035);
    w.clouds({ count: 170, box: [320, 90, 420], center: [0, -5, -150], size: [25, 65], color: golden ? [0xffffff, 0xffe6da, 0xffd6c6] : [0xffffff, 0xf2f6ff, 0xe8f0fb], opacity: 0.85, drift: [0, 0, 6], fadeNear: 30 });
    w.camera({ pos: [0, 0, 30], look: [0, 0, -100], drift: 1.4, speed: 0.06 });
    return golden ? { themeColor: '#f2b8a0', variant: 'golden' } : { themeColor: '#8cc0ef', variant: 'day' };
  },
});
