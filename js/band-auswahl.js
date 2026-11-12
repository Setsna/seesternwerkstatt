/* Seesternwerkstatt: Station Bandornamente, Auswahl der Stufe (Etappe 4c).
   Wird von js/band.js aufgerufen, wenn die Adresse keine Stufe enthält.
   Je Stufe: Beispielbild (erzeugt, mit festem Startwert, ohne Lösung), Zahl der geschafften Runden,
   Stempel und der Knopf für eine neue Runde. Dazu „Erfinde eigenes“ und „Am Tisch“. */
(() => {
  'use strict';
  const NAME = { leicht: 'Leicht', mittel: 'Mittel', knifflig: 'Knifflig' };
  const PUNKTE = { leicht: 1, mittel: 2, knifflig: 3 };
  /* Beispiele je Stufe: [Stufe der Aufgabe, Beschriftung] */
  const BEISPIELE = {
    leicht: [['leicht', 'Bandornament fortsetzen']],
    mittel: [['mittel', 'Mehr Farben, auch mit Spiegelbild']],
    knifflig: [['knifflig', 'Parkettmuster'], ['mittel', 'Bandornament']]
  };

  /* Kleines Bild einer Aufgabe, so wie das Kind sie zu Beginn sieht */
  function bildchen(a) {
    const parkett = a.art === 'parkett', W = parkett ? a.vorlageB : a.vorlage, Hh = parkett ? a.vorlageH : a.h;
    let gitter = '';
    for (let x = 0; x <= a.b; x++) gitter += `<line x1="${x}" y1="0" x2="${x}" y2="${a.h}"/>`;
    for (let y = 0; y <= a.h; y++) gitter += `<line x1="0" y1="${y}" x2="${a.b}" y2="${y}"/>`;
    const zellen = Object.entries(a.vorgabe).map(([k, f]) => {
      const [s, z] = k.split(',').map(Number);
      return `<rect x="${s}" y="${z}" width="1" height="1" class="sf${f} falt-stueck"/>` + (f > 1 ? `<rect x="${s}" y="${z}" width="1" height="1" fill="url(#sp-${f})"/>` : '');
    }).join('');
    const grenze = parkett ? `${W},0 ${W},${Hh} 0,${Hh}` : `${W},0 ${W},${Hh}`;
    return `<svg viewBox="-0.2 -0.2 ${a.b + 0.4} ${a.h + 0.4}" aria-hidden="true" focusable="false">${SW.spiegelMuster}
      <rect x="0" y="0" width="${a.b}" height="${a.h}" class="bildchen-grund"/>
      <rect x="0" y="0" width="${W}" height="${Hh}" class="bildchen-vorlage"/>
      <g class="falt-gitter">${gitter}</g>${zellen}<polyline points="${grenze}" class="band-grenze" fill="none"/></svg>`;
  }

  SW.bandAuswahl = function auswahl() {
    const C = SW.config, S = SW.speicher, BA = SW.bandAufgaben;
    const box = document.getElementById('auswahl');
    const kind = S && S.aktiv();
    const runden = (kind && S.stationStand('band').runden) || {};
    const stempel = (kind && kind.stempel) || {};
    const empfohlen = C.stufen.find(st => !stempel[`band:${st}`]) || null;

    const stufeHtml = st => {
      const n = Number(runden[st]) || 0, bsp = BEISPIELE[st];
      return `
      <section class="stufe-block${st === empfohlen ? ' stufe-block--empfohlen' : ''}" aria-labelledby="h-${st}">
        <div class="stufe-kopf">
          <h2 id="h-${st}"><span class="stufe-punkte" aria-hidden="true">${'●'.repeat(PUNKTE[st])}${'○'.repeat(3 - PUNKTE[st])}</span>${NAME[st]}</h2>
          ${st === empfohlen ? '<span class="marke marke--empfohlen">Stella empfiehlt</span>' : ''}
          ${stempel[`band:${st}`] ? '<span class="marke marke--stempel"><img src="bilder/stella-64.png?b=1" alt="" width="64" height="64">Stempel</span>' : ''}
          <span class="stufe-stand">${n === 0 ? 'noch keine Runde' : n === 1 ? '1 Runde geschafft' : `${n} Runden geschafft`}</span>
        </div>
        <p class="runde-inhalt">In dieser Runde:</p>
        <ul class="figur-liste beispiel-liste beispiel-liste--${bsp.length}">
          ${bsp.map(([as, text]) => `<li class="beispiel-kachel">${bildchen(BA.eine(as, 5 + 11 * PUNKTE[st]))}<span class="figur-kachel__name">${text}</span></li>`).join('')}
        </ul>
        <a class="knopf haupt runde-knopf" href="band.html?stufe=${st}">Runde starten <span class="runde-knopf__zahl">6 Aufgaben</span></a>
      </section>`;
    };

    const ohneKind = !kind && !(S && S.istVorschau);
    box.innerHTML = `
      ${ohneKind ? '<p class="auswahl-hinweis">Du kannst hier üben. Damit Stella sich merkt, was du geschafft hast, wähle zuerst auf der <a href="index.html">Startseite</a> deinen Namen.</p>' : ''}
      ${C.stufen.map(stufeHtml).join('')}
      <section class="stufe-block" aria-labelledby="h-eigenes">
        <div class="stufe-kopf"><h2 id="h-eigenes">Erfinde eigenes</h2><span class="stufe-stand">ohne Prüfen</span></div>
        <p>Male einen Baustein und verschiebe ihn, bis das Band voll ist.</p>
        <a class="knopf haupt runde-knopf" href="band.html?eigenes=1">Losmalen</a>
      </section>
      <details class="am-tisch">
        <summary><h2>Am Tisch</h2></summary>
        <div class="am-tisch__inhalt">
          <div class="am-tisch__bild">${SW.motive ? SW.motive.band() : ''}</div>
          <ol>
            <li><b>Stempeln:</b> Schneide aus einer Kartoffel oder aus Moosgummi einen Stempel. Stemple eine Borte an den Heftrand. Immer gleich weit verschieben!</li>
            <li><b>Perlenkette:</b> Fädle Perlen nach einem Muster auf, zum Beispiel rot, rot, blau. Ein anderes Kind sagt, wie es weitergeht.</li>
            <li><b>Parkett legen:</b> Lege mit gleichen Papierkärtchen oder Bauklötzen eine Fläche ohne Lücken.</li>
            <li><b>Suchen:</b> Wo findest du Bandornamente und Parkettmuster? Schau auf Fliesen, Zäune, Stoffe und Fassaden.</li>
          </ol>
        </div>
      </details>`;
    box.hidden = false;
    document.title = 'Bandornamente – Seesternwerkstatt';
  };
})();
