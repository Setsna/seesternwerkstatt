/* Seesternwerkstatt: Erwachsenenbereich am Ende der Startseite (Etappe 5b).
   Zwei Aufklapper „Für Eltern“ und „Für Lehrkräfte“, beim Laden geschlossen, unter jeder Ansicht der Startseite.
   Die Texte stehen als Daten in js/daten/erwachsene.js. */
(() => {
  'use strict';
  const box = document.getElementById('erwachsene');
  if (!box || !SW.erwachsene) return;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function tabelle([kopf, zeilen]) {
    return `<table class="erw-tabelle">
      <thead><tr>${kopf.map(k => `<th scope="col">${esc(k)}</th>`).join('')}</tr></thead>
      <tbody>${zeilen.map(z => `<tr><th scope="row">${esc(z[0])}</th>${z.slice(1).map((x, i) => `<td data-kopf="${esc(kopf[i + 1])}">${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
  }
  function abschnitt(a) {
    return `<section class="erw-abschnitt">
      <h3>${esc(a.titel)}</h3>
      ${(a.absaetze || []).map(p => `<p>${esc(p)}</p>`).join('')}
      ${a.tabelle ? tabelle(a.tabelle) : ''}
      ${a.liste ? `<ul class="liste">${a.liste.map(([fett, rest]) => `<li><b>${esc(fett)}</b> ${esc(rest)}</li>`).join('')}</ul>` : ''}
      ${a.link ? `<p><a href="${esc(a.link[1])}">${esc(a.link[0])}</a></p>` : ''}
    </section>`;
  }
  box.innerHTML = SW.erwachsene.map(t => `
    <details class="erwachsene" id="erw-${t.id}">
      <summary><h2>${esc(t.titel)}</h2></summary>
      <div class="erwachsene__inhalt">${t.abschnitte.map(abschnitt).join('')}</div>
    </details>`).join('');
})();
