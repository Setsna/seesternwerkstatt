/* Seesternwerkstatt: Station Spiegeln, Aufgabenart „Faltschnitt“ (Etappe 3c).
   Ein Papier ist gefaltet, ein Stück wird ausgeschnitten (farbig). Welche Figur entsteht beim Aufklappen?

   wählen (leicht):   Das gefaltete Papier steht groß im Raster, daneben drei Antworten. Antippen wählt,
                      „Fertig?“ prüft. Danach zeigt der Spiegel, was beim Aufklappen entsteht.
   zeichnen (mittel): Das gefaltete Papier steht klein als Vorlage bei den Werkzeugen. Das Kind malt die
                      ganze aufgeklappte Figur in ein leeres Raster mit Faltlinie (Malen wie beim Ergänzen).
                      Richtig ist sie auch, wenn sie längs der Faltlinie verschoben ist, aber nicht quer dazu.

   Wird von js/spiegeln.js gestartet: SW.spiegelArten.falt(aufgabe, ui). */
(() => {
  'use strict';
  SW.spiegelArten = SW.spiegelArten || {};
  const NS = 'http://www.w3.org/2000/svg';

  /* Die Hälfte des Papiers, auf der der Schnitt liegt: { s0, s1, z0, z1 } (Felder, einschließlich) */
  function papierHaelfte(aufg) {
    const R = SW.spiegelRaster, a = aufg.achsen[0], f = R.feldAus(Object.keys(aufg.vorgabe)[0]);
    if (a.typ === 'senkrecht') return f.s < a.pos ? { s0: 0, s1: a.pos - 1, z0: 0, z1: aufg.h - 1 } : { s0: a.pos, s1: aufg.b - 1, z0: 0, z1: aufg.h - 1 };
    return f.z < a.pos ? { s0: 0, s1: aufg.b - 1, z0: 0, z1: a.pos - 1 } : { s0: 0, s1: aufg.b - 1, z0: a.pos, z1: aufg.h - 1 };
  }
  /* Kästchenbild als SVG-Inhalt (Kästchen mit Farbe und Muster) */
  function kaestchen(bild, dx = 0, dz = 0) {
    let out = '';
    for (const [k, f] of Object.entries(bild)) {
      const [s, z] = k.split(',').map(Number);
      out += `<rect x="${s + dx}" y="${z + dz}" width="1" height="1" class="sf${f} falt-stueck"/>`;
      if (f > 1) out += `<rect x="${s + dx}" y="${z + dz}" width="1" height="1" fill="url(#sp-${f})"/>`;
    }
    return out;
  }
  const gitter = (x0, y0, b, h) => {
    let l = '';
    for (let x = x0; x <= x0 + b; x++) l += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y0 + h}"/>`;
    for (let y = y0; y <= y0 + h; y++) l += `<line x1="${x0}" y1="${y}" x2="${x0 + b}" y2="${y}"/>`;
    return `<g class="falt-gitter">${l}</g>`;
  };
  /* Kleines Bild des gefalteten Papiers mit dem ausgeschnittenen Stück */
  function papierBild(aufg, beschriftung) {
    const p = papierHaelfte(aufg), b = p.s1 - p.s0 + 1, h = p.z1 - p.z0 + 1, a = aufg.achsen[0];
    const falz = a.typ === 'senkrecht' ? [a.pos, p.z0, a.pos, p.z1 + 1] : [p.s0, a.pos, p.s1 + 1, a.pos];
    return `<svg viewBox="${p.s0 - 0.3} ${p.z0 - 0.3} ${b + 0.6} ${h + 0.6}" role="img" aria-label="${beschriftung}">${SW.spiegelMuster}
      <rect x="${p.s0}" y="${p.z0}" width="${b}" height="${h}" class="falt-papier"/>
      ${gitter(p.s0, p.z0, b, h)}${kaestchen(aufg.vorgabe)}
      <line x1="${falz[0]}" y1="${falz[1]}" x2="${falz[2]}" y2="${falz[3]}" class="falz"/></svg>`;
  }

  SW.spiegelArten.falt = function falt(aufg, ui) {
    const R = SW.spiegelRaster;
    const { sagen, zeigeHinweis } = ui;
    document.getElementById('farbwahl').hidden = true;

    /* ---------- zeichnen: Vorlage bei den Werkzeugen, Malen im leeren Raster ---------- */
    if (aufg.modus === 'zeichnen') {
      const vorlage = document.getElementById('vorlage');
      vorlage.innerHTML = `<p class="vorlage__titel">Gefaltet und geschnitten</p>${papierBild(aufg, 'Gefaltetes Papier, das farbige Stück wird ausgeschnitten')}`;
      vorlage.hidden = false;
      const a = aufg.achsen[0], entlang = a.typ === 'senkrecht' ? [0, 1] : [1, 0];
      const pruefen = gemalt => {
        const r = R.pruefenGanz(aufg, gemalt);
        const ziel = R.verschoben(R.loesung(aufg), entlang[0] * r.verschoben, entlang[1] * r.verschoben);
        return { ok: r.ok, fehlt: r.fehlt, zuviel: Object.keys(gemalt).filter(k => ziel[k] === undefined), falscheFarbe: [] };
      };
      const api = SW.spiegelArten.malen(aufg, ui, {
        vorgabe: {}, farben: [1], pruefen, linienKlasse: 'falz', erfolg: 'Richtig aufgeklappt!',
        spiegelBild: () => R.loesung(aufg)
      });
      zeigeHinweis('Male die ganze Figur, die beim Aufklappen entsteht.');
      return api;
    }

    /* ---------- wählen: Papier groß, drei Antworten ---------- */
    const rahmen = document.getElementById('malrahmen');
    const raster = document.getElementById('malraster');
    const svg = document.getElementById('achsen');
    const antworten = document.getElementById('antworten');
    const spiegelKnopf = document.querySelector('[data-aktion="spiegel"]');
    const p = papierHaelfte(aufg);
    document.getElementById('buehne').classList.add('spiegel-buehne--waehlen');
    let wahl = null, geprueft = false, spiegelAn = false, geschafft = false;
    const knoepfe = [];

    rahmen.style.setProperty('--spalten', aufg.b);
    rahmen.style.setProperty('--zeilen', aufg.h);
    raster.textContent = '';
    raster.setAttribute('role', 'img');
    raster.removeAttribute('aria-describedby');
    raster.setAttribute('aria-label', `Gefaltetes Papier. ${Object.keys(aufg.vorgabe).length} farbige Kästchen werden ausgeschnitten.`);
    for (let z = 0; z < aufg.h; z++) {
      const zeile = document.createElement('div');
      zeile.className = 'malzeile';
      for (let s = 0; s < aufg.b; s++) {
        const c = document.createElement('div'), k = `${s},${z}`, f = aufg.vorgabe[k];
        const papier = s >= p.s0 && s <= p.s1 && z >= p.z0 && z <= p.z1;
        c.className = 'zelle zelle--nur ' + (f ? `zelle--vorgabe f${f}` : papier ? 'zelle--papier' : 'zelle--weg');
        zeile.appendChild(c);
      }
      raster.appendChild(zeile);
    }
    svg.setAttribute('viewBox', `0 0 ${aufg.b} ${aufg.h}`);
    const [q1, q2] = R.achsenStrecke(aufg.achsen[0], aufg.b, aufg.h);
    svg.innerHTML = SW.spiegelMuster + `<g class="spiegelbilder"></g><line x1="${q1.x}" y1="${q1.y}" x2="${q2.x}" y2="${q2.y}" class="falz"/>`;

    /* Antworten: alle im gleichen Maßstab (so groß wie die größte), damit auch die Größe verglichen werden kann */
    antworten.textContent = '';
    const seite = Math.max(...aufg.optionen.map(o => { const r = R.rahmen(o); return Math.max(r.b, r.h); }));
    aufg.optionen.forEach((o, i) => {
      const r = R.rahmen(o), dx = (seite - r.b) / 2, dz = (seite - r.h) / 2;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'antwort';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.setAttribute('aria-label', `Figur ${i + 1}`);
      b.innerHTML = `<svg viewBox="-0.3 -0.3 ${seite + 0.6} ${seite + 0.6}" aria-hidden="true" focusable="false">${SW.spiegelMuster}${kaestchen(o, dx, dz)}</svg><span class="antwort__kreuz" aria-hidden="true"></span>`;
      b.addEventListener('click', () => waehlen(i));
      antworten.appendChild(b);
      knoepfe.push(b);
    });
    antworten.hidden = false;
    /* Pfeiltasten wandern in der Auswahl (wie bei Radioknöpfen) */
    antworten.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const i = (Math.max(0, knoepfe.indexOf(document.activeElement)) + d + knoepfe.length) % knoepfe.length;
      knoepfe[i].focus();
      waehlen(i);
    });

    function zeichnen() {
      knoepfe.forEach((b, i) => {
        b.setAttribute('aria-checked', String(wahl === i));
        b.tabIndex = (wahl === null ? i === 0 : wahl === i) ? 0 : -1;
      });
    }
    function waehlen(i) {
      if (geschafft) return;
      wahl = i;
      knoepfe.forEach(b => b.classList.remove('antwort--falsch'));
      zeichnen();
      zeigeHinweis('');
      sagen(`Figur ${i + 1} gewählt.`);
    }
    function fertigPruefen() {
      if (geschafft) return;
      if (wahl === null) { zeigeHinweis('Tippe zuerst eine der drei Figuren an.', true); return; }
      const ersterVersuch = !geprueft;
      if (!geprueft) { geprueft = true; spiegelKnopf.hidden = false; }
      if (R.pruefenWahl(aufg, wahl).ok) {
        geschafft = true;
        spiegelSetzen(true);   /* zum Schluss die aufgeklappte Figur zeigen */
        spiegelKnopf.hidden = true;
        ui.geschafft('Richtig! So sieht es aufgeklappt aus.');
        return;
      }
      knoepfe[wahl].classList.add('antwort--falsch');
      zeigeHinweis(`Diese Figur entsteht nicht. Schau noch einmal.${ersterVersuch ? ' Jetzt hilft dir der Spiegel.' : ''}`, true);
    }
    /* Spiegel an der Faltlinie: zeigt das Spiegelbild des Stücks, also die aufgeklappte Figur */
    function spiegelZeichnen() {
      const g = svg.querySelector('.spiegelbilder');
      g.textContent = '';
      if (!spiegelAn) return;
      const bild = R.bildSpiegeln(aufg.vorgabe, aufg.achsen[0]);
      for (const [k, f] of Object.entries(bild)) {
        const { s, z } = R.feldAus(k), r = document.createElementNS(NS, 'rect');
        r.setAttribute('x', s + 0.08); r.setAttribute('y', z + 0.08); r.setAttribute('width', 0.84); r.setAttribute('height', 0.84);
        r.setAttribute('class', `spiegelbild sf${f}`);
        g.appendChild(r);
      }
    }
    function spiegelSetzen(an) {
      spiegelAn = an;
      spiegelKnopf.setAttribute('aria-pressed', String(an));
      spiegelKnopf.querySelector('span').textContent = an ? 'Spiegel weg' : 'Spiegel';
      spiegelZeichnen();
    }
    document.querySelector('.spiegel-buehne').addEventListener('click', e => {
      const b = e.target.closest('[data-aktion]');
      if (!b) return;
      if (b.dataset.aktion === 'fertig') fertigPruefen();
      else if (b.dataset.aktion === 'spiegel') { spiegelSetzen(!spiegelAn); sagen(spiegelAn ? 'Der Spiegel zeigt, was beim Aufklappen entsteht.' : 'Spiegel weggestellt.'); }
    });

    document.querySelector('[data-aktion="zurueck"]').hidden = true;
    document.getElementById('mal-hilfe').textContent = 'Mit der Tabulatortaste erreichst du die drei Figuren. Die Pfeiltasten wechseln die Figur.';
    zeichnen();
    zeigeHinweis('Welche Figur entsteht beim Aufklappen? Tippe sie an.');

    return { aufg, waehlen, fertigPruefen, get wahl() { return wahl; }, get geschafft() { return geschafft; }, get spiegelAn() { return spiegelAn; } };
  };
})();
