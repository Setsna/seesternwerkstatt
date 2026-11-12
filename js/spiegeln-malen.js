/* Seesternwerkstatt: Station Spiegeln, Aufgabenart „Malen“ (Ergänzen, nacheinander spiegeln).
   Bedienmuster nach dem Pixelraster des Perlentaucher (nachgebaut, nicht übernommen):
   Tippen oder Wischen malt, jedes Kästchen nur einmal je Strich, Rückgängig nimmt einen ganzen Strich zurück.
   Anders als dort: Kästchen sind echte Knöpfe (Tastatur), Vorgabe-Kästchen sind gesperrt.
   Tippt man auf ein Kästchen, das schon die gewählte Farbe hat, wird es (für diesen Strich) wieder leer.
   Prüfen: erst „Fertig?“. Danach steht der Spiegel als Hilfe bereit (Entscheidung Ingo).

   Wird von js/spiegeln.js gestartet: SW.spiegelArten.malen(aufgabe, ui, opt).
   opt (für andere Aufgabenarten, z. B. Faltschnitt zeichnen in js/spiegeln-falt.js):
     vorgabe      gesperrte Kästchen (Standard: aufgabe.vorgabe)
     farben       wählbare Farben (Standard: die Farben der Vorgabe)
     pruefen      gemalt → { ok, fehlt (Zahl oder Liste), zuviel: [k], falscheFarbe: [k] }
     spiegelBild  () → Bild, das der Spiegel zeigt (Standard: Lösung ohne Vorgabe)
     erfolg       Satz auf der Erfolgskarte
     linienKlasse Klasse der Linien (Standard 'achse', Faltlinie 'falz')
     gesperrt     k → true: Kästchen ist gesperrt, auch wenn es leer ist (Vorlage beim Bandornament)
     geaendert    () → wird nach jeder Änderung am Bild aufgerufen (Erfinde eigenes beim Bandornament)
     hilfe        statt Spiegel eine andere Hilfe: { name, satz, an, aus, zeichnen(svg) } (Baustein beim Bandornament)
   Auch die Station Bandornamente (band.html) benutzt dieses Malraster. */
(() => {
  'use strict';
  SW.spiegelArten = SW.spiegelArten || {};
  /* Etappe 6c: Die Sprechblase unter der Fläche ist so breit wie der Rahmen (gilt für alle Aufgabenarten) */
  const buehne = document.getElementById('buehne'), rahmenEl = document.getElementById('malrahmen');
  if (buehne && rahmenEl) {
    const breite = () => buehne.style.setProperty('--rahmen-b', rahmenEl.offsetWidth + 'px');
    SW.rahmenBreite = breite;   /* von spiegeln.js und band.js nach dem Aufbau aufgerufen */
    /* sofort nach dem Aufbau, bei jeder Größenänderung und beim Drehen des iPads */
    requestAnimationFrame(breite); setTimeout(breite, 0); window.addEventListener('resize', breite);
    if (window.ResizeObserver) new ResizeObserver(breite).observe(rahmenEl);
  }
  /* Muster für Spiegelbilder in der Zeichnung (wie bei den Kästchen: Streifen, Punkte) */
  SW.spiegelMuster = `<defs>
    <pattern id="sp-2" width="0.18" height="0.18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="0.18" stroke="#0b3155" stroke-opacity=".35" stroke-width=".06"/></pattern>
    <pattern id="sp-3" width="0.2" height="0.2" patternUnits="userSpaceOnUse"><circle cx="0.1" cy="0.1" r="0.035" fill="#0b3155" fill-opacity=".4"/></pattern>
  </defs>`;
  SW.spiegelArten.malen = function malen(aufg, ui, opt = {}) {
  const R = SW.spiegelRaster;
  const raster = document.getElementById('malraster');
  const achsenSvg = document.getElementById('achsen');
  const farbwahl = document.getElementById('farbwahl');
  const spiegelKnopf = document.querySelector('[data-aktion="spiegel"]');
  const NS = 'http://www.w3.org/2000/svg';
  const FARBNAME = { 1: 'blau', 2: 'lila', 3: 'gelb' };
  const { sagen, zeigeHinweis } = ui;
  const vorgabe = opt.vorgabe || aufg.vorgabe;
  const gesperrt = k => vorgabe[k] !== undefined || !!(opt.gesperrt && opt.gesperrt(k));
  const farben = opt.farben || [...new Set(Object.values(vorgabe))].sort();   /* nur Farben, die in der Aufgabe vorkommen */

  /* ---------- Zustand ---------- */
  const gemalt = {};          /* "s,z" → Farbe, nur vom Kind gemalt */
  const schritte = [];        /* Rückgängig: je Strich eine Liste { k, vorher } */
  let farbe = farben[0], fokus = null, strich = null, geprueft = false, spiegelAn = false, geschafft = false;
  const knopf = {};           /* "s,z" → <button> */

  /* ---------- Aufbau ---------- */
  function zellText(k) {
    const { s, z } = R.feldAus(k);
    const f = vorgabe[k] || gemalt[k];
    return `Spalte ${s + 1}, Zeile ${z + 1}, ${f ? FARBNAME[f] : 'leer'}${gesperrt(k) ? ', vorgegeben' : ''}`;
  }
  function rasterBauen() {
    const rahmen = document.getElementById('malrahmen');
    rahmen.style.setProperty('--spalten', aufg.b);
    rahmen.style.setProperty('--zeilen', aufg.h);
    raster.textContent = '';
    for (let z = 0; z < aufg.h; z++) {
      const zeile = document.createElement('div');
      zeile.setAttribute('role', 'row');
      zeile.className = 'malzeile';
      for (let s = 0; s < aufg.b; s++) {
        const k = `${s},${z}`, b = document.createElement('button');
        b.type = 'button';
        b.className = 'zelle';
        b.dataset.k = k;
        b.setAttribute('role', 'gridcell');
        b.tabIndex = -1;
        if (gesperrt(k)) { b.classList.add(vorgabe[k] ? 'zelle--vorgabe' : 'zelle--gesperrt'); b.setAttribute('aria-disabled', 'true'); }
        knopf[k] = b;
        zeile.appendChild(b);
        zelleZeichnen(k);
      }
      raster.appendChild(zeile);
    }
    fokusSetzen('0,0', false);
  }
  function zelleZeichnen(k) {
    const b = knopf[k], f = vorgabe[k] || gemalt[k] || 0;
    b.className = b.className.replace(/\bf\d\b/g, '').trim();
    if (f) b.classList.add('f' + f);
    b.setAttribute('aria-label', zellText(k));
  }
  function achsenZeichnen() {
    achsenSvg.setAttribute('viewBox', `0 0 ${aufg.b} ${aufg.h}`);
    achsenSvg.innerHTML = SW.spiegelMuster;
    for (const a of aufg.achsen) {
      const [p, q] = R.achsenStrecke(a, aufg.b, aufg.h), l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', p.x); l.setAttribute('y1', p.y); l.setAttribute('x2', q.x); l.setAttribute('y2', q.y);
      l.setAttribute('class', opt.linienKlasse || 'achse');
      achsenSvg.appendChild(l);
    }
  }
  function farbenBauen() {
    farbwahl.textContent = '';
    for (const f of farben) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `farbknopf f${f}`;
      b.dataset.aktion = 'farbe';
      b.dataset.farbe = f;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', FARBNAME[f]);
      b.setAttribute('aria-keyshortcuts', String(f));
      farbwahl.appendChild(b);
    }
    farbwahl.hidden = farben.length < 2;   /* bei nur einer Farbe keine Auswahl nötig */
    farbeWaehlen(farbe);
  }
  function farbeWaehlen(f) {
    farbe = f;
    for (const b of farbwahl.children) b.setAttribute('aria-checked', String(Number(b.dataset.farbe) === f));
  }

  /* ---------- Malen ---------- */
  /* Ein Kästchen setzen (Farbe oder leer). Gibt false zurück, wenn nichts geändert wurde. */
  function setzen(k, neu) {
    if (!knopf[k] || gesperrt(k) || geschafft) return false;
    const vorher = gemalt[k] || 0;
    if (vorher === neu) return false;
    if (neu) gemalt[k] = neu; else delete gemalt[k];
    if (strich) strich.aenderungen.push({ k, vorher });
    knopf[k].classList.remove('zelle--falsch');
    zelleZeichnen(k);
    spiegelZeichnen();
    if (opt.geaendert) opt.geaendert();
    return true;
  }
  function strichBeginnen(k) {
    if (!knopf[k] || gesperrt(k)) { strich = null; return; }
    /* Erstes Kästchen entscheidet: hat es schon die gewählte Farbe, wird dieser Strich zum Radieren */
    strich = { modus: gemalt[k] === farbe ? 0 : farbe, aenderungen: [], gesehen: new Set() };
    strichWeiter(k);
  }
  function strichWeiter(k) {
    if (!strich || !k || strich.gesehen.has(k)) return;
    strich.gesehen.add(k);
    setzen(k, strich.modus);
  }
  function strichEnde() {
    if (strich && strich.aenderungen.length) schritte.push(strich.aenderungen);
    strich = null;
  }
  function rueckgaengig() {
    const letzte = schritte.pop();
    if (!letzte) { zeigeHinweis('Es gibt nichts zurückzunehmen.', true); return; }
    for (const { k, vorher } of letzte.slice().reverse()) {
      if (vorher) gemalt[k] = vorher; else delete gemalt[k];
      knopf[k].classList.remove('zelle--falsch');
      zelleZeichnen(k);
    }
    spiegelZeichnen();
    if (opt.geaendert) opt.geaendert();
    zeigeHinweis('');
    sagen('Zurückgenommen.');
  }
  const zelleUnter = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest ? (el.closest('.zelle') || {}).dataset?.k : null; };

  /* Schnelles Wischen liefert nur wenige Punkte: Die Strecke dazwischen wird in Schritten von
     einem Drittel Kästchen abgegangen, damit kein Kästchen übersprungen wird. */
  /* Beim Wischen wird das Kästchen aus der Lage berechnet (Raster einmal beim Aufsetzen vermessen),
     statt bei jeder Bewegung das Layout abzufragen (Etappe 6b). */
  let zeiger = null, letzterPunkt = null, mass = null;
  const zelleBei = (x, y) => {
    const s = Math.floor((x - mass.left) / mass.zb), z = Math.floor((y - mass.top) / mass.zh);
    return s >= 0 && z >= 0 && s < aufg.b && z < aufg.h ? `${s},${z}` : null;
  };
  raster.addEventListener('pointerdown', e => {
    const k = zelleUnter(e.clientX, e.clientY);
    if (!k || zeiger !== null) return;
    e.preventDefault();
    zeiger = e.pointerId;
    letzterPunkt = { x: e.clientX, y: e.clientY };
    const r = raster.getBoundingClientRect();
    mass = { left: r.left, top: r.top, zb: r.width / aufg.b, zh: r.height / aufg.h };
    /* Kann der Browser den Zeiger nicht festhalten, läuft der Strich trotzdem (sonst bliebe das Raster gesperrt) */
    try { raster.setPointerCapture(e.pointerId); } catch (x) { /* ohne Festhalten weiter */ }
    fokusSetzen(k, false);
    strichBeginnen(k);
  });
  raster.addEventListener('pointermove', e => {
    if (e.pointerId !== zeiger) return;
    const seite = Math.min(mass.zb, mass.zh) / 3 || 10;
    const dx = e.clientX - letzterPunkt.x, dy = e.clientY - letzterPunkt.y;
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / seite));
    for (let i = 1; i <= n; i++) strichWeiter(zelleBei(letzterPunkt.x + dx * i / n, letzterPunkt.y + dy * i / n));
    letzterPunkt = { x: e.clientX, y: e.clientY };
  });
  const zeigerEnde = e => { if (e.pointerId !== zeiger) return; zeiger = null; strichEnde(); };
  raster.addEventListener('pointerup', zeigerEnde);
  raster.addEventListener('pointercancel', zeigerEnde);
  raster.addEventListener('lostpointercapture', zeigerEnde);

  /* ---------- Tastatur: ein Kästchen ist erreichbar (roving tabindex), Pfeile wandern ---------- */
  function fokusSetzen(k, setzen = true) {
    if (fokus && knopf[fokus]) knopf[fokus].tabIndex = -1;
    fokus = k;
    knopf[k].tabIndex = 0;
    if (setzen) knopf[k].focus();
  }
  raster.addEventListener('keydown', e => {
    const b = e.target.closest('.zelle');
    if (!b) return;
    const { s, z } = R.feldAus(b.dataset.k);
    const ziel = { ArrowLeft: [s - 1, z], ArrowRight: [s + 1, z], ArrowUp: [s, z - 1], ArrowDown: [s, z + 1], Home: [0, z], End: [aufg.b - 1, z] }[e.key];
    if (ziel) {
      e.preventDefault();
      const [ns, nz] = ziel;
      if (ns >= 0 && nz >= 0 && ns < aufg.b && nz < aufg.h) fokusSetzen(`${ns},${nz}`);
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const k = b.dataset.k;
      if (gesperrt(k)) { sagen('Dieses Kästchen ist vorgegeben.'); return; }
      strichBeginnen(k); strichEnde();
      sagen(zellText(k));
      return;
    }
    if (farben.includes(Number(e.key))) { e.preventDefault(); farbeWaehlen(Number(e.key)); sagen(`Farbe ${FARBNAME[farbe]}.`); }
  });

  /* ---------- Prüfen ---------- */
  function fertigPruefen() {
    if (geschafft) return;
    const r = opt.pruefen ? opt.pruefen(gemalt) : R.pruefen(aufg, gemalt);
    const fehlt = typeof r.fehlt === 'number' ? r.fehlt : r.fehlt.length;
    for (const k of Object.keys(knopf)) knopf[k].classList.remove('zelle--falsch');
    /* Noch nichts gemalt: zählt nicht als Versuch, die Hilfe bleibt noch zu (Etappe 6b) */
    if (!r.ok && !Object.keys(gemalt).length) { zeigeHinweis('Fang einfach an. Tippe die Kästchen an.', true); return; }
    const ersterVersuch = !geprueft;
    if (!geprueft) { geprueft = true; spiegelKnopf.hidden = false; }
    if (r.ok) {
      geschafft = true;
      spiegelSetzen(false);
      ui.geschafft(opt.erfolg || 'Richtig gespiegelt!');
      return;
    }
    /* Falsch gemalte Kästchen werden markiert. Wo etwas fehlt, verrät die Seite nicht. */
    for (const k of r.zuviel.concat(r.falscheFarbe)) knopf[k].classList.add('zelle--falsch');
    /* kurz (Etappe 6c): „9 Kästchen fehlen, 1 zu viel.“ – das Wort „Kästchen“ nur im ersten Teil */
    const teile = [];
    if (fehlt) teile.push(fehlt === 1 ? '1 Kästchen fehlt' : `${fehlt} Kästchen fehlen`);
    const k = () => teile.length ? '' : ' Kästchen';
    if (r.zuviel.length) teile.push(`${r.zuviel.length}${k()} zu viel`);
    if (r.falscheFarbe.length) teile.push(`${r.falscheFarbe.length}${k()} mit falscher Farbe`);
    /* „Fast!“ nur, wenn wirklich wenig fehlt (1 bis 2 Fehler). Der Hilfe-Satz nur beim ersten Versuch. */
    const fehler = fehlt + r.zuviel.length + r.falscheFarbe.length;
    const anfang = fehler <= 2 ? 'Fast!' : 'Schau noch mal:';
    const hilfe = ersterVersuch ? ' ' + (opt.hilfe ? opt.hilfe.satz : 'Probier den Spiegel!') : '';
    zeigeHinweis(`${anfang} ${teile.join(', ')}.${hilfe}`, true);
  }

  /* ---------- Spiegel (erst nach dem ersten „Fertig?“) ---------- */
  /* Zeigt, was ein Spiegel an der Achse zeigen würde: das Spiegelbild der Vorgabe, durchscheinend. */
  function spiegelZeichnen() {
    achsenSvg.querySelectorAll('.spiegelbild, .hilfe').forEach(n => n.remove());
    if (!spiegelAn) return;
    if (opt.hilfe) { opt.hilfe.zeichnen(achsenSvg); return; }
    const l = opt.spiegelBild ? opt.spiegelBild() : R.loesung(aufg);
    for (const [k, f] of Object.entries(l)) {
      if (vorgabe[k]) continue;
      const { s, z } = R.feldAus(k), r = document.createElementNS(NS, 'rect');
      r.setAttribute('x', s + 0.08); r.setAttribute('y', z + 0.08); r.setAttribute('width', 0.84); r.setAttribute('height', 0.84);
      r.setAttribute('class', `spiegelbild sf${f}`);
      achsenSvg.insertBefore(r, achsenSvg.querySelector(':scope > line'));
      if (f > 1) {   /* Muster wie bei den Kästchen, damit Farben auch bei Farbschwäche unterscheidbar sind */
        const m = r.cloneNode();
        m.setAttribute('class', 'spiegelbild spiegelbild--muster');
        m.setAttribute('fill', `url(#sp-${f})`);
        achsenSvg.insertBefore(m, achsenSvg.querySelector(':scope > line'));
      }
    }
  }
  function spiegelSetzen(an) {
    spiegelAn = an;
    spiegelKnopf.setAttribute('aria-pressed', String(an));
    const name = opt.hilfe ? opt.hilfe.name : 'Spiegel';
    spiegelKnopf.querySelector('span').textContent = an ? `${name} weg` : name;
    spiegelZeichnen();
  }

  /* ---------- Knöpfe ---------- */
  document.querySelector('.spiegel-buehne').addEventListener('click', e => {
    const b = e.target.closest('[data-aktion]');
    if (!b) return;
    const a = b.dataset.aktion;
    if (a === 'farbe') farbeWaehlen(Number(b.dataset.farbe));
    else if (a === 'zurueck') rueckgaengig();
    else if (a === 'fertig') fertigPruefen();
    else if (a === 'spiegel') { spiegelSetzen(!spiegelAn); sagen(opt.hilfe ? (spiegelAn ? opt.hilfe.an : opt.hilfe.aus) : spiegelAn ? 'Der Spiegel zeigt das Spiegelbild.' : 'Spiegel weggestellt.'); }
  });

  /* ---------- Start ---------- */
  document.getElementById('mal-hilfe').textContent = 'Mit den Pfeiltasten gehst du von Kästchen zu Kästchen. Die Leertaste malt das Kästchen an oder macht es wieder leer. Die Zahlen 1, 2 und 3 wählen die Farbe.';
  rasterBauen();
  achsenZeichnen();
  farbenBauen();
  zeigeHinweis(farben.length > 1 ? 'Wähle eine Farbe und male die Kästchen an.' : 'Male die Kästchen an. Nochmal tippen macht sie wieder leer.');

  /* Für Rauchtest und Fehlersuche */
  return { aufg, gemalt, setzen, fertigPruefen, rueckgaengig, strichBeginnen, strichWeiter, strichEnde, farbeWaehlen,
    get geschafft() { return geschafft; }, get spiegelAn() { return spiegelAn; } };
  };
})();
