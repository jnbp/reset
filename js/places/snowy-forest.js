ResetWorld.define({
  id: 'snowy-forest',
  name: { de: 'Schneewald', en: 'Snowy Forest' },
  hint: { de: 'Leiser Schneefall, gedämpfte Welt', en: 'Quiet snowfall, a muffled world' },
  sound: 'snow',
  ui: 'light',
  swatch: ['#b9c8d8', '#eef2f6', '#5d7a6e'],
  themeColor: '#dfe6ee',
  facts: {
    de: [
      'Frischer Schnee schluckt Schall, darum wirkt eine verschneite Landschaft so still.',
      'Schneeflocken sind fast immer sechseckig, weil Wassermoleküle beim Gefrieren so zusammenpassen.',
      'Keine zwei Schneeflocken sind exakt gleich, weil jede ihren eigenen Weg durch die Wolke nimmt.',
      'Eine Schneeflocke kann bis zu einer Stunde brauchen, bis sie von der Wolke den Boden erreicht.',
    ],
    en: [
      'Fresh snow absorbs sound, which is why a snowy landscape feels so quiet.',
      'Snowflakes are almost always six-sided, because that is how water molecules fit together when they freeze.',
      'No two snowflakes are exactly alike, because each takes its own path through the cloud.',
      'A snowflake can take up to an hour to fall from the cloud to the ground.',
    ],
  },
  build(w) {
    const T = w.THREE;
    const blue = w.chance(0.35);
    if (blue) {
      w.sky({ top: 0x1a2846, mid: 0x3a4f78, bottom: 0x6a7fa5 });
      w.fog(0x4a5f88, 0.03);
      w.lights({ ambient: [0x8aa0d0, 0.6], hemi: [0xa8b8e0, 0x2a3550, 0.4] });
    } else {
      w.sky({ top: 0xb9c8d8, mid: 0xdfe6ee, bottom: 0xeef2f6 });
      w.fog(0xe6ebf1, 0.03);
      w.lights({ ambient: [0xffffff, 0.7], hemi: [0xffffff, 0xb0c0d0, 0.4] });
    }
    const g = w.terrain({ size: 220, seg: 90, height: 3, scale: 0.02, color: 0xf4f7fb });
    w.trees({ kind: 'pine', count: 95, x: [-70, 70], z: [-100, -5], scale: [1.2, 2.4], heightAt: g.heightAt, avoid: (x) => Math.abs(x) < 3, crown: [0x5d7a6e, 0x6f8c80, 0xdfe8ee, 0xc9d8de], trunk: 0x4a3a30 });
    if (blue) {
      // a small hut with warm light in the window
      const hx = 11, hz = -24, hy = g.heightAt(hx, hz);
      const hut = new T.Mesh(new T.BoxGeometry(4, 2.6, 3.2), new T.MeshPhongMaterial({ specular: 0x000000, shininess: 0, color: 0x4a3426, flatShading: true }));
      hut.position.set(hx, hy + 1.3, hz); hut.rotation.y = -0.4;
      const roof = new T.Mesh(new T.ConeGeometry(3.4, 1.8, 4), new T.MeshPhongMaterial({ specular: 0x000000, shininess: 0, color: 0xeef2f6, flatShading: true }));
      roof.position.set(hx, hy + 3.4, hz); roof.rotation.y = -0.4 + Math.PI / 4;
      w.add(hut, roof);
      w.glow({ pos: [hx - 1.6, hy + 1.4, hz + 1.9], color: 0xffb56b, size: 0.9, glow: 5, core: 0.9, coreColor: 0xffd9a0 });
      const lamp = new T.PointLight(0xffa860, 1.2, 14, 2); lamp.position.set(hx - 1.6, hy + 1.4, hz + 2.5); w.add(lamp);
    }
    w.particles({ count: 2600, box: [50, 30, 50], center: [0, 10, -5], color: 0xffffff, size: 0.12, opacity: 0.9, vel: [0.3, -1.2, 0], wobble: 0.8, sprite: 'flake', follow: true });
    w.camera({ pos: [0, g.heightAt(0, 10) + 1.7, 10], look: [0, 2, -40], drift: 0.15 });
    return blue ? { ui: 'dark', themeColor: '#3a4f78', variant: 'blue-hour' } : { ui: 'light', themeColor: '#dfe6ee', variant: 'day' };
  },
});
