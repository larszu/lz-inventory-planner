// Setzt Checkout-Link und Enddatum aus konfiguration.js ein.
;(function () {
  var k = window.NACHFRAGETEST || {}
  var knopf = document.getElementById('vorbestellen')
  if (k.checkoutUrl) {
    knopf.href = k.checkoutUrl
    knopf.removeAttribute('aria-disabled')
    knopf.textContent = knopf.dataset.offen
  }
  var ende = document.getElementById('ende')
  if (ende && k.ende) {
    var d = new Date(k.ende + 'T00:00:00')
    ende.textContent = d.toLocaleDateString(document.documentElement.lang, { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
  var kontakt = document.getElementById('kontakt')
  if (kontakt && k.kontakt) {
    var a = document.getElementById('kontakt-adresse')
    a.href = 'mailto:' + k.kontakt + '?subject=' + encodeURIComponent(a.dataset.betreff)
    a.textContent = k.kontakt
    kontakt.hidden = false
  }
})()

// Auto · Hell · Dunkel. Derselbe Schluessel wie die App (gleiche Herkunft),
// damit eine Wahl an beiden Stellen gilt. Auto entfernt das Attribut.
;(function () {
  var SCHLUESSEL = 'inventory-planner:thema'
  var knoepfe = document.querySelectorAll('.themen button')
  var zeige = function (t) {
    knoepfe.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.thema === t)) })
  }
  var jetzt = 'system'
  try { jetzt = localStorage.getItem(SCHLUESSEL) || 'system' } catch (e) {}
  if (jetzt !== 'hell' && jetzt !== 'dunkel') jetzt = 'system'
  zeige(jetzt)
  knoepfe.forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.dataset.thema
      if (t === 'system') delete document.documentElement.dataset.thema
      else document.documentElement.dataset.thema = t
      try { localStorage.setItem(SCHLUESSEL, t) } catch (e) {}
      zeige(t)
    })
  })
})()
