/* Seesternwerkstatt: die Tür vor Tangram, Spiegeln, Bandornamente und Sammelbuch (Konto-Umbau, 14.11.2026).
   Nur wer mit einem freigeschalteten Code angemeldet ist, sieht die Seite. Die Code-Eingabe steht nur
   auf der Startseite. Ohne Anmeldung geht es dorthin, danach zurück zu dieser Seite (?zu=…).

   Die Skripte der Station lädt erst diese Datei, wenn die Tür offen ist (data-skripte am eigenen script-Tag,
   in dieser Reihenfolge). Bis dahin ist <main> unsichtbar.

   Ehrlich: Das ist eine Tür, kein Tresor. Der Quelltext der Seite ist öffentlich.
   Geschützt ist der Stand der Kinder, über die Regeln der Datenbank. */
(() => {
  'use strict';
  const ich = document.currentScript;
  const skripte = (ich.dataset.skripte || '').split(/\s+/).filter(Boolean);
  const SP = SW.speicher, cloud = SP.cloud, LA = window.LagunenKonto.adresse;
  const seite = (location.pathname.split('/').pop() || 'index.html') + location.search;
  let offen = false;

  function aufmachen() {
    if (offen) return;
    offen = true;
    const m = document.querySelector('.tuer-moment');
    if (m) m.remove();
    document.body.classList.add('tuer-auf');
    for (const src of skripte) {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;          /* in der angegebenen Reihenfolge ausführen */
      document.body.appendChild(s);
    }
  }
  const zurStartseite = () => { location.replace('index.html?zu=' + encodeURIComponent(seite)); };

  function moment() {
    const p = document.createElement('p');
    p.className = 'tuer-moment';
    p.setAttribute('role', 'status');
    p.textContent = 'Einen Moment …';
    document.body.insertBefore(p, document.querySelector('main'));
  }

  /* Gesperrt oder nicht mehr gültig: den Tab abmelden und zur Startseite */
  function pruefeErgebnis(r) {
    if (r && !r.ok && r.grund === cloud.TEXT.gesperrt) { SP.S.abmelden(); zurStartseite(); }
  }

  if (SP.istVorschau) { aufmachen(); return; }

  /* Ein Aufkleber-Code gehört auf die Startseite */
  if (LA.spur()) { location.replace('index.html' + location.hash); return; }

  if (SP.aktiv()) {
    /* Dieser Tab kennt das Kind schon: sofort öffnen, die Anmeldung bei Firebase kommt nach */
    aufmachen();
    const gemerkt = SP.code();
    cloud.start().then(r => {
      if (r.ok || r.grund) return r;
      /* Firebase kennt niemanden, der Tab aber schon: mit dem gemerkten Code anmelden */
      return gemerkt && SP.code() === gemerkt && cloud.aktiv() ? cloud.anmelden(gemerkt) : null;
    }).then(pruefeErgebnis, () => {});
    return;
  }

  /* Neuer Tab (z. B. vom Home-Bildschirm): die Anmeldung holen, die Firebase auf dem Gerät gemerkt hat */
  moment();
  cloud.start().then(r => { if (r.ok) aufmachen(); else zurStartseite(); }, zurStartseite);
})();
