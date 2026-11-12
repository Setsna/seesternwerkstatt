/* Seesternwerkstatt: Urkunde als PDF, ganz auf dem Gerät (kein Server, keine Bibliothek). Etappe 5c.
   Technik nach der Flaschenpost (js/urkunde.js, ursprünglich KI-Korallenriff): Jede Seite wird auf ein
   Canvas gezeichnet (A4 hochkant, 150 dpi) und als JPEG in ein kleines PDF gelegt. Gestaltung eigen:
   Navy auf Weiß, Stella, Stempel in Korallenorange, Libre Caslon für Titel und Name, Andika für Lesetext.
   Alle Zeichen (Haken, Kreise) sind gezeichnet, keine Schriftzeichen als Symbol.
   Die Urkunde ist ein Ausdruck, keine Sicherung: Sie lässt sich nicht wieder einlesen.

   Seite 1: Urkunde mit Name, Satz, Stempelfeld (3 Stationen × 3 Stufen), Datum, Unterschrift.
   Seite 2: „Das kann ich schon“ (ein Satz je verdientem Stempel). */
(() => {
  'use strict';
  const B = 1240, H = 1754;
  const NAVY = '#0b3155', LEISE = '#4a6275', LINIE = '#d9d3c2', WELLE = '#2d6f98', KORALLE = '#ff8a5c', KORALLE_HELL = '#ffe3d6';
  const CASLON = '"Libre Caslon Text", Georgia, serif';
  const ANDIKA = '"Andika", "Trebuchet MS", sans-serif';
  const STUFE = { leicht: 'Leicht', mittel: 'Mittel', knifflig: 'Knifflig' };

  const bildCache = {};
  function bild(src) {
    if (!bildCache[src]) {
      bildCache[src] = new Promise((ok, nein) => {
        const img = new Image();
        img.onload = () => ok(img);
        img.onerror = () => nein(new Error('Bild fehlt: ' + src));
        img.src = src;
      });
    }
    return bildCache[src];
  }
  async function schriftenLaden() {
    if (!document.fonts || !document.fonts.load) return;
    await Promise.all([`400 80px ${CASLON}`, `400 40px ${ANDIKA}`, `700 40px ${ANDIKA}`].map(f => document.fonts.load(f).catch(() => null)));
  }
  function neueSeite() {
    const c = document.createElement('canvas');
    c.width = B; c.height = H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, B, H);
    return { c, ctx };
  }
  /* Text mittig setzen, bei Bedarf verkleinern, bis er passt (lange Namen) */
  function zeile(ctx, text, x, y, schrift, groesse, maxB, farbe) {
    let g = groesse;
    do { ctx.font = schrift.replace('#', g); g -= 2; } while (ctx.measureText(text).width > maxB && g > 20);
    ctx.fillStyle = farbe;
    ctx.fillText(text, x, y);
  }
  function umbrechen(ctx, text, maxB) {
    const zeilen = [];
    let z = '';
    text.split(/\s+/).forEach(w => {
      const probe = z ? z + ' ' + w : w;
      if (ctx.measureText(probe).width > maxB && z) { zeilen.push(z); z = w; } else z = probe;
    });
    if (z) zeilen.push(z);
    return zeilen;
  }
  function rahmen(ctx) {
    ctx.save();
    ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.strokeRect(70, 70, B - 140, H - 140);
    ctx.strokeStyle = LINIE; ctx.lineWidth = 2; ctx.strokeRect(92, 92, B - 184, H - 184);
    ctx.restore();
  }
  function welle(ctx, mx, y, breite) {
    ctx.save();
    ctx.strokeStyle = WELLE; ctx.lineWidth = 3; ctx.lineCap = 'round';
    const n = 4, s = breite / n;
    ctx.beginPath();
    ctx.moveTo(mx - breite / 2, y);
    for (let i = 0; i < n; i++) {
      const x0 = mx - breite / 2 + i * s;
      ctx.quadraticCurveTo(x0 + s / 4, y - 8, x0 + s / 2, y);
      ctx.quadraticCurveTo(x0 + 3 * s / 4, y + 8, x0 + s, y);
    }
    ctx.stroke();
    ctx.restore();
  }
  /* Verdienter Stempel: Kreis in Korallenorange mit Stella darin */
  function stempel(ctx, x, y, r, stella) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = KORALLE_HELL; ctx.fill();
    ctx.lineWidth = r * 0.12; ctx.strokeStyle = KORALLE; ctx.stroke();
    const g = r * 1.3;
    ctx.drawImage(stella, x - g / 2, y - g / 2, g, g);
    ctx.restore();
  }
  /* Offener Platz: gestrichelter Kreis */
  function offen(ctx, x, y, r) {
    ctx.save();
    ctx.strokeStyle = LEISE; ctx.lineWidth = Math.max(2, r * 0.07);
    ctx.setLineDash([r * 0.22, r * 0.16]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  function haken(ctx, x, y, g) {
    ctx.save();
    ctx.strokeStyle = NAVY; ctx.lineWidth = g * 0.14; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y - g * 0.35); ctx.lineTo(x + g * 0.33, y); ctx.lineTo(x + g * 0.9, y - g * 0.75);
    ctx.stroke();
    ctx.restore();
  }

  /* Seite 1. daten: { name, datum: Date, stationen: [{ id, name }], stufen, stempel: { 'id:stufe': … }, stellaSrc } */
  async function vorderseite(d) {
    await schriftenLaden();
    const stella = await bild(d.stellaSrc);
    const { c, ctx } = neueSeite();
    rahmen(ctx);
    const mitte = B / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    zeile(ctx, 'Seesternwerkstatt', mitte, 200, `400 #px ${CASLON}`, 46, 700, NAVY);
    welle(ctx, mitte, 228, 110);
    /* Stella im runden Feld */
    const sr = 120, sy = 390;
    ctx.beginPath(); ctx.arc(mitte, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = KORALLE_HELL; ctx.fill();
    ctx.drawImage(stella, mitte - sr * 0.85, sy - sr * 0.85, sr * 1.7, sr * 1.7);
    zeile(ctx, 'Urkunde', mitte, 670, `400 #px ${CASLON}`, 130, 900, NAVY);
    ctx.font = `400 40px ${ANDIKA}`; ctx.fillStyle = LEISE;
    ctx.fillText('für', mitte, 745);
    zeile(ctx, d.name, mitte, 850, `400 #px ${CASLON}`, 104, 900, NAVY);
    ctx.strokeStyle = LINIE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(mitte - 320, 890); ctx.lineTo(mitte + 320, 890); ctx.stroke();
    ctx.font = `400 44px ${ANDIKA}`; ctx.fillStyle = NAVY;
    ctx.fillText('hat in der Seesternwerkstatt Figuren gelegt,', mitte, 965);
    ctx.fillText('gespiegelt und Muster fortgesetzt.', mitte, 1022);

    /* Stempelfeld: je Station eine Spalte, je Stufe eine Zeile */
    const spalteB = 300, x0 = mitte - spalteB, yKopf = 1135, r = 44, zeileH = 112;
    d.stationen.forEach((st, si) => {
      const x = x0 + si * spalteB;
      zeile(ctx, st.name.replace(/­/g, ''), x, yKopf, `400 #px ${CASLON}`, 40, spalteB - 30, NAVY);
      d.stufen.forEach((stufe, zi) => {
        const y = yKopf + 75 + zi * zeileH;
        if (d.stempel[`${st.id}:${stufe}`]) stempel(ctx, x - 70, y, r, stella); else offen(ctx, x - 70, y, r);
        ctx.textAlign = 'left';
        ctx.font = `400 30px ${ANDIKA}`; ctx.fillStyle = d.stempel[`${st.id}:${stufe}`] ? NAVY : LEISE;
        ctx.fillText(STUFE[stufe], x - 10, y + 10);
        ctx.textAlign = 'center';
      });
    });

    const dat = d.datum.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    ctx.strokeStyle = NAVY; ctx.lineWidth = 2;
    [[190, 560], [680, 1050]].forEach(([a, e]) => { ctx.beginPath(); ctx.moveTo(a, 1588); ctx.lineTo(e, 1588); ctx.stroke(); });
    ctx.font = `400 34px ${ANDIKA}`; ctx.fillStyle = NAVY;
    ctx.fillText(dat, 375, 1573);
    ctx.font = `400 26px ${ANDIKA}`; ctx.fillStyle = LEISE;
    ctx.fillText('Datum', 375, 1622);
    ctx.fillText('Unterschrift der Lehrkraft', 865, 1622);
    return c;
  }

  /* Seite 2: „Das kann ich schon“. saetze: [{ station, text }] (nur verdiente). Passt es nicht, wird die Schrift kleiner. */
  async function rueckseite(d) {
    await schriftenLaden();
    const { c, ctx } = neueSeite();
    rahmen(ctx);
    const mitte = B / 2;
    ctx.textAlign = 'center';
    zeile(ctx, 'Das kann ich schon', mitte, 230, `400 #px ${CASLON}`, 84, 900, NAVY);
    ctx.font = `400 40px ${ANDIKA}`; ctx.fillStyle = LEISE;
    ctx.fillText(d.name, mitte, 296);
    const links = 170, rechts = B - 170, textX = links + 70, maxB = rechts - textX, oben = 400, unten = H - 200;
    const lauf = (g, zeichnen) => {
      const zeilenH = Math.round(g * 1.3), abstand = Math.round(g * 0.8);
      let y = oben, letzte = '';
      ctx.textAlign = 'left';
      d.saetze.forEach(s => {
        if (s.station !== letzte) {
          letzte = s.station;
          y += Math.round(g * 0.5);
          if (zeichnen) { ctx.font = `400 ${Math.round(g * 1.3)}px ${CASLON}`; ctx.fillStyle = NAVY; ctx.fillText(s.station, links, y); }
          y += Math.round(g * 0.6);
          if (zeichnen) { ctx.strokeStyle = LINIE; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(links, y); ctx.lineTo(rechts, y); ctx.stroke(); }
          y += Math.round(g * 1.5);
        }
        ctx.font = `400 ${g}px ${ANDIKA}`;
        const zeilen = umbrechen(ctx, s.text, maxB);
        if (zeichnen) {
          haken(ctx, links + 6, y - g * 0.15, g * 1.15);
          ctx.fillStyle = NAVY;
          zeilen.forEach((z, i) => ctx.fillText(z, textX, y + i * zeilenH));
        }
        y += zeilen.length * zeilenH + abstand;
      });
      return y;
    };
    let g = 36;
    while (g > 22 && lauf(g, false) > unten) g -= 2;
    lauf(g, true);
    return c;
  }

  function jpegBytes(canvas) {
    const daten = atob(canvas.toDataURL('image/jpeg', 0.9).split(',')[1]);
    const b = new Uint8Array(daten.length);
    for (let i = 0; i < daten.length; i++) b[i] = daten.charCodeAt(i);
    return b;
  }
  /* Kleines PDF mit je einem JPEG pro Seite (A4) */
  function pdfAusSeiten(canvasse) {
    const teile = [], offsets = [];
    let laenge = 0;
    const text = s => { const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 255; teile.push(b); laenge += b.length; };
    const roh = b => { teile.push(b); laenge += b.length; };
    const obj = (nr, inhalt) => { offsets[nr] = laenge; text(`${nr} 0 obj\n${inhalt}\nendobj\n`); };
    const W = 595.28, Hp = 841.89, n = canvasse.length, seitenNr = i => 3 + i * 3;
    text('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, `<< /Type /Pages /Count ${n} /Kids [${canvasse.map((_, i) => `${seitenNr(i)} 0 R`).join(' ')}] >>`);
    canvasse.forEach((cv, i) => {
      const s = seitenNr(i);
      obj(s, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${Hp}] /Resources << /XObject << /Im${i} ${s + 2} 0 R >> >> /Contents ${s + 1} 0 R >>`);
      const strom = `q ${W} 0 0 ${Hp} 0 0 cm /Im${i} Do Q`;
      obj(s + 1, `<< /Length ${strom.length} >>\nstream\n${strom}\nendstream`);
      const jpg = jpegBytes(cv);
      offsets[s + 2] = laenge;
      text(`${s + 2} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${cv.width} /Height ${cv.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`);
      roh(jpg);
      text('\nendstream\nendobj\n');
    });
    const anzahl = 3 + n * 3, xref = laenge;
    let x = `xref\n0 ${anzahl}\n0000000000 65535 f \n`;
    for (let i = 1; i < anzahl; i++) x += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    text(`${x}trailer\n<< /Size ${anzahl} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(teile, { type: 'application/pdf' });
  }

  /* ---------- Anbieten im Sammelbuch ---------- */
  let letzteUrl = null, letzteDatei = null;
  /* elemente: { status, fertig, ansehen, teilen } */
  async function anbieten(daten, { status, fertig, ansehen, teilen }) {
    status.textContent = 'Deine Urkunde wird gemacht …';
    try {
      const seiten = [await vorderseite(daten)];
      if (daten.saetze.length) seiten.push(await rueckseite(daten));
      const blob = pdfAusSeiten(seiten);
      if (letzteUrl) URL.revokeObjectURL(letzteUrl);
      letzteUrl = URL.createObjectURL(blob);
      const dateiname = `Urkunde Seesternwerkstatt ${String(daten.name).replace(/[\/:*?"<>|]/g, '')}.pdf`;
      ansehen.href = letzteUrl;
      ansehen.download = dateiname;
      letzteDatei = (typeof File === 'function') ? new File([blob], dateiname, { type: 'application/pdf' }) : null;
      teilen.hidden = !(letzteDatei && navigator.canShare && navigator.canShare({ files: [letzteDatei] }));
      fertig.hidden = false;
      status.textContent = 'Deine Urkunde ist fertig.';
      return { ok: true, seiten: seiten.length, bytes: blob.size };
    } catch (e) {
      status.textContent = 'Die Urkunde konnte gerade nicht gemacht werden. Versuch es noch einmal.';
      return { ok: false, fehler: e.message };
    }
  }
  /* Teilen-Menü des Geräts (AirDrop, Mail …). Die Seite selbst schickt nichts. */
  async function teilen(status) {
    if (!letzteDatei || !navigator.share) return;
    try {
      await navigator.share({ files: [letzteDatei], title: 'Meine Urkunde' });
      status.textContent = 'Geteilt.';
    } catch (e) {
      if (!e || e.name !== 'AbortError') status.textContent = 'Teilen klappt hier gerade nicht. Tippe auf „Urkunde ansehen“.';
    }
  }

  SW.urkunde = { vorderseite, rueckseite, pdfAusSeiten, anbieten, teilen };
})();
