/* Seesternwerkstatt: Tangram-Figuren.
   Jede Figur ist eine fertige Legung der sieben Teile. Daraus berechnet js/tangram-logik.js
   den Umriss und alle weiteren richtigen Legungen. Die Testseite prüft jede Figur automatisch
   (sieben richtige Formen, nichts übereinander, alle Teile berühren sich an Kanten, lösbar).

   Schreibweise: ein Teil = eine Zeile mit seinen Ecken "x,y x,y x,y".
   Einheit ist der Schenkel des kleinen Dreiecks. r = halbe Wurzel 2 (≈ 0,707), die Seite des
   kleinen Dreiecks, wenn es schräg liegt. Erlaubt sind z. B. 2, 3r, 2+r, 1-2r.
   y zeigt nach unten (wie auf dem Bildschirm).

   Reihenfolge der Teile: die zwei großen Dreiecke zuerst. In Stufe „mittel“ liegen die Teile
   aus `fest` schon (Nummern ab 0), ohne Angabe die ersten zwei.
   stufe: Vorschlag, in welcher Stufe die Figur kommt. probe: nur für Tests, nicht für Kinder.

   Alle Figuren sind selbst entworfen (Etappe 2c, Vorschlag zum Ansehen). */
SW.tangramFiguren = (() => {
  'use strict';
  const LISTE = [
    /* ---------- leicht ---------- */
    {
      id: 'pinguin', name: 'Pinguin', stufe: 'leicht',
      teile: [
        '0,2 2,2 0,4',          /* großes Dreieck: Bauch */
        '2,2 2,4 0,4',          /* großes Dreieck: Bauch */
        '0,2 2,2 1,1',          /* mittleres Dreieck: Kopf */
        '1,1 2,1 2,2',          /* kleines Dreieck: Kopf */
        '2,1 2,2 3,2',          /* kleines Dreieck: Schnabel */
        '2,2 2,3 3,4 3,3',      /* Parallelogramm: Flügel */
        '0,4 1,4 1,5 0,5'       /* Quadrat: Fuß */
      ]
    },
    {
      id: 'boot', name: 'Segelboot', stufe: 'leicht',
      teile: [
        '2,0 2,2 0,2',          /* großes Dreieck: Segel links */
        '2,0 4,2 2,2',          /* großes Dreieck: Segel rechts */
        '-1,2 0,2 0,3',         /* kleines Dreieck: Bug */
        '0,2 1,2 1,3 0,3',      /* Quadrat */
        '1,2 2,3 1,3',          /* kleines Dreieck */
        '1,2 3,2 2,3',          /* mittleres Dreieck */
        '3,2 4,2 3,3 2,3'       /* Parallelogramm: Heck */
      ]
    },
    {
      id: 'fisch', name: 'Fisch', stufe: 'leicht',
      teile: [
        '1,0 3,0 1,2',          /* großes Dreieck: Körper */
        '3,0 3,2 1,2',          /* großes Dreieck: Körper */
        '1,0 1,1 0,1',          /* kleines Dreieck: Kopf oben */
        '1,1 1,2 0,1',          /* kleines Dreieck: Kopf unten */
        '3,0 3,2 4,1',          /* mittleres Dreieck: Schwanzansatz */
        '3,0 4,0 5,1 4,1',      /* Parallelogramm: Flosse oben */
        '4,1 5,1 5,2 4,2'       /* Quadrat: Flosse unten */
      ]
    },
    /* ---------- mittel ---------- */
    {
      id: 'uboot', name: 'U-Boot', stufe: 'mittel',
      teile: [
        '1,1 3,1 1,3',          /* großes Dreieck: Rumpf */
        '3,1 3,3 1,3',          /* großes Dreieck: Rumpf */
        '1,1 1,3 0,2',          /* mittleres Dreieck: Bug */
        '3,1 4,1 4,2 3,2',      /* Quadrat: Rumpf hinten */
        '3,2 4,2 3,3',          /* kleines Dreieck: Heck */
        '4,1 5,1 4,2',          /* kleines Dreieck: Ruder */
        '1,0 2,0 3,1 2,1'       /* Parallelogramm: Turm */
      ]
    },
    {
      id: 'leuchtturm', name: 'Leuchtturm', stufe: 'mittel',
      teile: [
        '0,2 2,2 0,4',          /* großes Dreieck: Turm */
        '2,2 2,4 0,4',          /* großes Dreieck: Turm */
        '0,1 2,1 1,0',          /* mittleres Dreieck: Dach */
        '0,1 1,1 1,2 0,2',      /* Quadrat: Lampe */
        '1,1 2,1 2,2',          /* kleines Dreieck: Lampe */
        '1,1 2,2 1,2',          /* kleines Dreieck: Lampe */
        '0,4 1,4 2,5 1,5'       /* Parallelogramm: Felsen */
      ]
    },
    {
      id: 'robbe', name: 'Robbe', stufe: 'mittel',
      teile: [
        '0,4 2,4 2,2',          /* großes Dreieck: Körper */
        '2,2 4,2 2,4',          /* großes Dreieck: Körper */
        '3,1 4,1 4,2 3,2',      /* Quadrat: Kopf */
        '4,1 5,2 4,2',          /* kleines Dreieck: Nase */
        '2,4 4,4 3,3',          /* mittleres Dreieck: Vorderflosse */
        '0,4 1,4 0,5 -1,5',     /* Parallelogramm: Schwanz */
        '-1,4 0,4 -1,5'         /* kleines Dreieck: Schwanz */
      ]
    },
    /* ---------- knifflig ---------- */
    {
      id: 'wal', name: 'Wal', stufe: 'knifflig',
      teile: [
        '1,1 3,1 1,3',          /* großes Dreieck: Körper */
        '3,1 3,3 1,3',          /* großes Dreieck: Körper */
        '1,1 1,2 0,2',          /* kleines Dreieck: Kopf */
        '0,2 1,2 1,3 0,3',      /* Quadrat: Kopf */
        '3,1 3,3 4,2',          /* mittleres Dreieck: Schwanzansatz */
        '3,0 3,1 4,2 4,1',      /* Parallelogramm: Schwanz */
        '3,0 4,0 4,1'           /* kleines Dreieck: Schwanzflosse */
      ]
    },
    {
      id: 'hai', name: 'Hai', stufe: 'knifflig',
      teile: [
        '0,3 2,3 2,1',          /* großes Dreieck: Rücken */
        '2,1 2,3 4,3',          /* großes Dreieck: Kopf */
        '1,1 2,1 1,2',          /* kleines Dreieck: Rückenflosse */
        '0,1 1,2 0,3',          /* mittleres Dreieck: Schwanzansatz */
        '-1,0 0,1 0,2 -1,1',    /* Parallelogramm: Schwanz oben */
        '0,2 0,3 -1,3',         /* kleines Dreieck: Schwanz unten */
        '2,3 3,3 3,4 2,4'       /* Quadrat: Brustflosse */
      ]
    },
    {
      id: 'qualle', name: 'Qualle', stufe: 'knifflig',
      teile: [
        '0,2 2,0 2,2',          /* großes Dreieck: Schirm links */
        '2,0 4,2 2,2',          /* großes Dreieck: Schirm rechts */
        '0,2 1,2 1,3',          /* kleines Dreieck: Arm links */
        '0,2 1,3 1,4 0,3',      /* Parallelogramm: Arm links */
        '2,2 3,2 3,3 2,3',      /* Quadrat: Arm Mitte */
        '2,3 3,3 3,4',          /* kleines Dreieck: Arm Mitte */
        '3,2 3,4 4,3'           /* mittleres Dreieck: Arm rechts */
      ]
    },

    /* ---------- nur für Tests ---------- */
    {
      id: 'quadrat', name: 'Quadrat', probe: true,
      teile: [
        '0,0 4r,0 2r,2r', '0,0 2r,2r 0,4r', '4r,4r 2r,4r 4r,2r', '2r,2r 3r,3r 2r,4r r,3r',
        'r,3r 2r,4r 0,4r', '2r,2r 3r,r 3r,3r', '4r,0 4r,2r 3r,3r 3r,r'
      ]
    },
    {
      id: 'dreieck', name: 'Dreieck', probe: true,
      teile: [
        '0,4r 4r,4r 2r,2r', '4r,4r 4r,0 2r,2r', '4r,4r 6r,4r 4r,2r', '6r,2r 5r,3r 6r,4r 7r,3r',
        '7r,3r 6r,4r 8r,4r', '6r,2r 5r,r 5r,3r', '4r,0 4r,2r 5r,3r 5r,r'
      ]
    }
  ];
  return {
    LISTE,
    finde: id => LISTE.find(f => f.id === id) || null,
    fuerKinder: () => LISTE.filter(f => !f.probe)
  };
})();
