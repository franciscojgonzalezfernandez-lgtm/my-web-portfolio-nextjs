export const METRICS_DATA = {
  title: "Numbers Don't Lie",
  titleGerman: "Zahlen lügen nicht",
  titleSpanish: "Los números no mienten",

  subtitle:
    "Achieving perfect scores isn't just about bragging rights — it's about delivering exceptional user experiences that drive real business results.",
  subtitleGerman:
    "Perfekte Scores zu erreichen ist nicht nur Prahlerei — es geht darum, außergewöhnliche Nutzererlebnisse zu liefern, die echte Geschäftsergebnisse bringen.",
  subtitleSpanish: "Conseguir puntuaciones perfectas no es solo para presumir: se trata de ofrecer experiencias de usuario excepcionales que generen resultados de negocio reales.",

  title2: "Committed to Performance Excellence",
  title2German: "Engagement für Performance-Exzellenz",
  title2Spanish: "Comprometido con la excelencia en rendimiento",

  subtitle2:
    "As an engineer, I understand that web performance isn't just a technical metric — it's a <strong className='text-foreground'>critical business driver.</strong> Studies show that a 1-second delay in page load time can result in a <strong className='text-foreground'>7% reduction in conversions</strong>. That's why I obsess over every millisecond, every byte, and every render cycle.",
  subtitle2German:
    "Als Ingenieur verstehe ich, dass Web-Performance nicht nur eine technische Metrik ist — sie ist ein <strong className='text-foreground'>entscheidender Geschäftstreiber.</strong> Studien zeigen, dass eine 1-Sekunden-Verzögerung der Ladezeit zu einem <strong className='text-foreground'>7%igen Rückgang der Konversionen</strong> führen kann. Deshalb optimiere ich jede Millisekunde, jedes Byte und jeden Renderzyklus.",
  subtitle2Spanish: "Como ingeniero, sé que el rendimiento web no es solo una métrica técnica: es un <strong className='text-foreground'>factor clave para el negocio.</strong> Los estudios demuestran que un retraso de 1 segundo en el tiempo de carga puede suponer una <strong className='text-foreground'>caída del 7% en las conversiones</strong>. Por eso me obsesiono con cada milisegundo, cada byte y cada ciclo de render.",

  fact1: "of mobile users abandon sites that take over 3 seconds to load",
  fact1German:
    "Mobile-Nutzer verlassen Seiten, die länger als 3 Sekunden zum Laden brauchen",
  fact1Spanish: "de los usuarios móviles abandonan las webs que tardan más de 3 segundos en cargar",

  fact2: "higher conversion rates for sites with sub-2-second load times",
  fact2German:
    "höhere Konversionsraten bei Seiten mit unter 2 Sekunden Ladezeit",
  fact2Spanish: "más conversiones en las webs que cargan en menos de 2 segundos",

  fact3: "lost annually due to slow-loading websites",
  fact3German: "jährlich durch langsame Websites verloren",
  fact3Spanish: "perdidos cada año por culpa de webs que cargan lento",

  tryYourselfTitle: "Try It Yourself!",
  tryYourselfTitleGerman: "Teste es selbst!",
  tryYourselfTitleSpanish: "¡Compruébalo tú mismo!",

  tryYourselfSubtitle:
    "Don't just take my word for it. Run a Lighthouse audit on this very website and see the results with your own eyes.",
  tryYourselfSubtitleGerman:
    "Nimm nicht nur mein Wort dafür. Führe einen Lighthouse-Test auf dieser Website durch und sieh dir die Ergebnisse selbst an.",
  tryYourselfSubtitleSpanish: "No te fíes solo de mi palabra. Lanza una auditoría de Lighthouse sobre esta misma web y comprueba los resultados con tus propios ojos.",
};

// Lighthouse scores shown in Activity Monitor and in the crawlable /metrics copy.
export const LIGHTHOUSE: ReadonlyArray<{
  name: string;
  nameGerman: string;
  nameSpanish: string;
  score: number;
  pid: number;
}> = [
  {
    name: "Performance",
    nameGerman: "Leistung",
    nameSpanish: "Rendimiento",
    score: 100,
    pid: 101,
  },
  {
    name: "Accessibility",
    nameGerman: "Barrierefreiheit",
    nameSpanish: "Accesibilidad",
    score: 100,
    pid: 102,
  },
  {
    name: "Best Practices",
    nameGerman: "Best Practices",
    nameSpanish: "Buenas prácticas",
    score: 100,
    pid: 103,
  },
  { name: "SEO", nameGerman: "SEO", nameSpanish: "SEO", score: 100, pid: 104 },
];
