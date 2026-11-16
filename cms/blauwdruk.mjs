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
      { titel: 'Home', href: '/#top' },
      { titel: 'Diensten', href: '/#diensten' },
      { titel: 'Over ons', href: '/#over-ons' },
      { titel: 'Team', href: '/team/' },
      { titel: 'Inzichten', href: '/inzichten/' },
      { titel: 'Contact', href: '/#contact' },
    ],
    footer_kolommen: [
      {
        kop: 'Navigatie',
        links: [
          { titel: 'Onze diensten', href: '/#diensten' },
          { titel: 'Over Noblestreet AI', href: '/#over-ons' },
          { titel: 'Ons team', href: '/team/' },
          { titel: 'Inzichten', href: '/inzichten/' },
          { titel: 'Contact', href: '/#contact' },
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
      og_beeld: `${MEDIA}/hero-glas-mwj05kar-5dromk.webp`,
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
            media_afbeelding: `${MEDIA}/hero-glas-mwj05kar-5dromk.webp`,
            media_alt: 'Een hand plaatst een glazen plaatje in een opgebouwde constructie van glas en metaal op een marmeren voet',
            focal_x: 70,
            focal_y: 50,
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
                  'Een veilige AI-ontwikkelomgeving waarmee je team zelfstandig software kan bouwen.\n- AI-ontwikkeltools professioneel instellen\n- Versiebeheer en samenwerking\n- Rechten en veilige AI-instructies\n- Tests en werkafspraken\n- Training en overdracht',
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
          // Logo's in wit (PNG) uit de mediabibliotheek; ChatGPT en Lovable als tekstlogo.
          type: 'logostrook',
          bg: 'diep',
          content: {
            eyebrow: 'Tools waar we mee werken',
            titel: '',
            grijs: 'nee',
            items: [
              { logo: `${MEDIA}/logo-claude-mwj236od-km7jxd.png`, alt: "Claude", link: "" },
              { logo: `${MEDIA}/logo-chatgpt-mwj23ad1-db54ra.png`, alt: "ChatGPT", link: "" },
              { logo: `${MEDIA}/logo-gemini-mwj23dtx-aye113.png`, alt: "Gemini", link: "" },
              { logo: `${MEDIA}/logo-github-mwj23h2n-3difv1.png`, alt: "GitHub", link: "" },
              { logo: `${MEDIA}/logo-copilot-mwj23kmn-mp2u24.png`, alt: "Copilot", link: "" },
              { logo: `${MEDIA}/logo-lovable-mwj23o0l-9555f5.png`, alt: "Lovable", link: "" },
              { logo: `${MEDIA}/logo-cursor-mwj23rhc-313ptd.png`, alt: "Cursor", link: "" },
              { logo: `${MEDIA}/logo-vercel-mwj23usm-kha1w2.png`, alt: "Vercel", link: "" },
              { logo: `${MEDIA}/logo-supabase-mwj23yh3-ayj0r8.png`, alt: "Supabase", link: "" },
              { logo: `${MEDIA}/logo-v0-mwj242dt-ukvnnf.png`, alt: "v0", link: "" },
              { logo: `${MEDIA}/logo-replit-mwj245lv-957igp.png`, alt: "Replit", link: "" },
              { logo: `${MEDIA}/logo-windsurf-mwj248pc-vcz9bm.png`, alt: "Windsurf", link: "" },
              { logo: `${MEDIA}/logo-perplexity-mwj24byh-q3zvnx.png`, alt: "Perplexity", link: "" },
              { logo: `${MEDIA}/logo-mistral-mwj24f5w-t8dnv5.png`, alt: "Mistral AI", link: "" },
              { logo: `${MEDIA}/logo-huggingface-mwj24igv-h2h0qb.png`, alt: "Hugging Face", link: "" },
              { logo: `${MEDIA}/logo-n8n-mwj24lvc-d3rcm3.png`, alt: "n8n", link: "" },
              { logo: `${MEDIA}/logo-langchain-mwj24p1k-xqqqrb.png`, alt: "LangChain", link: "" },
              { logo: `${MEDIA}/logo-ollama-mwj24sf6-r9qlpd.png`, alt: "Ollama", link: "" },
              { logo: `${MEDIA}/logo-nextjs-mwj24vo8-owgukf.png`, alt: "Next.js", link: "" },
              { logo: `${MEDIA}/logo-cloudflare-mwj24z03-lqv077.png`, alt: "Cloudflare", link: "" },
              { logo: `${MEDIA}/logo-docker-mwj252ab-f32mqp.png`, alt: "Docker", link: "" },
              { logo: `${MEDIA}/logo-figma-mwj255v0-qkkd4f.png`, alt: "Figma", link: "" },
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
            // Duotoon in de merkkleuren (mediabibliotheek).
            beeld: `${MEDIA}/over-ons-trap-mwj0126w-wmv8jb.webp`,
            beeld_alt: 'Iemand loopt een gebogen betonnen trap op, met schaduwen van takken in het daglicht',
            beeldzijde: 'rechts',
            knop: '/team/',
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
    {
      slug: '/team',
      titel: 'Ons team | Noblestreet AI',
      beschrijving:
        'Maak kennis met het team van Noblestreet AI: specialisten die je AI-workflow opzetten, ondersteunen en veilig houden, en AI-producten bouwen.',
      published: true,
      page_type: 'landing',
      conversion_goal: 'contact',
      blokken: [
        {
          type: 'header',
          bg: 'nacht',
          content: {
            layout: 'compact',
            hoogte: 'compact',
            eyebrow: 'Over Noblestreet AI',
            heading: 'Ons team. Persoonlijk betrokken.',
            subheading:
              'Een vast team van AI- en softwarespecialisten dat je AI-workflow opzet, ondersteunt en veilig houdt, en AI-producten voor je bouwt.',
            media_type: 'geen',
            extras: 'geen',
            usps: [],
          },
        },
        {
          // De teamleden zelf beheer je in de collectie Team (One Studio › Team), niet in dit blok.
          type: 'mensen',
          bg: 'diep',
          content: {
            titel: 'Maak kennis met het team.',
            intro: 'Dit zijn de mensen met wie je werkt: van de eerste opzet tot support en doorontwikkeling.',
            maximaal: 12,
          },
        },
        {
          type: 'cta',
          bg: 'diep',
          content: {
            eyebrow: 'Contact',
            titel: 'Kennismaken?',
            tekst: 'Vertel ons waar je staat met AI. We plannen graag een gesprek met het team.',
            knoptekst: 'Plan een gesprek',
            knop: '/#contact-formulier',
            meta: [{ tekst: 'Op afspraak' }, { tekst: 'Vaste contactpersoon in het team' }],
          },
        },
      ],
    },
    {
      slug: '/inzichten',
      titel: 'Inzichten | Noblestreet AI',
      beschrijving:
        'Praktische artikelen over werken met AI: van een goede werkomgeving en veilige apps tot support, kosten en de keuze tussen zelf bouwen of laten bouwen.',
      published: true,
      page_type: 'landing',
      conversion_goal: 'contact',
      blokken: [
        {
          type: 'header',
          bg: 'nacht',
          content: {
            layout: 'compact',
            hoogte: 'compact',
            eyebrow: 'Inzichten',
            heading: 'Nieuwe inzichten. Heldere antwoorden.',
            subheading: 'Praktische artikelen over werken met AI: hoe je het goed opzet, veilig houdt en laat blijven werken.',
            media_type: 'geen',
            extras: 'geen',
            usps: [],
          },
        },
        // maximaal > 3 = overzicht: gelijk raster met rubriekfilter.
        { type: 'artikelen_grid', bg: 'diep', content: { eyebrow: '', titel: 'Alle artikelen.', maximaal: 60 } },
        {
          type: 'cta',
          bg: 'diep',
          content: {
            eyebrow: 'Contact',
            titel: 'Een vraag die hier niet staat?',
            tekst: 'Vertel ons waar je staat met AI. We denken graag met je mee.',
            knoptekst: 'Plan een gesprek',
            knop: '/#contact-formulier',
            meta: [{ tekst: 'Op afspraak' }, { tekst: 'Vaste contactpersoon in het team' }],
          },
        },
      ],
    },
  ],
}
