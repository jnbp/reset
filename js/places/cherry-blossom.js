ResetWorld.define({
  id: 'cherry-blossom',
  name: { de: 'Kirschblüte', en: 'Cherry Blossom' },
  hint: { de: 'Blütenblätter über einem stillen Teich', en: 'Petals drifting over a still pond' },
  sound: 'garden',
  ui: 'light',
  swatch: ['#a9c8ec', '#f6dbe3', '#eea5bd'],
  themeColor: '#f6dbe3',
  facts: {
    de: [
      'In Japan gibt es jedes Frühjahr eine eigene Vorhersage, wann die Kirschbäume blühen.',
      'Eine Kirschblüte hält oft nur etwa eine Woche.',
      'Das Feiern unter blühenden Kirschbäumen heißt Hanami und ist über tausend Jahre alt.',
      'In Japan wandert die Kirschblüte über mehrere Wochen vom Süden in den Norden.',
    ],
    en: [
      'Every spring, Japan publishes a forecast for when the cherry trees will bloom.',
      'A cherry blossom often lasts only about a week.',
      'Celebrating under blooming cherry trees is called hanami, a tradition over a thousand years old.',
      'In Japan, the cherry blossom moves from south to north over several weeks.',
    ],
  },
  build(w) {
    w.sky({ top: 0xa9c8ec, mid: 0xf6dbe3, bottom: 0xfbe9ec });
    w.fog(0xf6e1e6, 0.02);
    w.lights({ ambient: [0xfff0f3, 0.6], hemi: [0xffffff, 0x7a9a6a, 0.45], sun: { color: 0xfff2e6, intensity: 0.6, pos: [20, 30, 20] } });
    const pond = [-3, -14];
    const pd = (x, z) => Math.hypot(x - pond[0], (z - pond[1]) * 1.3);
    const g = w.terrain({ size: 220, seg: 100, height: 1, scale: 0.03, shape: (x, z, n) => n * 0.8 - Math.max(0, 1 - pd(x, z) / 11) * 2.2, colorAt: (h) => (h < -0.5 ? 0x9a9078 : 0x8db870) });
    const water = w.water({ size: 34, seg: 40, y: -0.55, color: 0x7fb6c9, specular: 0xffffff, shininess: 100, waves: [[1, 0.2, 0.02, 2, 1], [0.3, 1, 0.015, 1.4, 1.4]] });
    water.position.x = pond[0]; water.position.z = pond[1];
    w.trees({ kind: 'blossom', count: 22, x: [-42, 42], z: [-60, -2], scale: [1, 1.5], heightAt: g.heightAt, avoid: (x, z) => pd(x, z) < 12, crown: [0xf7c6d4, 0xf3b2c6, 0xfad7e2, 0xeea5bd], trunk: 0x5a4040 });
    w.rocks({ count: 10, x: [-16, 10], z: [-26, -2], scale: [0.3, 0.8], colors: [0x9a9a92, 0x85857e], heightAt: g.heightAt, avoid: (x, z) => pd(x, z) < 10 || pd(x, z) > 14 });
    w.grass({ count: 2500, x: [-18, 18], z: [-25, 9], height: 0.35, colors: [0x86b56a, 0x96c278, 0x7aa95f], heightAt: g.heightAt, avoid: (x, z) => pd(x, z) < 11.5, amp: 0.06 });
    w.particles({ count: 650, box: [40, 15, 40], center: [0, 6, -15], colors: [0xffd1dc, 0xf7b8c9, 0xffffff], size: 0.16, opacity: 0.95, vel: [0.6, -0.7, 0.2], wobble: 0.9, sprite: 'petal' });
    w.camera({ pos: [0, g.heightAt(0, 10) + 1.6, 10], look: [-2, 1, -20], drift: 0.15 });
  },
});
