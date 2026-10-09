# Reset

A short moment to clear your head: write down what's on your mind, travel to a calm place, breathe, let go.

**Live:** https://reset.bapo.me

## How it works

1. Write down the thought that's holding on to you.
2. Pick a place (or "Surprise me") and a duration: 1, 2 or 5 minutes.
3. The session runs in four phases:
   - **Arrive** (5 s): the place fades in and the camera glides into it.
   - **Reflect**: three to five short questions that form an arc: name it, check it, put it in time, see what you can influence, be kind to yourself.
   - **Zoom out**: breathe (4 s in, 4 s out) while facts grow from small to vast: you, humanity, Earth, the solar system, the Milky Way, the universe. Some numbers count up live ("Since you arrived …"). The camera pulls back and the thought shrinks to a dot.
   - **Let go**: the thought dissolves letter by letter.

The timing for each duration is set at the top of `js/app.js` (`PLAN`).

Every place has its own soundscape, generated live in the browser. There are no audio files. Many places vary on each visit (time of day, weather, layout). Facts you have already seen only come back once you have seen the others.

The interface is available in English and German.

## Structure

```
index.html            page skeleton, loads all scripts
css/style.css         look and animations of the interface
js/i18n.js            all text (EN/DE), reflection questions, general facts
js/sound.js           soundscapes (Web Audio API)
js/world.js           3D world and toolkit for places (Three.js)
js/places/*.js        one place per file
js/app.js             flow: setup, phases, end
```

No build step and no dependencies except Three.js from a CDN. To run it locally:

```bash
python3 -m http.server
# then open http://localhost:8000
```

## Adding a place

1. Copy an existing file in `js/places/`, e.g. `summer-night.js` → `mountain-lake.js`.
2. Change the `id`, names, colours and facts, and build the scene in `build(w)`.
3. Add one line to `index.html`: `<script src="js/places/mountain-lake.js"></script>`

A place looks like this:

```js
ResetWorld.define({
  id: 'mountain-lake',
  name: { en: 'Mountain Lake', de: 'Bergsee' },
  hint: { en: 'Still water below high peaks', de: 'Stilles Wasser vor hohen Gipfeln' },
  sound: 'wind',                       // a soundscape from js/sound.js
  ui: 'light',                         // 'light' = dark text, 'dark' = light text
  swatch: ['#8fbfe3', '#d7e9ef', '#3f7f8f'], // gradient of the gallery tile
  themeColor: '#d7e9ef',               // colour of the browser toolbar
  facts: { en: ['…'], de: ['…'] },     // shown as "Here" while zooming out
  pull: { back: 7, up: 2.5 },          // optional: how far the camera pulls back while zooming out
  build(w) {
    w.sky({ top: 0x8fbfe3, mid: 0xd7e9ef, bottom: 0xe8f0ea });
    w.fog(0xd9e6dc, 0.02);
    w.lights({ ambient: [0xffffff, 0.6] });
    const g = w.terrain({ height: 4 });
    w.water({ size: 60, y: 0.2 });
    w.trees({ kind: 'pine', count: 40, heightAt: g.heightAt });
    w.camera({ pos: [0, g.heightAt(0, 10) + 1.7, 10], look: [0, 2, -40] });
    // optional: return variants, e.g. { ui: 'dark', themeColor: '#123', variant: 'night' }
  },
});
```

### The toolkit (`w`)

| Helper | Purpose |
|---|---|
| `w.sky({ top, mid, bottom })` | gradient sky |
| `w.stars({ count })` | twinkling starfield |
| `w.glow({ pos, color, size })` | sun, moon, points of light |
| `w.fog(color, density)` | fog and depth |
| `w.lights({ ambient, hemi, sun })` | lighting |
| `w.terrain({ height, scale, shape, colorAt })` | terrain; returns `heightAt(x, z)` |
| `w.water({ size, y, color, waves, flow })` | moving water |
| `w.trees({ kind: 'pine' \| 'round' \| 'blossom' \| 'palm', … })` | trees |
| `w.rocks({ … })` | rocks |
| `w.grass({ count, height, colors, amp })` | grass, wheat or seaweed swaying in the wind |
| `w.particles({ count, vel, sprite, additive, twinkle })` | snow, bubbles, pollen, fireflies, petals |
| `w.rain({ count, speed, wind })` | rain |
| `w.clouds({ count, box, color })` | clouds and mist |
| `w.rays({ count, color })` | light rays |
| `w.camera({ pos, look, drift, move })` | camera with a gentle float |
| `w.flash()`, `w.on('lightning', fn)` | lightning, in sync with the thunder |
| `w.onFrame((dt, t) => …)` | your own per-frame animation |
| `w.rand`, `w.pick`, `w.chance`, `w.noise`, `w.fbm` | randomness and noise |

For anything else, `w.THREE` (Three.js r128) is available.

## Adding a soundscape

In `js/sound.js`, use `define('id', { level, send, build(s) { … } })`. Existing layers can be combined: `layers.rain`, `layers.wind`, `layers.birds`, `layers.crickets`, `layers.shimmer`, `layers.chimes`, `layers.drone`, `layers.deepwater`, `layers.bubbles`, `layers.whale`.

## Text, questions, facts

Everything lives in `js/i18n.js`:

- `prompts`: reflection questions, grouped by step in the arc (`name`, `check`, `time`, `control`, `kind`)
- `facts`: perspective facts, grouped by scale (`you`, `humanity`, `earth`, `solar`, `galaxy`, `universe`)
- `live`: facts with numbers that count up live

Place-specific facts live in each place's file and appear as "Here" in longer sessions.
