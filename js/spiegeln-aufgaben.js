/* Seesternwerkstatt: Aufgaben zum Spiegeln erzeugen (Etappe 3b). Reine Rechnung, keine Darstellung.
   Getestet in tools/spiegeln-test.html, zum Ansehen: tools/spiegeln-vorschau.html.

   runde(stufe, saat) liefert sechs gemischte Aufgaben. Gleicher Startwert (saat) → gleiche Aufgaben.
   Die Aufgaben enthalten keine Lösung. Die berechnet js/spiegeln-raster.js beim Prüfen.

   Jede Aufgabe wird nach dem Erzeugen geprüft und sonst verworfen:
   - Ergänzen: Vorgabe auf einer Seite der Achse, Spiegelbild passt ins Raster, es gibt etwas zu tun.
     Das Spiegelbild ist keine bloße Verschiebung der Vorgabe (sonst könnte man „abmalen“ statt spiegeln).
   - Achsen finden: Die Figur hat genau die gewollten Spiegelachsen (0, 1, 2 oder 4). Angeboten werden
     die Linien durch die Mitte der Figur, auch solche, die keine Achsen sind. Beim Rechteck sind die
     schrägen Linien die Diagonalen von Ecke zu Ecke.
   - Faltschnitt wählen: Genau eine Antwort stimmt. Die falschen Antworten sind weder zur richtigen
     noch untereinander deckungsgleich (auch nicht gedreht oder gewendet).
   Alle Figuren und Buchstaben sind selbst entworfen bzw. zufällig erzeugt. */
(() => {
  'use strict';
  const R = SW.spiegelRaster;
  const { key, feldAus } = R;

  /* ---------- Zufall mit Startwert (mulberry32) ---------- */
  function zufall(saat) {
    let a = (Number(saat) || 0) >>> 0;
    const naechste = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const zz = (von, bis) => von + Math.floor(naechste() * (bis - von + 1));
    const wahl = liste => liste[zz(0, liste.length - 1)];
    const mischen = liste => { const l = liste.slice(); for (let i = l.length - 1; i > 0; i--) { const k = zz(0, i); [l[i], l[k]] = [l[k], l[i]]; } return l; };
    /* paare: [[wert, gewicht], …] */
    const gewichtet = paare => { let summe = 0; for (const p of paare) summe += p[1]; let x = naechste() * summe; for (const p of paare) { x -= p[1]; if (x < 0) return p[0]; } return paare[paare.length - 1][0]; };
    return { naechste, zz, wahl, mischen, gewichtet };
  }

  /* ---------- Bausteine ---------- */
  const NACHBARN = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const bereich = (s0, s1, z0, z1, erlaubt = () => true) => {
    const m = new Set();
    for (let s = s0; s <= s1; s++) for (let z = z0; z <= z1; z++) if (erlaubt(s, z)) m.add(`${s},${z}`);
    return m;
  };
  const alsBild = (felder, farbe = 1) => Object.fromEntries([...felder].map(k => [k, farbe]));
  /* Lässt aus einem Startfeld eine zusammenhängende Figur mit n Feldern wachsen (nur in erlaubten Feldern) */
  function wachsen(zf, erlaubt, start, n) {
    if (!erlaubt.has(start)) return null;
    const drin = new Set([start]), rand = [];
    const dazu = k => {
      const f = feldAus(k);
      for (const [ds, dz] of NACHBARN) {
        const x = key({ s: f.s + ds, z: f.z + dz });
        if (erlaubt.has(x) && !drin.has(x) && !rand.includes(x)) rand.push(x);
      }
    };
    dazu(start);
    while (drin.size < n && rand.length) {
      const k = rand.splice(zf.zz(0, rand.length - 1), 1)[0];
      drin.add(k);
      dazu(k);
    }
    return drin.size === n ? [...drin] : null;
  }
  /* Färbt die Felder in zusammenhängenden Gruppen (wie im Heft: Figuren aus farbigen Teilen) */
  function faerben(zf, zellen, anzahl) {
    const farben = zf.mischen([1, 2, 3]).slice(0, anzahl);
    if (anzahl === 1) return alsBild(zellen, farben[0]);
    const menge = new Set(zellen), bild = {};
    let rand = zf.mischen(zellen).slice(0, anzahl);
    rand.forEach((k, i) => { bild[k] = farben[i]; });
    while (rand.length) {
      const neu = [];
      for (const k of rand) {
        const f = feldAus(k);
        for (const [ds, dz] of NACHBARN) {
          const x = key({ s: f.s + ds, z: f.z + dz });
          if (menge.has(x) && bild[x] === undefined) { bild[x] = bild[k]; neu.push(x); }
        }
      }
      rand = neu;
    }
    return bild;
  }
  /* Grundlage ist immer: senkrechte Achse bei p, Figur links davon, Raster b × h.
     Daraus entstehen die vier Lagen (Figur links, rechts, oben oder unten). */
  function inLage(lage, b, h, p) {
    if (lage === 'links') return { b, h, achse: { typ: 'senkrecht', pos: p }, f: x => x };
    if (lage === 'rechts') return { b, h, achse: { typ: 'senkrecht', pos: p }, f: x => ({ s: b - 1 - x.s, z: x.z }) };
    if (lage === 'oben') return { b: h, h: b, achse: { typ: 'waagerecht', pos: p }, f: x => ({ s: x.z, z: x.s }) };
    return { b: h, h: b, achse: { typ: 'waagerecht', pos: p }, f: x => ({ s: x.z, z: b - 1 - x.s }) };   /* unten */
  }
  /* Alle Bilder der Vorgabe (sie selbst und ihre Spiegelbilder) sehen verschieden aus:
     Wer nur verschiebt statt spiegelt, liegt falsch. */
  function spiegelnStattSchieben(aufgabe) {
    let bilder = [aufgabe.vorgabe];
    for (const a of aufgabe.achsen) bilder = bilder.concat(bilder.map(b => R.bildSpiegeln(b, a)));
    const n = bilder.map(R.normal);
    for (let i = 0; i < n.length; i++) for (let j = i + 1; j < n.length; j++) if (R.gleich(n[i], n[j])) return false;
    return true;
  }
  /* Schutz: keine Figur, die sich bei einer Vierteldrehung deckt, aber keine Spiegelachse hat (Windrad-Form).
     Solche Formen können an ein Hakenkreuz erinnern. Sie werden in jeder Figur jeder Aufgabe ausgeschlossen. */
  function windrad(bild) {
    const l = R.lagen(bild);   /* l[0] wie sie ist, l[2] um eine Vierteldrehung gedreht */
    return R.gleich(l[0], l[2]) && !R.achsenDurchMitte(bild).some(a => R.istAchse(bild, a));
  }

  /* ---------- Ergänzen ---------- */
  /* leicht: Figur liegt an der Achse, eine Farbe. mittel: ein oder zwei Kästchen Abstand, zwei bis drei Farben. */
  function ergaenzenGerade(zf, stufe, lage) {
    const mittel = stufe === 'mittel';
    const b = mittel ? 10 : 8, h = 8, p = b / 2;
    const abstand = mittel ? zf.zz(1, 2) : 0;
    const sMax = p - 1 - abstand;
    const erlaubt = bereich(Math.max(0, sMax - 3), sMax, 1, h - 2);
    const zellen = wachsen(zf, erlaubt, key({ s: sMax, z: zf.zz(2, h - 3) }), zf.zz(6, 9));
    if (!zellen) return null;
    const r = R.rahmen(alsBild(zellen));
    if (r.b < 2 || r.h < 3) return null;
    if (zellen.filter(k => feldAus(k).s === sMax).length < 2) return null;
    const farbig = faerben(zf, zellen, mittel ? zf.gewichtet([[2, 3], [3, 2]]) : 1);
    const l = inLage(lage, b, h, p);
    return { art: 'ergaenzen', stufe, b: l.b, h: l.h, achsen: [l.achse], vorgabe: R.abbilden(farbig, l.f) };
  }
  /* knifflig: schräge Achse durch die Ecken des Rasters, zwei bis drei Farben.
     Grundlage: Achse von links oben nach rechts unten, Figur unten links (höchstens zwei Felder auf der Achse). */
  function ergaenzenSchraeg(zf, lage) {
    const n = 8;
    const erlaubt = bereich(0, n - 1, 0, n - 1, (s, z) => s <= z);
    const starts = [...erlaubt].filter(k => { const f = feldAus(k); return f.z - f.s >= 1 && f.z - f.s <= 2; });
    const zellen = wachsen(zf, erlaubt, zf.wahl(starts), zf.zz(6, 9));
    if (!zellen) return null;
    const aufAchse = zellen.filter(k => { const f = feldAus(k); return f.s === f.z; }).length;
    if (aufAchse > 2 || zellen.length - aufAchse < 5) return null;
    const farbig = faerben(zf, zellen, zf.gewichtet([[2, 7], [3, 3]]));
    const karte = {
      'fallend-unten': { achse: { typ: 'fallend', pos: 0 }, f: x => x },
      'fallend-oben': { achse: { typ: 'fallend', pos: 0 }, f: x => ({ s: x.z, z: x.s }) },
      'steigend-unten': { achse: { typ: 'steigend', pos: n }, f: x => ({ s: n - 1 - x.s, z: x.z }) },
      'steigend-oben': { achse: { typ: 'steigend', pos: n }, f: x => ({ s: n - 1 - x.z, z: x.s }) }
    }[lage];
    return { art: 'ergaenzen', stufe: 'knifflig', b: n, h: n, achsen: [karte.achse], vorgabe: R.abbilden(farbig, karte.f) };
  }
  /* knifflig: Achsenkreuz, „nacheinander spiegeln“. Die Figur liegt in einem Viertel und berührt eine Achse. */
  function kreuz(zf, ecke) {
    const erlaubt = bereich(0, 3, 0, 3);
    const zellen = wachsen(zf, erlaubt, zf.wahl([...erlaubt]), zf.zz(4, 6));   /* höchstens 18 Kästchen zu malen */
    if (!zellen) return null;
    if (!zellen.some(k => { const f = feldAus(k); return f.s === 3 || f.z === 3; })) return null;
    const farbig = faerben(zf, zellen, zf.gewichtet([[1, 3], [2, 7]]));
    const f = x => ({ s: ecke & 1 ? 7 - x.s : x.s, z: ecke & 2 ? 7 - x.z : x.z });
    return { art: 'ergaenzen', stufe: 'knifflig', b: 8, h: 8, achsen: [{ typ: 'senkrecht', pos: 4 }, { typ: 'waagerecht', pos: 4 }], vorgabe: R.abbilden(farbig, f) };
  }

  /* ---------- Achsen finden ---------- */
  /* Formen: V = nur senkrechte Achse, H = nur waagerechte, D1/D2 = nur eine schräge, VH und DD = zwei Achsen,
     D4 = vier Achsen, C2 = keine Achse, aber nach halber Drehung gleich (wie ein Parallelogramm), keine = gar nichts.
     Eine Figur entsteht, indem ein kleiner Keim mit den Abbildungen der Form vervielfacht wird.
     Danach wird nachgerechnet, ob sie genau die gewollten Achsen hat. */
  const ERZEUGER = { V: ['V'], H: ['H'], D1: ['D1'], D2: ['D2'], VH: ['V', 'H'], DD: ['D1', 'D2'], D4: ['V', 'D1'], C2: ['R'], keine: [] };
  const ERWARTET = { V: ['senkrecht'], H: ['waagerecht'], D1: ['fallend'], D2: ['steigend'], VH: ['senkrecht', 'waagerecht'], DD: ['fallend', 'steigend'], D4: R.ACHSTYPEN, C2: [], keine: [] };
  const KEIM = { V: [3, 6], H: [3, 6], D1: [3, 6], D2: [3, 6], C2: [3, 6], VH: [2, 4], DD: [2, 4], D4: [1, 3], keine: [5, 9] };
  const echteAchsen = bild => R.achsenDurchMitte(bild).filter(a => R.istAchse(bild, a)).map(a => a.typ);
  const halbGedrehtGleich = bild => { const r = R.rahmen(bild); return R.gleich(R.abbilden(bild, f => ({ s: r.s0 + r.s1 - f.s, z: r.z0 + r.z1 - f.z })), bild); };

  function symFigur(zf, typ, maxSeite, maxFelder) {
    const quadratisch = ['D1', 'D2', 'DD', 'D4'].includes(typ);
    const bw = zf.zz(3, maxSeite), bh = quadratisch ? bw : zf.zz(3, maxSeite);
    const abb = {
      V: f => ({ s: bw - 1 - f.s, z: f.z }),
      H: f => ({ s: f.s, z: bh - 1 - f.z }),
      D1: f => ({ s: f.z, z: f.s }),
      D2: f => ({ s: bw - 1 - f.z, z: bw - 1 - f.s }),
      R: f => ({ s: bw - 1 - f.s, z: bh - 1 - f.z })
    };
    const alle = bereich(0, bw - 1, 0, bh - 1);
    const start = typ === 'keine' ? zf.wahl([...alle])
      : key({ s: zf.zz(Math.floor((bw - 1) / 2), Math.ceil((bw - 1) / 2)), z: zf.zz(Math.floor((bh - 1) / 2), Math.ceil((bh - 1) / 2)) });
    const keim = wachsen(zf, alle, start, Math.min(zf.zz(KEIM[typ][0], KEIM[typ][1]), alle.size));
    if (!keim) return null;
    const menge = new Set(keim);
    for (let neu = true; neu;) {
      neu = false;
      for (const g of ERZEUGER[typ]) for (const x of [...menge]) {
        const y = key(abb[g](feldAus(x)));
        if (!menge.has(y)) { menge.add(y); neu = true; }
      }
    }
    const bild = R.normal(alsBild(menge)), r = R.rahmen(bild);
    if (menge.size < 5 || menge.size > maxFelder || menge.size === r.b * r.h) return null;
    if (!R.zusammenhaengend(bild)) return null;
    if (echteAchsen(bild).join() !== ERWARTET[typ].join()) return null;
    if (typ === 'keine' && halbGedrehtGleich(bild)) return null;
    return bild;
  }
  /* Rechteck: zwei Achsen, die Diagonalen sind keine (häufiger Irrtum). Quadrat: vier Achsen. */
  function rechteck(zf, quadrat, maxSeite) {
    const b = zf.zz(2, quadrat ? 4 : maxSeite);
    let h = b;
    while (!quadrat && h === b) h = zf.zz(2, maxSeite);
    return alsBild(bereich(0, b - 1, 0, h - 1));
  }
  /* Fast symmetrisch: eine symmetrische Figur, bei der ein Feld fehlt oder dazukommt */
  function fastSymmetrisch(zf, maxSeite, maxFelder) {
    const basis = symFigur(zf, zf.wahl(['VH', 'V', 'H', 'D4']), maxSeite - 1, maxFelder - 1);
    if (!basis) return null;
    const vorher = echteAchsen(basis).join(), felder = Object.keys(basis), kandidaten = [];
    for (const k of felder) {
      const ohne = { ...basis };
      delete ohne[k];
      if (felder.length > 5 && R.zusammenhaengend(ohne)) kandidaten.push(ohne);
    }
    const rand = new Set();
    for (const k of felder) {
      const f = feldAus(k);
      for (const [ds, dz] of NACHBARN) { const x = key({ s: f.s + ds, z: f.z + dz }); if (basis[x] === undefined) rand.add(x); }
    }
    for (const x of rand) kandidaten.push({ ...basis, [x]: 1 });
    const gut = kandidaten.map(R.normal).filter(b => {
      const r = R.rahmen(b);
      return r.b <= maxSeite && r.h <= maxSeite && Object.keys(b).length !== r.b * r.h && echteAchsen(b).join() !== vorher;
    });
    return gut.length ? zf.wahl(gut) : null;
  }
  /* Setzt die Figur mit Rand in ein quadratisches Raster und bietet die Linien durch ihre Mitte an.
     leicht: nur senkrecht und waagerecht. Sonst auch die beiden schrägen. */
  function alsAchsenAufgabe(zf, stufe, figur, mehr = {}) {
    const n = R.normal(figur), r = R.rahmen(n), farbe = zf.zz(1, 3);
    const seite = Math.max(6, Math.max(r.b, r.h) + 2);
    const ds = Math.floor((seite - r.b) / 2), dz = Math.floor((seite - r.h) / 2);
    const platziert = {};
    for (const k of Object.keys(n)) { const f = feldAus(k); platziert[key({ s: f.s + ds, z: f.z + dz })] = farbe; }
    const typen = stufe === 'leicht' ? ['senkrecht', 'waagerecht'] : R.ACHSTYPEN;
    let kandidaten = R.achsenDurchMitte(platziert, typen);
    /* Rechteck (kein Quadrat): Statt der 45°-Linien die Diagonalen von Ecke zu Ecke anbieten.
       Das ist der häufigste Irrtum: Die Diagonale teilt das Rechteck in zwei gleiche Hälften, spiegelt aber nicht. */
    if (stufe !== 'leicht' && r.b !== r.h && Object.keys(n).length === r.b * r.h) {
      kandidaten = kandidaten.slice(0, 2).concat(R.eckDiagonalen(platziert));
    }
    return { art: 'achsen', stufe, b: seite, h: seite, figur: platziert, kandidaten, ...mehr };
  }
  const ACHS_FORMEN = {
    leicht: [['V', 3], ['H', 3], ['VH', 2], ['rechteck', 1], ['keine', 3]],
    mittel: [['V', 2], ['H', 2], ['D1', 2], ['D2', 2], ['VH', 1], ['rechteck', 2], ['C2', 2], ['keine', 1]],
    knifflig: [['D4', 3], ['quadrat', 1], ['DD', 2], ['C2', 2], ['rechteck', 1], ['VH', 1], ['fast', 3], ['D1', 1], ['D2', 1]]
  };
  /* Gibt [Aufgabe, Form] zurück. In einer Runde kommt jede Form höchstens einmal vor (merk.formen). */
  function achsenFigur(zf, stufe, merk) {
    const offen = ACHS_FORMEN[stufe].filter(p => !merk.formen.includes(p[0]));
    const form = zf.gewichtet(offen.length ? offen : ACHS_FORMEN[stufe]);
    const maxSeite = stufe === 'leicht' ? 5 : 6, maxFelder = stufe === 'leicht' ? 12 : 16;
    const figur = form === 'rechteck' ? rechteck(zf, false, maxSeite)
      : form === 'quadrat' ? rechteck(zf, true, maxSeite)
      : form === 'fast' ? fastSymmetrisch(zf, maxSeite, maxFelder)
      : symFigur(zf, form, maxSeite, maxFelder);
    return figur ? [alsAchsenAufgabe(zf, stufe, figur), form] : null;
  }

  /* Buchstaben aus Kästchen (5 breit, 7 hoch), selbst gezeichnet. Welche Achsen sie haben, wird berechnet. */
  const BUCHSTABEN = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
    D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    G: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.###.'],
    H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
    J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    M: ['#...#', '##.##', '#.#.#', '#...#', '#...#', '#...#', '#...#'],
    N: ['#...#', '##..#', '##..#', '#.#.#', '#..##', '#..##', '#...#'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    V: ['#...#', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
    W: ['#...#', '#...#', '#...#', '#...#', '#.#.#', '##.##', '#...#'],
    X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####']
  };
  function buchstabenBild(name) {
    const bild = {};
    BUCHSTABEN[name].forEach((zeile, z) => [...zeile].forEach((c, s) => { if (c === '#') bild[`${s},${z}`] = 1; }));
    return bild;
  }
  function buchstabe(zf, stufe) {
    const name = zf.wahl(Object.keys(BUCHSTABEN));
    return alsAchsenAufgabe(zf, stufe, buchstabenBild(name), { buchstabe: name });
  }

  /* ---------- Faltschnitt ---------- */
  /* Grundlage: aufgeklapptes Papier 8 × 8, Faltlinie senkrecht in der Mitte, die Hälfte liegt links.
     Der Schnitt beginnt an der Faltlinie und bleibt einen Kästchenrand vom Papierrand weg. */
  const FALZ = { typ: 'senkrecht', pos: 4 };
  function faltHaelfte(zf) {
    const zellen = wachsen(zf, bereich(1, 3, 1, 6), key({ s: 3, z: zf.zz(2, 5) }), zf.zz(5, 8));
    if (!zellen) return null;
    const bild = alsBild(zellen), r = R.rahmen(bild);
    if (r.b < 2 || r.h < 3 || zellen.filter(k => feldAus(k).s === 3).length < 2) return null;
    return bild;
  }
  /* Falsche Antworten, wie sie Kinder wirklich geben. Jede muss zusammenhängen und darf weder zur
     richtigen Figur noch zu einer anderen falschen deckungsgleich sein. */
  function falscheAntworten(zf, H, richtig, anzahl) {
    const r = R.rahmen(H);
    const bauer = {
      verschoben: () => ({ ...H, ...R.verschoben(H, 7 - r.s1 - r.s0, 0) }),                             /* abgemalt statt gespiegelt */
      gedreht: () => ({ ...H, ...R.abbilden(H, f => ({ s: 7 - f.s, z: r.z0 + r.z1 - f.z })) }),          /* gedreht statt gespiegelt */
      falscheSeite: () => ({ ...H, ...R.abbilden(H, f => ({ s: 2 * r.s0 - 1 - f.s, z: f.z })) }),        /* an der falschen Kante aufgeklappt */
      nurHalb: () => ({ ...H })                                                                          /* gar nicht aufgeklappt */
    };
    const gewaehlt = [];
    for (const name of zf.mischen(Object.keys(bauer))) {
      const d = bauer[name](), rd = R.rahmen(d);
      if (rd.b > 8 || rd.h > 8 || !R.zusammenhaengend(d) || windrad(d)) continue;
      if (R.kongruent(d, richtig) || gewaehlt.some(g => R.kongruent(d, g))) continue;
      gewaehlt.push(d);
      if (gewaehlt.length === anzahl) return gewaehlt;
    }
    return null;
  }
  function faltWaehlen(zf, stufe, lage) {
    const H = faltHaelfte(zf);
    if (!H) return null;
    const richtig = { ...H, ...R.bildSpiegeln(H, FALZ) };
    const falsch = falscheAntworten(zf, H, richtig, 2);
    if (!falsch) return null;
    const l = inLage(lage, 8, 8, 4);
    const optionen = zf.mischen([richtig, ...falsch]).map(o => R.normal(R.abbilden(o, l.f)));
    return { art: 'faltschnitt', modus: 'waehlen', stufe, b: l.b, h: l.h, achsen: [l.achse], vorgabe: R.abbilden(H, l.f), optionen };
  }
  function faltZeichnen(zf, stufe, lage) {
    const H = faltHaelfte(zf);
    if (!H) return null;
    const l = inLage(lage, 8, 8, 4);
    return { art: 'faltschnitt', modus: 'zeichnen', stufe, b: l.b, h: l.h, achsen: [l.achse], vorgabe: R.abbilden(H, l.f) };
  }

  /* ---------- Runde ---------- */
  const PLAN = {
    leicht: ['ergaenzen', 'ergaenzen', 'ergaenzen', 'achsen', 'achsen', 'faltWaehlen'],
    mittel: ['ergaenzen', 'ergaenzen', 'achsen', 'buchstabe', 'faltZeichnen', 'faltZeichnen'],
    knifflig: ['ergaenzen', 'ergaenzen', 'kreuz', 'kreuz', 'achsen', 'achsen']
  };
  /* Merkzettel einer Runde: sorgt für Abwechslung (Lage der Figur, Form bei „Achsen finden“) */
  const neuesMerk = zf => ({
    gerade: zf.mischen(['links', 'rechts', 'oben', 'unten']),
    schraeg: zf.mischen(['fallend-unten', 'fallend-oben', 'steigend-unten', 'steigend-oben']),
    falt: zf.mischen(['links', 'rechts', 'oben', 'unten']),
    ecken: zf.mischen([0, 1, 2, 3]),
    formen: [],
    n: { gerade: 0, schraeg: 0, falt: 0, ecken: 0 }
  });
  /* Letzte Prüfung jeder Aufgabe, unabhängig davon, wie sie entstanden ist */
  function brauchbar(a) {
    /* Keine Windrad-Form, in keiner Figur der Aufgabe (die Lösung selbst hat immer eine Spiegelachse) */
    if ((a.art === 'achsen' ? [a.figur] : [a.vorgabe].concat(a.optionen || [])).some(windrad)) return false;
    if (a.art === 'achsen') return R.imRaster(a.figur, a.b, a.h);
    if (R.aufgabePruefen(a).length || !spiegelnStattSchieben(a)) return false;
    if (a.art === 'faltschnitt' && a.modus === 'waehlen') {
      return R.richtigeWahl(a).length === 1 && a.optionen.every(o => { const r = R.rahmen(o); return r.b <= a.b && r.h <= a.h; });
    }
    return true;
  }
  const statistik = { aufgaben: 0, versuche: 0, meiste: 0 };
  function erzeugen(zf, art, stufe, merk = neuesMerk(zf)) {
    for (let versuch = 1; versuch <= 600; versuch++) {
      let a = null, reihe = null, form = null;
      if (art === 'ergaenzen' && stufe === 'knifflig') { reihe = 'schraeg'; a = ergaenzenSchraeg(zf, merk.schraeg[merk.n.schraeg % 4]); }
      else if (art === 'ergaenzen') { reihe = 'gerade'; a = ergaenzenGerade(zf, stufe, merk.gerade[merk.n.gerade % 4]); }
      else if (art === 'kreuz') { reihe = 'ecken'; a = kreuz(zf, merk.ecken[merk.n.ecken % 4]); }
      else if (art === 'achsen') { const paar = achsenFigur(zf, stufe, merk); if (paar) [a, form] = paar; }
      else if (art === 'buchstabe') a = buchstabe(zf, stufe);
      else if (art === 'faltWaehlen') { reihe = 'falt'; a = faltWaehlen(zf, stufe, merk.falt[merk.n.falt % 4]); }
      else if (art === 'faltZeichnen') { reihe = 'falt'; a = faltZeichnen(zf, stufe, merk.falt[merk.n.falt % 4]); }
      else throw new Error('Unbekannte Aufgabenart: ' + art);
      if (a && brauchbar(a)) {
        if (reihe) merk.n[reihe]++;
        if (form) merk.formen.push(form);
        statistik.aufgaben++;
        statistik.versuche += versuch;
        if (versuch > statistik.meiste) statistik.meiste = versuch;
        return a;
      }
    }
    throw new Error(`Keine brauchbare Aufgabe gefunden: ${art}, ${stufe}`);
  }
  /* Sechs gemischte Aufgaben einer Stufe. Gleicher Startwert → gleiche Runde. */
  function runde(stufe, saat) {
    if (!PLAN[stufe]) throw new Error('Unbekannte Stufe: ' + stufe);
    const zf = zufall(saat), merk = neuesMerk(zf);
    /* Gleiche Aufgabenarten hintereinander (Etappe 6b): Das Kind lernt eine Bedienung und bleibt dabei.
       Die Reihenfolge der Arten wechselt von Runde zu Runde. */
    const folge = zf.mischen([...new Set(PLAN[stufe])]).flatMap(art => PLAN[stufe].filter(x => x === art));
    return { stufe, saat, aufgaben: folge.map(art => erzeugen(zf, art, stufe, merk)) };
  }
  /* Eine einzelne Aufgabe (für Tests und Vorschau) */
  const eine = (art, stufe, saat) => erzeugen(zufall(saat), art, stufe);

  SW.spiegelAufgaben = { zufall, runde, eine, PLAN, BUCHSTABEN, buchstabenBild, echteAchsen, windrad, spiegelnStattSchieben, statistik };
})();
