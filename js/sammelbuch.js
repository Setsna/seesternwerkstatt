/* Seesternwerkstatt: Mein Sammelbuch (Etappe 5a).
   - Meine Stempel: je Station drei Plätze (Leicht, Mittel, Knifflig), verdient mit Datum, offen gestrichelt.
   - Kleiner Stand je Station, ohne Vergleich und ohne Punkte.
   - Das kann ich schon: ein Satz je verdientem Stempel (SW.config.koennen).
   - Meine Urkunde (Etappe 5c): sobald jede Station mindestens einen Stempel hat, als PDF (js/urkunde.js).
   - Kein Löschknopf mehr (Konto-Umbau 14.11.2026): Zurücksetzen macht die Lehrkraft im Perlentaucher. */
(() => {
  'use strict';
  const C = SW.config, S = SW.speicher;
  const app = document.getElementById('app');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NAME = { leicht: 'Leicht', mittel: 'Mittel', knifflig: 'Knifflig' };
  const vorschau = S.istVorschau ? `?vorschau=${new URLSearchParams(location.search).get('vorschau')}` : '';
  const WELLE = '<svg class="welle" viewBox="0 0 62 12" aria-hidden="true" focusable="false"><path d="M2 4c5-3 9-3 14 0s9 3 14 0 9-3 14 0 9 3 14 0M2 9c5-3 9-3 14 0s9 3 14 0 9-3 14 0 9 3 14 0" fill="none" style="stroke:var(--welle)" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const STELLA = `<picture><source srcset="bilder/stella.webp?b=${C.bildStand}" type="image/webp"><img class="stella" src="bilder/stella.png?b=${C.bildStand}" alt="" width="640" height="640"></picture>`;
  const datum = ms => new Date(ms).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' });

  function kopf(titel, text) {
    return `<header class="kopf">
        <a class="wortmarke" href="index.html${vorschau}">${esc(C.name)}${WELLE}</a>
        ${STELLA}
        <h1 class="frage">${titel}</h1>
        ${text ? `<p class="einleitung hof">${text}</p>` : ''}
      </header>`;
  }

  /* Kleiner Stand je Station (Zahlen nur als Beschreibung, nie als Vergleich) */
  function stand(st) {
    const s = S.stationStand(st.id);
    if (st.id === 'tangram') {
      const figuren = new Set(Object.keys(s.geloest || {}).map(k => k.split(':')[0])).size;
      return figuren === 0 ? 'Noch keine Figur gelegt.' : figuren === 1 ? '1 Figur gelegt.' : `${figuren} Figuren gelegt.`;
    }
    const n = Object.values(s.runden || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    return n === 0 ? 'Noch keine Runde geschafft.' : n === 1 ? '1 Runde geschafft.' : `${n} Runden geschafft.`;
  }

  function stempelPlatz(st, stufe, k) {
    const s = k.stempel[`${st.id}:${stufe}`];
    if (s) {
      return `<li class="stempel stempel--da">
          <span class="stempel__bild"><img src="bilder/stella-64.png?b=${C.bildStand}" alt="" width="64" height="64"></span>
          <span class="stempel__stufe">${NAME[stufe]}</span>
          <span class="stempel__text">am ${datum(s)}</span>
        </li>`;
    }
    return `<li class="stempel stempel--offen">
        <span class="stempel__bild" aria-hidden="true"></span>
        <span class="stempel__stufe">${NAME[stufe]}</span>
        <span class="stempel__text">noch offen</span>
      </li>`;
  }

  function stationBlock(st, k) {
    const motiv = SW.motive && SW.motive[st.id] ? SW.motive[st.id]() : '';
    return `
      <section class="buch-station" aria-labelledby="h-${st.id}">
        <div class="buch-station__kopf">
          <span class="buch-station__bild">${motiv}</span>
          <div>
            <h3 id="h-${st.id}">${esc(st.name)}</h3>
            <p class="buch-station__stand">${stand(st)}</p>
          </div>
          <a class="knopf leise-knopf knopf--klein buch-station__los" href="${esc(st.seite)}${vorschau}">Üben<span class="nurvorlesen">: ${esc(st.name.replace(/­/g, ''))}</span></a>
        </div>
        <ul class="stempel-reihe" aria-label="Stempel ${esc(st.name.replace(/­/g, ''))}">${C.stufen.map(stufe => stempelPlatz(st, stufe, k)).join('')}</ul>
      </section>`;
  }

  /* Urkunde: in jeder Station mindestens ein Stempel */
  const fehlendeStationen = k => C.stationen.filter(st => !C.stufen.some(stufe => k.stempel[`${st.id}:${stufe}`]));
  function urkundeBlock(k) {
    const fehlen = fehlendeStationen(k);
    if (fehlen.length) {
      const namen = fehlen.map(st => esc(st.name.replace(/\u00AD/g, ''))).join(fehlen.length === 2 ? ' und ' : ', ');
      return `<p>Für die Urkunde brauchst du in jeder Station mindestens einen Stempel.</p>
        <p class="urkunde-noch">${fehlen.length === 1 ? 'Es fehlt noch' : 'Es fehlen noch'}: ${namen}.</p>`;
    }
    return `<p>Du hast in jeder Station einen Stempel. Dafür gibt es eine Urkunde.</p>
      <p class="knopfreihe knopfreihe--links"><button type="button" class="knopf haupt" data-aktion="urkunde-machen">Urkunde machen</button></p>
      <p class="urkunde-status" id="urkunde-status" role="status"></p>
      <p class="knopfreihe knopfreihe--links" id="urkunde-fertig" hidden>
        <a class="knopf" id="urkunde-ansehen" href="#" target="_blank" rel="noopener">Urkunde ansehen</a>
        <button type="button" class="knopf leise-knopf" data-aktion="urkunde-teilen" hidden>Teilen</button>
      </p>`;
  }

  function zeigen() {
    const k = S.aktiv();
    if (!k) {   /* kommt mit der Tür (js/tuer.js) eigentlich nicht vor */
      app.innerHTML = `${kopf('Mein Sammelbuch', 'Melde dich zuerst auf der Startseite mit deinem Code an.')}
        <p class="knopfreihe"><a class="knopf haupt" href="index.html">Zur Startseite</a></p>`;
      document.title = `Sammelbuch – ${C.name}`;
      return;
    }
    const verdient = Object.keys(k.stempel).filter(x => C.koennen[x]);
    const saetze = Object.keys(C.koennen).filter(x => k.stempel[x]).map(x => `<li>${esc(C.koennen[x])}</li>`).join('');
    app.innerHTML = `
      ${kopf(`Sammelbuch von ${esc(k.name)}`, verdient.length ? 'Hier sammelst du deine Stempel.' : 'Hier sammelst du deine Stempel. Den ersten bekommst du, wenn du eine Stufe geschafft hast.')}
      <section class="fenster buch" aria-labelledby="h-stempel">
        <h2 id="h-stempel">Meine Stempel</h2>
        ${C.stationen.map(st => stationBlock(st, k)).join('')}
      </section>
      <section class="fenster buch" aria-labelledby="h-kann">
        <h2 id="h-kann">Das kann ich schon</h2>
        ${saetze ? `<ul class="kann-liste">${saetze}</ul>` : '<p>Mit jedem Stempel kommt hier ein Satz dazu.</p>'}
      </section>
      <section class="fenster buch" aria-labelledby="h-urkunde">
        <h2 id="h-urkunde">Meine Urkunde</h2>
        ${urkundeBlock(k)}
      </section>
      <p class="knopfreihe"><a class="knopf" href="index.html${vorschau}">← Zur Startseite</a></p>`;
    document.title = `Sammelbuch von ${k.name} – ${C.name}`;
  }

  /* Urkunde machen und teilen */
  app.addEventListener('click', async e => {
    const b = e.target.closest('[data-aktion="urkunde-machen"], [data-aktion="urkunde-teilen"]');
    if (!b || !SW.urkunde) return;
    const status = document.getElementById('urkunde-status');
    if (b.dataset.aktion === 'urkunde-teilen') { SW.urkunde.teilen(status); return; }
    const k = S.aktiv();
    b.disabled = true;
    SW.sammelbuch.letzteUrkunde = await SW.urkunde.anbieten({
      name: k.name, datum: new Date(), stationen: C.stationen, stufen: C.stufen, stempel: k.stempel,
      stellaSrc: `bilder/stella.png?b=${C.bildStand}`,
      saetze: C.stationen.flatMap(st => C.stufen.filter(stufe => k.stempel[`${st.id}:${stufe}`] && C.koennen[`${st.id}:${stufe}`])
        .map(stufe => ({ station: st.name.replace(/\u00AD/g, ''), text: C.koennen[`${st.id}:${stufe}`] })))
    }, { status, fertig: document.getElementById('urkunde-fertig'), ansehen: document.getElementById('urkunde-ansehen'), teilen: app.querySelector('[data-aktion="urkunde-teilen"]') });
    b.disabled = false;
    b.textContent = 'Urkunde neu machen';
  });

  if (S.istVorschau) {
    const h = document.getElementById('vorschau-hinweis');
    h.hidden = false;
    h.textContent = 'Vorschau: Hier wird nichts gespeichert.';
  }
  SW.sammelbuch = { letzteUrkunde: null };
  zeigen();
})();
