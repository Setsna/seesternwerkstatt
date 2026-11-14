/* Seesternwerkstatt: Ansichten und Bedienung der Startseite.
   Ansichten: Code-Eingabe (seit dem Konto-Umbau 14.11.2026, statt Name/Klasse und „Wer übt heute?“), Start.
   Aufbau nach dem Vorbild Zahlenschwarm, eigener Inhalt. */
(() => {
  'use strict';
  const C = SW.config, S = SW.speicher, cloud = S.cloud;
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

  /* ---------- Code-Eingabe (Konto-Umbau 14.11.2026) ---------- */
  const MOMENT = 'Einen Moment …';
  let ansicht = '';

  /* Nach dem Anmelden: zurück zur Seite, die das Kind öffnen wollte (?zu=… von js/tuer.js), sonst Start */
  const ZIEL = /^(tangram|spiegeln|band|sammelbuch)\.html(\?[A-Za-z0-9=&%._-]*)?$/;
  function weiterNachAnmelden() {
    const zu = new URLSearchParams(location.search).get('zu');
    if (zu && ZIEL.test(zu)) { location.replace(zu); return true; }
    return false;
  }

  /* Ergebnis von cloud.anmelden() oder start() anzeigen */
  function nachAnmelden(r) {
    if (!r.ok) {
      if (ansicht === 'code' && app.querySelector('#code')) {
        app.querySelector('#code-form button[type="submit"]').disabled = false;
        app.querySelector('#code-hinweis').textContent = r.grund || '';
        app.querySelector('#code').focus();
      } else ansichtCode(r.grund);
      return;
    }
    if (weiterNachAnmelden()) return;
    ansichtStart();
    if (r.gespeichert === false) melden(SPEICHER_FEHLT);
  }

  function ansichtCode(hinweis = '') {
    zeigen(`
      ${kopf('Willkommen!', 'Ich bin Stella. Mit mir spiegelst du, legst Figuren und setzt Muster fort.')}
      <section class="fenster mitte" aria-labelledby="h-code">
        <h2 id="h-code">Wie lautet dein Code?</h2>
        <form id="code-form" novalidate>
          <label for="code">Dein Code</label>
          <input type="text" id="code" name="code" class="code-feld" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" maxlength="${C.codeLaenge + 4}" aria-describedby="code-hinweis code-info">
          <p id="code-hinweis" class="hinweis-feld" aria-live="polite">${esc(hinweis || '')}</p>
          <p class="knopfreihe"><button type="submit" class="knopf haupt">Weiter</button></p>
        </form>
        <p id="code-info" class="leise">Dein Code hat ${C.codeLaenge} Zeichen: Buchstaben und Zahlen. Es ist derselbe Code wie beim Perlentaucher.</p>
      </section>`, '');
    ansicht = 'code';
    app.querySelector('#code-form').addEventListener('submit', e => {
      e.preventDefault();
      const knopf = e.target.querySelector('button[type="submit"]');
      if (knopf.disabled) return;
      knopf.disabled = true;
      app.querySelector('#code-hinweis').textContent = MOMENT;
      cloud.anmelden(app.querySelector('#code').value).then(nachAnmelden, () => nachAnmelden({ ok: false, grund: cloud.TEXT.sonst }));
    });
  }

  /* Zeile auf der Startseite, wenn der Stand gerade nicht in der Datenbank ankommt */
  function netzText() {
    const z = cloud.zustand().art;
    if (z === 'lokal') return 'Gerade ohne Internet. Dein Stand bleibt auf diesem Gerät und wird später abgeglichen.';
    if (z === 'fehler') return 'Dein Stand konnte gerade nicht im Internet gespeichert werden. Er bleibt auf diesem Gerät. Bitte sag deiner Lehrkraft Bescheid.';
    return '';
  }
  cloud.beiZustand(() => {
    const p = app.querySelector('#netz-zeile');
    if (p) { p.textContent = netzText(); p.hidden = !p.textContent; }
  });

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
    zeigen(`
      ${kopf(`Hallo, ${esc(k.name)}!`, 'Wähle eine Station.')}
      ${S.istVorschau ? `<p class="einleitung hof">Vorschau: ${Object.keys(k.stempel).length} Stempel.</p>` : ''}
      <p class="einleitung hof netz-zeile" id="netz-zeile" role="status"${netzText() ? '' : ' hidden'}>${esc(netzText())}</p>
      <section class="stationen-block" aria-labelledby="h-stationen">
        <h2 id="h-stationen" class="nurvorlesen">Stationen</h2>
        <ul class="stationen">${C.stationen.map(stationKarte).join('')}</ul>
      </section>
      ${sammelbuchKnopf(k)}
      ${S.istVorschau ? '' : `<p class="knopfreihe">
        <button type="button" class="knopf leise-knopf knopf--klein" data-aktion="abmelden">Abmelden</button>
      </p>`}`, `Hallo, ${k.name}`);
    ansicht = 'start';
  }

  /* ---------- Ablauf ---------- */
  function anzeigen() {
    if (S.ladeFehler) melden(cloud.TEXT.unlesbar);
    if (S.aktiv()) ansichtStart();
    else ansichtCode();
  }

  app.addEventListener('click', e => {
    const b = e.target.closest('[data-aktion]');
    if (!b || b.disabled) return;
    if (b.dataset.aktion === 'abmelden') {
      b.disabled = true;
      cloud.abmelden().then(() => { melden(''); ansichtCode(); }, () => { ansichtCode(); });
    }
  });

  /* Die Lehrkraft hat den Stand zurückgesetzt: Das Gerät hat seinen Stand verworfen (js/konto-cloud.js). */
  cloud.beiNeustart(() => {
    if (ansicht === 'start') ansichtStart();
    melden('Deine Lehrkraft hat die Seesternwerkstatt neu gestartet. Du fängst von vorn an.');
  });

  if (S.istVorschau) {
    const h = document.getElementById('vorschau-hinweis');
    h.hidden = false;
    h.textContent = 'Vorschau: Hier wird nichts gespeichert.';
  }

  /* Was das Gerät schon weiß, steht sofort da. Die Antwort aus dem Netz kommt nach. */
  const darfWechseln = () => ['code', 'start'].includes(ansicht);
  function starten() {
    if (S.istVorschau) { ansichtStart(); return; }
    const LA = window.LagunenKonto.adresse;
    const qr = LA.code(), spur = LA.spur();
    LA.saeubern();
    if (qr) {
      /* Ein gescannter Code hat Vorrang vor dem Kind, das in diesem Tab noch angemeldet ist. */
      if (S.aktiv() && S.code() !== qr) S.S.abmelden();
      if (S.aktiv()) ansichtStart(); else ansichtCode(MOMENT);
      cloud.anmelden(qr).then(r => { if (darfWechseln()) { if (!r.ok) ansichtCode(r.grund); else nachAnmelden(r); } }, () => {});
      return;
    }
    /* Kommt das Kind von einer Station (?zu=…) und kennt der Tab es schon: gleich zurück */
    if (S.aktiv() && weiterNachAnmelden()) return;
    if (S.aktiv()) ansichtStart(); else ansichtCode(MOMENT);
    if (S.ladeFehler) melden(cloud.TEXT.unlesbar);
    const gemerkt = S.code();
    cloud.start().then(r => {
      if (r.ok) { if (darfWechseln()) nachAnmelden(r); return null; }
      if (ansicht === 'code' && app.querySelector('#code-hinweis').textContent === MOMENT) {
        app.querySelector('#code-hinweis').textContent = spur ? 'Der Code wurde nicht ganz gelesen. Tippe ihn bitte ein.' : (r.grund || '');
      }
      if (r.grund) return r;
      /* Firebase kennt niemanden, der Tab aber schon: mit dem gemerkten Code anmelden */
      return gemerkt && S.code() === gemerkt && cloud.aktiv() ? cloud.anmelden(gemerkt) : null;
    }).then(r => {
      if (!r) return;
      if (r.ok) { if (ansicht === 'start') ansichtStart(); return; }
      /* Die Lehrkraft hat den Code gesperrt: nicht auf dem Gerät weiterarbeiten lassen */
      if (r.grund === cloud.TEXT.gesperrt && S.aktiv()) { S.S.abmelden(); if (darfWechseln()) ansichtCode(r.grund); }
    }, () => {});
  }
  starten();

  SW.app = { anzeigen, melden, cloud };
})();
