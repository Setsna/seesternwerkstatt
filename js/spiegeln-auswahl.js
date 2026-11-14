/* Seesternwerkstatt: Station Spiegeln, Auswahl der Stufe (Etappe 3c).
   Wird von js/spiegeln.js aufgerufen, wenn die Adresse keine Stufe und keine Aufgabe enthält.
   Je Stufe: drei kleine Beispielbilder (erzeugt, mit festem Startwert, ohne Lösung), Zahl der
   geschafften Runden, Stempel und der Knopf für eine neue Runde. Darunter „Am Tisch“. */
(() => {
  'use strict';
  const NAME = { leicht: 'Leicht', mittel: 'Mittel', knifflig: 'Knifflig' };
  const PUNKTE = { leicht: 1, mittel: 2, knifflig: 3 };
  /* Beispielbilder: [Aufgabenart, Beschriftung] */
  const BEISPIELE = {
    leicht: [['ergaenzen', 'Ergänzen'], ['achsen', 'Achsen finden'], ['faltWaehlen', 'Faltschnitt']],
    mittel: [['ergaenzen', 'Mit Farben ergänzen'], ['buchstabe', 'Buchstaben'], ['faltZeichnen', 'Faltschnitt zeichnen']],
    knifflig: [['ergaenzen', 'Schräge Achse'], ['kreuz', 'Achsenkreuz'], ['achsen', 'Achsen finden']]
  };

  /* Kleines Bild einer Aufgabe, so wie das Kind sie zu Beginn sieht */
  function bildchen(a) {
    const R = SW.spiegelRaster;
    let gitter = '';
    for (let x = 0; x <= a.b; x++) gitter += `<line x1="${x}" y1="0" x2="${x}" y2="${a.h}"/>`;
    for (let y = 0; y <= a.h; y++) gitter += `<line x1="0" y1="${y}" x2="${a.b}" y2="${y}"/>`;
    const zellen = bild => Object.entries(bild).map(([k, f]) => {
      const { s, z } = R.feldAus(k);
      return `<rect x="${s}" y="${z}" width="1" height="1" class="sf${f} falt-stueck"/>` + (f > 1 ? `<rect x="${s}" y="${z}" width="1" height="1" fill="url(#sp-${f})"/>` : '');
    }).join('');
    const linie = (x, klasse) => { const [p, q] = R.achsenStrecke(x, a.b, a.h); return `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" class="${klasse}"/>`; };
    let inhalt;
    if (a.art === 'achsen') inhalt = zellen(a.figur) + a.kandidaten.map(k => linie(k, 'linie')).join('');
    else if (a.art === 'faltschnitt') {
      const x = a.achsen[0], f = R.feldAus(Object.keys(a.vorgabe)[0]);
      const papier = x.typ === 'senkrecht'
        ? `<rect x="${f.s < x.pos ? 0 : x.pos}" y="0" width="${a.b / 2}" height="${a.h}" class="falt-papier"/>`
        : `<rect x="0" y="${f.z < x.pos ? 0 : x.pos}" width="${a.b}" height="${a.h / 2}" class="falt-papier"/>`;
      inhalt = papier + zellen(a.vorgabe) + linie(x, 'falz');
    } else inhalt = zellen(a.vorgabe) + a.achsen.map(x => linie(x, 'achse')).join('');
    return `<svg viewBox="-0.2 -0.2 ${a.b + 0.4} ${a.h + 0.4}" aria-hidden="true" focusable="false">${SW.spiegelMuster}
      <rect x="0" y="0" width="${a.b}" height="${a.h}" class="bildchen-grund"/><g class="falt-gitter">${gitter}</g>${inhalt}</svg>`;
  }

  SW.spiegelnAuswahl = function auswahl() {
    const C = SW.config, S = SW.speicher, A = SW.spiegelAufgaben;
    const box = document.getElementById('auswahl');
    const kind = S && S.aktiv();
    const runden = (kind && S.stationStand('spiegeln').runden) || {};
    const stempel = (kind && kind.stempel) || {};
    const empfohlen = C.stufen.find(st => !stempel[`spiegeln:${st}`]) || null;

    const stufeHtml = st => {
      const n = Number(runden[st]) || 0;
      return `
      <section class="stufe-block${st === empfohlen ? ' stufe-block--empfohlen' : ''}" aria-labelledby="h-${st}">
        <div class="stufe-kopf">
          <h2 id="h-${st}"><span class="stufe-punkte" aria-hidden="true">${'●'.repeat(PUNKTE[st])}${'○'.repeat(3 - PUNKTE[st])}</span>${NAME[st]}</h2>
          ${st === empfohlen ? '<span class="marke marke--empfohlen">Stella empfiehlt</span>' : ''}
          ${stempel[`spiegeln:${st}`] ? '<span class="marke marke--stempel"><img src="bilder/stella-64.png?b=1" alt="" width="64" height="64">Stempel</span>' : ''}
          <span class="stufe-stand">${n === 0 ? 'noch keine Runde' : n === 1 ? '1 Runde geschafft' : `${n} Runden geschafft`}</span>
        </div>
        <p class="runde-inhalt">In dieser Runde:</p>
        <ul class="figur-liste beispiel-liste">
          ${BEISPIELE[st].map(([art, text]) => `<li class="beispiel-kachel">${bildchen(A.eine(art, st, 3 + 7 * PUNKTE[st]))}<span class="figur-kachel__name">${text}</span></li>`).join('')}
        </ul>
        <a class="knopf haupt runde-knopf" href="spiegeln.html?stufe=${st}">Runde starten <span class="runde-knopf__zahl">6 Aufgaben</span></a>
      </section>`;
    };

    box.innerHTML = `
  
      ${C.stufen.map(stufeHtml).join('')}
      <details class="am-tisch">
        <summary><h2>Am Tisch</h2></summary>
        <div class="am-tisch__inhalt">
          <div class="am-tisch__bild">${SW.motive ? SW.motive.spiegeln() : ''}</div>
          <ol>
            <li><b>Klecksbild:</b> Tropfe Farbe auf eine Hälfte eines Blattes. Falte das Blatt, drücke fest und klappe es auf. Die Faltlinie ist die Spiegelachse.</li>
            <li><b>Faltschnitt:</b> Falte ein Blatt. Male an der Faltlinie eine halbe Figur und schneide sie aus. Rate vorher: Wie sieht sie aufgeklappt aus?</li>
            <li><b>Spiegel:</b> Stell einen kleinen Spiegel auf eine halbe Figur oder einen Buchstaben. Wo musst du ihn hinstellen, damit die Figur ganz aussieht?</li>
            <li><b>Zu zweit:</b> Zeichne auf Karopapier eine Linie und an ihr eine halbe Figur. Ein anderes Kind ergänzt sie. Prüft zusammen mit dem Spiegel.</li>
          </ol>
        </div>
      </details>`;
    box.hidden = false;
    document.title = 'Spiegeln – Seesternwerkstatt';
  };
})();
