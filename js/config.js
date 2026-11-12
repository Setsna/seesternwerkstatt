/* Seesternwerkstatt: alle Einstellungen an einer Stelle.
   Diese Datei wird als erste geladen. */
'use strict';

/* Skriptfehler sammeln, damit der Rauchtest sie sieht. */
window.FEHLER = window.FEHLER || [];
window.addEventListener('error', e => window.FEHLER.push(String(e.message || e)));
window.addEventListener('unhandledrejection', e => window.FEHLER.push(String(e.reason)));

window.SW = window.SW || {};

SW.config = {
  name: 'Seesternwerkstatt',
  unterzeile: 'Spiegeln, Legen, Muster',

  /* Speicher im Browser. Ändert sich der Aufbau der Daten, schema hochzählen
     und in js/speicher.js eine Umwandlung vom alten Stand ergänzen. */
  speicher: {
    schluessel: 'seesternwerkstatt',        /* localStorage: seesternwerkstatt-v<schema> */
    schema: 1,
    werSchluessel: 'seesternwerkstatt-wer'  /* sessionStorage: welches Kind in diesem Tab übt */
  },
  nameMaxLaenge: 20,
  klassen: [3, 4],
  klasseStandard: 3,

  /* Versionsnummer der Bilder, getrennt von ?v=N für js und css. */
  bildStand: 1,

  /* Stationen der Startseite. status: 'live' oder 'bald'.
     Neue Station: hier eintragen (seite = eigene HTML-Datei), sonst nichts ändern. */
  stationen: [
    { id: 'tangram',  name: 'Tangram',          satz: 'Lege Figuren aus sieben Teilen.', status: 'live', seite: 'tangram.html' },
    { id: 'spiegeln', name: 'Spiegeln',         satz: 'Spiegle Figuren an der Achse.',   status: 'live', seite: 'spiegeln.html' },
    { id: 'band',     name: 'Band­ornamente', /* weiches Trennzeichen für schmale Karten */satz: 'Setze Muster fort.',               status: 'live', seite: 'band.html' }
  ],
  stufen: ['leicht', 'mittel', 'knifflig'],
  /* Sammelbuch: „Das kann ich schon“. Ein Satz je Stempel, er erscheint, sobald der Stempel verdient ist. */
  koennen: {
    'tangram:leicht': 'Ich lege Figuren aus allen sieben Tangram-Teilen, wenn die Teile eingezeichnet sind.',
    'tangram:mittel': 'Ich lege Tangram-Figuren nach dem Umriss, wenn schon zwei Teile liegen.',
    'tangram:knifflig': 'Ich lege Tangram-Figuren nur nach dem Umriss.',
    'spiegeln:leicht': 'Ich ergänze Figuren spiegelbildlich und erkenne Spiegelachsen.',
    'spiegeln:mittel': 'Ich finde Spiegelachsen auch bei Buchstaben und zeichne, was beim Faltschnitt entsteht.',
    'spiegeln:knifflig': 'Ich spiegle an schrägen Achsen und nacheinander an zwei Achsen.',
    'band:leicht': 'Ich setze Bandornamente fort.',
    'band:mittel': 'Ich setze Bandornamente mit mehreren Farben und Spiegelbildern fort.',
    'band:knifflig': 'Ich setze Parkettmuster in alle Richtungen fort.'
  },

  /* Tangram. Längen in Einheiten (1 = Schenkel des kleinen Dreiecks). */
  tangram: {
    kurzeSeite: 9,            /* so viele Einheiten ist die kurze Seite der Spielfläche höchstens lang */
    kurzeSeiteMin: 6.5,       /* … und mindestens (kleiner = Figur und Teile größer) */
    figurRand: 0.6,           /* Platz rund um die Figur in ihrer Zone (Einheiten) */
    ablagePlatz: 1.9,         /* jeder Platz in der Ablage mindestens so groß (Einheiten) */
    einrasten: 0.4,           /* so nah muss ein Teil an seinem Platz liegen, damit es einrastet */
    einrastenTastatur: 0.2,   /* mit Pfeiltasten (Schritt 0,25): kleiner, damit man von einem Platz wieder wegkommt */
    fast: 0.7,                /* so nah gilt als „fast“: Stella sagt, ob schieben, drehen oder wenden fehlt */
    tippHinlegen: 2           /* so viele Teile legt Stella je Runde höchstens hin, danach zeigt sie nur den Platz */
  },

  /* Geometrie: Rechentoleranz für Vergleiche von Kommazahlen */
  eps: 1e-9
};
