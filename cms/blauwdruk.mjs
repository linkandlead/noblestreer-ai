// Blauwdruk voor de EERSTE vulling van de Noblestreet AI-site in Link & Lead One.
// Wordt verstuurd met `npm run cms:push` naar POST /api/cms/sync (token-gescopet, idempotent).
//
// LET OP: na de eerste vulling is One Studio (/admin) de bron van waarheid. Opnieuw pushen
// OVERSCHRIJFT de homepage-blokken en merk/navigatie met deze blauwdruk. Doe dat dus niet meer
// zodra redacteuren in het CMS werken.
//
// Alleen BESTAANDE kernbloktypen (geen nieuw sitebloktype nodig):
//   header · kaarten · mediatekst · artikelen_grid · cta · formulier
// Media komen uit de CMS-mediabibliotheek van deze site (geüpload via /api/cms/media).
// Alle beelden zijn TIJDELIJKE voorbeeldfotografie — zo ook in de alt-teksten benoemd.

const MEDIA = 'https://mucwwqjctynklovacwbv.supabase.co/storage/v1/object/public/media/43419df5-06b4-437a-9632-fd3f242a8364'

export default {
  // Exact twee merkkleuren op de twaalf historische CMS-sleutels (masterprompt §6).
  design_tokens: {
    wit: '#B1F9E1',
    mist: '#052824',
    limoenlicht: '#052824',
    diep: '#052824',
    nacht: '#052824',
    limoen: '#B1F9E1',
    limoendonker: '#B1F9E1',
    tekst: '#B1F9E1',
    steen: '#B1F9E1',
    mistdof: '#B1F9E1',
    fout: '#B1F9E1',
    foutlicht: '#052824',
  },
  // Site > Navigatie en instellingen (opslagformaat sites.config.merk).
  merk: {
    naam: 'Noblestreet AI',
    tagline: 'Zelf bouwen met AI. Met de zekerheid van technische expertise.',
    slogan: 'De vrijheid om zelf te bouwen',
    // Bewust GEEN e-mail/telefoon/adres: die zijn (nog) niet gevalideerd aangeleverd.
    contact: { bedrijf: 'Noblestreet AI', reactietijd: 'Op afspraak' },
    hoofd_nav: [
      { titel: 'Home', href: '#top' },
      { titel: 'Diensten', href: '#diensten' },
      { titel: 'Over ons', href: '#over-ons' },
      { titel: 'Inzichten', href: '#inzichten' },
      { titel: 'Contact', href: '#contact' },
    ],
    footer_kolommen: [
      {
        kop: 'Navigatie',
        links: [
          { titel: 'Onze diensten', href: '#diensten' },
          { titel: 'Over Noblestreet AI', href: '#over-ons' },
          { titel: 'Inzichten', href: '#inzichten' },
          { titel: 'Contact', href: '#contact' },
        ],
      },
    ],
    juridische_links: [],
    primaire_actie: { titel: 'Bespreek je project', href: '#contact' },
  },
  paginas: [
    {
      slug: '/',
      titel: 'Noblestreet AI | Bouw zelf met AI. Met technische zekerheid.',
      beschrijving:
        'Noblestreet AI helpt bedrijven zelfstandig software bouwen met AI. Van Claude Code-werkomgevingen tot technische controles en veilige livegang.',
      og_beeld: `${MEDIA}/hero-werkplek-mwi6rtt3-qy57eg.webp`,
      published: true,
      page_type: 'landing',
      blokken: [
        {
          type: 'header',
          bg: 'nacht',
          content: {
            layout: 'achtergrond',
            hoogte: 'fullscreen',
            eyebrow: 'Technische zekerheid voor een nieuwe generatie makers',
            heading: 'Zelf bouwen met AI.',
            subheading:
              'Jouw ideeën verdienen een sterke technische basis. Wij helpen je AI-software professioneel te bouwen, controleren en publiceren.',
            cta_primair_label: 'Ontdek onze expertise',
            cta_primair_link: '#diensten',
            media_type: 'afbeelding',
            media_afbeelding: `${MEDIA}/hero-werkplek-mwi6rtt3-qy57eg.webp`,
            media_alt: 'Warme werkruimte met laptop en natuurlijk licht; tijdelijke voorbeeldfotografie',
            focal_x: 50,
            focal_y: 47,
            overlay: 'donker',
            extras: 'geen',
          },
        },
        {
          type: 'kaarten',
          bg: 'diep',
          content: {
            eyebrow: '',
            titel: 'Techniek die je verder brengt.',
            intro: 'Je bouwt zelf met AI. Wij zorgen voor de kennis, structuur en controles die professioneel werken mogelijk maken.',
            kolommen: '4',
            // Per kaart: eerste regel(s) = korte beschrijving; regels met "- " = de (max. 5) punten.
            items: [
              {
                icoon: 'geen',
                titel: 'AI Workspace',
                tekst:
                  'Een veilige AI-ontwikkelomgeving waarmee je team zelfstandig software kan bouwen.\n- Claude Code professioneel instellen\n- GitHub en versiebeheer\n- Rechten en veilige AI-instructies\n- Tests en werkafspraken\n- Training en overdracht',
                link: '#contact',
              },
              {
                icoon: 'geen',
                titel: 'AI Launch Check',
                tekst:
                  'Technische controle voordat je AI-gebouwde website, app of tool livegaat.\n- Code en architectuur beoordelen\n- Toegang en beveiliging\n- Database en privacy\n- Prestaties en stabiliteit\n- Publicatie en livegang',
                link: '#contact',
              },
              {
                icoon: 'geen',
                titel: 'AI Guidance',
                tekst:
                  'Onafhankelijk advies om met AI goede technische keuzes te maken.\n- Technische roadmap\n- Keuze van AI-tools\n- Architectuur en code reviews\n- Governance en werkrichtlijnen\n- Sparren met een softwarearchitect',
                link: '#contact',
              },
              {
                icoon: 'geen',
                titel: 'AI Support',
                tekst:
                  'Technische hulp bij publicatie, beheer en verdere ontwikkeling.\n- Technische verbeteringen\n- Nieuwe versies publiceren\n- Monitoring en back-ups\n- Problemen helpen oplossen\n- Veilig doorontwikkelen',
                link: '#contact',
              },
            ],
          },
        },
        {
          type: 'mediatekst',
          bg: 'nacht',
          content: {
            // eyebrow = het kleine fotolabel rechtsboven in de beeldbanner.
            eyebrow: 'Beeld ter illustratie',
            titel: 'Persoonlijk in contact. Professioneel in techniek.',
            alineas: [
              {
                tekst:
                  'Noblestreet AI combineert jarenlange ervaring in softwareontwikkeling met een persoonlijke, praktische aanpak. Arnaud is een technisch aanspreekpunt voor organisaties die AI professioneel willen inzetten.',
              },
            ],
            punten: [],
            beeld: `${MEDIA}/team-werksessie-mwi6rvpr-50a1io.webp`,
            beeld_alt: 'Zakelijke werksessie in warm licht; tijdelijke voorbeeldfoto, geen afbeelding van het werkelijke team',
            beeldzijde: 'rechts',
            knop: '#contact',
            knoptekst: 'Maak kennis met ons',
          },
        },
        {
          type: 'artikelen_grid',
          bg: 'diep',
          content: { eyebrow: '', titel: 'Nieuwe inzichten. Heldere antwoorden.', maximaal: 3 },
        },
        {
          type: 'cta',
          bg: 'diep',
          content: {
            eyebrow: 'Contact',
            titel: 'Samen verder bouwen.',
            tekst: 'Vertel ons wat je wilt ontwikkelen of wat je al met AI hebt gebouwd. We denken graag met je mee.',
            knoptekst: 'Plan een gesprek',
            knop: '#contact-formulier',
            meta: [{ tekst: 'Op afspraak' }, { tekst: 'Persoonlijk technisch aanspreekpunt' }],
          },
        },
        {
          type: 'formulier',
          bg: 'diep',
          content: {
            soort: 'contact',
            eyebrow: '',
            titel: 'Bespreek je project',
            intro: 'Laat je gegevens achter; we nemen contact met je op om een kennismaking te plannen.',
            knoptekst: 'Plan een gesprek',
            voetnoot: 'We gebruiken je gegevens alleen om op je aanvraag te reageren.',
            bevestigingstekst: 'Bedankt. Je aanvraag is ontvangen; we nemen zo snel mogelijk contact met je op.',
          },
        },
      ],
    },
  ],
}
