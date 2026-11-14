/* Seesternwerkstatt: Station Tangram, Auswahl von Stufe und Figur (Etappe 2c).
   Läuft nur, wenn die Adresse keine ?figur= enthält. Jede Figur ist ein Link auf
   tangram.html?figur=…&stufe=… (Zurück im Browser führt wieder hierher).
   Stand: SW.speicher.stationStand('tangram').geloest = { 'pinguin:leicht': Zeitpunkt, … },
   Stempel je Stufe in SW.speicher (tangram:leicht usw.). */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).has('figur')) return;
  const C = SW.config, L = SW.tangramLogik, F = SW.tangramFiguren, S = SW.speicher;
  const box = document.getElementById('auswahl');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NAME = { leicht: 'Leicht', mittel: 'Mittel', knifflig: 'Knifflig' };
  const PUNKTE = { leicht: 1, mittel: 2, knifflig: 3 };

  const kind = S && S.aktiv();
  const geloest = (kind && S.stationStand('tangram').geloest) || {};
  const stempel = (kind && kind.stempel) || {};
  const istGeloest = (f, stufe) => !!geloest[`${f.id}:${stufe}`];

  /* Empfehlung: die erste Stufe, in der noch etwas offen ist */
  const figurenVon = stufe => F.fuerKinder().filter(f => f.stufe === stufe);
  const empfohlen = C.stufen.find(st => figurenVon(st).some(f => !istGeloest(f, st))) || null;

  function bild(f, stufe) {
    const u = L.umrissVon(f);
    if (!u.ok) return '';
    const r = u.rahmen, rand = 0.3;
    const d = u.umriss.map(z => 'M' + z.map(p => `${p.x},${p.y}`).join('L') + 'Z').join('');
    const grenzen = stufe === 'leicht' ? u.grenzen.map(e => `<polygon class="grenze" points="${e.map(p => `${p.x},${p.y}`).join(' ')}"/>`).join('') : '';
    return `<svg viewBox="${r.x0 - rand} ${r.y0 - rand} ${r.x1 - r.x0 + 2 * rand} ${r.y1 - r.y0 + 2 * rand}" aria-hidden="true" focusable="false"><path class="umriss" d="${d}" fill-rule="evenodd"/>${grenzen}</svg>`;
  }
  const HAKEN = '<svg class="haken" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5 10 17 19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const punkte = n => `<span class="stufe-punkte" aria-hidden="true">${'●'.repeat(n)}${'○'.repeat(3 - n)}</span>`;

  function stufeHtml(stufe) {
    const liste = figurenVon(stufe);
    const fertig = liste.filter(f => istGeloest(f, stufe)).length;
    const hatStempel = !!stempel[`tangram:${stufe}`];
    return `
      <section class="stufe-block${stufe === empfohlen ? ' stufe-block--empfohlen' : ''}" aria-labelledby="h-${stufe}">
        <div class="stufe-kopf">
          <h2 id="h-${stufe}">${punkte(PUNKTE[stufe])}${NAME[stufe]}</h2>
          ${stufe === empfohlen ? '<span class="marke marke--empfohlen">Stella empfiehlt</span>' : ''}
          ${hatStempel ? '<span class="marke marke--stempel"><img src="bilder/stella-64.png?b=1" alt="" width="64" height="64">Stempel</span>' : ''}
          <span class="stufe-stand">${fertig} von ${liste.length}</span>
        </div>
        <ul class="figur-liste">
          ${liste.map(f => {
            const ok = istGeloest(f, stufe);
            return `<li><a class="figur-kachel${ok ? ' figur-kachel--geloest' : ''}" href="tangram.html?figur=${encodeURIComponent(f.id)}&amp;stufe=${stufe}">
              ${bild(f, stufe)}
              <span class="figur-kachel__name">${esc(f.name)}</span>
              ${ok ? `<span class="figur-kachel__geloest">${HAKEN}geschafft</span>` : ''}
            </a></li>`;
          }).join('')}
        </ul>
      </section>`;
  }

  box.innerHTML = `

    ${C.stufen.map(stufeHtml).join('')}
    <details class="am-tisch">
      <summary><h2>Am Tisch</h2></summary>
      <div class="am-tisch__inhalt">
        <div class="am-tisch__bild">${SW.motive ? SW.motive.tangram() : ''}</div>
        <ol>
          <li>Nimm ein quadratisches Blatt Papier.</li>
          <li>Zeichne die sieben Teile ein, so wie im Bild.</li>
          <li>Schneide die Teile aus. Lass dir dabei helfen.</li>
          <li>Lege die Figuren von hier nach. Oder erfinde eigene Figuren und lass sie von einem anderen Kind nachlegen.</li>
        </ol>
        <p>Immer gilt: Alle sieben Teile werden gebraucht. Sie berühren sich, aber sie liegen nicht übereinander.</p>
      </div>
    </details>`;
  box.hidden = false;
  document.title = 'Tangram – Seesternwerkstatt';
})();
