# Noblestreet AI — website op Link & Lead One (CMS-model A)

Eigen frontend (model A) voor **Noblestreet AI**. Het ontwerp (`noblestreet_ai_onepage.html`) is zo
letterlijk mogelijk overgenomen; **alle inhoud** (teksten, beelden, diensten + punten, artikelen,
navigatie, CTA, formulier, SEO, merkkleuren) komt uit **Link & Lead One** en is in One Studio
(`/admin`) te beheren. Deze repo bevat géén CMS-code en wijzigt de CMS-kern niet.

| | |
|---|---|
| CMS | `https://linkandlead.nl` (Link & Lead One, productie) |
| Site-ID (publiek) | `43419df5-06b4-437a-9632-fd3f242a8364` |
| Tenant | `Noblestreet AI` (`9cd29c4e-cd2c-4c39-bbfd-b8f66a627cbb`) |
| Site-modus | `headless` (sites.config.modus), status `in_bouw` |
| Bouw-account | `bouw@noblestreer-ai-link-and-lead.vercel.app` (token-only, inloggen uitgeschakeld) |
| Vercel | project `noblestreer-ai` (team Link-and-Lead), Deploy Hook "Link & Lead One publiceren" |
| Productie-URL | `https://noblestreer-ai-link-and-lead.vercel.app/` (= sitedomein in het CMS; branch `main`) |

## Hoe de koppeling werkt

```
One Studio (/admin)  ──publiceren──▶  Deploy Hook (sites.config.deploy_hook)  ──▶  Vercel-build
        │                                                                         │
        └──── Postgres (content_blocks, pages, artikelen, sites.config) ◀── GET /api/cms/content
                                                                                  │  (Bearer cms_…, build-time)
bezoeker ──▶ statische, server-gerenderde HTML (dist/) ──▶ formulier ─▶ /api/cms/lead (cms-client.js)
                                                         └▶ meet.js (cookieloze bezoekerscijfers)
```

1. **Content** — `build.mjs` haalt bij elke build de gepubliceerde content op via de bestaande lees-API
   `GET /api/cms/content` met het site-gescopete token (`src/lib/cms/client.mjs`). Concepten
   (`content_concept`) komen nooit mee; alleen gepubliceerde blokken/artikelen.
2. **Normalisatie** — `src/lib/cms/normalize.mjs` valideert alle externe velden (links via allowlist,
   afbeeldingen alleen https, lengtegrenzen) en zet de echte CMS-bloktypen om naar props.
3. **Renderen** — `src/render/*` (Header, FullScreenMenu, Hero, ServiceGrid, TeamBanner, ArticleGrid,
   Contact, Footer). Alles wordt ge-escaped; er wordt nooit ruwe HTML uit het CMS gerenderd.
4. **Leads** — het contactformulier gebruikt de bestaande lead-SDK (`cms-client.js`, `data-ll-lead`):
   honeypot + tijdmeting, servervalidatie, rate-limit en origincontrole in het CMS.
5. **Tracking** — `meet.js` (cookieloos, bestaande CMS-koppeling).
6. **Voorbeeld in de pagina-editor** — `/__voorvertoning` (`src/voorvertoning.mjs`, Vercel-functie
   `api/voorvertoning.mjs`) toont het concept. Alleen bij een geldig concept én `&ingesloten=1` (het iframe van de
   editor) krijgt elke sectie `data-cms-sectie="<blok-id>"` en staat `voorvertoningKlikken` uit site-kit 1.21 als
   inline script onderaan (`src/voorvertoningklikken.mjs`, linkandlead-cms B-115/B-127): een klik kiest het blok,
   platte tekst is na de selectie direct te typen (Enter: klaar, Escape: terugzetten) en links openen in de editor
   geen andere pagina. De CSP staat precies dat script toe met zijn sha256 (geen `'unsafe-inline'`); berichten gaan
   alleen naar `CMS_BEHEER_URL` (standaard `https://cms.linkandlead.nl`). De gewone site verandert niet.

## CMS-blokkenkaart (alleen bestaande kernblokken — geen nieuw sitebloktype nodig)

| Sectie | CMS-blok (type) | Velden die de frontend gebruikt |
|---|---|---|
| Header + fullscreen menu | Site > Navigatie en instellingen (`sites.config.merk`) | `naam`, `hoofd_nav[]` (label/URL/volgorde), `primaire_actie`, `slogan` |
| Hero | **Header (hero)** `header`, lay-out *achtergrond*, hoogte *fullscreen* | `eyebrow`, `heading` (h1, over 2 regels), `subheading`, `cta_primair_label/link`, `media_afbeelding`, `media_alt`, `focal_x/y` |
| Wisselende laatste regel | **Header (hero)** › veld *USP's* (klantvoordelen); leeg → titels van de dienstkaarten | per USP één term, max. 6 |
| Diensten (getrapt raster) | **Kaartenrij** `kaarten`, 4 kolommen | `titel`, `intro`, `eyebrow`; per kaart `titel`, `tekst`, `link` |
| Logostrook (tools) | **Logostrook** `logostrook` | `eyebrow`, `titel`, `grijs`; per logo `logo` (mediabibliotheek, wit PNG), `alt` (naam), `link`. Doorlopende band; stil bij reduced motion of zonder JS |
| Team / over ons | **Tekst met beeld** `mediatekst` | `titel` (zinnen → regels), `alineas[]`, `punten[]`, `beeld`, `beeld_alt`, `knop`/`knoptekst`, `eyebrow` = fotolabel ("Beeld ter illustratie") |
| Inzichten | **Artikelen** `artikelen_grid` + collectie *Artikelen* | `titel`, `maximaal` (≤ 3), `filter_rubriek`; per artikel `titel`, `rubriek`, `gepubliceerd_op`, `samenvatting`, `foto`, `foto_alt`, `hoofdtekst`, `slug` |
| Teampagina `/team/` | **Header (hero)** compact + **Team** `mensen` + collectie *Team* | blok: `titel`, `intro`, `maximaal`; per teamlid `naam`, `functie`, `tekst`, `foto`, `linkedin` (gepubliceerd, CMS-volgorde). Zonder foto: kader met initialen |
| Diensten `/diensten/` | **Header** compact + **gedeeld** Kaartenrij-blok (`noblestreet-diensten`) + **Afsluitende oproep** | Hetzelfde dienstenblok als op de homepage (één keer beheren); op subpagina's als lijst met ankers (`/diensten/#ai-workspace`), de kaarten op de homepage linken daarheen |
| Overzicht `/inzichten/` | **Header** compact + **Artikelen** (`maximaal` > 3) + **Afsluitende oproep** | `maximaal` > 3 = alle artikelen in een gelijk raster met rubriekfilter; homepage-blok houdt 3 (2:1:1) en linkt dan naar dit overzicht |
| Contact | **Afsluitende oproep** `cta` + **Formulier** `formulier` (soort contact) | `eyebrow`, `titel`, `tekst`, `knop`/`knoptekst`, `meta[]`; formulier `intro`, `knoptekst`, `voetnoot`, `bevestigingstekst` |
| Footer | Site > Navigatie en instellingen | `tagline`, `footer_kolommen[]`, `juridische_links[]` (alleen getoond als ze bestaan), `contact.*` |
| Huisstijl | Site > Navigatie en instellingen, kleuren | `nacht` → donkergroen, `limoen` → mint (de 12 sleutels staan op exact twee kleuren) |
| SEO | Pagina-instellingen | `titel` → `<title>`, `beschrijving` → meta description, `og_beeld` |

**Dienstkaarten — redactieconventie.** De Kaartenrij heeft per kaart één tekstveld. Gebruik daarin
(dezelfde conventie als het CMS-veld "één punt per regel" bij Prijskaarten):

```
Een veilige AI-ontwikkelomgeving waarmee je team zelfstandig software kan bouwen.
- Claude Code professioneel instellen
- GitHub en versiebeheer
- Rechten en veilige AI-instructies
- Tests en werkafspraken
- Training en overdracht
```

Regels met `-`, `•` of `*` zijn de punten (het ontwerp toont er maximaal 5); de overige tekst is de korte
beschrijving (voor schermlezers). Volgorde van de kaarten = volgorde in One Studio; de nummers
01–04 en de wisseltekst in de hero volgen automatisch. Meer dan 5 kaarten: alleen de eerste 5 worden
getoond (met waarschuwing in de buildlog).

Andere blokken op de homepage worden veilig genegeerd (met een waarschuwing in de buildlog).
Secties uitschakelen, verwijderen of herschikken in One Studio werkt direct door.

## Lokaal starten

Vereist Node ≥ 20. Geen dependencies.

```bash
cp .env.example .env
```

```bash
npm run build:fixture   # bouwt met fixtures/content.json (kopie van de echte API-respons + testartikelen)
```

```bash
npm run serve           # http://127.0.0.1:4173/ (met dezelfde CSP-headers als Vercel)
```

```bash
npm run build           # bouwt tegen het echte CMS (CMS_TOKEN + SITE_ID uit .env)
```

### Omgevingsvariabelen

| Naam | Geheim? | Waarde |
|---|---|---|
| `CMS_BASE` | nee | `https://linkandlead.nl` |
| `CMS_TOKEN` | **ja** (alleen build-time) | `cms_…` — opvragen bij de platformbeheerder (One Control › site › "API-token genereren"/`maakBouwToken`) |
| `SITE_ID` | nee | `43419df5-06b4-437a-9632-fd3f242a8364` |
| `INDEXEREN` | nee | `nee` tot het echte domein live is; dan `ja` (zet robots/noindex om) |

Het token staat nooit in de HTML, JS of `dist/content.json` (gecontroleerd in de tests).

## Tests

```bash
npm test                # 18 unit-tests: normalisatie, XSS, links, lege standen, volgorde, SEO-basis
```

```bash
npm run test:e2e        # 17 browsertests (Chromium): 375/768/1024/1440, menu, focus trap, Escape, touch, reduced motion, zonder JS, CSP, fonts
```

```bash
npm run check:seo -- http://127.0.0.1:4173/   # de view-source-check uit linkandlead-cms (scripts/seo-basis-check.mjs)
```

## Deployen (Vercel) — staat ingericht

- Project `noblestreer-ai` (team Link-and-Lead) is gekoppeld aan deze repo; productiebranch `main`,
  build `node build.mjs`, output `dist` (`vercel.json`). Env-vars `CMS_TOKEN` (Sensitive), `SITE_ID`,
  `CMS_BASE`, `INDEXEREN=nee` zijn gezet.
- Deploy Hook "Link & Lead One publiceren (productie)" (branch `main`) staat in
  `sites.config.deploy_hook`: elke publicatie in One Studio bouwt de productiesite opnieuw.
- Het domein van de site in One Control is `noblestreer-ai-link-and-lead.vercel.app` (de
  lead-origincontrole is een exacte match).
- **Eigen domein:** koppel het in Vercel, zet het domein van de site in One Control op exact dat
  domein, zet `INDEXEREN=ja` en redeploy. Vercel Authentication staat op "all_except_custom_domains":
  de vercel.app-URL's zijn alleen voor teamleden zichtbaar; een eigen domein is publiek.

Is het CMS bij een build onbereikbaar, dan faalt de build bewust; Vercel laat de vorige deployment
live (geen lege of verzonnen pagina).

## Eerste vulling / seed

`cms/blauwdruk.mjs` is de redactionele seed (uit `noblestreet_content_seed.json` + de referentie-HTML)
in de echte bloktypen. `npm run cms:push` stuurt hem naar `POST /api/cms/sync`.
**Let op:** opnieuw pushen overschrijft de homepageblokken en navigatie; na de eerste vulling is
One Studio de bron van waarheid.

De drie voorbeeldartikelen staan als **concept** (niet gepubliceerd, zonder datum en zonder
hoofdtekst) in de collectie Artikelen. Zolang er niets gepubliceerd is, toont de site een nette lege
stand. Alle foto's zijn **tijdelijke voorbeeldbeelden** in de mediabibliotheek van de site en zijn in
hun alt-tekst zo benoemd; de teamfoto is géén foto van het werkelijke team.

## Projectstructuur

```
build.mjs                 build: ophalen → normaliseren → renderen → dist/
src/lib/cms/client.mjs    CMS-client (lees-API, token, time-out, cache-buster)
src/lib/cms/normalize.mjs CMS-velden → gevalideerde props (blokkenkaart hierboven)
src/render/               html-helpers, componenten, documentopbouw (home, artikel, 404)
src/styles/               tokens.css (Outfit 500 self-hosted, kleuren) + site.css
public/                   site.js (menu, wisseltekst, reveal), fonts/ (Outfit WOFF2 + OFL-licentie)
cms/blauwdruk.mjs         seed voor /api/cms/sync
scripts/                  cms-push, serve (lokale server met CSP), seo-check
tests/                    unit- en browsertests; fixtures/content.json
docs/                     RAPPORT.md, screenshots
```
