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
    tagline: 'Hulp bij het opzetten, beveiligen en onderhouden van je AI-workflow. En AI-producten op maat.',
    slogan: 'AI in je bedrijf, goed geregeld',
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
      titel: 'Noblestreet AI | AI in je bedrijf, goed geregeld',
      beschrijving:
        'Noblestreet AI zet je AI-workflow professioneel op, ondersteunt je team en houdt alles veilig en werkend. En we bouwen AI-producten op maat.',
      og_beeld: `${MEDIA}/hero-werkplek-mwi6rtt3-qy57eg.webp`,
      published: true,
      page_type: 'landing',
      // Verplicht voor de publicatiecheck van One Studio (paginaValidatie): anders kan een redacteur
      // de pagina niet opnieuw publiceren.
      conversion_goal: 'contact',
      blokken: [
        {
          type: 'header',
          bg: 'nacht',
          content: {
            layout: 'achtergrond',
            hoogte: 'fullscreen',
            eyebrow: 'Opzet, support en beveiliging van je AI-workflow',
            heading: 'AI in je bedrijf. Goed geregeld.',
            subheading:
              'Wij richten je AI-workflow professioneel in, ondersteunen je team en zorgen dat alles veilig blijft werken. En heb je een idee voor een AI-product? Dan bouwen wij het.',
            cta_primair_label: 'Bekijk wat we voor je doen',
            cta_primair_link: '#diensten',
            media_type: 'afbeelding',
            media_afbeelding: `${MEDIA}/hero-werkplek-mwi6rtt3-qy57eg.webp`,
            media_alt: 'Warme werkruimte met laptop en natuurlijk licht; tijdelijke voorbeeldfotografie',
            focal_x: 50,
            focal_y: 47,
            overlay: 'donker',
            extras: 'geen',
            // USP's = de wisselende laatste regel van de kop (klantvoordelen).
            usps: [
              { tekst: 'Wij zetten het op.' },
              { tekst: 'Wij houden het veilig.' },
              { tekst: 'Wij zorgen dat het blijft werken.' },
              { tekst: 'Wij bouwen je AI-product.' },
            ],
          },
        },
        {
          type: 'kaarten',
          bg: 'diep',
          content: {
            eyebrow: '',
            titel: 'Techniek die je verder brengt.',
            intro: 'Wij zetten je AI-workflow op, houden hem veilig en werkend, en bouwen AI-producten op maat.',
            kolommen: '4',
            // Per kaart (max. 5 kaarten): eerste regel(s) = korte beschrijving; regels met "- " = de (max. 5) punten.
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
              {
                icoon: 'geen',
                titel: 'AI Development',
                tekst:
                  'Wij bouwen AI-producten voor je: van idee tot werkende, veilige applicatie.\n- Idee en productontwerp\n- Prototype en validatie\n- Ontwikkeling met AI\n- Veilige livegang\n- Beheer en doorontwikkeling',
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
            titel: 'Een vast team. Persoonlijk betrokken.',
            alineas: [
              {
                tekst:
                  'Bij Noblestreet AI werk je met een vast team van AI- en softwarespecialisten. We zetten je AI-workflow samen met je op, blijven bereikbaar als er iets aangepast of opgelost moet worden en zorgen dat alles veilig blijft werken. Wil je een AI-product laten bouwen? Dan begeleiden we het van idee tot livegang.',
              },
            ],
            punten: [],
            beeld: `${MEDIA}/team-werksessie-mwi6rvpr-50a1io.webp`,
            beeld_alt: 'Zakelijke werksessie in warm licht; tijdelijke voorbeeldfoto, geen afbeelding van het werkelijke team',
            beeldzijde: 'rechts',
            knop: '#contact',
            knoptekst: 'Maak kennis met het team',
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
            meta: [{ tekst: 'Op afspraak' }, { tekst: 'Vaste contactpersoon in het team' }],
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
