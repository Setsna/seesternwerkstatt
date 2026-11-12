# Seesternwerkstatt

**Spiegeln, Legen, Muster.** Eine Geometrie-Lernplattform für Klasse 3 (mit Zusatzaufgaben für Klasse 4). Die Kinder legen Tangram-Figuren, spiegeln an Achsen und setzen Bandornamente fort. Sie tun etwas mit Formen, statt Text zu lesen.

Teil der Lernlagune („Wohin tauchst du heute?“), aber ein eigenständiges Projekt mit eigenem Maskottchen (Seestern Stella).

- Kein Konto, keine Anmeldung, keine Werbung, keine fremden Dienste.
- Alles bleibt im Browser (`localStorage`), je Kind ein Eintrag. Kein Sichern als Datei (Entscheidung Ingo, 11.11.2026: Kinder können keine Dateien speichern und laden).
- Reines HTML, CSS und JavaScript ohne Framework und ohne Build-Schritt.

## Stand

| Station | Stand |
|---|---|
| Tangram | fertig (lokal): 9 Figuren in 3 Stufen, Einrasten, Tipps von Stella, Stempel je Stufe |
| Spiegeln und Symmetrie | fertig (lokal): Runden à 6 erzeugte Aufgaben in 3 Stufen (Ergänzen, Achsen finden, Buchstaben, Achsenkreuz, Faltschnitt), Spiegel als Hilfe, Stempel je Stufe |
| Bandornamente | fertig (lokal): Runden à 6 erzeugte Aufgaben (leicht und mittel Band, knifflig Parkett und Band), Hilfe Baustein, Stempel je Stufe, Erfinde eigenes |

Hosting: GitHub Pages aus `main` von `Setsna/seesternwerkstatt`, live unter https://setsna.github.io/seesternwerkstatt/ (seit 12.11.2026).

## Ordner

```
index.html            Startseite (Willkommen, Wer übt heute?, Stationen)
tangram.html          Station Tangram: ohne Angabe die Auswahl, mit ?figur=…&stufe=… das Spiel
spiegeln.html         Station Spiegeln: ohne Angabe die Auswahl, ?stufe=… eine Runde (6 Aufgaben),
                      ?art=…&stufe=…&saat=N eine einzelne Aufgabe zum Ausprobieren
band.html             Station Bandornamente: ohne Angabe die Auswahl, ?stufe=… eine Runde (6 Aufgaben),
                      ?probe=1&stufe=…&saat=N eine einzelne Aufgabe, ?eigenes=1 Erfinde eigenes
sammelbuch.html       Mein Sammelbuch: Stempel aller Stationen, „Das kann ich schon“, Urkunde, Alles löschen / Neu anfangen
impressum.html
datenschutz.html
css/tokens.css        alle Farben, Schriften, Größen (Maßstab --s wie in der Lernlagune)
css/sw.css            Layout
js/config.js          alle Einstellungen, Liste der Stationen
js/speicher.js        Speicher im Browser, ?vorschau=N
js/geometrie.js       Spiegeln, Drehen, Verschieben, Deckungsgleichheit, Rasterfelder
js/motive.js          Code-Grafiken der Stationskarten
js/sammelbuch.js      Sammelbuch und Löschen-Dialog (Sätze „Das kann ich schon“ in js/config.js unter koennen)
js/urkunde.js         Urkunde als PDF ohne Bibliothek (Canvas → JPEG → PDF), im Sammelbuch
js/app.js             Ansichten der Startseite
js/erwachsene.js      Erwachsenenbereich: zwei Aufklapper „Für Eltern“, „Für Lehrkräfte“ unter jeder Startansicht
js/daten/erwachsene.js Texte dazu (Sie-Ansprache, von Ingo geprüft)
js/tangram-teile.js   die sieben Teile als Geometrie (Drehen, Wenden)
js/tangram-logik.js   exakte Rechnung, Figuren lesen, Löser (findet alle Legungen), Einrasten
js/tangram-figuren.js die Figuren: je eine fertige Legung, Schreibweise steht in der Datei
js/tangram-auswahl.js Auswahl von Stufe und Figur, Empfehlung, „Am Tisch“
js/spiegeln-raster.js Spiegeln am Kästchenraster: Lösung berechnen, prüfen (fehlt, zu viel, Farbe),
                      Spiegelachsen erkennen, Faltschnitt-Antwort prüfen, Figuren vergleichen
js/spiegeln-aufgaben.js erzeugt die Aufgaben (Ergänzen, Achsen finden, Achsenkreuz, Faltschnitt):
                      runde(stufe, startwert) = sechs Aufgaben, gleicher Startwert = gleiche Runde.
                      Aufgaben enthalten keine Lösung, die wird beim Prüfen berechnet.
js/spiegeln.js        Steuerung: Aufgabe der Runde, Auftrag, Erfolgskarte, Runden zählen, Stempel
js/spiegeln-auswahl.js Auswahl der Stufe mit Beispielbildern, Empfehlung, „Am Tisch“
js/spiegeln-malen.js  Malraster (Ergänzen, auch für Bandornamente): Tippen/Wischen, Tastatur, Rückgängig, Fertig?, Spiegel
js/spiegeln-achsen.js Achsen finden: Linien antippen (Griff oder Linie), „keine Achse“, Fertig?, Spiegel
js/spiegeln-falt.js   Faltschnitt: wählen (Papier groß, drei Antworten) und zeichnen (Vorlage klein, Malraster)
js/band-aufgaben.js   erzeugt Bandornamente und Parkette (Baustein zweimal in der Vorlage), Lösung und Prüfen berechnet
js/band-auswahl.js    Auswahl der Stufe mit Beispielbild, Empfehlung, Erfinde eigenes, „Am Tisch“
js/band.js            Steuerung Bandornamente, benutzt das Malraster aus js/spiegeln-malen.js
js/tangram.js         Spiel: Ziehen, Tasten, Tastatur, Tipp von Stella, Speichern, Stempel
schriften/            Andika, Libre Caslon Text (SIL OFL 1.1, Lizenztexte daneben)
bilder/               Bilder aus Canva (eigene Versionsnummer bildStand in config.js)
```

Tests und Werkzeuge liegen bewusst **außerhalb** dieses Repositorys im Projektordner unter `tools/` (Geometrie-, Speicher-, Tangram-, Spiegeln-, Bandornament-Test, Rauchtest, Vorschau der Tangram-Figuren, der erzeugten Spiegeln-Aufgaben und der Urkunde, lokaler Server). Sie werden nicht veröffentlicht.

## Neue Station hinzufügen

1. In `js/config.js` unter `stationen` einen Eintrag ergänzen (`id`, `name`, `satz`, `status`).
2. Eigene Datei `js/station-<id>.js`, optional ein Kartenmotiv in `js/motive.js`.
3. Die anderen Stationen bleiben unverändert.

## Veröffentlichen

1. Lokal prüfen: `tools/server.ps1` starten, `http://localhost:8151/tools/rauchtest.html`, `geometrie-test.html`, `speicher-test.html`, `tangram-test.html`, `spiegeln-test.html` und `band-test.html` müssen OK zeigen. Dazu `py tools/pruefen.py` (Verweise, CSP, noindex, ?v=N, Lizenzen, .gitignore, JS-Syntax): erwartet „ALLES OK“.
2. Bei jeder Änderung an js oder css die Zahl `?v=N` in **allen** HTML-Dateien um eins hochzählen.
3. `git status` prüfen: nur Dateien, die ins Netz sollen (siehe `.gitignore`, sperrt alles außer der fertigen Seite).
4. Commit und Push nach `main`, danach die Seite live ansehen (HTTP 200, richtige `?v=N`).
