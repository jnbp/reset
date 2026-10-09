/* Reset – app flow
 *
 * Setup → Arrive → Reflect (several short questions) → Zoom out (breathing + facts from small to vast) → Let go → End
 * Timings per duration live in PLAN. Text, questions and facts live in js/i18n.js.
 */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const W = window.ResetWorld, S = window.ResetSound, TXT = window.ResetText;

  // Seconds per duration: arrive, number of questions, seconds per question, let go. The rest is zoom out.
  const PLAN = {
    1: { arrive: 5, prompts: 3, perPrompt: 7, release: 9 },
    2: { arrive: 5, prompts: 4, perPrompt: 9, release: 13 },
    5: { arrive: 6, prompts: 5, perPrompt: 16, release: 26 },
  };
  const ARC = { 3: ['name', 'time', 'kind'], 4: ['name', 'check', 'time', 'kind'], 5: ['name', 'check', 'time', 'control', 'kind'] };
  const LEVELS = ['you', 'humanity', 'earth', 'solar', 'galaxy', 'universe'];
  const FACT_SECONDS = 7.5;
  const BREATH_HALF = 4000;

  const store = {
    get(k, d) { try { const v = localStorage.getItem('reset.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('reset.' + k, JSON.stringify(v)); } catch (e) { /* private mode / blocked */ } },
  };
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pickOne = (a) => a[Math.floor(Math.random() * a.length)];

  const state = {
    lang: store.get('lang', (navigator.language || 'de').toLowerCase().startsWith('de') ? 'de' : 'en'),
    place: store.get('place', 'surprise'),
    minutes: store.get('minutes', 2),
    sound: store.get('sound', true),
    shown: null, session: null, webgl: true,
  };
  if (state.place !== 'surprise' && !W.get(state.place)) state.place = 'surprise';
  if (!PLAN[state.minutes]) state.minutes = 2;
  if (!TXT[state.lang]) state.lang = 'de';
  const t = (k) => TXT[state.lang][k];

  const el = {
    body: document.body, veil: $('#veil'), meta: $('#theme-color-meta'), world: $('#world'),
    setup: $('#setup'), session: $('#session'), done: $('#done'), bar: $('#bar'),
    input: $('#thought-input'), gallery: $('#gallery'), hint: $('#place-hint'),
    start: $('#start-btn'), soundBtn: $('#sound-btn'), mute: $('#mute-btn'), exit: $('#exit-btn'),
    arrive: $('#arrive'), arriveEyebrow: $('#arrive-eyebrow'), arriveName: $('#arrive-name'), arriveLine: $('#arrive-line'),
    thought: $('#thought'), reflect: $('#reflect'), zoom: $('#zoom'), release: $('#release'),
    count: $('#prompt-count'), prompt: $('#prompt'), fact: $('#fact'),
    ladderLabel: $('#ladder-label'), ladderDots: $('#ladder-dots'), ladderFill: $('#ladder-fill'),
    ring: $('#breath-ring'), ringLabel: $('#breath-label'),
    releaseLine: $('#release-line'), releaseQ: $('#release-question'),
    fill: $('#progress-fill'), stayHint: $('#stay-hint'), doneTitle: $('#done-title'),
  };

  /* ---------- Small animation helpers ---------- */
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  function letters(node, text) {
    node.innerHTML = '';
    Array.from(text).forEach((ch, i) => { const s = document.createElement('span'); s.className = 'l'; s.textContent = ch; s.style.setProperty('--i', i); node.appendChild(s); });
  }
  function reveal(node, text) {
    node.classList.remove('leaving');
    node.innerHTML = '';
    text.split(/\s+/).forEach((w, i) => {
      const s = document.createElement('span'); s.className = 'rw'; s.textContent = w; s.style.setProperty('--i', i);
      node.appendChild(s); node.appendChild(document.createTextNode(' '));
    });
  }
  function conceal(node) { node.classList.add('leaving'); }
  function replay(node, cls) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }
  function stagger(sheet) {
    Array.from(sheet.children).forEach((c, i) => c.style.setProperty('--d', i));
    sheet.classList.remove('leaving'); replay(sheet, 'enter');
  }
  function movePill(group) {
    const pill = group.querySelector('.pill');
    const on = group.querySelector('button[aria-checked="true"], button[aria-pressed="true"]');
    if (!pill || !on) return;
    pill.style.width = on.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + on.offsetLeft + 'px)';
  }
  function ripple(btn, e) {
    const r = btn.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2.2;
    const s = document.createElement('span'); s.className = 'ripple';
    s.style.width = s.style.height = size + 'px';
    s.style.left = ((e.clientX || r.left + r.width / 2) - r.left - size / 2) + 'px';
    s.style.top = ((e.clientY || r.top + r.height / 2) - r.top - size / 2) + 'px';
    btn.appendChild(s); setTimeout(() => s.remove(), 800);
  }
  $$('.btn').forEach((b) => b.addEventListener('pointerdown', (e) => ripple(b, e)));

  /* ---------- Text ---------- */
  function applyTexts() {
    document.documentElement.lang = state.lang;
    $$('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
    $$('[data-i18n-ph]').forEach((n) => { n.placeholder = t(n.dataset.i18nPh); });
    $$('[data-i18n-label]').forEach((n) => { n.setAttribute('aria-label', t(n.dataset.i18nLabel)); n.title = t(n.dataset.i18nLabel); });
    $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    renderSoundButton();
    buildGallery();
    updateHint();
    requestAnimationFrame(() => { movePill($('#duration')); movePill($('.lang')); });
  }

  function renderSoundButton() {
    const on = state.sound;
    el.soundBtn.setAttribute('aria-pressed', String(on));
    el.soundBtn.innerHTML = (on
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path class="wave" d="M15.5 8.5a5 5 0 0 1 0 7"/><path class="wave w2" d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>') + '<span>' + t(on ? 'soundOn' : 'soundOff') + '</span>';
    el.mute.classList.toggle('muted', !on);
  }

  /* ---------- Gallery ---------- */
  function buildGallery() {
    el.gallery.innerHTML = '';
    const make = (id, label, swatch, idx) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tile' + (id === 'surprise' ? ' surprise' : '');
      b.setAttribute('role', 'radio'); b.dataset.id = id;
      b.setAttribute('aria-checked', String(state.place === id));
      b.style.setProperty('--t', idx);
      if (swatch) b.style.setProperty('--swatch', 'linear-gradient(160deg, ' + swatch[0] + ', ' + swatch[1] + ' 58%, ' + swatch[2] + ')');
      b.innerHTML = (id === 'surprise' ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.2" fill="#fff"/><circle cx="15" cy="15" r="1.2" fill="#fff"/><circle cx="15" cy="9" r="1.2" fill="#fff"/><circle cx="9" cy="15" r="1.2" fill="#fff"/></svg>' : '') + '<span>' + label + '</span>';
      b.addEventListener('click', () => { if (id === 'surprise') replay(b, 'roll'); selectPlace(id, true); });
      el.gallery.appendChild(b);
    };
    make('surprise', t('surprise'), null, 0);
    W.places.forEach((p, i) => make(p.id, p.name[state.lang] || p.name.de, p.swatch, Math.min(i + 1, 8)));
  }

  function placeName(def) { return def.name[state.lang] || def.name.de; }
  function updateHint() {
    const def = W.get(state.shown);
    el.hint.textContent = !def ? '' : state.place === 'surprise' ? '→ ' + placeName(def) : (def.hint[state.lang] || def.hint.de);
    replay(el.hint, 'swap');
  }

  function randomPlace() {
    const pool = W.places.filter((p) => p.id !== state.shown);
    return pickOne(pool).id;
  }

  function selectPlace(id, fromUser) {
    state.place = id; store.set('place', id);
    $$('.tile').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.id === id)));
    const target = id === 'surprise' ? randomPlace() : id;
    showPlace(target);
    if (fromUser) {
      const tile = $('.tile[data-id="' + id + '"]');
      if (tile && tile.scrollIntoView) tile.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      playPlaceSound(target);
    }
  }

  /* ---------- Show a place (with a soft blur transition) ---------- */
  let showToken = 0;
  function showPlace(id, instant) {
    if (state.shown === id) { updateHint(); return; }
    const def = W.get(id);
    const token = ++showToken;
    state.shown = id;
    el.veil.style.background = def.themeColor || '#000';
    if (!instant) { el.veil.style.opacity = '0.55'; el.world.classList.add('switching'); }
    setTimeout(() => {
      if (token !== showToken) return;
      let cur = { ui: def.ui, themeColor: def.themeColor };
      if (state.webgl) { try { cur = W.show(id); } catch (e) { console.error('Could not build place:', id, e); } }
      el.body.dataset.ui = cur.ui;
      el.meta.content = cur.themeColor;
      if (!state.webgl) el.body.style.background = 'linear-gradient(160deg,' + def.swatch.join(',') + ')';
      updateHint();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (token !== showToken) return;
        el.world.classList.remove('switching');
        el.veil.style.opacity = '0';
        movePill($('#duration')); movePill($('.lang'));
      }));
    }, instant ? 0 : 420);
  }

  /* ---------- Sound ---------- */
  function playPlaceSound(id) {
    if (!S) return;
    const def = W.get(id || state.shown);
    if (!def || !S.has(def.sound)) return;
    S.setMuted(!state.sound);
    if (state.sound || state.session) S.play(def.sound);
  }
  function setSound(on) {
    state.sound = on; store.set('sound', on);
    renderSoundButton();
    if (!S) return;
    S.setMuted(!on);
    if (on && S.current !== (W.get(state.shown) || {}).sound) playPlaceSound();
  }

  /* ---------- Picking facts ---------- */
  let seen = new Set(store.get('seen', []));
  function remember(text) {
    seen.add(text);
    const arr = Array.from(seen); if (arr.length > 160) arr.splice(0, arr.length - 160);
    seen = new Set(arr); store.set('seen', arr);
  }
  function staticFact(level, used) {
    const all = (TXT[state.lang].facts[level] || []).filter((f) => !used.has(f));
    let fresh = all.filter((f) => !seen.has(f));
    if (!fresh.length) { all.forEach((f) => seen.delete(f)); fresh = all; }
    return fresh.length ? pickOne(fresh) : null;
  }
  // Order of levels for n facts: always from small to vast
  function levelPlan(n, def) {
    const withHere = n >= 7 && def.facts && def.facts[state.lang] && def.facts[state.lang].length;
    const out = [];
    const lv = LEVELS;
    const rest = withHere ? n - 1 : n;
    if (withHere) out.push('here');
    for (let k = 0; k < rest; k++) out.push(lv[Math.min(lv.length - 1, Math.floor((k * lv.length) / rest))]);
    if (rest >= 1 && rest < lv.length) out[out.length - 1] = 'universe';
    return out;
  }

  /* ---------- Session ---------- */
  function splitThought(text) {
    el.thought.innerHTML = '';
    let i = 0;
    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { el.thought.appendChild(document.createTextNode(' ')); return; }
      const word = document.createElement('span');
      word.className = 'word';
      word.style.setProperty('--w', el.thought.querySelectorAll('.word').length);
      Array.from(part).forEach((ch) => {
        const s = document.createElement('span');
        s.className = 'ch'; s.textContent = ch;
        s.style.setProperty('--i', i++);
        s.style.setProperty('--dx', (Math.random() * 120 - 60).toFixed(0) + 'px');
        s.style.setProperty('--dy', (-60 - Math.random() * 120).toFixed(0) + 'px');
        s.style.setProperty('--rot', (Math.random() * 80 - 40).toFixed(0) + 'deg');
        word.appendChild(s);
      });
      el.thought.appendChild(word);
    });
  }

  function showStep(name) {
    ['reflect', 'zoom', 'release'].forEach((k) => {
      const node = el[k];
      if (k === name) { node.hidden = false; node.classList.remove('leaving'); replay(node, 'in'); }
      else if (!node.hidden) { node.classList.add('leaving'); setTimeout(() => { if (node.classList.contains('leaving')) node.hidden = true; }, 780); }
    });
  }

  let wakeLock = null;
  async function keepAwake(on) {
    try {
      if (on && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
      else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch (e) { /* not allowed – fine */ }
  }

  function startSession() {
    if (state.session) return;
    const def = W.get(state.shown);
    const plan = PLAN[state.minutes];
    const total = state.minutes * 60;
    const tReflect = plan.arrive;
    const tZoom = tReflect + plan.prompts * plan.perPrompt;
    const tRelease = total - plan.release;
    const zoomDur = tRelease - tZoom;
    const nFacts = Math.max(3, Math.round(zoomDur / FACT_SECONDS));
    const factEvery = zoomDur / nFacts;

    const sess = { timers: [], intervals: [], raf: 0, start: performance.now(), total, def };
    state.session = sess;
    const at = (sec, fn) => sess.timers.push(setTimeout(fn, sec * 1000));
    const elapsed = () => (performance.now() - sess.start) / 1000;
    const nf = new Intl.NumberFormat(state.lang, { maximumFractionDigits: 0 });
    const num = (x) => nf.format(Math.round(x));

    playPlaceSound(def.id);
    keepAwake(true);

    // Hide setup
    el.setup.classList.add('leaving');
    setTimeout(() => { if (state.session === sess) el.setup.hidden = true; }, 700);
    el.done.hidden = true; el.stayHint.hidden = true;
    el.body.dataset.phase = 'session';
    el.session.hidden = false; el.bar.hidden = false; el.bar.classList.remove('leaving');
    ['reflect', 'zoom', 'release'].forEach((k) => { el[k].hidden = true; });
    el.thought.innerHTML = ''; el.thought.className = '';

    // 1 · Arrive
    if (W.pull) W.pull(0, plan.arrive + 1, 0.55);
    el.arrive.hidden = false; el.arrive.classList.remove('leaving');
    el.arriveEyebrow.textContent = def.hint[state.lang] || def.hint.de;
    letters(el.arriveName, placeName(def));
    el.arriveLine.textContent = t('arrive') + ' ' + t('arriveSub');
    replay(el.arriveEyebrow, 'x'); replay(el.arriveLine, 'x');
    at(plan.arrive - 1.1, () => el.arrive.classList.add('leaving'));
    at(plan.arrive, () => { el.arrive.hidden = true; });

    // 2 · Reflect: the thought appears and shrinks until the zoom ends
    const thought = el.input.value.trim() || t('fallbackThought');
    at(tReflect, () => {
      splitThought(thought);
      el.thought.style.setProperty('--shrink', (tRelease - tReflect).toFixed(1) + 's');
      replay(el.thought, 'appear');
      setTimeout(() => el.thought.classList.add('shrinking'), 50);
      showStep('reflect');
    });
    const arc = ARC[plan.prompts] || ARC[4];
    const prompts = TXT[state.lang].prompts;
    arc.forEach((cat, i) => {
      const text = pickOne(prompts[cat]);
      at(tReflect + i * plan.perPrompt, () => {
        const go = () => {
          el.count.textContent = t('promptCount').replace('{i}', i + 1).replace('{n}', arc.length);
          replay(el.count, 'swap');
          reveal(el.prompt, text);
        };
        if (i === 0) go(); else { conceal(el.prompt); setTimeout(go, 650); }
      });
    });

    // 3 · Zoom out
    const levels = levelPlan(nFacts - 1, def);
    const ladderLevels = levels.filter((l, i) => levels.indexOf(l) === i);
    at(tZoom, () => {
      conceal(el.prompt);
      showStep('zoom');
      if (W.pull) W.pull(1, zoomDur + plan.release * 0.5);
      el.ladderDots.innerHTML = ladderLevels.map(() => '<i></i>').join('');
      el.ladderFill.style.width = '0';
      el.ladderLabel.textContent = t('zoomTitle');
      el.fact.innerHTML = '';
      replay(el.ring, 'go');
      let inhale = true;
      el.ringLabel.textContent = t('breatheIn');
      sess.intervals.push(setInterval(() => {
        inhale = !inhale;
        el.ringLabel.classList.add('fade');
        setTimeout(() => { el.ringLabel.textContent = t(inhale ? 'breatheIn' : 'breatheOut'); el.ringLabel.classList.remove('fade'); }, 450);
      }, BREATH_HALF));
    });
    const used = new Set();
    const placeFacts = shuffle(((def.facts && def.facts[state.lang]) || []).slice());
    const liveUsed = new Set();
    for (let k = 0; k < nFacts; k++) {
      at(tZoom + 0.6 + k * factEvery, () => {
        let text, level;
        if (k === nFacts - 1) { text = t('closing'); level = null; }
        else {
          level = levels[k];
          if (level === 'here') text = placeFacts.shift();
          else {
            const lives = (TXT[state.lang].live[level] || []).filter((fn) => !liveUsed.has(fn));
            if (lives.length && Math.random() < 0.4) { const fn = pickOne(lives); liveUsed.add(fn); text = fn(elapsed(), num); }
            else text = staticFact(level, used) || (lives[0] ? lives[0](elapsed(), num) : t('closing'));
          }
          used.add(text); remember(text);
        }
        const show = () => {
          reveal(el.fact, text);
          if (level) {
            const idx = ladderLevels.indexOf(level);
            Array.from(el.ladderDots.children).forEach((d, i) => { d.className = i < idx ? 'past' : i === idx ? 'now' : ''; });
            const track = el.ladderDots.offsetWidth - 7;
            el.ladderFill.style.width = (ladderLevels.length > 1 ? (idx / (ladderLevels.length - 1)) * track : 0) + 'px';
            el.ladderLabel.textContent = t('levels')[level];
            replay(el.ladderLabel, 'swap');
          } else {
            Array.from(el.ladderDots.children).forEach((d) => { d.className = 'past'; });
            el.ladderFill.style.width = (el.ladderDots.offsetWidth - 7) + 'px';
          }
        };
        if (k === 0) show(); else { conceal(el.fact); setTimeout(show, 700); }
      });
    }

    // 4 · Let go
    at(tRelease, () => {
      sess.intervals.forEach(clearInterval); sess.intervals = [];
      showStep('release');
      reveal(el.releaseLine, t('release'));
      el.releaseQ.innerHTML = '';
      setTimeout(() => { if (state.session === sess) reveal(el.releaseQ, t('releaseQuestion')); }, 2200);
      el.thought.classList.add('dissolve');
    });

    // 5 · End
    at(total, finishSession);

    const tick = () => {
      const p = Math.min(1, elapsed() / total);
      el.fill.style.width = (p * 100).toFixed(2) + '%';
      if (p < 1 && state.session === sess) sess.raf = requestAnimationFrame(tick);
    };
    tick();
  }

  function clearSession() {
    const s = state.session;
    if (!s) return;
    s.timers.forEach(clearTimeout); s.intervals.forEach(clearInterval); cancelAnimationFrame(s.raf);
    state.session = null;
    el.ring.classList.remove('go');
    keepAwake(false);
  }

  function leaveSession() {
    el.bar.classList.add('leaving');
    if (!el.session.hidden) { replay(el.session, 'x'); el.session.style.transition = 'opacity .6s, filter .6s'; el.session.style.opacity = '0'; el.session.style.filter = 'blur(10px)'; }
    setTimeout(() => {
      el.session.hidden = true; el.bar.hidden = true;
      el.session.style.opacity = ''; el.session.style.filter = '';
    }, 600);
  }

  function finishSession() {
    clearSession();
    leaveSession();
    if (W.pull) W.pull(0.35, 6);
    setTimeout(() => {
      el.body.dataset.phase = 'done';
      el.done.hidden = false;
      letters(el.doneTitle, t('doneTitle'));
      stagger(el.done);
    }, 500);
  }

  function backToSetup(newPlace) {
    const wasSession = !!state.session;
    clearSession();
    if (wasSession || !el.session.hidden) leaveSession();
    if (W.pull) W.pull(0, 3);
    const show = () => {
      el.done.hidden = true; el.stayHint.hidden = true;
      el.body.dataset.phase = 'setup';
      el.setup.hidden = false;
      stagger(el.setup);
      requestAnimationFrame(() => { movePill($('#duration')); movePill($('.lang')); });
      if (newPlace && state.place === 'surprise') { selectPlace('surprise', false); setTimeout(() => playPlaceSound(state.shown), 450); }
    };
    if (!el.done.hidden) { el.done.classList.add('leaving'); setTimeout(show, 600); } else setTimeout(show, wasSession ? 450 : 0);
  }

  function stay() {
    el.done.classList.add('leaving');
    setTimeout(() => {
      el.done.hidden = true;
      el.body.dataset.phase = 'stay';
      el.stayHint.hidden = false; replay(el.stayHint, 'x');
      if (W.pull) W.pull(0, 8);
    }, 600);
  }

  /* ---------- Events ---------- */
  el.start.addEventListener('click', startSession);
  el.input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startSession(); } });
  $$('#duration button').forEach((b) => {
    b.setAttribute('aria-checked', String(+b.dataset.min === state.minutes));
    b.addEventListener('click', () => {
      state.minutes = +b.dataset.min; store.set('minutes', state.minutes);
      $$('#duration button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      movePill($('#duration'));
    });
  });
  $$('.lang button').forEach((b) => b.addEventListener('click', () => {
    if (state.lang === b.dataset.lang) return;
    state.lang = b.dataset.lang; store.set('lang', state.lang);
    applyTexts();
    letters($('#brand-title'), 'Reset');
  }));
  el.soundBtn.addEventListener('click', () => setSound(!state.sound));
  el.mute.addEventListener('click', () => setSound(!state.sound));
  el.exit.addEventListener('click', () => backToSetup(false));
  $('#again-btn').addEventListener('click', () => { el.input.value = ''; backToSetup(true); setTimeout(() => el.input.focus({ preventScroll: true }), 900); });
  $('#stay-btn').addEventListener('click', stay);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (state.session || el.body.dataset.phase === 'stay' || el.body.dataset.phase === 'done') backToSetup(false);
  });
  document.addEventListener('pointerdown', () => { if (el.body.dataset.phase === 'stay') backToSetup(false); }, true);
  addEventListener('resize', () => { movePill($('#duration')); movePill($('.lang')); });

  // The "Surprise me" tile slowly rotates its gradient
  (function spin() { const tile = $('.tile.surprise'); if (tile) tile.style.setProperty('--spin', ((performance.now() / 60) % 360).toFixed(1) + 'deg'); requestAnimationFrame(spin); })();

  // First interaction unlocks audio (browsers only allow sound after a gesture)
  const unlock = () => {
    document.removeEventListener('pointerdown', unlock, true);
    document.removeEventListener('keydown', unlock, true);
    if (state.sound && S && !S.current) playPlaceSound();
  };
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);

  /* ---------- Start ---------- */
  try {
    if (!window.THREE) throw new Error('Three.js failed to load');
    W.init(el.world);
  } catch (e) {
    console.error(e);
    state.webgl = false;
    const n = document.createElement('p'); n.className = 'notice'; n.textContent = t('noWebgl');
    el.setup.insertBefore(n, el.start);
  }
  applyTexts();
  letters($('#brand-title'), 'Reset');
  $('#brand-title').classList.add('letters');
  stagger(el.setup);
  showPlace(state.place === 'surprise' ? randomPlace() : state.place, true);
})();
