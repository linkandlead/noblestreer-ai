# Implementatierapport — Noblestreet AI op Link & Lead One

Datum: 15 november 2026 · Branch: `claude/eloquent-noether-o78esu`

## Samenvatting

| Onderdeel | Status |
|---|---|
| Frontend (model A) volgens de referentie-HTML | **Klaar** — getest op 375/768/1024/1440 px |
| Site in het CMS (tenant, site, bouw-token, merk/navigatie/huisstijl, homepage, media, conceptartikelen, conversiedoel) | **Klaar** — productie-CMS, geïsoleerd als nieuwe site |
| Vercel-project `noblestreer-ai` (team Link-and-Lead) met env-vars (`CMS_TOKEN` sensitive, `SITE_ID`, `CMS_BASE`, `INDEXEREN=nee`) | **Klaar** — builds slagen tegen het live CMS |
| Deploy Hook "Link & Lead One publiceren" → `sites.config.deploy_hook` | **Klaar** — publiceren in One Studio bouwt de site opnieuw |
| Volledige keten getest: CMS-wijziging → Deploy Hook → Vercel-build → zichtbaar online | **Geslaagd** (15-11-2026, zie test 11) |
| Formulier → CMS-leadflow | **Klaar** (bestaande lead-SDK, sitedomein = staging-URL); meldingsadres nog te configureren |
| Livegang op productie-URL / eigen domein | **Wacht op beheerder** — zie "Wat nog nodig is" |

**Staging-URL (vast, wordt bij elke publicatie bijgewerkt):**
`https://noblestreer-ai-git-claude-eloquent-noether-o78esu-link-and-lead.vercel.app/`
— achter Vercel Authentication (alleen teamleden), `noindex`.

## Wat ik in het CMS heb aangemaakt (productie, `mucwwqjctynklovacwbv`)

Alles hangt aan één nieuwe site; andere sites zijn niet aangeraakt.

| Record | Waarde |
|---|---|
| `tenants` | `9cd29c4e-cd2c-4c39-bbfd-b8f66a627cbb` — Noblestreet AI |
| `sites` | `43419df5-06b4-437a-9632-fd3f242a8364` — Noblestreet AI, domein = staging-URL hierboven (lead-origincontrole), status `in_bouw`, `config.modus = headless`, `config.deploy_hook` gezet, `vercel_project = noblestreer-ai` |
| `gebruikers` | bouw-account `bouw@noblestreer-ai-link-and-lead.vercel.app`, rol `klant`, alleen deze site; inloggen kan niet (willekeurig wachtwoord-hash, net als `maakBouwToken`); alleen de sha256 van het token is opgeslagen |
| `sites.design_tokens` | 12 kleursleutels → exact `#052824` / `#B1F9E1` (masterprompt §6) |
| `sites.config.merk` | naam, tagline, slogan, `hoofd_nav` (Home/Diensten/Over ons/Inzichten/Contact), footerkolom, primaire actie, contact (alleen "Op afspraak"; géén verzonnen e-mail/telefoon/adres) |
| `pages` `/` + 6 blokken | header · kaarten · mediatekst · artikelen_grid · cta · formulier (via `POST /api/cms/sync`) |
| Mediabibliotheek | 5 WebP-voorbeeldbeelden (via `POST /api/cms/media`) |
| `artikelen` | 3 **concepten** (`published = false`, geen datum, geen hoofdtekst) |

Het token is aan het eind van de sessie vernieuwd: het actieve token staat alleen als *Sensitive*
variabele in Vercel (niet in de repo, niet in logs). Het testtoken van eerder is ongeldig.
`pages./.conversion_goal = contact` is gezet; zonder conversiedoel blokkeert de publicatiecheck van
One Studio (`paginaValidatie`) het opnieuw publiceren van de pagina.

Er is **geen nieuw sitebloktype** gemaakt en **niets in `linkandlead-cms` gewijzigd**: alle secties
passen in bestaande kernblokken (zie blokkenkaart in de README). De vijf punten per dienst gebruiken
de bestaande "één punt per regel"-conventie in het tekstveld van de Kaartenrij.

## Testresultaten

### CMS-integratie (live CMS, 15-11-2026)

Werkwijze: ik heb de database-writes uitgevoerd die One Studio zelf doet
(`content-paginaeditor.ts`: bewaren → `content_concept`; blok publiceren → `content = content_concept`)
en daarna de site opnieuw gebouwd tegen `https://linkandlead.nl/api/cms/content`. De One Studio-UI
zelf heb ik niet bediend (daarvoor is een admin-login nodig die ik niet heb); de Deploy Hook-stap is
vervangen door een handmatige build omdat er nog geen Vercel-project is.

| # | Scenario | Resultaat |
|---|---|---|
| 1 | Hero-kop wijzigen: concept opgeslagen → **niet** op de site; gepubliceerd → **wel** op de site | ✅ |
| 2 | Derde punt van AI Workspace wijzigen → alleen die kaart verandert | ✅ |
| 3 | Volgorde AI Workspace ↔ AI Launch Check → nieuwe volgorde, nummers 01–04 en wisseltekst volgen | ✅ |
| 4 | Hero-afbeelding + alt vervangen door ander mediabibliotheekbeeld | ✅ |
| 5 | Artikel publiceren (met datum) → verschijnt met rubriek "Kwaliteit", datum "november 2026" en werkende route `/inzichten/ai-app-klaar-voor-klanten/`; concepten blijven onzichtbaar | ✅ |
| 6 | Menulabel + URL wijzigen ("Inzichten" → "Kennisbank", `#inzichten-e2e`) | ✅ |
| 7 | CTA-titel en knoptekst wijzigen → zichtbaar in contactsectie en alle secundaire links | ✅ (formulierbestemming: zie open punten) |
| 8 | Lees-API zonder token → 401; API levert geen concepten | ✅ |
| 9 | Tenant-isolatie: pagina van een andere site opvragen met het Noblestreet-token → 0 pagina's; ongeldig token → 401; lead vanaf vreemde origin → 403 "Herkomst niet toegestaan" | ✅ |
| 10 | CMS onbereikbaar → build stopt met exit 1, er wordt niets uitgerold (vorige deployment blijft live) | ✅ |
| 11 | **Volledige keten op Vercel:** hero-eyebrow gepubliceerd in het CMS → Deploy Hook afgevuurd (zoals `triggerDeployHook` na publiceren) → Vercel-build met live CMS-content → tekst zichtbaar op de staging-URL; daarna teruggezet en opnieuw gebouwd | ✅ |

Alle testwijzigingen zijn daarna teruggedraaid (seed opnieuw gesynchroniseerd, artikel terug naar
concept); een controlebuild bevatte geen testtekst meer.

Gevonden en opgelost: de lees-API stuurt `cache-control: public, max-age=60`. Een build die direct na
publiceren start, kon daardoor verouderde content krijgen. De client stuurt nu een cache-buster mee.

### Website

- `npm test` — **18/18 geslaagd** (normalisatie, link-allowlist, XSS in kop/naam/JSON-LD/artikeltekst,
  0/1/4/5 kaarten, lege artikelstand, volgorde/uitschakelen, SEO-basis, geen token in output).
- `npm run test:e2e` — **17/17 geslaagd** (incl. echte lead-SDK onder CSP, lead-endpoint gemockt) in Chromium met de productie-CSP:
  geen horizontale scroll en één h1 op 375/768/1024/1440; footer-woordmerk binnen beeld; geen
  consolefouten; geen Google Fonts-aanvraag, Outfit 500 lokaal geladen; menu open/dicht met muis,
  Enter en Escape, focus trap, `inert` achtergrond, focus terug naar de knop, ankerlink sluit menu;
  hover én toetsenbordfocus tonen de vijf punten en vullen de kaart mint; op touch staan de punten
  standaard zichtbaar; wisseltekst verandert zonder hoogteverandering; reduced motion zet wisselen en
  reveal uit; zonder JavaScript staat alle inhoud er, is de eerste term zichtbaar en kan het formulier
  niet doen alsof het verzendt; artikelen 2:1:1 en detailroute 200; geen `href="#"`; formulier met
  labels en tekstuele "Fout:"-melding; 404 in huisstijl.
- `scripts/seo-check.mjs` (uit `linkandlead-cms`) op home + artikel — **alle harde checks geslaagd**.
- Screenshots: `docs/screenshots/fixture-{desktop,mobiel}.png` (met testartikelen) en
  `docs/screenshots/live-cms-{desktop,mobiel}.png` (echte CMS-inhoud, lege artikelstand).

Niet gemeten: LCP/CLS/INP in het veld (kan pas na deployment). Ingebouwd: hero-preload met
`fetchpriority=high`, lazy-load onder de vouw, vaste beeldverhoudingen, één font-preload (13 kB WOFF2),
geen JS-framework (site.js ≈ 5 kB).

## Afwijkingen van de referentie (bewust)

- Lettertype Outfit 500, lokaal gehost (de preview-PNG's tonen een fallback-font).
- Contactsectie met formulier toegevoegd (masterprompt §G), opgebouwd uit dezelfde bouwstenen.
- Footer: geen "Den Haag / Maandag — vrijdag" en geen "Contactadres toevoegen"-placeholder: alleen
  gevalideerde CMS-gegevens; zonder contactgegevens linkt hij naar het formulier.
- Teamtekst uit de seed (zonder "netwerk van specialisten"-claim).
- "Stel je vraag" / "Samen aan de slag" gebruiken de knop van de gedeelde Afsluitende oproep, zodat
  ze in One Studio te wijzigen zijn ("Plan een gesprek").
- Footerverloop mint→beige→roze: behouden als geïsoleerde uitzondering omdat de referentie-HTML het toont.

## Wat nog nodig is (beheerder)

1. **Productiebranch.** Vercel bouwt productie vanaf `main`, en die branch bestaat nog niet. Merge deze
   branch naar `main` (of zet in Vercel de productiebranch op deze branch). Maak daarna in Vercel een
   Deploy Hook voor `main` en vervang hem in One Studio › Instellingen › Deploy Hook.
2. **Domein.** Productie-URL `noblestreer-ai-link-and-lead.vercel.app` of eigen domein koppelen →
   het domein van de site in One Control op exact dat domein zetten (lead-origincontrole is een exacte
   match) → `INDEXEREN=ja` in Vercel → redeploy. Vercel Authentication staat op
   "all_except_custom_domains": de vercel.app-URL's zijn alleen voor teamleden zichtbaar.
3. **Leadmeldingen**: een `site_mail_instellingen`-rij voor Noblestreet AI (meldingsadres + afzender).
   Zonder die rij komen leads wél in de leadlijst van de site, maar gaan meldingsmails via de
   platform-terugvalafzender.
4. **Echte gegevens**: contact (e-mail/telefoon/adres) in Merk & branding, privacy-/voorwaardenpagina's
   (verschijnen automatisch als juridische links), echte foto's (na toestemming), en artikelen met
   hoofdtekst en publicatiedatum.
5. **Redacteuraccount** voor Noblestreet in One Control (rol `redacteur`, site Noblestreet AI), zodat
   iemand van Noblestreet zelf in One Studio kan werken.
6. Bekende beperking van het CMS-contract: de lees-API levert alleen gepubliceerde content; een
   **conceptpreview** voor headless sites bestaat (nog) niet. Daarvoor is een CMS-verzoek nodig.
