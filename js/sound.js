/* Reset – Klanglandschaften
 * Alle Sounds werden live im Browser mit der Web Audio API erzeugt (keine Audiodateien).
 * Neue Klangwelt hinzufügen:  ResetSound.define('id', { level, send, build(s) { ... } })
 * Innerhalb von build() stehen die Helfer der Klasse Scene zur Verfügung (noise, filter, walk, loop, …).
 */
(function (global) {
  'use strict';

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  let ctx = null, comp, master, reverb, analyser;
  const buffers = {};
  const defs = {};
  let current = null;
  let volume = 0.8;
  let muted = false;
  const listeners = {};
  const emit = (name, data) => (listeners[name] || []).forEach((fn) => fn(data));

  /* ---------- Grundbausteine ---------- */

  // Nahtlos loopbarer Stereo-Rauschpuffer (white / pink / brown)
  function makeNoise(type, seconds) {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * seconds);
    const xf = Math.floor(sr * 0.25); // Überblendung am Loop-Punkt
    const buf = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const raw = new Float32Array(len + xf);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
      for (let i = 0; i < raw.length; i++) {
        const w = Math.random() * 2 - 1;
        if (type === 'white') raw[i] = w * 0.5;
        else if (type === 'pink') {
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
          b2 = 0.969 * b2 + w * 0.153852;    b3 = 0.8665 * b3 + w * 0.3104856;
          b4 = 0.55 * b4 + w * 0.5329522;    b5 = -0.7616 * b5 - w * 0.016898;
          raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
          b6 = w * 0.115926;
        } else { // brown
          last = (last + 0.02 * w) / 1.02;
          raw[i] = last * 3.5;
        }
      }
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) data[i] = raw[i];
      for (let i = 0; i < xf; i++) { const t = i / xf; data[i] = raw[i] * t + raw[len + i] * (1 - t); }
    }
    return buf;
  }

  // Künstlicher Hallraum
  function makeImpulse(seconds, decay) {
    const sr = ctx.sampleRate, len = Math.floor(sr * seconds);
    const buf = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function ensure() {
    if (ctx) return ctx;
    const AC = global.AudioContext || global.webkitAudioContext;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 14; comp.ratio.value = 3;
    comp.attack.value = 0.01; comp.release.value = 0.4;
    master = ctx.createGain(); master.gain.value = muted ? 0 : volume;
    analyser = ctx.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.85;
    reverb = ctx.createConvolver(); reverb.buffer = makeImpulse(4, 2.4);
    reverb.connect(comp);
    comp.connect(master); master.connect(analyser); analyser.connect(ctx.destination);
    buffers.white = makeNoise('white', 5);
    buffers.pink = makeNoise('pink', 7);
    buffers.brown = makeNoise('brown', 9);
    return ctx;
  }

  /* ---------- Szene: Container für eine laufende Klangwelt ---------- */

  class Scene {
    constructor(send) {
      this.bus = ctx.createGain(); this.bus.gain.value = 0;
      const dry = ctx.createGain(), wet = ctx.createGain();
      wet.gain.value = send;
      this.bus.connect(dry); this.bus.connect(wet);
      dry.connect(comp); wet.connect(reverb);
      this.sources = []; this.timers = new Set(); this.alive = true;
    }
    get now() { return ctx.currentTime; }
    noise(type, rate = 1) {
      const s = ctx.createBufferSource();
      s.buffer = buffers[type]; s.loop = true; s.playbackRate.value = rate;
      s.start(0, Math.random() * s.buffer.duration);
      this.sources.push(s); return s;
    }
    osc(type, freq, detune = 0) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; o.detune.value = detune;
      o.start(); this.sources.push(o); return o;
    }
    filter(type, freq, Q = 0.707) {
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = Q; return f;
    }
    gain(v = 1) { const g = ctx.createGain(); g.gain.value = v; return g; }
    pan(v = 0) { const p = ctx.createStereoPanner(); p.pan.value = v; return p; }
    // verbindet Knoten der Reihe nach; letzter Knoten ohne Ziel geht auf den Szenen-Bus
    chain(...nodes) {
      for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
      return nodes[nodes.length - 1];
    }
    out(...nodes) { this.chain(...nodes).connect(this.bus); return nodes[nodes.length - 1]; }
    after(ms, fn) {
      const id = setTimeout(() => { this.timers.delete(id); if (this.alive) fn(); }, ms);
      this.timers.add(id);
    }
    // wiederkehrendes Ereignis in zufälligen Abständen
    loop(minMs, maxMs, fn, firstMs) {
      const tick = () => { fn(); this.after(rand(minMs, maxMs), tick); };
      this.after(firstMs != null ? firstMs : rand(minMs, maxMs), tick);
    }
    // Parameter wandert langsam und organisch zwischen min und max
    walk(param, min, max, minMs, maxMs) {
      param.value = rand(min, max);
      this.loop(minMs, maxMs, () => {
        param.setTargetAtTime(rand(min, max), ctx.currentTime, rand(minMs, maxMs) / 3000);
      });
    }
    // kurzer Rauschimpuls (Tropfen, Knacken, Donner …); nodes = Kette bis zum Bus
    burst(type, dur, nodes, at = 0) {
      const s = ctx.createBufferSource(); s.buffer = buffers[type];
      const t = ctx.currentTime + at;
      this.chain(s, ...nodes).connect(this.bus);
      s.start(t, Math.random() * (s.buffer.duration - dur - 0.1), dur + 0.05);
      s.onended = () => { s.disconnect(); nodes.forEach((n) => n.disconnect()); };
      return t;
    }
    // kurzer Ton mit Hüllkurve; shape(freqParam, t) setzt Tonhöhenverlauf
    tone(type, dur, nodes, shape, at = 0) {
      const o = ctx.createOscillator(); o.type = type;
      const t = ctx.currentTime + at;
      shape(o.frequency, t, o);
      this.chain(o, ...nodes).connect(this.bus);
      o.start(t); o.stop(t + dur + 0.05);
      o.onended = () => { o.disconnect(); nodes.forEach((n) => n.disconnect()); };
      return t;
    }
    envGain(t, attack, peak, decay) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
      return g;
    }
    fadeIn(level, sec) { this.bus.gain.setTargetAtTime(level, ctx.currentTime, sec / 4); }
    stop(sec) {
      this.alive = false;
      this.timers.forEach(clearTimeout); this.timers.clear();
      this.bus.gain.cancelScheduledValues(ctx.currentTime);
      this.bus.gain.setTargetAtTime(0, ctx.currentTime, sec / 4);
      setTimeout(() => {
        this.sources.forEach((s) => { try { s.stop(); } catch (e) {} s.disconnect(); });
        this.bus.disconnect();
      }, sec * 1000 + 600);
    }
  }

  /* ---------- Wiederverwendbare Schichten ---------- */

  const layers = {
    rain(s, amount = 1) {
      const lp = s.filter('lowpass', 6500);
      const g = s.gain(0.3 * amount);
      s.out(s.noise('pink'), s.filter('highpass', 450), lp, g);
      s.walk(lp.frequency, 5000, 8000, 2000, 5000);
      s.walk(g.gain, 0.24 * amount, 0.38 * amount, 3000, 7000);
      s.out(s.noise('brown'), s.filter('lowpass', 260), s.gain(0.22 * amount));
      // einzelne Tropfen
      s.loop(12 / amount, 55 / amount, () => {
        const t = s.now;
        s.burst('white', 0.03, [
          s.filter('bandpass', rand(2200, 7500), rand(2, 7)),
          s.envGain(t, 0.002, Math.pow(Math.random(), 2) * 0.35 + 0.02, rand(0.02, 0.05)),
          s.pan(rand(-1, 1)),
        ]);
      }, 0);
      // Tropfen in Pfützen
      s.loop(250, 1300, () => {
        const t = s.now, f = rand(1400, 3200);
        s.tone('sine', 0.12, [s.envGain(t, 0.003, rand(0.02, 0.06), rand(0.05, 0.1)), s.pan(rand(-0.8, 0.8))],
          (fr, tt) => { fr.setValueAtTime(f, tt); fr.exponentialRampToValueAtTime(f * 1.6, tt + 0.06); });
      });
    },
    wind(s, amount = 1, low = 250, high = 800) {
      [-0.5, 0.5].forEach((p) => {
        const bp = s.filter('bandpass', 500, 1.1);
        const g = s.gain(0.2);
        s.out(s.noise('pink'), bp, g, s.pan(p));
        s.walk(bp.frequency, low, high, 1500, 4500);
        s.walk(bp.Q, 0.7, 1.8, 3000, 6000);
        s.walk(g.gain, 0.08 * amount, 0.5 * amount, 1500, 5000);
      });
    },
    birds(s, density = 1, spread = 1) {
      const sing = () => {
        const species = pick(['chirp', 'chirp', 'whistle', 'trill', 'warble']);
        const dist = Math.random();
        const vol = (0.025 + (1 - dist) * 0.07) * spread;
        const lpf = 9000 - dist * 5000;
        const panv = rand(-0.9, 0.9);
        let at = 0;
        if (species === 'chirp') {
          const n = Math.floor(rand(3, 7)), f0 = rand(3000, 4600);
          for (let i = 0; i < n; i++) {
            const d = rand(0.05, 0.1);
            s.tone('sine', d, [s.envGain(s.now + at, 0.01, vol, d), s.filter('lowpass', lpf), s.pan(panv)],
              (fr, t) => { fr.setValueAtTime(f0 * rand(0.95, 1.05), t); fr.exponentialRampToValueAtTime(f0 * rand(1.2, 1.45), t + d); }, at);
            at += d + rand(0.04, 0.09);
          }
        } else if (species === 'whistle') {
          const n = Math.floor(rand(2, 5));
          for (let i = 0; i < n; i++) {
            const d = rand(0.18, 0.4), f = rand(1700, 2900), f2 = f * rand(0.8, 1.3);
            s.tone('sine', d, [s.envGain(s.now + at, 0.04, vol * 1.2, d), s.filter('lowpass', lpf), s.pan(panv)],
              (fr, t) => { fr.setValueAtTime(f, t); fr.exponentialRampToValueAtTime(f2, t + d * 0.8); }, at);
            at += d + rand(0.06, 0.2);
          }
        } else if (species === 'trill') {
          const n = Math.floor(rand(10, 22)), f0 = rand(4800, 6200);
          for (let i = 0; i < n; i++) {
            s.tone('sine', 0.03, [s.envGain(s.now + at, 0.004, vol * 0.7, 0.03), s.filter('lowpass', lpf), s.pan(panv)],
              (fr, t) => { fr.setValueAtTime(f0, t); fr.linearRampToValueAtTime(f0 * 0.85, t + 0.03); }, at);
            at += 0.045;
          }
        } else { // warble – melodische Phrase mit Vibrato
          const d = rand(0.8, 1.4), f = rand(2200, 3200);
          s.tone('sine', d, [s.envGain(s.now, 0.08, vol, d), s.filter('lowpass', lpf), s.pan(panv)],
            (fr, t, o) => {
              const lfo = ctx.createOscillator(), lg = ctx.createGain();
              lfo.frequency.value = rand(18, 30); lg.gain.value = rand(80, 200);
              lfo.connect(lg); lg.connect(fr); lfo.start(t); lfo.stop(t + d + 0.1);
              fr.setValueAtTime(f, t);
              for (let k = 1; k <= 4; k++) fr.linearRampToValueAtTime(f * rand(0.8, 1.25), t + (d * k) / 4);
            });
        }
      };
      s.loop(700 / density, 4200 / density, sing, 400);
    },
    crickets(s, count = 4, vol = 1) {
      for (let c = 0; c < count; c++) {
        const f = rand(4200, 4900), v = rand(0.015, 0.05) * vol, p = rand(-0.9, 0.9);
        const pulses = Math.floor(rand(3, 5));
        s.loop(380, 900, () => {
          for (let i = 0; i < pulses; i++) {
            const at = i * 0.032;
            s.tone('sine', 0.02, [s.envGain(s.now + at, 0.003, v, 0.018), s.pan(p)],
              (fr, t) => fr.setValueAtTime(f, t), at);
          }
        }, rand(0, 800));
      }
    },
    // lange, weiche Obertöne (Kosmos, Polarlicht, Himmel)
    shimmer(s, notes, minMs = 3000, maxMs = 9000, vol = 1) {
      s.loop(minMs, maxMs, () => {
        const t = s.now, d = rand(6, 10), f = pick(notes);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(rand(0.012, 0.03) * vol, t + d * 0.35);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        s.tone('sine', d, [g, s.pan(rand(-0.8, 0.8))], (fr, tt) => fr.setValueAtTime(f, tt));
      }, 1500);
    },
    // Windspiel: Glockentöne mit unharmonischem Oberton
    chimes(s, minMs = 4000, maxMs = 11000, vol = 1) {
      const notes = [1046.5, 1174.7, 1396.9, 1568, 1760, 2093];
      s.loop(minMs, maxMs, () => {
        const n = Math.floor(rand(1, 5));
        for (let i = 0; i < n; i++) {
          const at = i * rand(0.15, 0.6), f = pick(notes), p = rand(-0.5, 0.5);
          const d = rand(2.5, 4);
          s.tone('sine', d, [s.envGain(s.now + at, 0.004, 0.035 * vol, d), s.pan(p)], (fr, t) => fr.setValueAtTime(f, t), at);
          s.tone('sine', d * 0.6, [s.envGain(s.now + at, 0.004, 0.012 * vol, d * 0.6), s.pan(p)], (fr, t) => fr.setValueAtTime(f * 2.76, t), at);
        }
      }, 2500);
    },
    drone(s, freqs, vol = 1, cutoff = [350, 1600]) {
      const lp = s.filter('lowpass', 900, 0.8);
      lp.connect(s.bus);
      s.walk(lp.frequency, cutoff[0], cutoff[1], 5000, 12000);
      freqs.forEach((f, i) => {
        [-6, 6].forEach((det) => {
          const g = s.gain(0.03 * vol);
          s.chain(s.osc(i < 2 ? 'triangle' : 'sine', f, det), g, s.pan(det > 0 ? 0.4 : -0.4)).connect(lp);
          s.walk(g.gain, 0.005 * vol, (i < 3 ? 0.07 : 0.04) * vol, 5000, 14000);
        });
      });
    },
    // Unterwasser-Grundrauschen
    deepwater(s, low = 150, high = 360, vol = 1) {
      const lp = s.filter('lowpass', 240);
      const g = s.gain(0.55 * vol);
      s.out(s.noise('brown'), lp, g);
      s.walk(lp.frequency, low, high, 2000, 5000);
      s.walk(g.gain, 0.4 * vol, 0.65 * vol, 2000, 6000);
      s.out(s.noise('pink'), s.filter('lowpass', 500), s.gain(0.04 * vol));
    },
    bubbles(s, minMs = 150, maxMs = 1400, vol = 1) {
      const bubble = (at) => {
        const t = s.now + at, f = rand(350, 1300), d = rand(0.02, 0.07);
        s.tone('sine', d + 0.02, [s.envGain(t, 0.004, rand(0.04, 0.14) * vol, d), s.pan(rand(-0.9, 0.9))],
          (fr, tt) => { fr.setValueAtTime(f, tt); fr.exponentialRampToValueAtTime(f * rand(1.8, 2.6), tt + d); }, at);
      };
      s.loop(minMs, maxMs, () => {
        const n = Math.random() < 0.3 ? Math.floor(rand(3, 9)) : 1;
        for (let i = 0; i < n; i++) bubble(i * rand(0.03, 0.12));
      }, 300);
    },
    whale(s, minMs = 20000, maxMs = 42000, vol = 1) {
      s.loop(minMs, maxMs, () => {
        const d = rand(2.5, 4);
        s.tone('sine', d, [s.envGain(s.now, 0.8, 0.07 * vol, d - 0.8), s.filter('lowpass', 700)],
          (fr, t) => {
            fr.setValueAtTime(rand(160, 220), t);
            fr.linearRampToValueAtTime(rand(280, 380), t + d * 0.45);
            fr.linearRampToValueAtTime(rand(140, 190), t + d);
          });
      }, rand(6000, 12000));
    },
  };

  /* ---------- Klangwelten ---------- */

  const define = (id, def) => { defs[id] = def; };

  define('rain', { level: 0.9, send: 0.18, build(s) { layers.rain(s, 1); } });

  define('storm', {
    level: 0.95, send: 0.3,
    build(s) {
      layers.rain(s, 1.5);
      layers.wind(s, 0.6, 200, 600);
      // Blitz zuerst (Ereignis für die Grafik), Donner je nach Entfernung später
      const strike = () => {
        const near = Math.random() < 0.4;
        emit('lightning', { near });
        s.after(near ? 80 : rand(1500, 4000), () => thunder(near));
      };
      const thunder = (near) => {
        const t = s.now;
        const lp = s.filter('lowpass', near ? 1200 : 500);
        lp.frequency.setValueAtTime(near ? 1200 : 500, t);
        lp.frequency.exponentialRampToValueAtTime(110, t + 2.5);
        const g = s.gain(0.0001);
        const peak = near ? 1.1 : 0.6;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + (near ? 0.05 : 0.6));
        // Grollen in mehreren Wellen
        let tt = t + 0.8;
        for (let k = 0; k < 4; k++) { g.gain.setTargetAtTime(peak * rand(0.3, 0.8), tt, 0.4); tt += rand(0.6, 1.4); }
        g.gain.setTargetAtTime(0.0001, tt, 1.6);
        s.burst('brown', 9, [lp, g]);
        if (near) s.burst('white', 0.6, [s.filter('lowpass', 3500), s.envGain(t, 0.005, 0.35, 0.5)]);
      };
      s.loop(12000, 28000, strike, rand(3000, 6000));
    },
  });

  define('ocean', {
    level: 0.95, send: 0.2,
    build(s) {
      s.out(s.noise('brown'), s.filter('lowpass', 180), s.gain(0.18));
      [-0.6, 0.6].forEach((p, idx) => {
        const lp = s.filter('lowpass', 300);
        const g = s.gain(0.12);
        s.out(s.noise('brown'), lp, g, s.pan(p));
        const hp = s.filter('bandpass', 1600, 0.6);
        const fizz = s.gain(0.0001);
        s.out(s.noise('pink'), hp, fizz, s.pan(p * 0.7));
        const wave = () => {
          const T = rand(7, 12), t = s.now, rise = T * 0.42;
          lp.frequency.cancelScheduledValues(t); g.gain.cancelScheduledValues(t); fizz.gain.cancelScheduledValues(t);
          lp.frequency.setValueAtTime(lp.frequency.value, t);
          lp.frequency.linearRampToValueAtTime(rand(1100, 1800), t + rise);
          lp.frequency.setTargetAtTime(280, t + rise + 0.4, T * 0.18);
          g.gain.setValueAtTime(g.gain.value, t);
          g.gain.linearRampToValueAtTime(rand(0.5, 0.8), t + rise);
          g.gain.setTargetAtTime(0.1, t + rise + 0.3, T * 0.2);
          fizz.gain.setValueAtTime(0.0001, t);
          fizz.gain.setTargetAtTime(rand(0.15, 0.3), t + rise - 0.2, 0.15);
          fizz.gain.setTargetAtTime(0.0001, t + rise + 0.6, T * 0.15);
          s.after(T * rand(0.85, 1.1) * 1000, wave);
        };
        s.after(idx * 4500 + 200, wave);
      });
    },
  });

  define('wind', {
    level: 0.9, send: 0.25,
    build(s) {
      layers.wind(s, 1);
      s.out(s.noise('brown'), s.filter('lowpass', 140), s.gain(0.2));
      const bp = s.filter('bandpass', 1200, 28);
      const g = s.gain(0.02);
      s.out(s.noise('white'), bp, g);
      s.walk(bp.frequency, 850, 1700, 1500, 4000);
      s.walk(g.gain, 0.0, 0.05, 2000, 6000);
    },
  });

  define('fire', {
    level: 0.95, send: 0.08,
    build(s) {
      const roar = s.gain(0.35);
      s.out(s.noise('brown'), s.filter('lowpass', 380), roar);
      s.walk(roar.gain, 0.22, 0.45, 600, 2200);
      s.out(s.noise('pink'), s.filter('highpass', 3000), s.gain(0.025));
      const click = (at) => {
        const t = s.now + at;
        s.burst('white', 0.01, [
          s.filter('highpass', rand(1500, 4500)),
          s.envGain(t, 0.0008, Math.pow(Math.random(), 1.6) * 0.5 + 0.03, rand(0.003, 0.012)),
          s.pan(rand(-0.4, 0.4)),
        ], at);
      };
      s.loop(40, 380, () => {
        if (Math.random() < 0.25) { const n = Math.floor(rand(2, 6)); for (let i = 0; i < n; i++) click(i * rand(0.015, 0.05)); }
        else click(0);
      }, 0);
      s.loop(900, 4500, () => {
        const t = s.now;
        s.burst('white', 0.04, [s.filter('bandpass', rand(250, 900), 3), s.envGain(t, 0.002, rand(0.3, 0.6), 0.05), s.pan(rand(-0.3, 0.3))]);
      });
    },
  });

  define('forest', {
    level: 0.9, send: 0.35,
    build(s) {
      const leaves = s.gain(0.05);
      const bp = s.filter('bandpass', 3200, 0.5);
      s.out(s.noise('pink'), bp, leaves);
      s.walk(leaves.gain, 0.015, 0.09, 2000, 6000);
      s.walk(bp.frequency, 2200, 4500, 3000, 7000);
      s.out(s.noise('brown'), s.filter('lowpass', 350), s.gain(0.06));
      layers.birds(s, 1);
      // Kuckuck in der Ferne
      s.loop(18000, 40000, () => {
        const reps = Math.floor(rand(2, 5));
        for (let i = 0; i < reps; i++) {
          [[660, 0], [530, 0.32]].forEach(([f, off]) => {
            const at = i * 0.95 + off;
            s.tone('sine', 0.26, [s.envGain(s.now + at, 0.03, 0.05, 0.24), s.filter('lowpass', 1500), s.pan(-0.6)],
              (fr, t) => { fr.setValueAtTime(f, t); fr.linearRampToValueAtTime(f * 0.97, t + 0.25); }, at);
          });
        }
      }, rand(5000, 12000));
    },
  });

  define('stream', {
    level: 0.9, send: 0.2,
    build(s) {
      s.out(s.noise('brown'), s.filter('lowpass', 320), s.gain(0.2));
      for (let i = 0; i < 5; i++) {
        const bp = s.filter('bandpass', rand(500, 2800), rand(3, 8));
        const g = s.gain(0.12);
        s.out(s.noise('pink'), bp, g, s.pan(rand(-0.8, 0.8)));
        s.walk(bp.frequency, 400, 3200, 120, 600);
        s.walk(g.gain, 0.03, 0.22, 150, 700);
      }
      s.loop(60, 400, () => {
        const t = s.now, f = rand(500, 1500);
        s.tone('sine', 0.05, [s.envGain(t, 0.003, rand(0.02, 0.07), 0.04), s.pan(rand(-0.8, 0.8))],
          (fr, tt) => { fr.setValueAtTime(f, tt); fr.exponentialRampToValueAtTime(f * 2, tt + 0.04); });
      }, 0);
      layers.birds(s, 0.4, 0.8);
    },
  });


  define('night', {
    level: 0.9, send: 0.3,
    build(s) {
      s.out(s.noise('pink'), s.filter('bandpass', 700, 0.8), s.gain(0.05));
      layers.crickets(s, 4);
      // Eule
      s.loop(15000, 35000, () => {
        [0, 0.55, 0.85].forEach((at, i) => {
          const d = i === 0 ? 0.45 : 0.25;
          s.tone('sine', d, [s.envGain(s.now + at, 0.08, 0.06, d), s.filter('lowpass', 900), s.pan(0.5)],
            (fr, t) => { fr.setValueAtTime(390, t); fr.linearRampToValueAtTime(360, t + d); }, at);
        });
      }, rand(4000, 9000));
    },
  });

  define('underwater', {
    level: 1, send: 0.5,
    build(s) { layers.deepwater(s); layers.bubbles(s); layers.whale(s); },
  });

  define('deep', {
    level: 1, send: 0.7,
    build(s) {
      layers.deepwater(s, 90, 200, 1.1);
      layers.bubbles(s, 1500, 5000, 0.6);
      layers.whale(s, 14000, 30000, 1.2);
      layers.drone(s, [41.2, 61.7, 82.4], 0.6, [150, 500]);
    },
  });

  const cosmosNotes = [440, 554.37, 659.25, 830.61, 880, 1108.73, 1318.51];

  define('cosmos', {
    level: 0.85, send: 0.7,
    build(s) {
      layers.drone(s, [55, 82.41, 110, 164.81, 220, 277.18]);
      s.out(s.noise('pink', 0.5), s.filter('bandpass', 220, 1.5), s.gain(0.04));
      layers.shimmer(s, cosmosNotes);
    },
  });

  define('arctic', {
    level: 0.9, send: 0.6,
    build(s) {
      layers.wind(s, 0.45, 150, 480);
      s.out(s.noise('brown'), s.filter('lowpass', 120), s.gain(0.12));
      layers.shimmer(s, [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5], 5000, 12000, 0.8);
      layers.drone(s, [65.41, 98, 130.81], 0.35, [250, 700]);
    },
  });

  define('sky', {
    level: 0.85, send: 0.5,
    build(s) {
      layers.wind(s, 0.5, 400, 1200);
      layers.shimmer(s, [587.33, 739.99, 880, 1174.66, 1479.98], 6000, 13000, 0.6);
    },
  });

  define('city', {
    level: 0.9, send: 0.2,
    build(s) {
      // Regen hinter Glas: gedämpft
      const glass = s.filter('lowpass', 2500);
      glass.connect(s.bus);
      const lp = s.filter('lowpass', 5000);
      s.chain(s.noise('pink'), s.filter('highpass', 300), lp, s.gain(0.3)).connect(glass);
      s.walk(lp.frequency, 3000, 5500, 3000, 6000);
      s.out(s.noise('brown'), s.filter('lowpass', 110), s.gain(0.35)); // Stadtrauschen
      // Tropfen gegen die Scheibe
      s.loop(40, 180, () => {
        const t = s.now;
        s.burst('white', 0.02, [s.filter('bandpass', rand(1200, 3500), 3), s.envGain(t, 0.002, rand(0.03, 0.15), 0.02), s.pan(rand(-0.9, 0.9))]);
      }, 0);
      // vorbeifahrende Autos auf nasser Straße
      s.loop(5000, 14000, () => {
        const t = s.now, d = rand(3, 5.5), dir = Math.random() < 0.5 ? -1 : 1;
        const p = s.pan(-dir);
        p.pan.setValueAtTime(-dir * 0.9, t);
        p.pan.linearRampToValueAtTime(dir * 0.9, t + d);
        const g = s.gain(0.0001);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(rand(0.15, 0.3), t + d * 0.5);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        const bp = s.filter('bandpass', 700, 0.7);
        bp.frequency.setValueAtTime(500, t);
        bp.frequency.linearRampToValueAtTime(1100, t + d * 0.5);
        bp.frequency.linearRampToValueAtTime(450, t + d);
        s.burst('pink', d, [bp, g, p]);
      }, 2500);
    },
  });

  define('jungle', {
    level: 0.9, send: 0.3,
    build(s) {
      layers.rain(s, 0.55);
      layers.birds(s, 1.4);
      // Zikaden
      const bp = s.filter('bandpass', 6200, 12);
      const am = s.gain(0.5);
      const g = s.gain(0.03);
      s.out(s.noise('white'), bp, am, g);
      const lfo = s.osc('sine', 45);
      const lfoG = s.gain(0.5);
      s.chain(lfo, lfoG).connect(am.gain);
      s.walk(g.gain, 0.0, 0.05, 3000, 9000);
      // Frösche
      s.loop(1500, 5000, () => {
        const f = rand(260, 520), p = rand(-0.8, 0.8), n = Math.floor(rand(2, 4));
        for (let i = 0; i < n; i++) {
          const at = i * 0.12;
          s.tone('square', 0.07, [s.filter('lowpass', 900), s.envGain(s.now + at, 0.01, 0.025, 0.06), s.pan(p)],
            (fr, t) => { fr.setValueAtTime(f, t); fr.linearRampToValueAtTime(f * 0.85, t + 0.07); }, at);
        }
      });
    },
  });

  define('desert', {
    level: 0.9, send: 0.35,
    build(s) {
      layers.wind(s, 0.5, 150, 450);
      const hiss = s.gain(0.01);
      s.out(s.noise('pink'), s.filter('highpass', 4000), hiss);
      s.walk(hiss.gain, 0.003, 0.025, 2000, 5000);
      layers.drone(s, [55, 82.41], 0.3, [200, 500]);
    },
  });

  define('snow', {
    level: 0.85, send: 0.4,
    build(s) {
      layers.wind(s, 0.3, 150, 400);
      s.out(s.noise('brown'), s.filter('lowpass', 200), s.gain(0.08));
      // Schnee rutscht von einem Ast
      s.loop(9000, 22000, () => {
        const t = s.now;
        s.burst('brown', 1.6, [s.filter('lowpass', 700), s.envGain(t, 0.05, rand(0.08, 0.18), 1.4), s.pan(rand(-0.7, 0.7))]);
      }, rand(4000, 9000));
      layers.shimmer(s, [659.25, 783.99, 987.77, 1318.5], 9000, 18000, 0.5);
    },
  });

  define('garden', {
    level: 0.9, send: 0.35,
    build(s) {
      for (let i = 0; i < 3; i++) {
        const bp = s.filter('bandpass', rand(600, 2200), rand(4, 8));
        const g = s.gain(0.06);
        s.out(s.noise('pink'), bp, g, s.pan(rand(-0.6, 0.6)));
        s.walk(bp.frequency, 500, 2400, 200, 800);
        s.walk(g.gain, 0.01, 0.08, 250, 900);
      }
      s.out(s.noise('brown'), s.filter('lowpass', 300), s.gain(0.06));
      layers.chimes(s);
      layers.birds(s, 0.5, 0.8);
    },
  });

  define('meadow', {
    level: 0.9, send: 0.3,
    build(s) {
      layers.wind(s, 0.45, 300, 900);
      layers.birds(s, 0.6, 0.9);
      layers.crickets(s, 3, 0.6);
    },
  });

  define('room', {
    level: 0.85, send: 0.6,
    build(s) {
      s.out(s.noise('pink'), s.filter('lowpass', 300), s.gain(0.03));
      layers.drone(s, [110, 164.81, 220], 0.4, [300, 800]);
      s.loop(10000, 20000, () => {
        const t = s.now, f = pick([523.25, 659.25, 783.99, 880]);
        s.tone('sine', 5, [s.envGain(t, 0.005, 0.04, 5)], (fr, tt) => fr.setValueAtTime(f, tt));
        s.tone('sine', 3, [s.envGain(t, 0.005, 0.012, 3)], (fr, tt) => fr.setValueAtTime(f * 2.01, tt));
      }, 3000);
    },
  });

  /* ---------- Öffentliche Schnittstelle ---------- */

  const ResetSound = {
    define,
    layers,
    has: (id) => !!defs[id],
    list: () => Object.keys(defs),
    get analyser() { return analyser; },
    get current() { return current ? current.id : null; },
    get unlocked() { return !!ctx && ctx.state === 'running'; },
    play(id, fade = 2.5) {
      ensure();
      if (ctx.state === 'suspended') ctx.resume();
      if (current && current.id === id) return;
      if (current) current.scene.stop(fade);
      const def = defs[id];
      if (!def) { current = null; return; }
      const scene = new Scene(def.send != null ? def.send : 0.2);
      def.build(scene);
      scene.fadeIn(def.level != null ? def.level : 0.9, fade);
      current = { id, scene };
    },
    stop(fade = 2) { if (current) { current.scene.stop(fade); current = null; } },
    setVolume(v) {
      volume = v;
      if (master && !muted) master.gain.setTargetAtTime(v, ctx.currentTime, 0.1);
    },
    setMuted(m) {
      muted = m;
      if (master) master.gain.setTargetAtTime(m ? 0 : volume, ctx.currentTime, 0.3);
    },
    get muted() { return muted; },
    on(name, fn) { (listeners[name] = listeners[name] || []).push(fn); return () => this.off(name, fn); },
    off(name, fn) { listeners[name] = (listeners[name] || []).filter((f) => f !== fn); },
  };

  global.ResetSound = ResetSound;
})(window);
