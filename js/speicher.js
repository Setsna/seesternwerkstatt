/* Seesternwerkstatt: Speicher (seit dem Konto-Umbau, 14.11.2026).
   - Das Kind meldet sich mit dem Zugangscode des Perlentauchers an (js/konto-cloud.js).
   - Der Stand liegt im Browser, ein Eintrag je Code (js/konto-speicher.js), und wird
     im Hintergrund mit sw_stand/<code> in Firebase abgeglichen.
   - Die Oberfläche arbeitet weiter synchron mit aktiv, stationStand, stationSetzen, stempelGeben.
   - ?vorschau=N zeigt einen Beispielstand mit N Stempeln und speichert nichts. Nur auf dem eigenen Rechner
     (localhost), auf der echten Seite wäre das eine Tür ohne Code (Spec Konto-Umbau, Entscheidung 5).
   - Kein Löschknopf für Kinder, Zurücksetzen macht die Lehrkraft im Perlentaucher.
   Die drei Baukasten-Module stehen in jeder Seite vor dieser Datei. */
(() => {
  'use strict';
  const C = SW.config, LK = window.LagunenKonto, A = LK.abgleich;
  const STATIONEN = C.stationen.map(s => s.id);
  const RUNDEN = ['spiegeln', 'band'];        /* Stationen mit gezählten Runden */
  const STEMPEL_ID = new Set(STATIONEN.flatMap(st => C.stufen.map(stufe => `${st}:${stufe}`)));
  const FIGUR_ID = /^[a-z0-9-]{1,30}:(leicht|mittel|knifflig)$/;
  const LETZTE = /^(leicht|mittel|knifflig):\d{1,12}$/;
  const zeit = x => Math.round(A.zahl(x));

  /* ---------- Der Stand in sw_stand/<code> ----------
     tangram   { geloest: { 'figur:stufe': Zeitpunkt } }
     spiegeln  { runden: { leicht, mittel, knifflig }, letzte: 'stufe:saat' }
     band      wie spiegeln
     stempel   { 'station:stufe': Zeitpunkt }          der erste Stempel bleibt
     angelegt, geaendert (setzt konto-speicher.js). Kein Name, keine Klasse. */
  function runden(roh) {
    const r = A.karte(roh), aus = { runden: {} };
    for (const stufe of C.stufen) { const n = Math.round(A.zahl(A.karte(r.runden)[stufe])); if (n) aus.runden[stufe] = n; }
    if (typeof r.letzte === 'string' && LETZTE.test(r.letzte)) aus.letzte = r.letzte;
    return aus;
  }
  function sauber(roh) {
    const r = A.karte(roh), geloest = {}, stempel = {};
    for (const [id, t] of Object.entries(A.karte(A.karte(r.tangram).geloest))) if (FIGUR_ID.test(id) && zeit(t)) geloest[id] = zeit(t);
    for (const [id, t] of Object.entries(A.karte(r.stempel))) if (STEMPEL_ID.has(id) && zeit(t)) stempel[id] = zeit(t);
    return { tangram: { geloest }, spiegeln: runden(r.spiegeln), band: runden(r.band), stempel };
  }

  /* Zwei Stände zusammenführen (Bausteine aus js/konto-abgleich.js) */
  function mische(basis, lokal, fern) {
    const b = sauber(basis), l = sauber(lokal), f = sauber(fern);
    const aus = {
      tangram: { geloest: A.vereinigeFrueh(l.tangram.geloest, f.tangram.geloest) },
      stempel: A.vereinigeFrueh(l.stempel, f.stempel),
      geaendert: A.spaeter(A.karte(lokal).geaendert, A.karte(fern).geaendert)
    };
    for (const st of RUNDEN) {
      const r = { runden: {} };
      for (const stufe of C.stufen) {
        const n = A.zuwachs(b[st].runden[stufe], l[st].runden[stufe], f[st].runden[stufe]);
        if (n) r.runden[stufe] = n;
      }
      const letzte = A.hierGeaendert(b[st].letzte, l[st].letzte, f[st].letzte);
      if (letzte) r.letzte = letzte;
      aus[st] = r;
    }
    const angelegt = A.frueher(A.karte(lokal).angelegt, A.karte(fern).angelegt);
    if (angelegt) aus.angelegt = angelegt;
    return aus;
  }

  /* Nach dem Zurücksetzen durch die Lehrkraft: leer anfangen */
  const leer = () => ({ tangram: { geloest: {} }, spiegeln: { runden: {} }, band: { runden: {} }, stempel: {} });
  const neuanfang = (lokal, jetzt) => ({ ...leer(), angelegt: jetzt, geaendert: jetzt });

  /* ---------- Vorschau (nur localhost) ---------- */
  const LOKAL = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const vorschauWert = new URLSearchParams(location.search).get('vorschau');
  const vorschauAn = LOKAL && vorschauWert !== null && /^\d{1,3}$/.test(vorschauWert);
  function vorschauStand() {
    if (!vorschauAn) return null;
    const k = leer();
    let z = 0;
    for (const st of STATIONEN) for (const stufe of C.stufen) {
      if (z++ >= Number(vorschauWert)) return k;
      k.stempel[`${st}:${stufe}`] = Date.now();
      /* passender Stand, damit Sammelbuch und Auswahl in der Vorschau nicht widersprechen */
      if (st === 'tangram') for (let i = 1; i <= 3; i++) k.tangram.geloest[`vorschau-${stufe}-${i}:${stufe}`] = Date.now();
      else k[st].runden[stufe] = 1;
    }
    return k;
  }

  /* ---------- Speicher und Cloud ---------- */
  const S = LK.speicher({
    schluessel: `${C.speicher.schluessel}-v${C.speicher.schema}`,
    nameMax: C.nameMaxLaenge,
    leer,
    normalisiere: sauber,
    mische,
    vorschau: vorschauStand
  });

  const cloud = LK.cloud({
    firebase: C.firebase,
    sammlung: C.cloud.stand,
    sammlungKinder: C.cloud.kinder,
    speicher: S, mische, neuanfang,
    brauchtAngaben: false,
    schreibPauseMs: C.cloud.schreibPauseMs,
    nameMax: C.nameMaxLaenge
  });

  const aktiv = () => S.aktiv();

  /* Stempel für eine gemeisterte Stufe. Gibt { ok, neu } zurück. Einmal verdient, bleibt er. */
  function stempelGeben(station, stufe) {
    const k = aktiv();
    const key = `${station}:${stufe}`;
    if (!k || !STEMPEL_ID.has(key)) return { ok: false, neu: false };
    if (k.stempel[key]) return { ok: true, neu: false };
    k.stempel[key] = Date.now();
    return { ok: S.speichern(), neu: true };
  }

  /* Stand einer Station lesen und ändern. aendern bekommt eine Kopie und gibt den neuen Stand zurück. */
  function stationStand(station) {
    const k = aktiv();
    return k && STATIONEN.includes(station) && A.istObjekt(k[station]) ? A.kopie(k[station]) : {};
  }
  function stationSetzen(station, stand) {
    const k = aktiv();
    if (!k || !STATIONEN.includes(station) || !A.istObjekt(stand)) return false;
    k[station] = station === 'tangram' ? sauber({ tangram: stand }).tangram : runden(stand);
    return S.speichern();
  }

  SW.speicher = {
    S, cloud, mische, neuanfang, sauber,
    get istVorschau() { return S.istVorschau; },
    get ladeFehler() { return S.ladeFehler; },
    get letzterFehler() { return S.letzterFehler; },
    aktiv,
    code: () => S.code(),
    speichern: () => S.speichern(),
    stempelGeben,
    stationStand,
    stationSetzen
  };
})();
