ResetWorld.define({
  id: 'regenwald',
  name: { de: 'Regenwald', en: 'Rainforest' },
  hint: { de: 'Warmer Regen im dichten Grün', en: 'Warm rain in deep green' },
  sound: 'jungle',
  ui: 'dark',
  swatch: ['#1b3325', '#2f5a3a', '#7fb07a'],
  themeColor: '#2a4535',
  facts: {
    de: [
      'Regenwälder bedecken nur rund 6 Prozent der Landfläche, beherbergen aber mehr als die Hälfte aller Tier- und Pflanzenarten.',
      'Ein Regentropfen kann im Regenwald bis zu zehn Minuten brauchen, bis er vom Blätterdach den Boden erreicht.',
      'Der Amazonas-Regenwald erzeugt einen großen Teil seines Regens selbst, weil die Bäume so viel Wasser verdunsten.',
      'Auf einem einzigen Baum im Regenwald können Hunderte Insektenarten leben.',
    ],
    en: [
      'Rainforests cover only about 6 percent of the land but are home to more than half of all plant and animal species.',
      'In a rainforest, a raindrop can take up to ten minutes to travel from the canopy to the ground.',
      'The Amazon rainforest makes much of its own rain, because its trees release so much water.',
      'Hundreds of insect species can live on a single rainforest tree.',
    ],
  },
  build(w) {
    w.sky({ top: 0x3b5446, mid: 0x4c6a55, bottom: 0x5f7d66 });
    w.fog(0x2f4b3a, 0.034);
    w.lights({ ambient: [0xb8d8c0, 0.5], hemi: [0xcfe8d0, 0x1d2e22, 0.5] });
    const g = w.terrain({ size: 200, seg: 80, height: 1.5, scale: 0.05, colorAt: (h) => (h > 0.3 ? 0x2f4d2c : 0x26402a) });
    w.trees({ kind: 'round', count: 130, x: [-55, 55], z: [-80, -5], scale: [1.4, 2.6], heightAt: g.heightAt, crown: [0x1f4a26, 0x2a5d2f, 0x174020, 0x356b35], trunk: 0x3d2e22, avoid: (x, z) => Math.abs(x) < 2.5 && z > -25 });
    w.trees({ kind: 'palm', count: 18, x: [-30, 30], z: [-40, -6], scale: [1.1, 1.6], heightAt: g.heightAt, crown: [0x2b6030, 0x23502a], trunk: 0x4a3a2a, avoid: (x) => Math.abs(x) < 3 });
    w.grass({ count: 1600, x: [-14, 14], z: [-18, 7], height: 1.2, width: 0.35, colors: [0x2f6a35, 0x3c7c3c, 0x285c2e], heightAt: g.heightAt, amp: 0.08, speed: 1.2, tilt: 0.5 });
    w.rain({ count: 3500, speed: 18, color: 0xcfe3d6, opacity: 0.22, wind: [0.5, 0] });
    w.clouds({ count: 26, box: [100, 6, 80], center: [0, 3, -30], size: [15, 30], color: 0xd8eadf, opacity: 0.22, drift: [0.5, 0, 0] });
    w.rays({ count: 7, x: [-20, 20], z: [-40, -12], top: 30, length: 45, color: 0xd9f2c8, opacity: 0.05 });
    w.camera({ pos: [0, g.heightAt(0, 8) + 1.7, 8], look: [0, 3, -30], drift: 0.15 });
  },
});
