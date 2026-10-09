ResetWorld.define({
  id: 'thunderstorm',
  name: { de: 'Gewitter', en: 'Thunderstorm' },
  hint: { de: 'Sicher beobachten, wie es draußen tobt', en: 'Watching the storm from a safe distance' },
  sound: 'storm',
  ui: 'dark',
  swatch: ['#1b2028', '#3a414a', '#c8d4ff'],
  themeColor: '#2c333d',
  facts: {
    de: [
      'Zähl zwischen Blitz und Donner: Je drei Sekunden ist das Gewitter etwa einen Kilometer entfernt.',
      'Auf der Erde toben in jedem Moment rund 2.000 Gewitter gleichzeitig.',
      'Ein Blitz ist nur wenige Zentimeter dick, aber oft mehrere Kilometer lang.',
      'Donner entsteht, weil die Luft im Blitzkanal schlagartig erhitzt wird und sich explosionsartig ausdehnt.',
    ],
    en: [
      'Count between flash and thunder: every three seconds means the storm is about a kilometre away.',
      'At any moment, around 2,000 thunderstorms are happening on Earth.',
      'A lightning bolt is only a few centimetres thick but often several kilometres long.',
      'Thunder happens because the air in a lightning channel heats up in an instant and expands explosively.',
    ],
  },
  build(w) {
    const T = w.THREE;
    w.sky({ top: 0x1b2028, mid: 0x2c333d, bottom: 0x3a414a });
    w.fog(0x2c333d, 0.012);
    w.lights({ ambient: [0x8a96a8, 0.45], hemi: [0x9aa6b8, 0x2a2f26, 0.4] });
    const g = w.terrain({ size: 520, seg: 100, height: 3, scale: 0.01, colorAt: (h, x, z) => (w.noise(x * 0.05, z * 0.05) > 0 ? 0x3d4a33 : 0x45523a) });
    w.grass({ count: 3200, x: [-16, 16], z: [-22, 9], height: 0.6, colors: [0x34452c, 0x3c4e32, 0x2e3e27], heightAt: g.heightAt, amp: 0.35, speed: 2.6 });
    w.trees({ kind: 'round', count: 16, x: [-160, 160], z: [-190, -80], scale: [2, 3], heightAt: g.heightAt, crown: [0x1e2a1c, 0x253322], trunk: 0x1c1712 });
    w.clouds({ count: 75, box: [520, 16, 420], center: [0, 46, -150], size: [60, 120], color: [0x3a4048, 0x2e343b, 0x4a5058], opacity: 0.95, drift: [3, 0, 0] });
    w.rain({ count: 4000, speed: 26, wind: [5, 0], opacity: 0.3 });

    // Lightning: a jagged line plus a flash of light
    const strike = ({ near }) => {
      w.flash(near ? 3.2 : 1.5);
      const pts = [], x0 = w.rand(-110, 110), z0 = near ? w.rand(-70, -50) : w.rand(-180, -120);
      let x = x0, y = 46;
      while (y > g.heightAt(x, z0)) { pts.push(new T.Vector3(x, y, z0)); y -= w.rand(2, 5); x += w.rand(-3, 3); }
      pts.push(new T.Vector3(x, g.heightAt(x, z0), z0));
      const line = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0xeef3ff, transparent: true, opacity: 1, fog: false }));
      w.add(line);
      let life = 0;
      const fade = (dt) => {
        life += dt;
        line.material.opacity = life < 0.25 ? (Math.random() > 0.3 ? 1 : 0.2) : Math.max(0, 1 - (life - 0.25) * 5);
        if (life > 0.5 && line.parent) { line.parent.remove(line); line.geometry.dispose(); line.material.dispose(); }
      };
      w.onFrame(fade);
    };
    w.on('lightning', strike);
    // Without sound, lightning still strikes now and then
    w.every(14000, 30000, () => { if (!w.soundLive()) strike({ near: w.chance(0.4) }); }, 5000);
    w.camera({ pos: [0, g.heightAt(0, 10) + 1.7, 10], look: [0, 6, -100], drift: 0.15 });
  },
});
