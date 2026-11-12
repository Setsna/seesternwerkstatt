/* Seesternwerkstatt: Speicher im Browser.
   - Alles bleibt in localStorage dieses Browsers, je Kind ein Eintrag.
   - Welches Kind in diesem Tab übt, steht in sessionStorage.
   - ?vorschau=N zeigt einen Beispielstand mit N Stempeln und speichert nichts.
   Aufbau nach dem Vorbild Zahlenschwarm, eigener Inhalt. */
(() => {
  'use strict';
  const C = SW.config;
  const KEY = `${C.speicher.schluessel}-v${C.speicher.schema}`;
  const WER = C.speicher.werSchluessel;

  const neueId = () => 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const istObjekt = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const klasseOk = n => C.klassen.includes(Number(n)) ? Number(n) : C.klasseStandard;

  /* Ein Kind. stationen: Stand je Station (z. B. { tangram: { geloest: {...} } }),
     stempel: je gemeisterter Stufe { 'tangram:leicht': { am: Zeitstempel } }. */
  const leeresKind = (name, klasse = C.klasseStandard) =>
    ({ id: neueId(), name, klasse: klasseOk(klasse), angelegt: Date.now(), stationen: {}, stempel: {} });
  const normalisiere = k => ({
    id: String(k.id),
    name: String(k.name).trim().slice(0, C.nameMaxLaenge),
    klasse: klasseOk(k.klasse),
    angelegt: Number(k.angelegt) || Date.now(),
    stationen: istObjekt(k.stationen) ? k.stationen : {},
    stempel: istObjekt(k.stempel) ? k.stempel : {}
  });
  const kindGueltig = k => istObjekt(k) && typeof k.id === 'string' && k.id !== '' &&
    typeof k.name === 'string' && k.name.trim() !== '';

  let kinder = [];
  let aktivId = null;
  /* Konnte ein vorhandener Stand nicht gelesen werden, speichert die Seite nichts,
     damit der alte Stand nicht überschrieben wird. */
  let ladeFehler = false;
  let letzterFehler = null;
  let persistGefragt = false;

  /* ---------- Vorschau ---------- */
  const such = new URLSearchParams(location.search);
  const vorschauWert = such.get('vorschau');
  const istVorschau = vorschauWert !== null && /^\d{1,3}$/.test(vorschauWert);

  function vorschauKind(n) {
    const k = leeresKind('Vorschau', such.get('klasse'));
    k.id = 'vorschau';
    let z = 0;
    for (const st of C.stationen) for (const stufe of C.stufen) {
      if (z++ >= n) return k;
      k.stempel[`${st.id}:${stufe}`] = { am: Date.now() };
      /* passender Stand, damit Sammelbuch und Auswahl in der Vorschau nicht widersprechen (Etappe 6c) */
      const stand = k.stationen[st.id] = k.stationen[st.id] || {};
      if (st.id === 'tangram') { stand.geloest = stand.geloest || {}; for (let i = 1; i <= 3; i++) stand.geloest[`vorschau-${stufe}-${i}:${stufe}`] = Date.now(); }
      else { stand.runden = stand.runden || {}; stand.runden[stufe] = 1; }
    }
    return k;
  }

  /* ---------- Laden ---------- */
  function laden() {
    if (istVorschau) {
      kinder = [vorschauKind(Number(vorschauWert))];
      aktivId = 'vorschau';
      return;
    }
    let roh = null;
    try { roh = localStorage.getItem(KEY); } catch (e) { letzterFehler = e; return; }
    if (roh === null) return;
    try {
      const daten = JSON.parse(roh);
      if (!istObjekt(daten) || !Array.isArray(daten.kinder)) throw new Error('Aufbau unbekannt');
      kinder = daten.kinder.filter(kindGueltig).map(normalisiere);
    } catch (e) {
      ladeFehler = true;
      letzterFehler = e;
      return;
    }
    let gewaehlt = null;
    try { gewaehlt = sessionStorage.getItem(WER); } catch (e) { /* dann fragt die Seite nach */ }
    const k = kinder.length === 1 ? kinder[0] : kinder.find(x => x.id === gewaehlt);
    if (k) aktivId = k.id;
  }

  /* ---------- Speichern ---------- */
  /* Gibt true zurück, wenn gespeichert wurde (oder in der Vorschau nichts zu tun ist). */
  function speichern() {
    if (istVorschau) return true;
    if (ladeFehler) return false;
    try {
      localStorage.setItem(KEY, JSON.stringify({ schema: C.speicher.schema, kinder }));
    } catch (e) {
      letzterFehler = e;
      return false;
    }
    letzterFehler = null;
    if (!persistGefragt) {
      persistGefragt = true;
      /* Bittet den Browser, die Daten zu behalten. Ob er zustimmt, entscheidet er selbst. */
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* Normalfall bleibt */ }
    }
    return true;
  }

  /* ---------- Kinder ---------- */
  const gleicherName = (a, b) => a.trim().toLocaleLowerCase('de') === b.trim().toLocaleLowerCase('de');

  /* Prüft einen Vornamen. null = passt, sonst ein Hinweis für das Kind. */
  function namePruefen(name, ausserId = null) {
    const n = String(name || '').trim();
    if (!n) return 'Schreib bitte deinen Vornamen.';
    if (n.length > C.nameMaxLaenge) return `Der Name ist zu lang. Höchstens ${C.nameMaxLaenge} Zeichen.`;
    if (kinder.some(k => k.id !== ausserId && gleicherName(k.name, n))) return 'Diesen Namen gibt es hier schon. Nimm noch den ersten Buchstaben vom Nachnamen dazu.';
    return null;
  }

  function anlegen(name, klasse) {
    if (istVorschau) return { ok: false, grund: 'In der Vorschau kann man niemanden anlegen.' };
    if (ladeFehler) return { ok: false, grund: 'Der alte Stand konnte nicht gelesen werden.' };
    const grund = namePruefen(name);
    if (grund) return { ok: false, grund, feld: 'name' };
    if (!C.klassen.includes(Number(klasse))) return { ok: false, grund: 'Tippe bitte auf deine Klasse.', feld: 'klasse' };
    const k = leeresKind(String(name).trim(), klasse);
    kinder.push(k);
    waehlen(k.id);
    return { ok: speichern(), kind: k };
  }

  function waehlen(id) {
    if (!kinder.some(k => k.id === id)) return false;
    aktivId = id;
    if (!istVorschau) { try { sessionStorage.setItem(WER, id); } catch (e) { /* nur dieser Tab */ } }
    return true;
  }

  function abmelden() {
    aktivId = null;
    try { sessionStorage.removeItem(WER); } catch (e) { /* egal */ }
  }

  function aktiv() { return kinder.find(k => k.id === aktivId) || null; }

  /* Stempel für eine gemeisterte Stufe. Gibt { ok, neu } zurück. Einmal verdient, bleibt er. */
  function stempelGeben(station, stufe) {
    const k = aktiv();
    if (!k || !C.stufen.includes(stufe)) return { ok: false, neu: false };
    const key = `${station}:${stufe}`;
    if (k.stempel[key]) return { ok: true, neu: false };
    k.stempel[key] = { am: Date.now() };
    return { ok: speichern(), neu: true };
  }

  /* Stand einer Station lesen und ändern. aendern bekommt eine Kopie und gibt den neuen Stand zurück. */
  function stationStand(station) {
    const k = aktiv();
    return k && istObjekt(k.stationen[station]) ? JSON.parse(JSON.stringify(k.stationen[station])) : {};
  }
  function stationSetzen(station, stand) {
    const k = aktiv();
    if (!k || !istObjekt(stand)) return false;
    k.stationen[station] = stand;
    return speichern();
  }

  /* Löscht nur das aktive Kind ("Alles löschen / Neu anfangen"). In der Vorschau nichts. */
  function aktivLoeschen() {
    const k = aktiv();
    if (!k || istVorschau) return false;
    kinder = kinder.filter(x => x.id !== k.id);
    abmelden();
    return speichern();
  }

  laden();

  SW.speicher = {
    KEY,
    istVorschau,
    get ladeFehler() { return ladeFehler; },
    get letzterFehler() { return letzterFehler; },
    kinder: () => kinder.slice(),
    aktiv,
    namePruefen,
    anlegen,
    waehlen,
    abmelden,
    speichern,
    stempelGeben,
    stationStand,
    stationSetzen,
    aktivLoeschen
  };
})();
