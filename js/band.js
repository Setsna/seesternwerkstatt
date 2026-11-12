/* Seesternwerkstatt: Station Bandornamente, Steuerung (Etappe 4).
   Malen wie beim Spiegeln (js/spiegeln-malen.js). Die Vorlage ist gesperrt, eine dicke Linie trennt sie
   vom freien Teil. Hilfe nach dem ersten „Fertig?“: „Baustein“ rahmt jeden Baustein ein, in der Vorlage
   kräftig, im freien Teil gestrichelt (ohne Farben, verrät also nicht die Lösung).

   Adresse:
     band.html                               Auswahl (js/band-auswahl.js)
     band.html?stufe=leicht|mittel|knifflig  neue Runde (Startwert wird ausgewürfelt und in die Adresse geschrieben)
     band.html?stufe=…&saat=N&nr=1..6        Aufgabe nr der Runde. Gleicher Startwert = gleiche Runde.
     band.html?probe=1&stufe=…&saat=N        einzelne Aufgabe zum Ausprobieren (zählt nicht)
     band.html?eigenes=1                     Erfinde eigenes: Baustein in die ersten 4 Spalten malen,
                                             „Verschieben“ setzt ihn Schritt für Schritt fort. Keine Prüfung.

   Gemerkt (nur mit gewähltem Kind): stationen.band.runden = { leicht: Anzahl, … }, letzte = 'stufe:saat'
   (eine Runde zählt nur einmal). Stempel band:<stufe> nach der ersten Runde. */
(() => {
  'use strict';
  const BA = SW.bandAufgaben, S = SW.speicher;
  const hinweis = document.getElementById('hinweis');
  const live = document.getElementById('live');
  const erfolg = document.getElementById('erfolg');
  const rahmen = document.getElementById('malrahmen');
  const svg = document.getElementById('achsen');
  const NS = 'http://www.w3.org/2000/svg';
  const STUFE = { leicht: 'Leicht', mittel: 'Mittel', knifflig: 'Knifflig' };
  const PRO_RUNDE = 6;
  const s_ = k => Number(k.split(',')[0]);
  const z_ = k => Number(k.split(',')[1]);
  const neueSaat = () => 1 + Math.floor(Math.random() * 999999999);

  const sagen = t => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 30); };
  const zeigeHinweis = (t, vorlesen = false) => { hinweis.textContent = t || ''; if (vorlesen && t) sagen(t); };
  const el = (name, attr) => { const e = document.createElementNS(NS, name); for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v); return e; };
  /* Rundenstand als sechs Kreise (geschafft gefüllt, aktuell weiß). Nur Bild, die Marke sagt es in Worten. */
  function rundenPunkte(nr, n) {
    const r = document.createElement('span');
    r.className = 'runden-punkte';
    r.setAttribute('aria-hidden', 'true');
    for (let i = 1; i <= n; i++) { const p = document.createElement('span'); if (i < nr) p.className = 'da'; else if (i === nr) p.className = 'jetzt'; r.appendChild(p); }
    return r;
  }
  function kopf(marke, satz, punkte) {
    const a = document.getElementById('auftrag');
    a.textContent = '';
    const m = document.createElement('span');
    m.className = 'auftrag-marke';
    m.textContent = marke;
    if (punkte) a.append(punkte);
    a.append(m, ' ' + satz);
    document.title = `${marke.split(' · ')[0]} – Bandornamente – Seesternwerkstatt`;
  }
  /* Grenze der Vorlage (bleibt stehen, die Hilfe wird darüber gezeichnet) */
  function grenze(punkte) {
    svg.appendChild(el('polyline', { points: punkte.map(p => p.join(',')).join(' '), class: 'band-grenze', fill: 'none' }));
  }

  const q = new URLSearchParams(location.search);
  const stufe = ['leicht', 'mittel', 'knifflig'].includes(q.get('stufe')) ? q.get('stufe') : null;
  const probe = q.has('probe');

  /* ================= Auswahl ================= */
  if (!q.has('eigenes') && !stufe) {
    document.getElementById('buehne').hidden = true;
    document.getElementById('auftrag').textContent = 'Wähle eine Stufe.';
    if (SW.bandAuswahl) SW.bandAuswahl();
    return;
  }
  document.getElementById('zurueck-link').href = 'band.html';
  document.getElementById('zurueck-link').textContent = '← Auswahl';

  /* ================= Erfinde eigenes ================= */
  if (q.has('eigenes')) {
    const BREIT = 4, b = BA.B, h = BA.H, MAX = Math.ceil((b - BREIT) / BREIT);
    let kopien = 0, api = null;
    rahmen.classList.add('malrahmen--band');
    kopf('Erfinde eigenes', 'Male einen Baustein und verschiebe ihn.');
    function kopienZeichnen(neu = false) {
      svg.querySelectorAll('.kopien').forEach(n => n.remove());
      const g = el('g', { class: 'kopien' });
      for (let i = 1; i <= kopien; i++) {
        const gi = el('g', { class: 'kopie' + (neu && i === kopien ? ' kopie--neu' : '') });
        for (const [k, f] of Object.entries(api.gemalt)) {
          const s = s_(k) + i * BREIT, z = z_(k);
          if (s >= b) continue;
          gi.appendChild(el('rect', { x: s, y: z, width: 1, height: 1, class: `sf${f} falt-stueck` }));
          if (f > 1) gi.appendChild(el('rect', { x: s, y: z, width: 1, height: 1, fill: `url(#sp-${f})` }));
        }
        g.appendChild(gi);
      }
      svg.appendChild(g);
    }
    api = SW.spiegelArten.malen({ art: 'band', b, h, achsen: [], vorgabe: {} }, { sagen, zeigeHinweis, geschafft() {} }, {
      vorgabe: {}, farben: [1, 2, 3],
      gesperrt: k => s_(k) >= BREIT,
      geaendert: () => kopienZeichnen()
    });
    grenze([[BREIT, 0], [BREIT, h]]);
    document.querySelector('[data-aktion="fertig"]').hidden = true;
    document.querySelector('[data-aktion="spiegel"]').remove();   /* keine Hilfe, also auch kein freigehaltener Platz */
    const verschieben = document.querySelector('[data-aktion="verschieben"]');
    const neuKnopf = document.querySelector('[data-aktion="neu"]');
    verschieben.hidden = false;
    neuKnopf.hidden = false;
    zeigeHinweis('Male links einen Baustein. Dann tippe auf „Verschieben“.');
    document.querySelector('.spiegel-buehne').addEventListener('click', e => {
      const k = e.target.closest('[data-aktion]');
      if (!k) return;
      if (k.dataset.aktion === 'verschieben') {
        if (!Object.keys(api.gemalt).length) { zeigeHinweis('Male zuerst etwas in die ersten vier Spalten.', true); return; }
        if (kopien >= MAX) { zeigeHinweis('Das Band ist voll. Du kannst den Baustein noch ändern.', true); return; }
        kopien++;
        kopienZeichnen(true);
        zeigeHinweis(kopien >= MAX ? 'Fertig ist dein Bandornament! Ändere den Baustein, das ganze Band ändert sich mit.' : `${kopien}-mal verschoben.`, true);
      } else if (k.dataset.aktion === 'neu') {
        for (const x of Object.keys(api.gemalt)) api.setzen(x, 0);
        kopien = 0;
        kopienZeichnen();
        zeigeHinweis('Alles leer. Male einen neuen Baustein.', true);
      }
    });
    SW.band = Object.assign(api, { eigenes: { get kopien() { return kopien; }, MAX, BREIT } });
    if (SW.rahmenBreite) SW.rahmenBreite();
    return;
  }

  /* ================= Aufgabe: Runde oder Probe ================= */
  let aufg, marke, saat, nr = 1;
  if (probe) {
    saat = Math.max(1, Math.floor(Number(q.get('saat'))) || 1);
    aufg = BA.eine(stufe, saat);
    marke = `Probe ${saat} · ${STUFE[stufe]}`;
  } else {
    saat = Math.floor(Number(q.get('saat')));
    nr = Math.floor(Number(q.get('nr')));
    if (!(saat >= 1) || !(nr >= 1 && nr <= PRO_RUNDE)) {
      saat = saat >= 1 ? saat : neueSaat();
      nr = 1;
      history.replaceState(null, '', `band.html?stufe=${stufe}&saat=${saat}&nr=1`);
    }
    aufg = BA.runde(stufe, saat).aufgaben[nr - 1];
    marke = `Aufgabe ${nr} von ${PRO_RUNDE} · ${STUFE[stufe]}`;
  }
  const parkett = aufg.art === 'parkett';
  let kb, kh;
  if (parkett) ({ px: kb, py: kh } = BA.perioden(aufg.vorgabe, aufg.vorlageB, aufg.vorlageH));
  else { kb = BA.periode(aufg.vorgabe, aufg.vorlage, aufg.h); kh = aufg.h; }
  if (!parkett) rahmen.classList.add('malrahmen--band');
  kopf(marke, parkett ? 'Setze das Parkettmuster nach rechts und nach unten fort.' : 'Setze das Bandornament bis zum Ende fort.', probe ? null : rundenPunkte(nr, PRO_RUNDE));

  /* Hilfe „Baustein“: Rahmen um jeden Baustein */
  function bausteineZeichnen(ziel) {
    const g = el('g', { class: 'hilfe' });
    for (let s = 0; s + kb <= aufg.b; s += kb) for (let z = 0; z + kh <= aufg.h; z += kh) {
      const inVorlage = parkett ? s < aufg.vorlageB && z < aufg.vorlageH : s < aufg.vorlage;
      g.appendChild(el('rect', { x: s + 0.06, y: z + 0.06, width: kb - 0.12, height: kh - 0.12, rx: 0.15, class: inVorlage ? 'baustein' : 'baustein baustein--leer' }));
    }
    ziel.appendChild(g);
  }

  /* Runde merken. Gibt true zurück, wenn dabei ein neuer Stempel verdient wurde. */
  function rundeMerken() {
    if (!S || !S.aktiv()) return false;
    const stand = S.stationStand('band');
    stand.runden = stand.runden && typeof stand.runden === 'object' ? stand.runden : {};
    const kennung = `${stufe}:${saat}`;
    if (stand.letzte !== kennung) {
      stand.runden[stufe] = (Number(stand.runden[stufe]) || 0) + 1;
      stand.letzte = kennung;
      S.stationSetzen('band', stand);
    }
    return S.stempelGeben('band', stufe).neu;
  }
  function geschafft(satz) {
    document.getElementById('buehne').classList.add('geschafft');
    const gross = erfolg.querySelector('.erfolg__gross'), stempelZeile = document.getElementById('erfolg-stempel');
    const w = document.getElementById('weiter'), auswahl = document.getElementById('zur-auswahl');
    let ansage = satz;
    gross.textContent = satz;
    if (probe) { w.href = `band.html?probe=1&stufe=${stufe}&saat=${saat + 1}`; w.textContent = 'Nächste Aufgabe'; }
    else if (nr < PRO_RUNDE) { w.href = `band.html?stufe=${stufe}&saat=${saat}&nr=${nr + 1}`; w.textContent = 'Nächste Aufgabe'; }
    else {
      const neu = rundeMerken();
      gross.textContent = 'Runde geschafft!';
      ansage = `${satz} Runde geschafft!`;
      if (neu) { stempelZeile.textContent = `Neuer Stempel: ${STUFE[stufe]}!`; stempelZeile.hidden = false; ansage += ` Neuer Stempel: ${STUFE[stufe]}!`; }
      w.href = `band.html?stufe=${stufe}&saat=${neueSaat()}&nr=1`;
      w.textContent = 'Neue Runde';
      auswahl.hidden = false;
    }
    erfolg.hidden = false;
    zeigeHinweis('');
    sagen(ansage);
  }

  SW.band = SW.spiegelArten.malen({ ...aufg, achsen: [] }, { sagen, zeigeHinweis, geschafft }, {
    vorgabe: aufg.vorgabe,
    gesperrt: k => BA.imVorlagebereich(aufg, k),
    pruefen: gemalt => BA.pruefen(aufg, gemalt),
    erfolg: 'Richtig fortgesetzt!',
    hilfe: {
      name: 'Baustein', satz: 'Jetzt hilft dir der Baustein.',
      an: 'Die Rahmen zeigen, welcher Teil sich wiederholt.', aus: 'Rahmen weg.',
      zeichnen: bausteineZeichnen
    }
  });
  if (parkett) grenze([[aufg.vorlageB, 0], [aufg.vorlageB, aufg.vorlageH], [0, aufg.vorlageH]]);
  else grenze([[aufg.vorlage, 0], [aufg.vorlage, aufg.h]]);
  zeigeHinweis(parkett ? 'Male rechts und unten weiter. Das Muster wiederholt sich in alle Richtungen.' : 'Male rechts von der dicken Linie weiter. Das Muster wiederholt sich.');
  SW.band.band = { aufg, stufe, saat, nr, probe, kb, kh };
  if (SW.rahmenBreite) SW.rahmenBreite();   /* Sprechblase so breit wie der fertige Rahmen */
})();
