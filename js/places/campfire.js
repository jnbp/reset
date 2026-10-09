ResetWorld.define({
  id: 'campfire',
  name: { de: 'Lagerfeuer', en: 'Campfire' },
  hint: { de: 'Glut und Funken unter dem Sternenhimmel', en: 'Embers and sparks under the stars' },
  sound: 'fire',
  ui: 'dark',
  swatch: ['#05070f', '#3a1a0c', '#ff8a3a'],
  themeColor: '#0a1120',
  facts: {
    de: [
      'Menschen nutzen Feuer seit mindestens rund einer Million Jahren.',
      'Ein Feuer knistert, wenn Wasser und Harz im Holz verdampfen und dabei winzige Zellen aufplatzen.',
      'Die Farbe einer Flamme verrät ihre Temperatur: Gelb und Orange sind kühler als Blau.',
      'Die Wärme eines Feuers spürst du vor allem als Infrarotstrahlung, ganz ähnlich wie Sonnenlicht.',
    ],
    en: [
      'Humans have been using fire for at least around a million years.',
      'A fire crackles when water and resin in the wood turn to steam and burst tiny cells open.',
      'A flame’s colour reveals its temperature: yellow and orange are cooler than blue.',
      'You feel a fire’s warmth mostly as infrared radiation, much like sunlight.',
    ],
  },
  build(w) {
    const T = w.THREE;
    w.sky({ top: 0x02040c, mid: 0x0a1424, bottom: 0x111a2a });
    w.stars({ count: 3000 });
    w.glow({ pos: [160, 110, -300], color: 0xcfdcff, size: 20, glow: 5, core: 0.9 });
    w.fog(0x0a1120, 0.03);
    w.lights({ ambient: [0x334466, 0.35] });
    const fireLight = new T.PointLight(0xff8a3a, 2.2, 30, 1.6);
    fireLight.position.set(0, 1, 0);
    w.add(fireLight);
    w.onFrame((dt, t) => { fireLight.intensity = 1.9 + Math.sin(t * 13) * 0.15 + Math.sin(t * 7.3) * 0.2 + w.noise(t * 2, 0) * 0.3; });

    const g = w.terrain({ size: 200, seg: 70, height: 1.2, scale: 0.04, shape: (x, z, n) => n * 1.2 * Math.min(1, Math.hypot(x, z) / 10), color: 0x2a2a22 });
    // Stone ring and logs
    const stone = new T.MeshPhongMaterial({ specular: 0x000000, shininess: 0, color: 0x5b5550, flatShading: true });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, m = new T.Mesh(new T.DodecahedronGeometry(w.rand(0.22, 0.32), 0), stone);
      m.position.set(Math.cos(a) * 1.25, 0.1, Math.sin(a) * 1.25); m.rotation.set(w.rand(0, 3), w.rand(0, 3), 0); m.scale.y = 0.7;
      w.add(m);
    }
    const wood = new T.MeshPhongMaterial({ specular: 0x000000, shininess: 0, color: 0x4a3020, flatShading: true });
    // Logs lie on the ground in a star shape
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      const log = new T.Mesh(new T.CylinderGeometry(0.09, 0.11, 1.3, 6), wood);
      log.position.set(Math.cos(a) * 0.45, 0.1, Math.sin(a) * 0.45);
      log.rotation.set(0, -a, Math.PI / 2);
      w.add(log);
    }
    w.add(new T.Mesh(new T.CircleGeometry(0.55, 16).rotateX(-Math.PI / 2).translate(0, 0.03, 0), new T.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: 0.55 })));
    // Flames and sparks: particles with a lifetime
    const makeFire = (count, size, life, speed, sparks) => {
      count = w.n(count);
      const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
      const age = new Float32Array(count), max = new Float32Array(count), vy = new Float32Array(count), vx = new Float32Array(count), vz = new Float32Array(count);
      const reset = (i) => {
        const a = w.rand(0, Math.PI * 2), r = sparks ? w.rand(0, 0.3) : Math.pow(Math.random(), 0.7) * 0.5;
        pos.set([Math.cos(a) * r, 0.2, Math.sin(a) * r], i * 3);
        age[i] = 0; max[i] = w.rand(life[0], life[1]); vy[i] = w.rand(speed[0], speed[1]);
        vx[i] = w.rand(-0.15, 0.15); vz[i] = w.rand(-0.15, 0.15);
      };
      for (let i = 0; i < count; i++) { reset(i); age[i] = w.rand(0, max[i]); }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      geo.setAttribute('color', new T.BufferAttribute(col, 3));
      const tex = new T.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c; })());
      const pts = new T.Points(geo, new T.PointsMaterial({ size, map: tex, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      w.add(pts);
      w.onFrame((dt, t) => {
        for (let i = 0; i < count; i++) {
          age[i] += dt;
          if (age[i] > max[i]) reset(i);
          const k = i * 3, f = age[i] / max[i];
          pos[k] += (vx[i] + (sparks ? Math.sin(t * 3 + i) * 0.3 : -pos[k] * 0.8)) * dt;
          pos[k + 1] += vy[i] * dt;
          pos[k + 2] += (vz[i] + (sparks ? Math.cos(t * 2.6 + i) * 0.3 : -pos[k + 2] * 0.8)) * dt;
          const fade = Math.pow(1 - f, sparks ? 1 : 1.6) * (sparks ? 1 : 0.6);
          col[k] = 1 * fade; col[k + 1] = (sparks ? 0.55 : 0.85 - f * 0.65) * fade; col[k + 2] = (sparks ? 0.15 : 0.35 - f * 0.33) * fade;
        }
        geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      });
    };
    makeFire(200, 0.6, [0.5, 1.1], [1.0, 2.0], false);
    makeFire(70, 0.07, [1.5, 3.5], [1.2, 2.6], true);

    w.trees({ count: 70, x: [-45, 45], z: [-45, 12], scale: [1.4, 2.6], heightAt: g.heightAt, crown: [0x0f1a18, 0x132220, 0x0c1513], trunk: 0x16110c, avoid: (x, z) => Math.hypot(x, z) < 11 || (z > 2 && Math.abs(x) < 14) });
    // Fire sits in the lower third so the text stays clear
    w.camera({ pos: [0, 1.7, 6.5], look: [0, 2.7, 0], drift: 0.08, speed: 0.1 });
  },
});
