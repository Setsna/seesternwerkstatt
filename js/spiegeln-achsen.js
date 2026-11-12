/* Seesternwerkstatt: Station Spiegeln, Aufgabenart „Achsen finden“ (Etappe 3c).
   Die Figur steht im Raster, darüber liegen Linien durch ihre Mitte. Das Kind tippt die Linien an,
   die Spiegelachsen sind. Hat die Figur keine, tippt es „keine Achse“.

   Bedienung, auch für kleine Finger:
   - Jede Linie hat am Rand einen runden Griff (echter Knopf, mindestens 48 px, per Tastatur erreichbar).
   - Man kann auch direkt auf die Linie tippen. Gewählt wird die nächste Linie, wenn sie näher als ein
     halbes Kästchen liegt. In der Mitte, wo sich die Linien kreuzen, ist das nicht eindeutig:
     Dann passiert nichts und ein Hinweis sagt, wo man tippen kann.
   - „Fertig?“ prüft. Falsch gewählte Linien bekommen ein ✕. Wie viele Achsen fehlen, wird gesagt, welche nicht.
   - Danach steht der Spiegel bereit: Er zeigt das Spiegelbild der Figur an der zuletzt angetippten Linie.
     Deckt es sich mit der Figur, ist die Linie eine Spiegelachse (wie „Prüft mit dem Spiegel“ im Heft).

   Wird von js/spiegeln.js gestartet: SW.spiegelArten.achsen(aufgabe, ui). */
(() => {
  'use strict';
  SW.spiegelArten = SW.spiegelArten || {};
  SW.spiegelArten.achsen = function achsen(aufg, ui) {
    const R = SW.spiegelRaster, G = SW.geometrie, NS = 'http://www.w3.org/2000/svg';
    const { sagen, zeigeHinweis } = ui;
    const rahmen = document.getElementById('malrahmen');
    const raster = document.getElementById('malraster');
    const svg = document.getElementById('achsen');
    const spiegelKnopf = document.querySelector('[data-aktion="spiegel"]');
    const keineKnopf = document.querySelector('[data-aktion="keine"]');
    const linien = aufg.kandidaten.map(k => ({ achse: k, strecke: R.achsenStrecke(k, aufg.b, aufg.h) }));
    const farbe = Object.values(aufg.figur)[0];

    /* ---------- Zustand ---------- */
    const gewaehlt = linien.map(() => false);
    let keine = false, aktiv = null, geprueft = false, spiegelAn = false, geschafft = false, falsch = new Set();
    const griffe = [];

    function name(l) {
      const a = l.achse;
      if (a.typ === 'senkrecht') return 'senkrechte Linie';
      if (a.typ === 'waagerecht') return 'waagerechte Linie';
      const [p, q] = l.strecke, fallend = a.typ === 'fallend' || (a.typ === 'frei' && (q.y - p.y) * (q.x - p.x) > 0);
      return fallend ? 'schräge Linie von links oben nach rechts unten' : 'schräge Linie von links unten nach rechts oben';
    }

    /* ---------- Aufbau ---------- */
    function rasterBauen() {
      rahmen.style.setProperty('--spalten', aufg.b);
      rahmen.style.setProperty('--zeilen', aufg.h);
      raster.textContent = '';
      raster.setAttribute('role', 'img');
      raster.removeAttribute('aria-describedby');
      const n = Object.keys(aufg.figur).length;
      raster.setAttribute('aria-label', aufg.buchstabe ? `Buchstabe ${aufg.buchstabe} aus Kästchen` : `Figur aus ${n} Kästchen`);
      for (let z = 0; z < aufg.h; z++) {
        const zeile = document.createElement('div');
        zeile.className = 'malzeile';
        for (let s = 0; s < aufg.b; s++) {
          const c = document.createElement('div'), f = aufg.figur[`${s},${z}`];
          c.className = 'zelle zelle--nur' + (f ? ` zelle--vorgabe f${f}` : '');
          zeile.appendChild(c);
        }
        raster.appendChild(zeile);
      }
    }
    /* Griff an einem Ende der Linie, ein halbes Kästchen nach innen. Liegt er zu nah an einem anderen Griff,
       kommt er ans andere Ende. */
    function griffPunkt(l, schon) {
      const [p, q] = l.strecke, laenge = Math.hypot(q.x - p.x, q.y - p.y);
      const kandidaten = [[p, q], [q, p]].map(([a, b]) => ({ x: a.x + (b.x - a.x) / laenge * 0.55, y: a.y + (b.y - a.y) / laenge * 0.55 }));
      return kandidaten.find(k => schon.every(o => Math.hypot(o.x - k.x, o.y - k.y) >= 1.2)) || kandidaten[0];
    }
    function linienBauen() {
      svg.setAttribute('viewBox', `0 0 ${aufg.b} ${aufg.h}`);
      svg.innerHTML = SW.spiegelMuster + '<g class="spiegelbilder"></g>';
      rahmen.querySelectorAll('.linien-griff').forEach(n => n.remove());
      const punkte = [];
      linien.forEach((l, i) => {
        const [p, q] = l.strecke, el = document.createElementNS(NS, 'line');
        el.setAttribute('x1', p.x); el.setAttribute('y1', p.y); el.setAttribute('x2', q.x); el.setAttribute('y2', q.y);
        el.setAttribute('class', 'linie');
        svg.appendChild(el);
        l.el = el;
        const pt = griffPunkt(l, punkte);
        punkte.push(pt);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'linien-griff';
        b.dataset.i = i;
        b.style.setProperty('--x', pt.x / aufg.b);
        b.style.setProperty('--y', pt.y / aufg.h);
        b.setAttribute('aria-label', name(l));
        b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path class="griff-haken" d="M5 12.5 10 17 19 7"/><path class="griff-kreuz" d="M6 6l12 12M18 6 6 18"/></svg>';
        b.addEventListener('click', () => waehlen(i));
        rahmen.appendChild(b);
        griffe.push(b);
      });
      zeichnen();
    }
    function zeichnen() {
      linien.forEach((l, i) => {
        l.el.setAttribute('class', 'linie' + (gewaehlt[i] ? ' linie--gewaehlt' : '') + (falsch.has(i) ? ' linie--falsch' : ''));
        griffe[i].setAttribute('aria-pressed', String(gewaehlt[i]));
        griffe[i].classList.toggle('linien-griff--falsch', falsch.has(i));
      });
      keineKnopf.setAttribute('aria-pressed', String(keine));
      spiegelZeichnen();
    }

    /* ---------- Wählen ---------- */
    function waehlen(i) {
      if (geschafft || !linien[i]) return;
      gewaehlt[i] = !gewaehlt[i];
      keine = false;
      aktiv = i;
      falsch.delete(i);
      zeichnen();
      zeigeHinweis('');
      sagen(`${name(linien[i])}: ${gewaehlt[i] ? 'gewählt' : 'nicht mehr gewählt'}.`);
    }
    function keineWaehlen() {
      if (geschafft) return;
      keine = !keine;
      if (keine) { gewaehlt.fill(false); falsch = new Set(); aktiv = null; }
      zeichnen();
      zeigeHinweis('');
      sagen(keine ? 'Keine Achse gewählt.' : 'Keine Achse nicht mehr gewählt.');
    }
    /* Direkt auf eine Linie tippen: nächste Linie, wenn eindeutig */
    function linieBei(x, y) {
      const d = linien.map(l => {
        const [p, q] = l.strecke;
        return Math.abs((q.x - p.x) * (y - p.y) - (q.y - p.y) * (x - p.x)) / Math.hypot(q.x - p.x, q.y - p.y);
      });
      const ordnung = d.map((w, i) => [w, i]).sort((a, b) => a[0] - b[0]);
      if (ordnung[0][0] > 0.5) return { i: null };
      if (ordnung[1] && ordnung[1][0] - ordnung[0][0] < 0.2) return { i: null, unklar: true };
      return { i: ordnung[0][1] };
    }
    let start = null;
    rahmen.addEventListener('pointerdown', e => {
      if (e.target.closest('.linien-griff') || geschafft) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    });
    rahmen.addEventListener('pointerup', e => {
      if (!start || e.pointerId !== start.id) return;
      const weit = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      start = null;
      if (weit > 14) return;
      const r = raster.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * aufg.b, y = (e.clientY - r.top) / r.height * aufg.h;
      const t = linieBei(x, y);
      if (t.i !== null) waehlen(t.i);
      else if (t.unklar) zeigeHinweis('Hier kreuzen sich Linien. Tippe weiter außen auf die Linie oder auf ihren Kreis.', true);
    });
    rahmen.addEventListener('pointercancel', () => { start = null; });

    /* ---------- Prüfen ---------- */
    function fertigPruefen() {
      if (geschafft) return;
      if (!keine && !gewaehlt.some(Boolean)) {
        zeigeHinweis('Tippe die Spiegelachsen an. Hat die Figur keine, tippe auf „keine Achse“.', true);
        return;
      }
      const ersterVersuch = !geprueft;
      if (!geprueft) { geprueft = true; spiegelKnopf.hidden = false; }
      const r = R.pruefenAchsen(aufg, gewaehlt);
      if (r.ok) {
        geschafft = true;
        falsch = new Set();
        spiegelSetzen(false);
        griffe.forEach(g => g.setAttribute('aria-disabled', 'true'));
        ui.geschafft(keine ? 'Richtig: keine Spiegelachse!' : r.fehlt === 0 && gewaehlt.filter(Boolean).length === 1 ? 'Richtig: Das ist die Spiegelachse!' : 'Alle Spiegelachsen gefunden!');
        return;
      }
      falsch = new Set(r.zuviel);
      zeichnen();
      const teile = [];
      const n = r.zuviel.length;
      /* kurz (Etappe 6c): höchstens zwei knappe Teile */
      if (n) teile.push(n === 1 ? '1 Linie ist keine Achse' : `${n} Linien sind keine Achsen`);
      if (r.fehlt) {
        if (keine) teile.push(r.fehlt === 1 ? 'die Figur hat doch eine Achse' : `die Figur hat doch ${r.fehlt} Achsen`);
        else teile.push(r.fehlt === 1 ? '1 Achse fehlt' : `${r.fehlt} Achsen fehlen`);
      }
      /* „Fast!“ nur bei einem Fehler, der Hilfe-Satz nur beim ersten Versuch (Etappe 6b) */
      const anfang = r.zuviel.length + r.fehlt <= 1 ? 'Fast!' : 'Schau noch mal:';
      zeigeHinweis(`${anfang} ${teile.join(', ')}.${ersterVersuch ? ' Probier den Spiegel!' : ''}`, true);
    }

    /* ---------- Spiegel: Spiegelbild der Figur an der zuletzt angetippten Linie ---------- */
    function spiegelZeichnen() {
      const g = svg.querySelector('.spiegelbilder');
      if (!g) return;
      g.textContent = '';
      if (!spiegelAn) return;
      const i = aktiv !== null ? aktiv : gewaehlt.indexOf(true);
      if (i < 0) return;
      const achse = R.alsGeometrie(linien[i].achse);
      for (const k of Object.keys(aufg.figur)) {
        const { s, z } = R.feldAus(k), d = 0.08;
        const ecken = [[s + d, z + d], [s + 1 - d, z + d], [s + 1 - d, z + 1 - d], [s + d, z + 1 - d]]
          .map(([x, y]) => G.spiegeln({ x, y }, achse)).map(p => `${p.x},${p.y}`).join(' ');
        const p = document.createElementNS(NS, 'polygon');
        p.setAttribute('points', ecken);
        p.setAttribute('class', `spiegelbild sf${farbe}`);
        g.appendChild(p);
        if (farbe > 1) {
          const m = p.cloneNode();
          m.setAttribute('class', 'spiegelbild spiegelbild--muster');
          m.setAttribute('fill', `url(#sp-${farbe})`);
          g.appendChild(m);
        }
      }
    }
    function spiegelSetzen(an) {
      spiegelAn = an;
      spiegelKnopf.setAttribute('aria-pressed', String(an));
      spiegelKnopf.querySelector('span').textContent = an ? 'Spiegel weg' : 'Spiegel';
      spiegelZeichnen();
    }
    function spiegelUmschalten() {
      spiegelSetzen(!spiegelAn);
      if (!spiegelAn) { sagen('Spiegel weggestellt.'); return; }
      if (aktiv === null && !gewaehlt.some(Boolean)) zeigeHinweis('Tippe eine Linie an. Der Spiegel zeigt dann das Spiegelbild an dieser Linie.', true);
      else sagen('Der Spiegel zeigt das Spiegelbild an der Linie. Deckt es sich mit der Figur, ist sie eine Spiegelachse.');
    }

    /* ---------- Knöpfe ---------- */
    document.querySelector('.spiegel-buehne').addEventListener('click', e => {
      const b = e.target.closest('[data-aktion]');
      if (!b) return;
      const a = b.dataset.aktion;
      if (a === 'keine') keineWaehlen();
      else if (a === 'fertig') fertigPruefen();
      else if (a === 'spiegel') spiegelUmschalten();
    });

    /* ---------- Start ---------- */
    document.getElementById('farbwahl').hidden = true;
    document.querySelector('[data-aktion="zurueck"]').hidden = true;
    keineKnopf.hidden = false;
    rahmen.classList.add('malrahmen--linien');
    document.getElementById('mal-hilfe').textContent = 'Mit der Tabulatortaste erreichst du die Kreise an den Linien. Die Leertaste wählt eine Linie als Spiegelachse.';
    rasterBauen();
    linienBauen();
    zeigeHinweis('Tippe auf eine Linie oder ihren Kreis.');

    /* Für Rauchtest und Fehlersuche */
    return { aufg, waehlen, keineWaehlen, fertigPruefen, linieBei,
      get gewaehlt() { return gewaehlt.slice(); }, get keine() { return keine; },
      get geschafft() { return geschafft; }, get spiegelAn() { return spiegelAn; } };
  };
})();
