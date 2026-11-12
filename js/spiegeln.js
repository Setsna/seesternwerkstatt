/* Seesternwerkstatt: Station Spiegeln, Steuerung (Etappe 3c).
   Wählt die Aufgabe, schreibt den Auftrag, zeigt die Erfolgskarte, zählt Runden und gibt Stempel.
   Die Bedienung je Aufgabenart steht in js/spiegeln-malen.js (Ergänzen, nacheinander spiegeln),
   js/spiegeln-achsen.js (Achsen finden) und js/spiegeln-falt.js (Faltschnitt wählen und zeichnen).
   Die Auswahl der Stufe steht in js/spiegeln-auswahl.js.

   Adresse:
     spiegeln.html                              Auswahl (Stufe wählen)
     spiegeln.html?stufe=leicht                 neue Runde (Startwert wird ausgewürfelt und in die Adresse geschrieben)
     spiegeln.html?stufe=…&saat=N&nr=1..6       Aufgabe nr der Runde. Gleicher Startwert = gleiche Runde.
     spiegeln.html?art=ergaenzen|kreuz|achsen|buchstabe|faltWaehlen|faltZeichnen&stufe=…&saat=N
                                                einzelne Aufgabe zum Ausprobieren (zählt nicht, kein Stempel)

   Gemerkt (nur mit gewähltem Kind): stationen.spiegeln.runden = { leicht: Anzahl, … },
   letzte = 'stufe:saat' (damit eine Runde nicht doppelt zählt). Stempel spiegeln:<stufe> nach der ersten Runde. */
(() => {
  'use strict';
  const A = SW.spiegelAufgaben, S = SW.speicher, C = SW.config;
  const hinweis = document.getElementById('hinweis');
  const live = document.getElementById('live');
  const erfolg = document.getElementById('erfolg');
  const STUFE = { leicht: 'Leicht', mittel: 'Mittel', knifflig: 'Knifflig' };
  const PRO_RUNDE = A.PLAN.leicht.length;

  const sagen = t => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 30); };
  const zeigeHinweis = (t, vorlesen = false) => { hinweis.textContent = t || ''; if (vorlesen && t) sagen(t); };
  const neueSaat = () => 1 + Math.floor(Math.random() * 999999999);

  /* ---------- Was soll gezeigt werden? ---------- */
  const q = new URLSearchParams(location.search);
  const stufe = C.stufen.includes(q.get('stufe')) ? q.get('stufe') : null;
  const ARTEN = ['ergaenzen', 'kreuz', 'achsen', 'buchstabe', 'faltWaehlen', 'faltZeichnen'];
  const probe = ARTEN.includes(q.get('art'));

  if (!probe && !stufe) {   /* Auswahl */
    document.getElementById('buehne').hidden = true;
    document.getElementById('auftrag').textContent = 'Wähle eine Stufe.';
    if (SW.spiegelnAuswahl) SW.spiegelnAuswahl();
    return;
  }
  document.getElementById('zurueck-link').href = 'spiegeln.html';
  document.getElementById('zurueck-link').textContent = '← Auswahl';

  let aufg, marke, saat, nr = 1;
  if (probe) {
    const art = q.get('art');
    const st = stufe || (art === 'kreuz' ? 'knifflig' : 'mittel');
    saat = Math.max(1, Math.floor(Number(q.get('saat'))) || 1);
    aufg = A.eine(art, st, saat);
    marke = `Probe ${saat} · ${STUFE[st]}`;
  } else {
    saat = Math.floor(Number(q.get('saat')));
    nr = Math.floor(Number(q.get('nr')));
    if (!(saat >= 1) || !(nr >= 1 && nr <= PRO_RUNDE)) {
      /* Neue Runde: Startwert in die Adresse, damit Neuladen dieselbe Aufgabe zeigt */
      saat = saat >= 1 ? saat : neueSaat();
      nr = 1;
      history.replaceState(null, '', `spiegeln.html?stufe=${stufe}&saat=${saat}&nr=1`);
    }
    aufg = A.runde(stufe, saat).aufgaben[nr - 1];
    marke = `Aufgabe ${nr} von ${PRO_RUNDE} · ${STUFE[stufe]}`;
  }
  const auftrag = aufg.art === 'faltschnitt' ? (aufg.modus === 'waehlen' ? 'Welche Figur entsteht beim Aufklappen?' : 'Zeichne die Figur, die beim Aufklappen entsteht.')
    : aufg.art === 'achsen' ? (aufg.buchstabe ? 'Tippe alle Spiegelachsen des Buchstabens an.' : 'Tippe alle Spiegelachsen an.')
    : aufg.achsen.length > 1 ? 'Spiegle nacheinander an beiden Achsen.' : 'Ergänze spiegelbildlich.';


  /* Rundenstand als sechs Kreise (geschafft gefüllt, aktuell weiß). Nur Bild, die Marke sagt es in Worten. */
  function rundenPunkte(nr, n) {
    const r = document.createElement('span');
    r.className = 'runden-punkte';
    r.setAttribute('aria-hidden', 'true');
    for (let i = 1; i <= n; i++) { const p = document.createElement('span'); if (i < nr) p.className = 'da'; else if (i === nr) p.className = 'jetzt'; r.appendChild(p); }
    return r;
  }

  /* ---------- Kopf ---------- */
  const a = document.getElementById('auftrag');
  a.textContent = '';
  const m = document.createElement('span');
  m.className = 'auftrag-marke';
  m.textContent = marke;
  if (!probe) a.append(rundenPunkte(nr, PRO_RUNDE));
  a.append(m, ' ' + auftrag);
  document.title = `${marke.split(' · ')[0]} – Spiegeln – Seesternwerkstatt`;

  /* ---------- Runde merken ---------- */
  /* Gibt true zurück, wenn dabei ein neuer Stempel verdient wurde */
  function rundeMerken() {
    if (!S || !S.aktiv()) return false;
    const stand = S.stationStand('spiegeln');
    stand.runden = stand.runden && typeof stand.runden === 'object' ? stand.runden : {};
    const kennung = `${stufe}:${saat}`;
    if (stand.letzte !== kennung) {
      stand.runden[stufe] = (Number(stand.runden[stufe]) || 0) + 1;
      stand.letzte = kennung;
      S.stationSetzen('spiegeln', stand);
    }
    return S.stempelGeben('spiegeln', stufe).neu;
  }

  /* ---------- Erfolg ---------- */
  function geschafft(satz) {
    document.getElementById('buehne').classList.add('geschafft');
    const gross = erfolg.querySelector('.erfolg__gross'), stempelZeile = document.getElementById('erfolg-stempel');
    const weiter = document.getElementById('weiter'), auswahl = document.getElementById('zur-auswahl');
    let ansage = satz;
    gross.textContent = satz;
    if (probe) {
      weiter.href = `spiegeln.html?art=${q.get('art')}&stufe=${stufe || ''}&saat=${saat + 1}`.replace('&stufe=&', '&');
      weiter.textContent = 'Nächste Aufgabe';
    } else if (nr < PRO_RUNDE) {
      weiter.href = `spiegeln.html?stufe=${stufe}&saat=${saat}&nr=${nr + 1}`;
      weiter.textContent = 'Nächste Aufgabe';
    } else {
      const neu = rundeMerken();
      gross.textContent = 'Runde geschafft!';
      ansage = `${satz} Runde geschafft!`;
      if (neu) { stempelZeile.textContent = `Neuer Stempel: ${STUFE[stufe]}!`; stempelZeile.hidden = false; ansage += ` Neuer Stempel: ${STUFE[stufe]}!`; }
      weiter.href = `spiegeln.html?stufe=${stufe}&saat=${neueSaat()}&nr=1`;
      weiter.textContent = 'Neue Runde';
      auswahl.hidden = false;
    }
    erfolg.hidden = false;
    zeigeHinweis('');
    sagen(ansage);
  }

  const start = { achsen: SW.spiegelArten.achsen, faltschnitt: SW.spiegelArten.falt }[aufg.art] || SW.spiegelArten.malen;
  SW.spiegeln = start(aufg, { sagen, zeigeHinweis, geschafft });
  if (SW.rahmenBreite) SW.rahmenBreite();   /* Sprechblase so breit wie der fertige Rahmen */
  SW.spiegeln.runde = { stufe, saat, nr, probe };
})();
