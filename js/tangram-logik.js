/* Seesternwerkstatt: Tangram-Logik (Etappe 2b). Reine Rechnung, keine Darstellung.
   Getestet in tools/tangram-test.html.

   Was hier passiert:
   1. Figur lesen: Eine Figur ist eine fertige Legung der sieben Teile (js/tangram-figuren.js).
      Sie wird geprüft: sieben richtige Formen, nichts liegt übereinander.
   2. Löser: findet ALLE Legungen, die dieselbe Figur ergeben. So erkennt die Seite auch richtige
      Lösungen, die anders aussehen als der Entwurf.
   3. Einrasten: Ein Teil rastet nur an einem Platz ein, der zu den schon liegenden Teilen passt.
      Die eingerasteten Teile lassen sich deshalb immer zu einer ganzen Lösung ergänzen.

   Warum exakte Zahlen? Tangram-Ecken liegen auf Koordinaten der Form a + b·√2. Mit Kommazahlen
   müsste jede Entscheidung („liegt das auf der Linie?“) mit einer Toleranz raten. Hier wird mit
   Paaren ganzer Zahlen [a, b] = a + b·√2 gerechnet, jede Entscheidung ist sicher.
   Gitterkoordinate = Koordinate in Einheiten mal √2 (Einheit: Schenkel des kleinen Dreiecks).
   Dann sind a und b bei allen Ecken ganze Zahlen.

   Idee des Lösers: Der „kleinste“ Eckpunkt V der noch freien Fläche (erst kleinstes y, dann
   kleinstes x) ist eine Ecke der Fläche. Das Teil, das dort liegt, hat selbst eine Ecke in V und
   eine Kante genau auf der Randkante, die in V mit dem kleinsten Winkel beginnt. Dafür gibt es je
   Schritt höchstens 14 Möglichkeiten. Jede wird ausprobiert, wenn das Teil ganz in die freie
   Fläche passt. Der Rand der freien Fläche wird als Kette gerichteter Strecken geführt:
   Legt man ein Teil, heben sich gemeinsame Kantenstücke auf. */
(() => {
  'use strict';
  const G = SW.geometrie, T = SW.tangramTeile;
  const W2 = Math.SQRT2;
  const ARTEN = ['gross', 'mittel', 'klein', 'quadrat', 'parallelogramm'];
  const VORRAT = { gross: 2, mittel: 1, klein: 2, quadrat: 1, parallelogramm: 1 };

  /* ---------- Exakte Zahlen [a, b] = a + b·√2 ---------- */
  const add = (u, v) => [u[0] + v[0], u[1] + v[1]];
  const sub = (u, v) => [u[0] - v[0], u[1] - v[1]];
  const neg = u => [-u[0], -u[1]];
  const mul = (u, v) => [u[0] * v[0] + 2 * u[1] * v[1], u[0] * v[1] + u[1] * v[0]];
  /* Vorzeichen: bei gemischten Vorzeichen entscheidet a² gegen 2·b² (nie gleich, √2 ist irrational) */
  function vz(u) {
    const a = u[0], b = u[1];
    if (b === 0) return Math.sign(a);
    if (a === 0) return Math.sign(b);
    if ((a > 0) === (b > 0)) return a > 0 ? 1 : -1;
    return (a > 0 ? 1 : -1) * Math.sign(a * a - 2 * b * b);
  }
  const cmp = (u, v) => vz(sub(u, v));
  const wert = u => u[0] + u[1] * W2;

  /* ---------- Punkte { x, y } mit exakten Koordinaten ---------- */
  const pk = p => `${p.x[0]},${p.x[1]},${p.y[0]},${p.y[1]}`;
  const pGleich = (p, q) => p.x[0] === q.x[0] && p.x[1] === q.x[1] && p.y[0] === q.y[0] && p.y[1] === q.y[1];
  const pPlus = (p, q) => ({ x: add(p.x, q.x), y: add(p.y, q.y) });
  const pMinus = (p, q) => ({ x: sub(p.x, q.x), y: sub(p.y, q.y) });
  /* Ordnung der Punkte: erst y, dann x */
  const vor = (p, q) => { const c = cmp(p.y, q.y); return c !== 0 ? c : cmp(p.x, q.x); };
  /* Kreuzprodukt (w − v) × (X − v): > 0 heißt, X liegt links der Kante v→w */
  const kreuz = (v, w, X) => sub(mul(sub(w.x, v.x), sub(X.y, v.y)), mul(sub(w.y, v.y), sub(X.x, v.x)));
  /* Gitterpunkt → Punkt in Einheiten (Kommazahl) */
  const reell = p => ({ x: G.glatt(wert(p.x) / W2), y: G.glatt(wert(p.y) / W2) });

  /* ---------- Polygone in Normalform ---------- */
  function flaeche2(P) {   /* doppelte Fläche mit Vorzeichen */
    let s = [0, 0];
    for (let i = 0; i < P.length; i++) {
      const p = P[i], q = P[(i + 1) % P.length];
      s = add(s, sub(mul(p.x, q.y), mul(q.x, p.y)));
    }
    return s;
  }
  /* Normalform: positiver Umlaufsinn, Start an der kleinsten Ecke. Gleiche Polygone → gleiche Liste. */
  function normal(P) {
    const Q = vz(flaeche2(P)) < 0 ? P.slice().reverse() : P.slice();
    let m = 0;
    for (let i = 1; i < Q.length; i++) if (vor(Q[i], Q[m]) < 0) m = i;
    return Q.slice(m).concat(Q.slice(0, m));
  }
  const polyKey = P => P.map(pk).join(' ');                             /* Lage und Form */
  const formKey = P => P.map(p => pk(pMinus(p, P[0]))).join(' ');       /* nur Form (ohne Verschiebung) */

  /* ---------- Richtungen: alle Kanten liegen auf dem 45°-Raster ---------- */
  /* 0 = (+,0), 1 = (+,+), 2 = (0,+), 3 = (−,+), 4 = (−,0), 5 = (−,−), 6 = (0,−), 7 = (+,−); −1 = ungültig */
  const RI = [5, 4, 3, 6, -1, 2, 7, 0, 1];
  function richtung(p, q) {
    const dx = sub(q.x, p.x), dy = sub(q.y, p.y), sx = vz(dx), sy = vz(dy);
    if (sx !== 0 && sy !== 0 && vz(sub(mul(dx, dx), mul(dy, dy))) !== 0) return -1;
    return RI[(sx + 1) * 3 + (sy + 1)];
  }
  /* Vier Geradenklassen: Richtung D und Normale N */
  const D = [[1, 0], [1, 1], [0, 1], [-1, 1]];
  const N = [[0, 1], [-1, 1], [-1, 0], [-1, -1]];
  const skalar = (c, p) => [c[0] * p.x[0] + c[1] * p.y[0], c[0] * p.x[1] + c[1] * p.y[1]];

  /* ---------- Die Formen in allen Drehungen ---------- */
  /* k = Drehung in 45°-Schritten, gew = gewendet. Ecke 0 der Rohform liegt im Ursprung. */
  function variante(art, k, gew) {
    return T.ROH[art].map(({ x, y }) => {
      let i = gew ? -x : x, j = y;
      for (let n = 0; n < (k >> 1); n++) [i, j] = [-j, i];
      return (k & 1) ? { x: [i - j, 0], y: [i + j, 0] } : { x: [0, i], y: [0, j] };
    });
  }
  const FORMEN = new Map();   /* formKey → art */
  const ANLEGEN = {};         /* art → je Richtung 0..7 die Polygone mit Ecke 0 im Ursprung und Kante 0→1 in dieser Richtung */
  for (const art of ARTEN) {
    ANLEGEN[art] = Array.from({ length: 8 }, () => []);
    const gesehen = new Set();
    for (let k = 0; k < 8; k++) for (const gew of [false, true]) {
      const P = normal(variante(art, k, gew));
      FORMEN.set(formKey(P), art);
      for (let e = 0; e < P.length; e++) {
        const Q = P.slice(e).concat(P.slice(0, e)).map(p => pMinus(p, P[e]));
        const key = polyKey(Q);
        if (gesehen.has(key)) continue;
        gesehen.add(key);
        ANLEGEN[art][richtung(Q[0], Q[1])].push(Q);
      }
    }
  }

  /* ---------- Randkette ---------- */
  /* Kanten eines Polygons als gerichtete Strecken (rueck = umgekehrt, zum Abziehen) */
  function kanten(P, rueck = false) {
    return P.map((p, i) => { const q = P[(i + 1) % P.length]; return rueck ? { p: q, q: p } : { p, q }; });
  }
  /* Fasst Strecken auf gleichen Geraden zusammen: Gegenläufige Stücke heben sich auf.
     Ergebnis: der Rand der Fläche (Fläche links der Laufrichtung). null, wenn etwas nicht aufgeht. */
  function netto(strecken) {
    const linien = new Map();
    for (const s of strecken) {
      const ri = richtung(s.p, s.q);
      if (ri < 0) return null;
      const c = ri & 3, o = skalar(N[c], s.p), key = `${c}|${o[0]},${o[1]}`;
      let L = linien.get(key);
      if (!L) linien.set(key, L = []);
      /* Entlang der Geraden zählt jede Strecke +1 ab ihrem Anfang und −1 ab ihrem Ende. */
      L.push({ t: skalar(D[c], s.p), p: s.p, m: 1 }, { t: skalar(D[c], s.q), p: s.q, m: -1 });
    }
    const out = [];
    for (const L of linien.values()) {
      L.sort((a, b) => cmp(a.t, b.t));
      let m = 0, start = null, i = 0;
      while (i < L.length) {
        let j = i, delta = 0;
        while (j < L.length && cmp(L[j].t, L[i].t) === 0) delta += L[j++].m;
        if (delta !== 0) {
          if (m !== 0) {
            if (Math.abs(m) > 1) return null;
            out.push(m > 0 ? { p: start, q: L[i].p } : { p: L[i].p, q: start });
          }
          m += delta;
          start = L[i].p;
        }
        i = j;
      }
    }
    return out;
  }
  /* Kleinste Ecke V des Rands und die Randkante mit dem kleinsten Winkel, die dort beginnt */
  function ecke(netz) {
    let V = null;
    for (const s of netz) { if (!V || vor(s.p, V) < 0) V = s.p; if (vor(s.q, V) < 0) V = s.q; }
    let ri = 9, weg = false;
    for (const s of netz) {
      if (pGleich(s.p, V)) { const r = richtung(s.p, s.q); if (r < ri) { ri = r; weg = true; } }
      else if (pGleich(s.q, V)) { const r = richtung(s.q, s.p); if (r < ri) { ri = r; weg = false; } }
    }
    return weg && ri < 4 ? { V, ri } : null;
  }
  /* Läuft die Strecke A–B durch das Innere des konvexen Polygons P (positiver Umlaufsinn)?
     Entlang der Strecke ist jede Kantenbedingung linear: Es bleiben untere und obere Grenzen
     für den Streckenparameter, verglichen als Brüche ohne zu teilen. */
  function schneidetInneres(A, B, P) {
    const unten = [], oben = [];
    for (let k = 0; k < P.length; k++) {
      const v = P[k], w = P[(k + 1) % P.length];
      const a = kreuz(v, w, A), b = kreuz(v, w, B), sa = vz(a), sb = vz(b);
      if (sa <= 0 && sb <= 0) return false;
      if (sa > 0 && sb > 0) continue;
      const n = sub(a, b);
      if (sa <= 0) unten.push([neg(a), neg(n)]);   /* t > −a / (b − a) */
      else oben.push([a, n]);                      /* t <  a / (a − b) */
    }
    for (const [n1, d1] of unten) for (const [n2, d2] of oben) {
      if (vz(sub(mul(n1, d2), mul(n2, d1))) >= 0) return false;
    }
    return true;
  }
  const innenFrei = (netz, P) => !netz.some(s => schneidetInneres(s.p, s.q, P));

  /* Haben zwei konvexe Polygone (positiver Umlaufsinn) gemeinsame innere Punkte?
     Nein genau dann, wenn eine Kante des einen alle Ecken des anderen auf ihrer Außenseite hat. */
  function ueberlappen(P, Q) {
    for (const [A, B] of [[P, Q], [Q, P]]) {
      for (let k = 0; k < A.length; k++) {
        const v = A[k], w = A[(k + 1) % A.length];
        if (B.every(X => vz(kreuz(v, w, X)) <= 0)) return false;
      }
    }
    return true;
  }
  /* Rand als geschlossene Linienzüge (für den Umriss) */
  function schleifen(netz) {
    const ab = new Map();
    netz.forEach((s, i) => { const k = pk(s.p); if (!ab.has(k)) ab.set(k, []); ab.get(k).push(i); });
    const benutzt = netz.map(() => false), out = [];
    for (let i = 0; i < netz.length; i++) {
      if (benutzt[i]) continue;
      const zug = [];
      for (let j = i; j !== undefined; j = (ab.get(pk(netz[j].q)) || []).find(x => !benutzt[x])) {
        benutzt[j] = true;
        zug.push(netz[j].p);
      }
      out.push(zug);
    }
    return out;
  }

  /* ---------- Figur lesen ---------- */
  /* Schreibweise einer Koordinate: ganze Zahl, Vielfaches von r (r = halbe Wurzel 2 ≈ 0,707)
     oder Summe: "2", "3r", "2+r", "1-2r", "-r". Punkt: "x,y". Polygon: Punkte mit Leerzeichen. */
  function zahlLesen(text) {
    if (!/^[+-]?(\d+r?|r)([+-](\d+r?|r))*$/.test(text)) throw new Error(`„${text}“ ist keine Zahl wie 2, 3r oder 2+r`);
    let ganz = 0, mitR = 0;
    for (const m of text.matchAll(/([+-]?)(\d*)(r?)/g)) {
      if (!m[0]) continue;
      const s = m[1] === '-' ? -1 : 1, n = m[2] === '' ? 1 : Number(m[2]);
      if (m[3]) mitR += s * n; else ganz += s * n;
    }
    return [mitR, ganz];   /* Einheiten: ganz + mitR·r, im Gitter (mal √2): mitR + ganz·√2 */
  }
  function punktLesen(text) {
    const t = text.split(',');
    if (t.length !== 2) throw new Error(`„${text}“ ist kein Punkt wie 2,3r`);
    return { x: zahlLesen(t[0]), y: zahlLesen(t[1]) };
  }
  const teilAus = (art, P) => ({ art, punkte: P, key: `${art}:${polyKey(P)}` });
  function figurLesen(def) {
    const fehler = [], teile = [];
    ((def && def.teile) || []).forEach((text, i) => {
      try {
        const P = normal(String(text).trim().split(/\s+/).map(punktLesen));
        const art = FORMEN.get(formKey(P));
        if (art) teile.push(teilAus(art, P));
        else fehler.push(`Teil ${i + 1} ist keine Tangram-Form.`);
      } catch (e) { fehler.push(`Teil ${i + 1}: ${e.message}`); }
    });
    if (!fehler.length) {
      for (const a of ARTEN) {
        const n = teile.filter(t => t.art === a).length;
        if (n !== VORRAT[a]) fehler.push(`Form „${a}“ kommt ${n}-mal vor, soll ${VORRAT[a]}-mal.`);
      }
      for (let i = 0; i < teile.length; i++) for (let j = i + 1; j < teile.length; j++) {
        if (ueberlappen(teile[i].punkte, teile[j].punkte)) fehler.push(`Teil ${i + 1} und Teil ${j + 1} liegen übereinander.`);
      }
    }
    return { ok: fehler.length === 0, fehler, teile };
  }

  /* ---------- Löser ---------- */
  /* teile: [{ art, punkte (Normalform) }] einer Legung. Findet alle Legungen derselben Fläche
     mit denselben Formen. Gleiche Formen sind austauschbar und zählen nicht doppelt. */
  function loesen(teile, opt = {}) {
    const max = opt.max || 3000;
    const vorrat = {};
    for (const a of ARTEN) vorrat[a] = teile.filter(t => t.art === a).length;
    const start = netto(teile.flatMap(t => kanten(t.punkte)));
    const loesungen = [], gesehen = new Set(), gelegt = [];
    let knoten = 0, abgeschnitten = false;
    if (!start) return { loesungen, knoten, abgeschnitten, fehler: 'Der Rand der Figur geht nicht auf.' };
    (function suche(netz) {
      if (abgeschnitten) return;
      knoten++;
      if (netz.length === 0) {
        if (ARTEN.some(a => vorrat[a] > 0)) return;
        const key = gelegt.map(g => g.key).sort().join('|');
        if (!gesehen.has(key)) {
          gesehen.add(key);
          loesungen.push(gelegt.slice());
          if (loesungen.length >= max) abgeschnitten = true;
        }
        return;
      }
      const e = ecke(netz);
      if (!e) return;
      for (const art of ARTEN) {
        if (!vorrat[art]) continue;
        for (const Q of ANLEGEN[art][e.ri]) {
          const P = Q.map(p => pPlus(p, e.V));
          if (!innenFrei(netz, P)) continue;
          const rest = netto(netz.concat(kanten(P, true)));
          if (!rest) continue;
          vorrat[art]--;
          gelegt.push(teilAus(art, normal(P)));
          suche(rest);
          gelegt.pop();
          vorrat[art]++;
        }
      }
    })(start);
    return { loesungen, knoten, abgeschnitten };
  }
  const loesungKey = l => l.map(t => t.key).sort().join('|');

  /* ---------- Aufgabe für die Spielseite (Kommazahlen in Einheiten, bezogen auf die Figur) ---------- */
  const alsZiel = t => { const ecken = t.punkte.map(reell); return { key: t.key, art: t.art, ecken, mitte: T.schwerpunkt(ecken) }; };
  /* stufe: 'leicht'   Teilgrenzen sichtbar, es gilt die gezeichnete Legung
            'mittel'   nur Umriss, zwei Teile liegen schon (def.fest = Nummern in def.teile, sonst die ersten zwei)
            'knifflig' nur Umriss, jede richtige Legung gilt */
  function aufgabe(def, stufe = 'knifflig') {
    const f = figurLesen(def);
    if (!f.ok) return { ok: false, fehler: f.fehler };
    const r = loesen(f.teile);
    if (!r.loesungen.some(l => loesungKey(l) === loesungKey(f.teile))) {
      return { ok: false, fehler: ['Der Löser findet die entworfene Legung nicht.'] };
    }
    const entwurf = f.teile.map(alsZiel);
    const alle = r.loesungen.map(l => l.map(alsZiel));
    const fest = stufe === 'mittel' ? (def.fest || [0, 1]).map(i => entwurf[i]).filter(Boolean) : [];
    let loesungen = alle;
    if (stufe === 'leicht') loesungen = [entwurf];
    else if (fest.length) loesungen = alle.filter(l => fest.every(z => l.some(y => y.key === z.key)));
    const umriss = schleifen(netto(f.teile.flatMap(t => kanten(t.punkte)))).map(zug => zug.map(reell));
    const xs = entwurf.flatMap(z => z.ecken.map(p => p.x)), ys = entwurf.flatMap(z => z.ecken.map(p => p.y));
    return {
      ok: true, def, stufe, entwurf, fest, loesungen, umriss,
      anzahlAlle: alle.length, abgeschnitten: r.abgeschnitten,
      rahmen: { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }
    };
  }

  /* Umriss und Teilgrenzen ohne Löser (schnell, für die Vorschaubilder der Auswahl) */
  function umrissVon(def) {
    const f = figurLesen(def);
    if (!f.ok) return { ok: false, fehler: f.fehler };
    const umriss = schleifen(netto(f.teile.flatMap(t => kanten(t.punkte)))).map(zug => zug.map(reell));
    const grenzen = f.teile.map(t => t.punkte.map(reell));
    const xs = grenzen.flat().map(p => p.x), ys = grenzen.flat().map(p => p.y);
    return { ok: true, umriss, grenzen, rahmen: { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) } };
  }

  /* ---------- Einrasten (Kommazahlen, Toleranz gewollt: das Kind legt ungefähr) ---------- */
  const verschoben = (ecken, dx, dy) => ecken.map(p => ({ x: p.x + dx, y: p.y + dy }));
  /* Plätze, die ein Teil dieser Form jetzt belegen darf: Sie kommen in einer Lösung vor,
     die alle schon belegten Plätze enthält. belegt = Schlüssel der eingerasteten Teile. */
  function freieZiele(aufg, art, belegt) {
    const out = new Map();
    for (const l of aufg.loesungen) {
      if (!belegt.every(k => l.some(z => z.key === k))) continue;
      for (const z of l) if (z.art === art && !belegt.includes(z.key)) out.set(z.key, z);
    }
    return [...out.values()];
  }
  /* Liegt das Teil (Ecken) nah genug und richtig gedreht auf einem Platz? → { ziel, dx, dy, abstand } oder null */
  function einrasten(ecken, ziele, toleranz) {
    const m = T.schwerpunkt(ecken);
    let best = null;
    for (const z of ziele) {
      const dx = z.mitte.x - m.x, dy = z.mitte.y - m.y, abstand = Math.hypot(dx, dy);
      if (abstand > toleranz || (best && abstand >= best.abstand)) continue;
      if (G.polygonGleich(verschoben(ecken, dx, dy), z.ecken, 1e-6)) best = { ziel: z, dx, dy, abstand };
    }
    return best;
  }
  /* Fast richtig: Das Teil liegt nah an einem Platz, sitzt aber noch nicht.
     was = 'schieben' (Lage stimmt, nur zu weit weg), 'drehen' oder 'wenden' */
  function fastDa(ecken, ziele, radius) {
    const m = T.schwerpunkt(ecken);
    let best = null;
    for (const z of ziele) {
      const abstand = Math.hypot(z.mitte.x - m.x, z.mitte.y - m.y);
      if (abstand <= radius && (!best || abstand < best.abstand)) best = { ziel: z, abstand };
    }
    if (!best) return null;
    const z = best.ziel;
    let was = 'wenden';
    for (let k = 0; k < 8; k++) {
      const gedreht = ecken.map(p => G.drehen(p, 45 * k, m));
      if (G.polygonGleich(verschoben(gedreht, z.mitte.x - m.x, z.mitte.y - m.y), z.ecken, 1e-6)) { was = k === 0 ? 'schieben' : 'drehen'; break; }
    }
    return { ...best, was };
  }
  /* Lage { x, y, dreh, gewendet }, in der das Teil genau auf den Ecken liegt (für Hilfen und feste Teile) */
  function lageFuer(teil, ecken) {
    const m = T.schwerpunkt(ecken);
    for (const gewendet of [false, true]) for (let dreh = 0; dreh < 8; dreh++) {
      const lage = { x: m.x, y: m.y, dreh, gewendet };
      if (G.polygonGleich(T.ecken(teil, lage), ecken, 1e-6)) return lage;
    }
    return null;
  }
  /* Sind alle Plätze einer Lösung belegt? */
  const geloest = (aufg, belegt) => aufg.loesungen.some(l => l.length === belegt.length && l.every(z => belegt.includes(z.key)));

  SW.tangramLogik = {
    ARTEN, VORRAT,
    Z: { add, sub, neg, mul, vz, cmp, wert },
    P: { key: pk, gleich: pGleich, plus: pPlus, minus: pMinus, vor },
    reell, normal, polyKey, formKey, flaeche2, richtung, variante, FORMEN, ANLEGEN,
    kanten, netto, ecke, innenFrei, ueberlappen, schleifen,
    zahlLesen, punktLesen, figurLesen, teilAus, loesen, loesungKey,
    aufgabe, umrissVon, freieZiele, einrasten, fastDa, lageFuer, geloest
  };
})();
