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
| Beoogd domein | `noblestreer-ai-link-and-lead.vercel.app` (tijdelijk; ook gebruikt voor de lead-origincontrole) |

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

## CMS-blokkenkaart (alleen bestaande kernblokken — geen nieuw sitebloktype nodig)

| Sectie | CMS-blok (type) | Velden die de frontend gebruikt |
|---|---|---|
| Header + fullscreen menu | Site > Navigatie en instellingen (`sites.config.merk`) | `naam`, `hoofd_nav[]` (label/URL/volgorde), `primaire_actie`, `slogan` |
| Hero | **Header (hero)** `header`, lay-out *achtergrond*, hoogte *fullscreen* | `eyebrow`, `heading` (h1, over 2 regels), `subheading`, `cta_primair_label/link`, `media_afbeelding`, `media_alt`, `focal_x/y` |
| Wisselende laatste regel | afgeleid uit de dienstkaarten (geen dubbele content) | titel van elke kaart + "." |
| Diensten (getrapt raster) | **Kaartenrij** `kaarten`, 4 kolommen | `titel`, `intro`, `eyebrow`; per kaart `titel`, `tekst`, `link` |
| Team / over ons | **Tekst met beeld** `mediatekst` | `titel` (zinnen → regels), `alineas[]`, `punten[]`, `beeld`, `beeld_alt`, `knop`/`knoptekst`, `eyebrow` = fotolabel ("Beeld ter illustratie") |
| Inzichten | **Artikelen** `artikelen_grid` + collectie *Artikelen* | `titel`, `maximaal` (≤ 3), `filter_rubriek`; per artikel `titel`, `rubriek`, `gepubliceerd_op`, `samenvatting`, `foto`, `foto_alt`, `hoofdtekst`, `slug` |
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
01–04 en de wisseltekst in de hero volgen automatisch. Meer dan 4 kaarten: alleen de eerste 4 worden
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

## Deployen (Vercel)

1. Nieuw Vercel-project **`noblestreet-ai`** (team Link-and-Lead), gekoppeld aan deze repo.
   Build `node build.mjs`, output `dist`, geen install-stap (staat in `vercel.json`).
2. Environment Variables: `CMS_TOKEN` (Sensitive), `SITE_ID`, `CMS_BASE`, `INDEXEREN=nee`.
3. Settings › Git › **Deploy Hooks** › maak een hook (branch van productie). Zet de URL in One Studio:
   `/admin/instellingen` › **Deploy Hook** (wordt opgeslagen in `sites.config.deploy_hook`). Vanaf dat
   moment bouwt elke publicatie in One Studio de site automatisch opnieuw.
4. Controleer dat de site op `noblestreer-ai-link-and-lead.vercel.app` draait: dat is het domein waarop het CMS de
   herkomst van formulierleads toestaat. Ander domein? Pas eerst het domein van de site in One Control aan.
5. Eigen domein koppelen → domein in One Control bijwerken → `INDEXEREN=ja` → redeploy.

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
