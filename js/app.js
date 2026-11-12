/* Seesternwerkstatt: Ansichten und Bedienung der Startseite (Etappe 1).
   Ansichten: Neu (Name, Klasse), Wer übt heute?, Start (Stationen).
   Aufbau nach dem Vorbild Zahlenschwarm, eigener Inhalt. */
(() => {
  'use strict';
  const C = SW.config, S = SW.speicher;
  const app = document.getElementById('app');
  const meldung = document.getElementById('meldung');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Sichtbare Meldung oben, wird von Screenreadern angesagt (role=status). */
  function melden(text) {
    meldung.textContent = '';
    if (text) setTimeout(() => { meldung.textContent = text; }, 30);
  }
  const SPEICHER_FEHLT = 'Dein Stand konnte gerade nicht gespeichert werden. Vielleicht ist der Speicher voll oder ausgeschaltet. Bitte sag deiner Lehrkraft Bescheid.';

  /* ---------- Bausteine ---------- */
  let ersterAufruf = true;
  function zeigen(html, titel) {
    app.innerHTML = html;
    document.title = titel ? `${titel} – ${C.name}` : C.name;
    const h1 = app.querySelector('h1');
    if (h1 && !ersterAufruf) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); window.scrollTo(0, 0); }
    ersterAufruf = false;
  }
  const WELLE = '<svg class="welle" viewBox="0 0 62 12" aria-hidden="true" focusable="false"><path d="M2 4c5-3 9-3 14 0s9 3 14 0 9-3 14 0 9 3 14 0M2 9c5-3 9-3 14 0s9 3 14 0 9-3 14 0 9 3 14 0" fill="none" style="stroke:var(--welle)" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const SCHLOSS = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  /* Stella ist Schmuck neben der Überschrift (alt=""), ihr Name steht im Text */
  const STELLA = `<picture><source srcset="bilder/stella.webp?b=${C.bildStand}" type="image/webp"><img class="stella" src="bilder/stella.png?b=${C.bildStand}" alt="" width="640" height="640"></picture>`;
  function kopf(titel, text = '') {
    return `<header class="kopf">
        <a class="wortmarke" href="./">${esc(C.name)}${WELLE}</a>
        ${STELLA}
        <h1 class="frage">${titel}</h1>
        ${text ? `<p class="einleitung hof">${text}</p>` : ''}
      </header>`;
  }

  /* ---------- Neues Kind ---------- */
  function ansichtNeu() {
    const andere = S.kinder().length > 0;
    zeigen(`
      ${kopf(andere ? 'Neues Kind' : 'Willkommen!', 'Ich bin Stella. Mit mir spiegelst du, legst Figuren und setzt Muster fort.')}
      <section class="fenster mitte" aria-labelledby="h-neu">
        <h2 id="h-neu">Wie heißt du?</h2>
        <form id="neu-form" novalidate>
          <label for="name">Dein Vorname</label>
          <input type="text" id="name" name="name" autocomplete="off" autocapitalize="words" spellcheck="false" maxlength="${C.nameMaxLaenge}" aria-describedby="name-hinweis name-info">
          <p id="name-hinweis" class="hinweis-feld" aria-live="polite"></p>
          <fieldset class="klassenwahl">
            <legend>In welche Klasse gehst du?</legend>
            <div class="klassen-knoepfe">${C.klassen.map(n => `<label class="klasse-wahl"><input type="radio" name="klasse" value="${n}"><span>Klasse ${n}</span></label>`).join('')}</div>
            <p id="klasse-hinweis" class="hinweis-feld" aria-live="polite"></p>
          </fieldset>
          <p class="knopfreihe">
            <button type="submit" class="knopf haupt">Los geht's</button>
            ${andere ? '<button type="button" class="knopf leise-knopf" data-aktion="wer">Zurück</button>' : ''}
          </p>
        </form>
        <p id="name-info" class="leise">Dein Name bleibt nur auf diesem Gerät.</p>
      </section>`, andere ? 'Neues Kind' : '');
    app.querySelector('#neu-form').addEventListener('submit', e => {
      e.preventDefault();
      const feld = app.querySelector('#name');
      const wahl = app.querySelector('input[name="klasse"]:checked');
      const r = S.anlegen(feld.value, wahl ? wahl.value : null);
      app.querySelector('#name-hinweis').textContent = '';
      app.querySelector('#klasse-hinweis').textContent = '';
      if (!r.kind) {
        if (r.feld === 'klasse') { app.querySelector('#klasse-hinweis').textContent = r.grund; app.querySelector('input[name="klasse"]').focus(); }
        else if (r.feld === 'name') { app.querySelector('#name-hinweis').textContent = r.grund; feld.focus(); }
        else melden(r.grund);
        return;
      }
      if (!r.ok) melden(SPEICHER_FEHLT);
      ansichtStart();
    });
  }

  /* ---------- Wer übt heute? ---------- */
  function ansichtWer() {
    const liste = S.kinder().map(k => `<li><button type="button" class="knopf" data-aktion="waehlen" data-id="${esc(k.id)}">${esc(k.name)}</button></li>`).join('');
    zeigen(`
      ${kopf('Wer übt heute?', 'Tippe auf deinen Namen.')}
      <section class="fenster mitte" aria-label="Namen">
        <ul class="kinder-liste">${liste}</ul>
        <p class="knopfreihe"><button type="button" class="knopf leise-knopf" data-aktion="neu">Ich bin neu hier</button></p>
      </section>`, 'Wer übt heute?');
  }

  /* ---------- Start ---------- */
  function stationKarte(st) {
    const motiv = SW.motive[st.id] ? SW.motive[st.id]() : '';
    const inhalt = `
      <h3 class="station__name">${esc(st.name)}</h3>
      <span class="station__linie" aria-hidden="true"></span>
      <span class="station__bild">${motiv}</span>
      <p class="station__satz">${esc(st.satz)}</p>`;
    if (st.status === 'live') {
      return `<li><a class="fenster station" href="${esc(st.seite)}">${inhalt}</a></li>`;
    }
    return `<li><div class="fenster station station--bald">${inhalt}<span class="station__status">${SCHLOSS}<span aria-hidden="true">Bald</span><span class="nurvorlesen">Kommt bald.</span></span></div></li>`;
  }

  /* Knopf zum Sammelbuch. Die Stempel erscheinen als kleine Reihe (Form statt Zahl), nicht als Punkte. */
  function sammelbuchKnopf(k) {
    const alle = C.stationen.length * C.stufen.length;
    const n = Object.keys(k.stempel).filter(x => C.koennen[x]).length;
    const reihe = Array.from({ length: alle }, (_, i) => `<span class="mini-stempel${i < n ? ' mini-stempel--da' : ''}"></span>`).join('');
    const link = S.istVorschau ? `sammelbuch.html?vorschau=${new URLSearchParams(location.search).get('vorschau')}` : 'sammelbuch.html';
    return `<p class="knopfreihe"><a class="knopf sammelbuch-knopf" href="${link}">
        <span>Mein Sammelbuch</span>
        <span class="mini-reihe" aria-hidden="true">${reihe}</span>
        <span class="nurvorlesen">, ${n === 0 ? 'noch kein Stempel' : n === 1 ? '1 Stempel' : n + ' Stempel'}</span>
      </a></p>`;
  }

  function ansichtStart() {
    const k = S.aktiv();
    const mehrere = S.kinder().length > 1;
    zeigen(`
      ${kopf(`Hallo, ${esc(k.name)}!`, 'Wähle eine Station.')}
      ${S.istVorschau ? `<p class="einleitung hof">Vorschau: ${Object.keys(k.stempel).length} Stempel.</p>` : ''}
      <section class="stationen-block" aria-labelledby="h-stationen">
        <h2 id="h-stationen" class="nurvorlesen">Stationen</h2>
        <ul class="stationen">${C.stationen.map(stationKarte).join('')}</ul>
      </section>
      ${sammelbuchKnopf(k)}
      ${S.istVorschau ? '' : `<p class="knopfreihe">
        ${mehrere ? '<button type="button" class="knopf leise-knopf knopf--klein" data-aktion="wer">Kind wechseln</button>' : ''}
        <button type="button" class="knopf leise-knopf knopf--klein" data-aktion="neu">Neues Kind anlegen</button>
      </p>`}`, `Hallo, ${k.name}`);
  }

  /* ---------- Ablauf ---------- */
  function anzeigen() {
    if (S.ladeFehler) melden('Dein gespeicherter Stand konnte nicht gelesen werden. Damit nichts verloren geht, speichert die Seite gerade nichts. Bitte sag deiner Lehrkraft Bescheid.');
    if (S.aktiv()) ansichtStart();
    else if (S.kinder().length) ansichtWer();
    else ansichtNeu();
  }

  app.addEventListener('click', e => {
    const b = e.target.closest('[data-aktion]');
    if (!b || b.disabled) return;
    const a = b.dataset.aktion;
    if (a === 'waehlen') { S.waehlen(b.dataset.id); ansichtStart(); }
    else if (a === 'wer') { S.abmelden(); S.kinder().length ? ansichtWer() : ansichtNeu(); }
    else if (a === 'neu') { S.abmelden(); ansichtNeu(); }
  });

  if (S.istVorschau) {
    const h = document.getElementById('vorschau-hinweis');
    h.hidden = false;
    h.textContent = 'Vorschau: Hier wird nichts gespeichert.';
  }
  anzeigen();

  SW.app = { anzeigen, melden };
})();
