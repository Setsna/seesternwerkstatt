/* Seesternwerkstatt: Texte für Eltern und Lehrkräfte (zwei Aufklapper am Ende der Startseite).
   Quelle: Ausgaben/Erwachsenenbereich Entwurf.md (von Ingo geprüft am 12.11.2026). Ansprache: Sie.
   Daten, kein Code: Absätze sind Texte, Listen sind Arrays [fett, Rest], Tabellen [Kopf, Zeilen]. */
SW.erwachsene = [
  {
    id: 'eltern',
    titel: 'Für Eltern',
    abschnitte: [
      {
        titel: 'Worum es geht',
        absaetze: [
          'Die Seesternwerkstatt übt Geometrie für Kinder der Klasse 3, mit Zusatzaufgaben für Klasse 4. In drei Stationen tun die Kinder etwas mit Formen: Sie legen Figuren aus den sieben Tangram-Teilen, spiegeln Figuren an Achsen und setzen Muster fort. Gelesen wird dabei wenig, die Aufgaben erklären sich über Bilder.',
          'Die Aufgaben passen zu den Geometrieseiten im Mathebuch „Denken und Rechnen“ und verwenden dieselben Fachwörter, zum Beispiel Spiegelachse, achsensymmetrisch und Bandornament.'
        ]
      },
      {
        titel: 'Prinzip und Umsetzung',
        tabelle: [['Prinzip', 'Umsetzung'], [
          ['Tun statt Lesen', 'Die Kinder ziehen, drehen und malen. Kurze Sätze und Bilder erklären die Aufgabe.'],
          ['Hilfen statt Fehlermeldungen', 'Bei einem Fehler steht „Fast!“ und ein Hinweis, was noch fehlt. Die Lösung wird nicht verraten.'],
          ['Prüfen wie im Heft', 'Beim Spiegeln steht nach dem ersten Prüfen ein Spiegel bereit, bei den Mustern ein Rahmen um den Baustein. Beim Tangram gibt Stella Tipps.'],
          ['Kein Zeitdruck', 'Es gibt keine Uhr, keine Punkte und keine Rangliste. Jedes Kind darf so lange probieren, wie es braucht.'],
          ['Fortschritt wächst', 'Für jede geschaffte Stufe gibt es einen Stempel im Sammelbuch, dazu einen Satz „Das kann ich schon“. Verloren geht nichts.'],
          ['Drei Stufen', 'Leicht, mittel und knifflig. Das Kind wählt selbst, Stella empfiehlt die nächste Stufe.'],
          ['Immer neue Aufgaben', 'Beim Spiegeln und bei den Bandornamenten entstehen die Aufgaben jedes Mal neu. Jede wird vorher automatisch geprüft, ob sie eindeutig lösbar ist.'],
          ['Lernen auch ohne Bildschirm', 'Zu jeder Station gibt es Ideen „Am Tisch“, zum Beispiel ein Tangram aus Papier oder ein Klecksbild.']
        ]]
      },
      {
        titel: 'Zu Hause',
        liste: [
          ['Spiegel hinstellen:', 'Stellen Sie einen kleinen Spiegel auf einen Buchstaben oder ein Bild. Wo muss er stehen, damit wieder etwas Ganzes entsteht?'],
          ['Tangram aus Papier:', 'Zeichnen Sie die sieben Teile auf ein quadratisches Blatt und schneiden Sie sie aus. Legen Sie abwechselnd Figuren, die das andere nachlegt.'],
          ['Faltschnitt:', 'Falten Sie ein Blatt, schneiden Sie an der Faltlinie eine Form aus und lassen Sie Ihr Kind vorher raten, wie sie aufgeklappt aussieht.'],
          ['Muster suchen:', 'Fliesen, Zäune, Stoffe und Hausfassaden zeigen oft Bandornamente und Parkettmuster. Fragen Sie: Was wiederholt sich?'],
          ['Lieber kurz und öfter:', 'Eine Runde dauert etwa 10 bis 15 Minuten (geschätzt).']
        ]
      },
      {
        titel: 'Daten',
        absaetze: ['Alles bleibt auf diesem Gerät im Browser: der Vorname, die Klasse, der Stand und die Stempel. Es gibt kein Konto, keine Anmeldung, keine Werbung und keine Verbindung zu anderen Anbietern.'],
        link: ['Mehr dazu auf der Seite Datenschutz', 'datenschutz.html']
      }
    ]
  },
  {
    id: 'lehrkraefte',
    titel: 'Für Lehrkräfte',
    abschnitte: [
      {
        titel: 'Im Unterricht',
        liste: [
          ['Ablauf:', 'Jedes Kind wählt auf seinem Gerät seinen Namen und eine Station. Beim Spiegeln und bei den Bandornamenten besteht eine Runde aus sechs Aufgaben, beim Tangram legt das Kind einzelne Figuren. Ein Stempel kommt nach der ersten geschafften Runde einer Stufe bzw. nach allen drei Figuren einer Stufe.'],
          ['Zeitbedarf:', 'etwa 10 bis 15 Minuten je Runde (geschätzt, noch nicht mit einer Klasse erprobt).'],
          ['Differenzierung:', 'drei Stufen je Station. Schnelle Kinder finden in „knifflig“ schräge Achsen, das Achsenkreuz und Parkettmuster. Langsamere Kinder bekommen Hilfen, ohne dass die Lösung gezeigt wird.'],
          ['Tafel und Beamer:', 'Jede Station lässt sich vorne vormachen. Ist kein Name gewählt, wird dabei nichts gespeichert.'],
          ['Am Tisch:', 'Zu jeder Station gibt es Ideen ohne Bildschirm. Gebraucht werden vor allem Papier, Stift und Schere, für einzelne Ideen ein kleiner Spiegel, Farbe oder Perlen.'],
          ['Alles ausgedacht:', 'Figuren, Aufgaben, Texte und Bilder sind für diese Seite neu entstanden. Aus Lehrwerken oder anderen Angeboten wurde nichts übernommen.'],
          ['Keine Lehreransicht:', 'Die Ergebnisse bleiben beim Kind. Den Stand sehen Sie im Sammelbuch des Kindes auf seinem Gerät.']
        ]
      },
      {
        titel: 'Die Stationen',
        tabelle: [['Station', 'Was geübt wird', 'Anknüpfung an „Denken und Rechnen“'], [
          ['Tangram', 'Ebene Figuren aus sieben Teilen legen, Teile drehen und wenden, erst mit eingezeichneten Teilen, dann nur nach dem Umriss', 'Tangram (Band 4), Figuren legen und Flächen zerlegen'],
          ['Spiegeln', 'Spiegelbildlich ergänzen (senkrechte, waagerechte und schräge Achse), Spiegelachsen finden, auch bei Buchstaben, nacheinander an zwei Achsen spiegeln, Faltschnitte', 'Achsensymmetrie, Faltschnitte, Symmetrie in der Umwelt, Spiegeln auf Karopapier (Band 3)'],
          ['Bandornamente', 'Bandornamente fortsetzen, auch mit Spiegelbild im Baustein, Parkettmuster in zwei Richtungen fortsetzen, eigene Bandornamente erfinden', 'Bandornamente und Parkettierung: Verschieben in eine Richtung bzw. in alle Richtungen (Band 3)']
        ]]
      },
      {
        titel: 'Lehrplanbezug (Lehrplan Thüringen, Mathematik Grundschule)',
        liste: [
          ['Raum und Form, geometrische Abbildungen (S. 22):', 'Achsenspiegelungen ausführen, Symmetrieachsen bestimmen und einzeichnen, entscheiden und begründen, ob Figuren achsensymmetrisch sind, Spiegelung und Verschiebung in Mustern wie Bandornamenten erkennen und beschreiben, achsensymmetrische Figuren erzeugen (Falten, Klecksen, Legen, Zeichnen), auch auf Rasterpapier und mit digitalen Werkzeugen.'],
          ['Raum und Form, ebene Figuren (S. 21):', 'ebene Figuren herstellen, unter anderem legen, Flächen zerlegen, Muster auf Rasterpapier und mit digitalen Werkzeugen darstellen.'],
          ['Muster, Strukturen und funktionaler Zusammenhang (S. 16):', 'Muster in geometrischen Darstellungen wie Bandornamenten erkennen, beschreiben, fortsetzen und selbst entwickeln.'],
          ['Selbst- und Sozialkompetenz (S. 22):', 'Ergebnisse kontrollieren und berichtigen, den eigenen Lernstand einschätzen (Sammelbuch, „Das kann ich schon“).']
        ]
      }
    ]
  }
];
