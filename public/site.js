/* Noblestreet AI — minimale interactie (geen libraries).
   - Fullscreen menu: aria-expanded, focus trap, Escape, scroll-lock, focus terug naar de opener, inert.
   - Hero: alleen de laatste regel wisselt door de diensten (hoogte ligt vast via CSS-grid).
   - Reveal bij scrollen. Alles respecteert prefers-reduced-motion. Zonder JS blijft alle inhoud zichtbaar. */
(function () {
  'use strict'
  var root = document.documentElement
  root.classList.add('js')
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn)
    else fn()
  }

  ready(function () {
    // ---- Menu ----
    var openBtn = document.getElementById('open-menu')
    var closeBtn = document.getElementById('close-menu')
    var menu = document.getElementById('main-menu')
    var buiten = ['.site-header', 'main', '#site-footer', '.skip-link'].map(function (s) { return document.querySelector(s) }).filter(Boolean)
    var isOpen = false

    function zetInert(el, aan) {
      if (aan) { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true') }
      else { el.removeAttribute('inert'); el.removeAttribute('aria-hidden') }
    }

    function setMenu(open, focusTerug) {
      if (!menu || !openBtn) return
      isOpen = open
      if (open) menu.hidden = false
      // reflow zodat de overgang ook bij het tonen loopt
      void menu.offsetWidth
      menu.classList.toggle('open', open)
      openBtn.setAttribute('aria-expanded', String(open))
      root.classList.toggle('menu-open', open)
      buiten.forEach(function (el) { zetInert(el, open) })
      if (open) {
        closeBtn && closeBtn.focus()
      } else {
        var verberg = function () { if (!isOpen) menu.hidden = true }
        if (reduced) verberg()
        else window.setTimeout(verberg, 300)
        if (focusTerug !== false) openBtn.focus()
      }
    }

    if (openBtn && menu) {
      openBtn.addEventListener('click', function () { setMenu(true) })
      closeBtn && closeBtn.addEventListener('click', function () { setMenu(false) })
      menu.querySelectorAll('.menu-nav-link').forEach(function (a) {
        a.addEventListener('click', function () { setMenu(false, false) })
      })
      document.addEventListener('keydown', function (e) {
        if (!isOpen) return
        if (e.key === 'Escape') { e.preventDefault(); setMenu(false); return }
        if (e.key === 'Tab') {
          var f = Array.prototype.slice.call(menu.querySelectorAll('a[href],button:not([disabled])'))
          if (!f.length) return
          var first = f[0], last = f[f.length - 1]
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
          else if (!menu.contains(document.activeElement)) { e.preventDefault(); first.focus() }
        }
      })
    }

    // ---- Hero-wisseltekst ----
    var rot = document.querySelector('[data-rotate]')
    if (rot && !reduced) {
      var items = rot.querySelectorAll('.rotate-item')
      var i = 0
      if (items.length > 1) {
        window.setInterval(function () {
          if (document.hidden) return
          items[i].classList.remove('is-active')
          i = (i + 1) % items.length
          items[i].classList.add('is-active')
        }, 3800)
      }
    }

    // ---- Reveal ----
    var els = document.querySelectorAll('[data-reveal]')
    if ('IntersectionObserver' in window && !reduced) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target) }
        })
      }, { threshold: 0.12, rootMargin: '0px 0px 50px 0px' })
      els.forEach(function (el) { io.observe(el) })
    } else {
      els.forEach(function (el) { el.classList.add('visible') })
    }

    // ---- Rubriekfilter op het overzicht van inzichten ----
    document.querySelectorAll('.article-filter').forEach(function (groep) {
      var sectie = groep.closest('section')
      var cellen = sectie.querySelectorAll('[data-rubriek]')
      var status = sectie.querySelector('[data-filter-status]')
      groep.addEventListener('click', function (e) {
        var knop = e.target.closest('.filter-knop')
        if (!knop) return
        var r = knop.getAttribute('data-filter')
        groep.querySelectorAll('.filter-knop').forEach(function (k) { k.setAttribute('aria-pressed', String(k === knop)) })
        var n = 0
        cellen.forEach(function (c) { var toon = !r || c.getAttribute('data-rubriek') === r; c.hidden = !toon; if (toon) { n++; c.querySelectorAll('[data-reveal]').forEach(function (x) { x.classList.add('visible') }) } })
        if (status) status.textContent = n + (n === 1 ? ' artikel' : ' artikelen') + (r ? ' in ' + r : '')
      })
    })

    // ---- Formulier: inline validatie (de server valideert opnieuw) ----
    var form = document.getElementById('contact-formulier')
    if (form) {
      form.querySelectorAll('[data-enable-js]').forEach(function (b) { b.disabled = false })
      var email = form.querySelector('input[type="email"]')
      var fout = form.querySelector('[data-ll-error]')
      form.addEventListener('submit', function (e) {
        if (email && !email.checkValidity()) {
          e.preventDefault()
          e.stopImmediatePropagation()
          email.setAttribute('aria-invalid', 'true')
          if (fout) { fout.textContent = 'Vul een geldig e-mailadres in.'; fout.hidden = false }
          email.focus()
        } else if (email) {
          email.removeAttribute('aria-invalid')
          if (fout) fout.hidden = true
        }
      }, true)
      // Zonder de lead-SDK (bv. geblokkeerd) verstuurt het formulier niets: zeg dat eerlijk.
      window.addEventListener('load', function () {
        if (!window.LLCMS) {
          form.addEventListener('submit', function (e) {
            if (window.LLCMS) return
            e.preventDefault()
            if (fout) { fout.textContent = 'Het formulier kan nu niet worden verzonden. Probeer het later opnieuw.'; fout.hidden = false }
          })
        }
      })
    }
  })
})()
