# Reset

Ein kurzer Moment, um den Kopf freizubekommen: Gedanken aufschreiben, an einen ruhigen Ort reisen, atmen, loslassen.

**Live:** https://reset.bapo.me

## So funktioniert's

1. Gedanken aufschreiben, der dich gerade festhält.
2. Einen Ort wählen (oder „Überrasch mich“) und die Dauer: 1, 2 oder 5 Minuten.
3. Die Sitzung läuft in vier Phasen:
   - **Ankommen** (5 s): Der Ort erscheint, die Kamera gleitet hinein.
   - **Hinschauen**: drei bis fünf kurze Fragen als Bogen – benennen, prüfen, Zeitperspektive, Einfluss, Freundlichkeit.
   - **Herauszoomen**: atmen (4 s ein, 4 s aus), dazu Fakten von klein nach groß – Du, Menschheit, Erde, Sonnensystem, Milchstraße, Universum. Manche Zahlen laufen live mit („Seit du hier bist …“). Die Kamera zieht sich zurück, der Gedanke schrumpft zu einem Punkt.
   - **Loslassen**: Der Gedanke löst sich Buchstabe für Buchstabe auf.

Die Zeiten pro Dauer stehen oben in `js/app.js` (`PLAN`).

Jeder Ort hat eine eigene Klangwelt, die live im Browser erzeugt wird. Es gibt keine Audiodateien. Viele Orte variieren bei jedem Besuch (Tageszeit, Wetter, Anordnung). Fakten, die du schon gesehen hast, kommen erst wieder, wenn die anderen durch sind.

## Aufbau

```
index.html            Gerüst der Seite, lädt alle Skripte
css/style.css         Aussehen der Oberfläche
js/i18n.js            alle Texte (DE/EN), Perspektivfragen, allgemeine Fakten
js/sound.js           Klangwelten (Web Audio API)
js/world.js           3D-Welt und Baukasten für Orte (Three.js)
js/places/*.js        ein Ort pro Datei
js/app.js             Ablauf: Einstieg, Phasen, Ende
```

Kein Build-Schritt, keine Abhängigkeiten außer Three.js vom CDN. Lokal starten:

```bash
python3 -m http.server
# dann http://localhost:8000 öffnen
```

## Einen neuen Ort hinzufügen

1. Eine bestehende Datei in `js/places/` kopieren, z. B. `sommernacht.js` → `bergsee.js`.
2. `id`, Namen, Farben und Fakten anpassen, in `build(w)` die Szene bauen.
3. In `index.html` eine Zeile ergänzen: `<script src="js/places/bergsee.js"></script>`

Ein Ort sieht so aus:

```js
ResetWorld.define({
  id: 'bergsee',
  name: { de: 'Bergsee', en: 'Mountain Lake' },
  hint: { de: 'Stilles Wasser vor hohen Gipfeln', en: 'Still water below high peaks' },
  sound: 'wind',                       // eine Klangwelt aus js/sound.js
  ui: 'light',                         // 'light' = dunkle Schrift, 'dark' = helle Schrift
  swatch: ['#8fbfe3', '#d7e9ef', '#3f7f8f'], // Farbverlauf der Kachel
  themeColor: '#d7e9ef',               // Farbe der Browserleiste
  facts: { de: ['…'], en: ['…'] },     // erscheinen beim Herauszoomen als „Hier“
  pull: { back: 7, up: 2.5 },          // optional: wie weit die Kamera beim Herauszoomen zurückfährt
  build(w) {
    w.sky({ top: 0x8fbfe3, mid: 0xd7e9ef, bottom: 0xe8f0ea });
    w.fog(0xd9e6dc, 0.02);
    w.lights({ ambient: [0xffffff, 0.6] });
    const g = w.terrain({ height: 4 });
    w.water({ size: 60, y: 0.2 });
    w.trees({ kind: 'pine', count: 40, heightAt: g.heightAt });
    w.camera({ pos: [0, g.heightAt(0, 10) + 1.7, 10], look: [0, 2, -40] });
    // optional: Varianten zurückgeben, z. B. { ui: 'dark', themeColor: '#123', variant: 'nacht' }
  },
});
```

### Der Baukasten (`w`)

| Helfer | Wofür |
|---|---|
| `w.sky({ top, mid, bottom })` | Farbverlauf-Himmel |
| `w.stars({ count })` | Sternenhimmel, funkelt |
| `w.glow({ pos, color, size })` | Sonne, Mond, Lichtpunkte |
| `w.fog(color, dichte)` | Nebel/Tiefe |
| `w.lights({ ambient, hemi, sun })` | Beleuchtung |
| `w.terrain({ height, scale, shape, colorAt })` | Gelände; liefert `heightAt(x, z)` |
| `w.water({ size, y, color, waves, flow })` | bewegtes Wasser |
| `w.trees({ kind: 'pine' \| 'round' \| 'blossom' \| 'palm', … })` | Bäume |
| `w.rocks({ … })` | Steine |
| `w.grass({ count, height, colors, amp })` | Gras/Weizen/Seetang, wiegt sich im Wind |
| `w.particles({ count, vel, sprite, additive, twinkle })` | Schnee, Blasen, Pollen, Glühwürmchen, Blüten |
| `w.rain({ count, speed, wind })` | Regen |
| `w.clouds({ count, box, color })` | Wolken und Nebelschwaden |
| `w.rays({ count, color })` | Lichtstrahlen |
| `w.camera({ pos, look, drift, move })` | Kamera mit sanftem Schweben |
| `w.flash()`, `w.on('lightning', fn)` | Blitze, passend zum Donner im Ton |
| `w.onFrame((dt, t) => …)` | eigene Animation pro Bild |
| `w.rand`, `w.pick`, `w.chance`, `w.noise`, `w.fbm` | Zufall und Rauschen |

Für alles Weitere steht `w.THREE` (Three.js r128) zur Verfügung.

## Eine neue Klangwelt hinzufügen

In `js/sound.js` mit `define('id', { level, send, build(s) { … } })`. Vorhandene Schichten lassen sich kombinieren: `layers.rain`, `layers.wind`, `layers.birds`, `layers.crickets`, `layers.shimmer`, `layers.chimes`, `layers.drone`, `layers.deepwater`, `layers.bubbles`, `layers.whale`.

## Texte, Fragen, Fakten

Alles in `js/i18n.js`:

- `prompts` – Reflexionsfragen, sortiert nach Schritt im Bogen (`name`, `check`, `time`, `control`, `kind`)
- `facts` – Perspektiv-Fakten, sortiert nach Größenordnung (`du`, `menschheit`, `erde`, `sonnensystem`, `milchstrasse`, `universum`)
- `live` – Fakten mit mitlaufenden Zahlen

Ortsbezogene Fakten stehen direkt in der Datei des Ortes und erscheinen in längeren Sitzungen als „Hier“.
