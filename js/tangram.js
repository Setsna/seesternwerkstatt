/* Seesternwerkstatt: Station Tangram, Spiel (Etappe 2b/2c: Figur, Einrasten, Prüfung, Tipp, Stempel).
   Ziehen mit Finger, Stift oder Maus (Pointer-Events), Drehen und Wenden über große Tasten,
   alles auch per Tastatur. Geometrie: js/tangram-teile.js. Figur, Löser, Einrasten: js/tangram-logik.js.

   Aufgabe über die Adresse: tangram.html?figur=pinguin&stufe=leicht|mittel|knifflig.
   Ohne ?figur= zeigt js/tangram-auswahl.js die Auswahl, dieses Skript tut dann nichts.

   Darstellung: SVG, 1 SVG-Einheit = Schenkel des kleinen Dreiecks.
   Jedes Teil ist ein <g> mit CSS-transform. In SVG gilt 1 CSS-px = 1 Einheit. */
(() => {
  'use strict';
  const such = new URLSearchParams(location.search);
  if (!such.has('figur')) return;
  const C = SW.config, E = C.tangram, T = SW.tangramTeile, L = SW.tangramLogik, F = SW.tangramFiguren, S = SW.speicher;
  const svg = document.getElementById('tangram');
  const flaeche = document.getElementById('spielflaeche');
  const rahmen = document.getElementById('spielrahmen');
  const spiel = document.getElementById('spiel');
  const hinweis = document.getElementById('hinweis');
  const live = document.getElementById('live');
  const auftrag = document.getElementById('auftrag');
  const erfolg = document.getElementById('erfolg');
  const NS = 'http://www.w3.org/2000/svg';
  const FARBNAME = { 1: 'gelb', 2: 'türkis', 3: 'lila', 4: 'grün', 5: 'blau', 6: 'rosa', 7: 'sand' };

  /* ---------- Aufgabe ---------- */
  const def = F.finde(such.get('figur')) || F.LISTE[0];
  const stufe = C.stufen.includes(such.get('stufe')) ? such.get('stufe') : 'knifflig';
  let aufg;
  try { aufg = L.aufgabe(def, stufe); } catch (e) { aufg = { ok: false, fehler: [String(e && e.message || e)] }; }

  /* ---------- Zustand ---------- */
  let bw = 14, bh = E.kurzeSeite;       /* Größe der Spielfläche in Einheiten */
  let versatz = { x: 0, y: 0 };         /* wo die Figur auf der Fläche liegt */
  const lagen = {};                     /* id → { x, y, dreh, gewendet } */
  const knoten = {};                    /* id → <g> */
  const sitzt = {};                     /* id → Schlüssel des Platzes, auf dem das Teil eingerastet ist */
  const fest = {};                      /* id → true: liegt von Anfang an richtig und bleibt liegen */
  let gewaehlt = null, figurKnoten = null, letzterHinweis = '';
  let tipp = null;                      /* { id, ziel, knoten }: Stella zeigt gerade einen Platz */
  let hingelegt = 0;                    /* so viele Teile hat Stella in dieser Runde schon hingelegt */
  const NAME = { leicht: 'Leicht', mittel: 'Mittel', knifflig: 'Knifflig' };

  const sagen = t => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 30); };
  /* Sichtbarer Hinweis unter den Tasten. vorlesen: auch für Screenreader, aber nicht bei jeder Wiederholung */
  function zeigeHinweis(t, vorlesen = false) {
    hinweis.textContent = t || '';
    hinweis.parentElement.classList.toggle('rueckmeldung--leer', !t);   /* leere Blase verstecken, auch ohne :has */
    if (vorlesen && t && t !== letzterHinweis) sagen(t);
    letzterHinweis = t || '';
  }

  /* ---------- Aufbau ---------- */
  function el(name, attr = {}) {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v);
    return e;
  }
  function muster() {
    const defs = el('defs');
    defs.innerHTML = `
      <pattern id="tm-streifen" width="0.3" height="0.3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="0.3" stroke="#0b3155" stroke-opacity=".32" stroke-width=".09"/></pattern>
      <pattern id="tm-punkte" width="0.36" height="0.36" patternUnits="userSpaceOnUse"><circle cx="0.18" cy="0.18" r="0.055" fill="#0b3155" fill-opacity=".38"/></pattern>`;
    return defs;
  }
  const punkte = ecken => ecken.map(p => `${p.x},${p.y}`).join(' ');
  function figurBauen() {
    const g = el('g', { class: 'figur', 'aria-hidden': 'true' });
    const d = aufg.umriss.map(zug => 'M' + zug.map(p => `${p.x},${p.y}`).join('L') + 'Z').join('');
    g.appendChild(el('path', { class: 'umriss', d, 'fill-rule': 'evenodd' }));
    if (stufe === 'leicht') for (const z of aufg.entwurf) g.appendChild(el('polygon', { class: 'grenze', points: punkte(z.ecken) }));
    return g;
  }
  function aufbauen() {
    svg.textContent = '';
    svg.appendChild(muster());
    if (aufg.ok) svg.appendChild(figurKnoten = figurBauen());
    for (const t of T.TEILE) {
      const pts = punkte(t.form);
      const g = el('g', { class: 'tteil', tabindex: '0', role: 'button', 'aria-pressed': 'false',
        'aria-label': `${t.name}, ${FARBNAME[t.farbe]}`, 'aria-describedby': 'tastatur-hilfe', 'data-id': t.id });
      g.appendChild(el('polygon', { class: 'tteil__rahmen', points: pts }));
      const f = el('polygon', { class: 'tteil__flaeche', points: pts });
      f.style.fill = `var(--form-${t.farbe})`;
      g.appendChild(f);
      if (t.muster) g.appendChild(el('polygon', { class: 'tteil__muster', points: pts, fill: `url(#tm-${t.muster})` }));
      g.appendChild(el('polygon', { class: 'tteil__kante', points: pts }));
      svg.appendChild(g);
      knoten[t.id] = g;
      sitzt[t.id] = null;
    }
  }

  /* ---------- Lage anzeigen ---------- */
  /* Geometrie: erst wenden (F), dann drehen (R). Gezeichnet wird gleichwertig als F · R(−dreh):
     So bleibt beim Wenden der Drehwinkel gleich und nur scaleX klappt um (keine Doppel-Drehung
     in der Animation). Der Rauchtest vergleicht die gezeichneten Ecken mit T.ecken(). */
  function zeichnen(id) {
    const l = lagen[id];
    const f = l.gewendet ? -1 : 1;
    knoten[id].style.transform = `translate(${l.x}px, ${l.y}px) scaleX(${f}) rotate(${45 * f * l.dreh}deg)`;
    knoten[id].classList.toggle('sitzt', !!sitzt[id]);
  }
  /* Teil ganz in der Fläche halten */
  function einpassen(id) {
    const l = lagen[id], a = T.ausdehnung(T.teil(id), l);
    l.x = Math.min(Math.max(l.x, a.x + 0.1), bw - a.x - 0.1);
    l.y = Math.min(Math.max(l.y, a.y + 0.1), bh - a.y - 0.1);
  }

  /* ---------- Aufteilung der Fläche: Figur und Ablage ---------- */
  /* quer: Figur links, Teile rechts (bei den Tasten). hoch: Figur oben, Teile unten.
     Welche Teilung gilt, entscheidet groesse() (bei fast quadratischer Fläche die, in die die Figur größer passt). */
  let teilung = 'quer';
  function zonen() {
    return teilung === 'quer'
      ? { ziel: { x: 0, y: 0, w: bw * 0.58, h: bh }, ablage: { x: bw * 0.58, y: 0, w: bw * 0.42, h: bh }, spalten: 2, zeilen: 4 }
      : { ziel: { x: 0, y: 0, w: bw, h: bh * 0.55 }, ablage: { x: 0, y: bh * 0.55, w: bw, h: bh * 0.45 }, spalten: 4, zeilen: 2 };
  }
  function versatzNeu() {
    if (!aufg.ok) return { x: 0, y: 0 };
    const z = zonen().ziel, r = aufg.rahmen;
    return { x: z.x + z.w / 2 - (r.x0 + r.x1) / 2, y: z.y + z.h / 2 - (r.y0 + r.y1) / 2 };
  }
  /* Seitenverhältnis der Fläche übernehmen. Die Figur rückt in ihre Zone, eingerastete Teile wandern mit. */
  function groesse() {
    const r = flaeche.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const v = r.width / r.height;
    /* Maßstab (Etappe 6b): so wenige Einheiten auf der kurzen Seite wie möglich, damit Figur und Teile groß sind.
       Bedingungen: Die Figur passt mit Rand in ihre Zone, und jeder Ablageplatz ist groß genug für ein Teil.
       Höchstens E.kurzeSeite (alter fester Wert), mindestens E.kurzeSeiteMin. */
    const passt = k => {
      const b = v >= 1 ? k * v : k, h = v >= 1 ? k : k / v;
      bw = b; bh = h;
      const z = zonen();
      if (!aufg.ok) return true;
      const fw = aufg.rahmen.x1 - aufg.rahmen.x0, fh = aufg.rahmen.y1 - aufg.rahmen.y0, rand = E.figurRand;
      return fw + 2 * rand <= z.ziel.w && fh + 2 * rand <= z.ziel.h &&
        z.ablage.w / z.spalten >= E.ablagePlatz && z.ablage.h / z.zeilen >= E.ablagePlatz;
    };
    /* Etappe 6c: Bei fast quadratischer Fläche beide Teilungen probieren und die mit der größeren Figur nehmen.
       Passt die Figur auch bei E.kurzeSeite nicht, wird weiter verkleinert (k steigt), bis sie sicher hineinpasst. */
    const teilungen = v >= 1.25 ? ['quer'] : v <= 0.8 ? ['hoch'] : (v >= 1 ? ['quer', 'hoch'] : ['hoch', 'quer']);
    let beste = null;
    for (const t of teilungen) {
      teilung = t;
      let k = E.kurzeSeiteMin;
      while (k < 16 && !passt(k)) k += 0.25;
      if (!beste || k < beste.k) beste = { t, k };
    }
    teilung = beste.t;
    passt(beste.k);
    svg.setAttribute('viewBox', `0 0 ${bw.toFixed(3)} ${bh.toFixed(3)}`);
    /* für die Erfolgskarte: quer = rechts in der Ablage, unten = in der Ablage unter der Figur (iPad hoch),
       hoch = unter der Fläche (nur sehr schmale Flächen wie am Handy) */
    rahmen.dataset.lage = spiel.dataset.lage = teilung === 'quer' ? 'quer' : v > 0.8 ? 'unten' : 'hoch';
    const neu = versatzNeu(), dx = neu.x - versatz.x, dy = neu.y - versatz.y;
    versatz = neu;
    if (figurKnoten) figurKnoten.style.transform = `translate(${versatz.x}px, ${versatz.y}px)`;
    for (const id in lagen) {
      if (sitzt[id]) { lagen[id].x += dx; lagen[id].y += dy; } else einpassen(id);
      zeichnen(id);
    }
  }

  /* Stufe mittel: Teile, die schon richtig liegen */
  function festLegen() {
    if (!aufg.ok) return;
    for (const z of aufg.fest) {
      const t = T.TEILE.find(x => x.art === z.art && !fest[x.id]), l = t && L.lageFuer(t, z.ecken);
      if (!l) continue;
      lagen[t.id] = { ...l, x: l.x + versatz.x, y: l.y + versatz.y };
      sitzt[t.id] = z.key;
      fest[t.id] = true;
      const g = knoten[t.id];
      g.classList.add('fest');
      g.setAttribute('tabindex', '-1');
      g.setAttribute('aria-disabled', 'true');
      g.setAttribute('aria-label', `${t.name}, liegt schon richtig`);
      zeichnen(t.id);
    }
  }

  /* Die losen Teile durcheinander in die Ablage legen */
  function mischen() {
    const z = zonen(), a = z.ablage, plaetze = [];
    for (let i = 0; i < z.spalten; i++) for (let j = 0; j < z.zeilen; j++) {
      plaetze.push({ x: a.x + (i + 0.5) * a.w / z.spalten, y: a.y + (j + 0.5) * a.h / z.zeilen });
    }
    for (let i = plaetze.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [plaetze[i], plaetze[k]] = [plaetze[k], plaetze[i]]; }
    let n = 0;
    for (const t of T.TEILE) {
      if (fest[t.id]) continue;
      const p = plaetze[n++];
      lagen[t.id] = { x: p.x, y: p.y, dreh: Math.floor(Math.random() * 8), gewendet: t.art === 'parallelogramm' && Math.random() < 0.5 };
      sitzt[t.id] = null;
      einpassen(t.id);
      zeichnen(t.id);
    }
    tippWeg();
    hingelegt = 0;
    erfolgZeigen(false);
  }

  /* ---------- Prüfen und Einrasten ---------- */
  const belegtOhne = id => Object.keys(sitzt).filter(k => k !== id && sitzt[k]).map(k => sitzt[k]);
  const FAST = { schieben: 'Fast! Schieb das Teil noch ein Stück.', drehen: 'Fast! Dreh das Teil noch.', wenden: 'Fast! Wende das Teil.' };
  /* Nach jedem Ablegen, Drehen, Wenden oder Tastenschritt: Sitzt das Teil auf einem freien Platz?
     Frei ist ein Platz nur, wenn er zu den schon eingerasteten Teilen passt. */
  function pruefen(id, toleranz) {
    if (!aufg.ok || fest[id]) return false;
    tippWeg();
    const t = T.teil(id);
    const ecken = T.ecken(t, lagen[id]).map(p => ({ x: p.x - versatz.x, y: p.y - versatz.y }));
    const ziele = L.freieZiele(aufg, t.art, belegtOhne(id));
    const treffer = L.einrasten(ecken, ziele, toleranz);
    if (treffer) {
      lagen[id].x += treffer.dx;
      lagen[id].y += treffer.dy;
      const neu = sitzt[id] !== treffer.ziel.key;
      sitzt[id] = treffer.ziel.key;
      zeichnen(id);
      if (neu) { hinweis.textContent = letzterHinweis = 'Passt!'; hinweis.parentElement.classList.remove('rueckmeldung--leer'); sagen('Passt!'); }   /* jedes Mal ansagen */
      fertigPruefen();
      return true;
    }
    sitzt[id] = null;
    zeichnen(id);
    const fast = L.fastDa(ecken, ziele, E.fast);
    zeigeHinweis(fast ? FAST[fast.was] : '', true);
    erfolgZeigen(false);
    return false;
  }
  function fertigPruefen() {
    const belegt = Object.values(sitzt).filter(Boolean);
    erfolgZeigen(belegt.length === T.TEILE.length && L.geloest(aufg, belegt));
  }
  let geschafft = false;
  function erfolgZeigen(ja) {
    if (ja === geschafft) return;
    geschafft = ja;
    erfolg.hidden = !ja;
    flaeche.classList.toggle('geschafft', ja);
    spiel.classList.toggle('geschafft', ja);
    if (!ja) return;
    waehlen(null);
    zeigeHinweis('');
    const stempel = merken();
    const zeile = document.getElementById('erfolg-stempel');
    zeile.hidden = !stempel;
    zeile.textContent = stempel ? `Neuer Stempel: ${NAME[stufe]}!` : '';
    const weiter = document.getElementById('weiter'), ziel = naechste();
    weiter.setAttribute('href', ziel);
    weiter.textContent = ziel === 'tangram.html' ? 'Zur Auswahl' : 'Nächste Figur';
    /* Handy hochkant: Die Karte liegt unter der Fläche und muss ins Bild */
    if (spiel.dataset.lage === 'hoch' && erfolg.scrollIntoView) {
      const ruhig = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      erfolg.scrollIntoView({ block: 'nearest', behavior: ruhig ? 'auto' : 'smooth' });
    }
    sagen('Geschafft! Alle sieben Teile passen.' + (stempel ? ` Neuer Stempel: ${NAME[stufe]} ist geschafft!` : ''));
  }

  /* ---------- Merken: gelöste Figur, Stempel je Stufe ---------- */
  const kind = () => (S && S.aktiv()) || null;
  const figurenDerStufe = () => F.fuerKinder().filter(f => f.stufe === stufe);
  /* Speichert die gelöste Figur. Gibt true zurück, wenn dabei ein neuer Stempel verdient wurde. */
  function merken() {
    if (!kind() || def.probe) return false;
    const stand = S.stationStand('tangram');
    stand.geloest = stand.geloest || {};
    if (!stand.geloest[`${def.id}:${stufe}`]) stand.geloest[`${def.id}:${stufe}`] = Date.now();
    S.stationSetzen('tangram', stand);
    const alle = figurenDerStufe().every(f => stand.geloest[`${f.id}:${stufe}`]);
    return alle ? S.stempelGeben('tangram', stufe).neu : false;
  }
  /* Nächste offene Figur derselben Stufe, sonst zurück zur Auswahl */
  function naechste() {
    const geloest = (kind() && S.stationStand('tangram').geloest) || {};
    const liste = figurenDerStufe(), i = liste.findIndex(f => f.id === def.id);
    const rest = liste.slice(i + 1).concat(liste.slice(0, Math.max(i, 0)));
    const f = rest.find(x => !geloest[`${x.id}:${stufe}`]);
    return f ? `tangram.html?figur=${encodeURIComponent(f.id)}&stufe=${stufe}` : 'tangram.html';
  }

  /* ---------- Tipp von Stella ---------- */
  /* Erster Druck: Stella zeigt, wo ein Teil hingehört (gestrichelter Platz, das Teil ist gewählt).
     Zweiter Druck: Stella legt dieses Teil hin. Verraten wird immer nur ein Teil. */
  const REIHENFOLGE = ['g1', 'g2', 'm', 'q', 'p', 'k1', 'k2'];
  function tippWeg() {
    if (tipp && tipp.knoten) tipp.knoten.remove();
    tipp = null;
  }
  function tippGeben() {
    if (!aufg.ok || geschafft) return;
    if (tipp && !sitzt[tipp.id]) {
      if (hingelegt >= E.tippHinlegen) {   /* genug geholfen: Platz bleibt markiert, legen muss das Kind */
        zeigeHinweis('Probier es selbst! Der Platz ist markiert. Drehen hilft.', true);
        return;
      }
      hingelegt++;
      const { id, ziel } = tipp, l = L.lageFuer(T.teil(id), ziel.ecken);
      tippWeg();
      lagen[id] = { ...l, x: l.x + versatz.x, y: l.y + versatz.y };
      waehlen(id);
      if (pruefen(id, 0.01) && !geschafft) zeigeHinweis('Stella hat das Teil hingelegt.', true);
      return;
    }
    tippWeg();
    const lose = id => !sitzt[id] && !fest[id];
    const id = (gewaehlt && lose(gewaehlt)) ? gewaehlt : REIHENFOLGE.find(lose);
    if (!id) return;
    const ziel = L.freieZiele(aufg, T.teil(id).art, belegtOhne(id))[0];
    if (!ziel) return;
    const knoten = el('polygon', { class: 'tipp-platz', points: punkte(ziel.ecken) });
    figurKnoten.appendChild(knoten);
    tipp = { id, ziel, knoten };
    waehlen(id);
    zeigeHinweis(hingelegt < E.tippHinlegen
      ? 'Schau: Hier gehört dieses Teil hin. Tippst du noch einmal, legt Stella es hin.'
      : 'Schau: Hier gehört dieses Teil hin.', true);
  }

  /* ---------- Auswahl ---------- */
  function waehlen(id, ansagen = false) {
    if (gewaehlt === id) return;
    if (gewaehlt) { knoten[gewaehlt].classList.remove('gewaehlt'); knoten[gewaehlt].setAttribute('aria-pressed', 'false'); }
    gewaehlt = id;
    if (!id) return;
    const g = knoten[id];
    g.classList.add('gewaehlt');
    g.setAttribute('aria-pressed', 'true');
    svg.appendChild(g);   /* nach vorne */
    if (document.activeElement !== g) g.focus({ preventScroll: true });
    if (ansagen) sagen(`${T.teil(id).name} gewählt.`);
  }

  /* ---------- Drehen, Wenden ---------- */
  function ohneAuswahl() {
    if (gewaehlt) return false;
    zeigeHinweis('Tippe zuerst ein Teil an.', true);
    return true;
  }
  function drehen(schritte) {
    if (ohneAuswahl()) return;
    lagen[gewaehlt] = T.gedreht(lagen[gewaehlt], schritte);
    einpassen(gewaehlt);
    if (!pruefen(gewaehlt, E.einrasten) && !letzterHinweis) sagen(schritte > 0 ? 'Nach rechts gedreht.' : 'Nach links gedreht.');
  }
  function wenden() {
    if (ohneAuswahl()) return;
    lagen[gewaehlt] = T.gewendet(lagen[gewaehlt]);
    einpassen(gewaehlt);
    if (!pruefen(gewaehlt, E.einrasten) && !letzterHinweis) sagen('Gewendet.');
  }

  /* ---------- Ziehen ---------- */
  let zug = null;   /* { id, pointerId, dx, dy } */
  function svgPunkt(e) {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  svg.addEventListener('pointerdown', e => {
    const g = e.target.closest('.tteil');
    if (!g || fest[g.dataset.id]) { if (gewaehlt) waehlen(null); return; }
    if (zug) return;                     /* nur ein Finger zieht */
    e.preventDefault();
    const id = g.dataset.id;
    waehlen(id);
    const p = svgPunkt(e);
    zug = { id, pointerId: e.pointerId, dx: p.x - lagen[id].x, dy: p.y - lagen[id].y };
    g.classList.add('zieht');
    try { svg.setPointerCapture(e.pointerId); } catch (x) { /* ohne Festhalten weiter */ }
  });
  svg.addEventListener('pointermove', e => {
    if (!zug || e.pointerId !== zug.pointerId) return;
    const p = svgPunkt(e), l = lagen[zug.id];
    const x = p.x - zug.dx, y = p.y - zug.dy;
    if (sitzt[zug.id] && Math.hypot(x - l.x, y - l.y) < 0.05) return;   /* ein Antippen löst das Teil nicht */
    sitzt[zug.id] = null;
    l.x = x; l.y = y;
    einpassen(zug.id);
    zeichnen(zug.id);
  });
  function zugEnde(e) {
    if (!zug || e.pointerId !== zug.pointerId) return;
    const id = zug.id;
    knoten[id].classList.remove('zieht');
    zug = null;
    pruefen(id, E.einrasten);
  }
  svg.addEventListener('pointerup', zugEnde);
  svg.addEventListener('pointercancel', zugEnde);
  svg.addEventListener('lostpointercapture', zugEnde);

  /* ---------- Kein Zoomen mit zwei Fingern auf der Spielfläche (Ingo, 12.11.2026) ----------
     Kinder berühren beim Drehen und Ziehen oft mit zwei Fingern die Fläche, Safari zoomte dann.
     Nur auf der Spielfläche gesperrt; auf dem Rest der Seite bleibt Zoomen möglich (Barrierefreiheit).
     gesture… gibt es nur in Safari; touchmove mit zwei Fingern fängt andere Browser ab. */
  const keinZoom = e => e.preventDefault();
  for (const art of ['gesturestart', 'gesturechange', 'gestureend']) flaeche.addEventListener(art, keinZoom, { passive: false });
  flaeche.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

  /* ---------- Tastatur ---------- */
  svg.addEventListener('focusin', e => { const g = e.target.closest('.tteil'); if (g && !fest[g.dataset.id]) waehlen(g.dataset.id, true); });
  svg.addEventListener('keydown', e => {
    const g = e.target.closest('.tteil');
    if (!g || fest[g.dataset.id]) return;
    const id = g.dataset.id, schritt = e.shiftKey ? 1 : 0.25;
    waehlen(id);   /* das Teil mit dem Fokus ist immer das gewählte, auch wenn kein Fokus-Ereignis kam */
    const bewegung = { ArrowLeft: [-schritt, 0], ArrowRight: [schritt, 0], ArrowUp: [0, -schritt], ArrowDown: [0, schritt] }[e.key];
    if (bewegung) {
      e.preventDefault();
      lagen[id].x += bewegung[0]; lagen[id].y += bewegung[1];
      sitzt[id] = null;
      einpassen(id);
      pruefen(id, E.einrastenTastatur);
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'r') { e.preventDefault(); drehen(1); }
    else if (k === 'l') { e.preventDefault(); drehen(-1); }
    else if (k === 'w') { e.preventDefault(); wenden(); }
    else if (e.key === 'Escape') { waehlen(null); g.blur(); }
  });

  /* ---------- Werkzeuge ---------- */
  document.querySelector('.aufgabe-seite').addEventListener('click', e => {
    const b = e.target.closest('[data-aktion]');
    if (!b) return;
    const a = b.dataset.aktion;
    /* Der Fokus bleibt auf der Taste, damit man mehrmals hintereinander tippen kann. */
    if (a === 'links') drehen(-1);
    else if (a === 'rechts') drehen(1);
    else if (a === 'wenden') wenden();
    else if (a === 'tipp') tippGeben();
    else if (a === 'mischen') { waehlen(null); mischen(); zeigeHinweis(''); sagen('Die Teile sind neu gemischt.'); }
  });

  /* ---------- Start ---------- */
  spiel.hidden = false;
  document.getElementById('zurueck').setAttribute('href', 'tangram.html');
  document.getElementById('zurueck').textContent = '← Auswahl';
  document.title = `${def.name} – Tangram – Seesternwerkstatt`;
  auftrag.textContent = '';
  const marke = document.createElement('span');
  marke.className = 'auftrag-marke';
  marke.textContent = `${def.name} · ${NAME[stufe]}`;
  auftrag.append(marke, ' Lege die Figur mit allen sieben Teilen.');
  aufbauen();
  svg.classList.add('still');          /* beim ersten Hinlegen nicht einfliegen */
  groesse();
  festLegen();
  mischen();
  requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.remove('still')));
  if (aufg.ok) {
    svg.setAttribute('aria-label', `Spielfläche mit sieben Tangram-Teilen. Figur: ${def.name}.`);
    zeigeHinweis('Zieh ein Teil mit dem Finger.');
  } else {
    auftrag.textContent = 'Probiere die Teile aus.';
    zeigeHinweis('Tippe ein Teil an.');
  }
  if ('ResizeObserver' in window) new ResizeObserver(groesse).observe(flaeche);
  else window.addEventListener('resize', groesse);

  /* Für Rauchtest und Fehlersuche */
  SW.tangram = {
    aufg, lagen, sitzt, fest, waehlen, drehen, wenden, mischen, zeichnen, tippGeben,
    get tipp() { return tipp && { id: tipp.id, key: tipp.ziel.key }; },
    /* legt ein Teil wie mit dem Finger ab und prüft */
    ablegen(id, lage, toleranz = E.einrasten) { lagen[id] = { ...lage }; return pruefen(id, toleranz); },
    get gewaehlt() { return gewaehlt; },
    get geschafft() { return geschafft; },
    get versatz() { return versatz; },
    get flaeche() { return { bw, bh }; }
  };
})();
