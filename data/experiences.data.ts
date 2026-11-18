import { Experience } from "@/interfaces/experience.interface";

export const experiences: Experience[] = [
  {
    role: "Founder, Software Engineer & Snowboard Instructor",
    roleGerman: "Gründer, Software Engineer & Snowboardlehrer",
    roleSpanish: "Fundador, Software Engineer y profesor de snowboard",
    company: "Ride Flumserberg",
    companyLink: "https://rideflumserberg.ch",
    period: "May 2026 - Now",
    description:
      "I founded my own snowboard school in Flumserberg, registered as a sole proprietorship, and built its booking platform end to end. On the mountain I teach private lessons in English, German and Spanish; off it I run the product, the brand and the business.",
    descriptionGerman:
      "Ich habe meine eigene Snowboardschule in Flumserberg gegründet, als Einzelfirma angemeldet, und ihre Buchungsplattform von Anfang bis Ende gebaut. Am Berg gebe ich Privatstunden auf Englisch, Deutsch und Spanisch; daneben verantworte ich Produkt, Marke und Geschäft.",
    descriptionSpanish:
      "He fundado mi propia escuela de snowboard en Flumserberg, registrada como empresa individual, y he construido de principio a fin su plataforma de reservas. En la montaña doy clases particulares en inglés, alemán y español; fuera de ella llevo el producto, la marca y el negocio.",
    achievements: [
      "Built and shipped a production booking platform (Next.js 15, Prisma + Neon, Better Auth, Stripe with TWINT, Resend, Sentry) with a trilingual booking flow, an admin cockpit and an instructor panel — live since May 2026 and taking real payments.",
      "Worked AI-first with Claude Code: tickets as the source of scope, agents to locate, plan, build and review, CI with Vitest and Playwright, automatic database migrations and a smoke test against production after every deploy.",
      "Took a business from zero in a new country: legal registration, pricing, brand, website, marketing with QR flyers and tracked campaigns, and the lessons themselves in three languages.",
    ],
    achievementsGerman: [
      "Eine produktive Buchungsplattform gebaut und ausgeliefert (Next.js 15, Prisma + Neon, Better Auth, Stripe mit TWINT, Resend, Sentry) mit dreisprachigem Buchungsablauf, Admin-Cockpit und Instructor-Panel — live seit Mai 2026 und mit echten Zahlungen.",
      "AI-first mit Claude Code gearbeitet: Tickets als Quelle für den Umfang, Agents zum Finden, Planen, Bauen und Reviewen, CI mit Vitest und Playwright, automatische Datenbank-Migrationen und ein Smoke-Test gegen Produktion nach jedem Deploy.",
      "Ein Geschäft in einem neuen Land von null aufgebaut: rechtliche Anmeldung, Preise, Marke, Website, Marketing mit QR-Flyern und messbaren Kampagnen und der Unterricht selbst in drei Sprachen.",
    ],
    achievementsSpanish: [
      "He construido y puesto en producción una plataforma de reservas (Next.js 15, Prisma + Neon, Better Auth, Stripe con TWINT, Resend, Sentry) con reservas en tres idiomas, panel de administración y panel de instructor; en producción desde mayo de 2026 y cobrando pagos reales.",
      "He trabajado AI-first con Claude Code: tickets como fuente del alcance, agentes para localizar, planificar, construir y revisar, CI con Vitest y Playwright, migraciones de base de datos automáticas y un smoke test contra producción después de cada deploy.",
      "He levantado un negocio desde cero en un país nuevo: alta legal, precios, marca, web, marketing con flyers con QR y campañas medidas, y las propias clases en tres idiomas.",
    ],
    relatedProjects: [
      {
        label: "Ride Flumserberg platform",
        labelGerman: "Ride-Flumserberg-Plattform",
        labelSpanish: "Plataforma Ride Flumserberg",
        url: "/ride-flumserberg",
      },
    ],
  },
  {
    role: "SENIOR SOFTWARE ENGINEER – AI-Driven Product Development",
    roleGerman: "SENIOR SOFTWARE ENGINEER – AI‑gesteuerte Produktentwicklung",
    roleSpanish: "SENIOR SOFTWARE ENGINEER – Desarrollo de producto impulsado por IA",
    company: "Portfolio Expansion",
    period: "Dec 2025 - Now",
    description:
      "Building end‑to‑end web applications as an independent full‑stack engineer while actively adapting to the Swiss tech market. Working autonomously across discovery, architecture, implementation, and deployment, with a strong focus on performance, UX, and production‑ready quality.",
    descriptionGerman:
      "Entwicklung von End-to-End-Web-Anwendungen als unabhängiger Full-Stack-Engineer mit aktiver Anpassung an den Schweizer Tech-Markt. Autonomes Arbeiten über alle Phasen von der Entdeckung, Architektur, Implementierung bis Deployment mit starkem Fokus auf Performance, UX und produktionsreife Qualität.",
    descriptionSpanish:
      "Desarrollo aplicaciones web end‑to‑end como ingeniero full‑stack independiente mientras me adapto activamente al mercado tecnológico suizo. Trabajo de forma autónoma en todas las fases, desde el discovery y la arquitectura hasta la implementación y el deploy, con un fuerte foco en el rendimiento, la UX y una calidad lista para producción.",
    achievements: [
      "Designed, implemented, and deployed end‑to‑end applications with Next.js and React on Vercel, including routing, data fetching, UI, performance tuning, and CI/CD.",
      "Quickly adapted to the Swiss market's expectations in terms of performance, accessibility, and SEO, achieving strong Lighthouse scores and clean Core Web Vitals on deployed projects.",
      "Built a modular personal portfolio and metrics platform that showcases real usage data, automated deployments, and a codebase structured for team‑level scalability, even as a solo developer.",
    ],
    achievementsGerman: [
      "Entworfen, implementiert und bereitgestellt von End-to-End-Anwendungen mit Next.js und React auf Vercel, inklusive Routing, Datenabruf, UI, Performance-Tuning und CI/CD.",
      "Schnelle Anpassung an die Erwartungen des Schweizer Marktes hinsichtlich Performance, Barrierefreiheit und SEO mit starken Lighthouse-Werten und sauberen Core Web Vitals in produktiven Projekten.",
      "Entwicklung einer modularen Portfolio- und Metrikplattform, die echte Nutzungsdaten, automatisierte Deployments und eine für Team-Skalierbarkeit strukturierte Codebasis zeigt – auch als Solo-Entwickler.",
    ],
    achievementsSpanish: [
      "He diseñado, implementado y desplegado aplicaciones end‑to‑end con Next.js y React en Vercel, cubriendo routing, data fetching, UI, optimización de rendimiento y CI/CD.",
      "Me he adaptado rápidamente a lo que el mercado suizo espera en rendimiento, accesibilidad y SEO, logrando muy buenas puntuaciones en Lighthouse y Core Web Vitals limpios en los proyectos desplegados.",
      "He construido un portfolio personal y una plataforma de métricas modulares que muestran datos de uso reales, deploys automatizados y un código estructurado para escalar a nivel de equipo, aun trabajando en solitario.",
    ],
    relatedProjects: [
      {
        label: "Optimized Web Portfolio",
        labelGerman: "Optimierte Web-Portfolio",
        labelSpanish: "Portfolio web optimizado",
        url: "/this-portfolio",
      },
      {
        label: "Full Stack E-commerce",
        labelGerman: "Full-Stack-E-Commerce",
        labelSpanish: "E-commerce full-stack",
        url: "/ecommerce-platform",
      },
    ],
  },
  {
    role: "Product Owner & Project Manager",
    roleGerman: "Product Owner & Projektmanager",
    roleSpanish: "Product Owner & Project Manager",
    company: "Telefonica",
    companyLink: "https://www.telefonica.es/es/",
    period: "Jan 2024 - Dec 2025",
    description:
      "Leaded the integration of Adobe Experience Manager (CMS) in the Telefonica Ecosystem, making the business able to create pages with a friendly interface and without technical knowledge. Full integration meeting security requirements at the network layer, business requirements at the application layer. (2024-2025)",
    descriptionGerman:
      "Leitung der Integration von Adobe Experience Manager (CMS) im Telefónica-Ökosystem, wodurch das Geschäft Seiten mit einer benutzerfreundlichen Oberfläche ohne technisches Wissen erstellen konnte. Volle Integration, die Sicherheitsanforderungen auf Netzwerkebene und Geschäftsanforderungen auf Anwendungsebene erfüllt. (2024-2025)",
    descriptionSpanish:
      "Lideré la integración de Adobe Experience Manager (CMS) en el ecosistema de Telefónica, permitiendo que negocio creara páginas desde una interfaz sencilla y sin conocimientos técnicos. Una integración completa que cumple los requisitos de seguridad en la capa de red y los requisitos de negocio en la capa de aplicación. (2024-2025)",
    achievements: [
      "Supporting 10.000 visits/day without degrading",
      "Proposed a workflow and provided the necessary building blocks to give the business full independence to create, edit, and publish pages.",
      "A 40‑person team (contributors, UX, UI, SEO, and Analytics) working on these capabilities smoothly while continuously gathering and addressing their requirements & accomplishing times.",
    ],
    achievementsGerman: [
      "Unterstützung von 10.000 Besuchen/Tag ohne Degradation",
      "Vorgeschlagener Workflow und Bereitstellung der notwendigen Bausteine, um dem Geschäft volle Unabhängigkeit beim Erstellen, Bearbeiten und Veröffentlichen von Seiten zu geben.",
      "40-Personen-Team (Mitwirkende, UX, UI, SEO und Analytics) arbeitet reibungslos an diesen Funktionen, während kontinuierlich Anforderungen gesammelt und bearbeitet werden.",
    ],
    achievementsSpanish: [
      "Soporta 10.000 visitas/día sin degradación",
      "Propuse un workflow y proporcioné las piezas necesarias para que negocio tuviera total autonomía para crear, editar y publicar páginas.",
      "Un equipo de 40 personas (contribuidores, UX, UI, SEO y Analytics) trabajando con estas capacidades de forma fluida, mientras recogíamos y atendíamos sus requisitos de forma continua y cumplíamos los plazos.",
    ],
    relatedProjects: [
      {
        label:
          "Full integration of Adobe Experience Manager (CMS) in Telefonica Ecosystem.",
        labelGerman:
          "Vollständige Integration von Adobe Experience Manager (CMS) im Telefónica-Ökosystem.",
        labelSpanish:
          "Integración completa de Adobe Experience Manager (CMS) en el ecosistema de Telefónica.",
        url: "/adobe-experience-manager-integration",
      },
    ],
  },
  {
    role: "Lead Software Engineer",
    roleGerman: "Lead-Softwareentwickler",
    roleSpanish: "Lead Software Engineer",
    company: "Telefonica",
    period: "July 2022 - Jan 2024",
    description:
      "Leading the unified frontend strategy for the entire area, defining and establishing shared paradigms and technologies to maximize team productivity. Training junior developers in methodology and technical skills, and providing the core seeds and components for each application.",
    descriptionGerman:
      "Leitung der einheitlichen Frontend-Strategie für den gesamten Bereich, Definition und Etablierung gemeinsamer Paradigmen und Technologien zur Maximierung der Teamproduktivität. Schulung von Junior-Entwicklern in Methodik und technischen Fähigkeiten sowie Bereitstellung der Kernbausteine und Komponenten für jede Anwendung.",
    descriptionSpanish:
      "Lideré la estrategia frontend unificada de toda el área, definiendo y estableciendo paradigmas y tecnologías comunes para maximizar la productividad de los equipos. Formé a desarrolladores junior en metodología y habilidades técnicas, y proporcioné las semillas base y los componentes core de cada aplicación.",
    achievements: [
      "Designed and implemented a complete ecosystem of SPAs in React and Next.js from scratch, enabling a team of 30 people to work on projects in parallel to meet the evolving and specific needs of each web segment",
      "Ranked Movistar.es as the #1 telecomunications website in Spain",
    ],
    achievementsGerman: [
      "Entwurf und Implementierung eines vollständigen SPA-Ökosystems in React und Next.js von Grund auf, das ein 30-Personen-Team ermöglicht, parallel an Projekten zu arbeiten, um den sich entwickelnden und spezifischen Bedürfnissen jedes Websegments gerecht zu werden.",
      "Movistar.es als #1 Telekommunikations-Website in Spanien platziert.",
    ],
    achievementsSpanish: [
      "Diseñé e implementé desde cero un ecosistema completo de SPAs en React y Next.js, permitiendo que un equipo de 30 personas trabajara en paralelo en distintos proyectos para cubrir las necesidades cambiantes y específicas de cada segmento web",
      "Llevamos Movistar.es a ser la web de telecomunicaciones #1 de España",
    ],
    companyLink: "https://www.telefonica.es/es/",
    relatedProjects: [
      {
        label: "Next & React pages ecosystem",
        labelGerman: "Next.js & React Seiten-Ökosystem",
        labelSpanish: "Ecosistema de páginas en Next & React",
        url: "/nextjs-ecosystem",
      },
      {
        label: "Make editable all that React&Next ecosystem!",
        labelGerman: "Das gesamte React&Next-Ökosystem editierbar machen!",
        labelSpanish: "¡Todo el ecosistema React&Next, editable!",
        url: "/whole-cms-next",
      },
    ],
  },
  {
    role: "Full Stack Developer",
    roleGerman: "Full-Stack-Entwickler",
    roleSpanish: "Desarrollador Full Stack",
    company: "Telefonica",
    companyLink: "https://www.telefonica.es/es/",
    period: "July 2018 - July 2022",
    description:
      "Collaborated on the professionalization of Telefónica's digital channels, leading the adoption of modern technologies such as React and Next.js on the frontend and strengthening our backend through the migration to Google Cloud Platform. I delivered multiple frontend and backend projects to help transform the digital channel into the company's leading sales force.",
    descriptionGerman:
      "Zusammenarbeit bei der Professionalisierung der digitalen Kanäle von Telefónica, Leitung der Einführung moderner Technologien wie React und Next.js im Frontend sowie Stärkung unseres Backends durch Migration zur Google Cloud Platform. Lieferung mehrerer Frontend- und Backend-Projekte zur Unterstützung der Transformation des digitalen Kanals zur führenden Vertriebskraft des Unternehmens.",
    descriptionSpanish:
      "Colaboré en la profesionalización de los canales digitales de Telefónica, liderando la adopción de tecnologías modernas como React y Next.js en el frontend y reforzando nuestro backend con la migración a Google Cloud Platform. Entregué múltiples proyectos de frontend y backend que ayudaron a convertir el canal digital en la principal fuerza de ventas de la compañía.",
    achievements: [
      "Optimization of Front-end applications in React and Next to reach +90% of metrics performance (code chunk, pre-rendering...), SEO & Best practices. Still running in Production",
      "Developed a Full-stack lead generation & call tracking project hosted in Google Cloud Platform with 96% of traceability and <1% error rate. Built an interactive dashboard that provided real-time end-to-end system visibility and enabled business pattern detection.",
      "Developed a complete frontend e-commerce in Angular with the integration of the new in-house catalogue of products. Reached sales record ",
    ],
    achievementsGerman: [
      "Optimierung von Frontend-Anwendungen in React und Next.js auf +90% Performance-Metriken (Code-Chunking, Pre-Rendering...), SEO & Best Practices. Läuft noch in Produktion.",
      "Entwicklung eines Full-Stack-Lead-Generation- & Call-Tracking-Projekts auf Google Cloud Platform mit 96% Rückverfolgbarkeit und <1% Fehlerrate. Interaktives Dashboard mit Echtzeit-End-to-End-Systemtransparenz und Erkennung von Geschäfts-Mustern.",
      "Entwicklung eines vollständigen Frontend-E-Commerce in Angular mit Integration des neuen internen Produktkatalogs. Verkaufsrekord erreicht.",
    ],
    achievementsSpanish: [
      "Optimización de aplicaciones frontend en React y Next hasta superar el 90% en las métricas de performance (code chunking, pre-rendering...), SEO y buenas prácticas. Siguen funcionando en producción",
      "Desarrollé un proyecto full-stack de generación de leads y call tracking alojado en Google Cloud Platform, con un 96% de trazabilidad y una tasa de error <1%. Construí un dashboard interactivo que daba visibilidad end-to-end del sistema en tiempo real y permitía detectar patrones de negocio.",
      "Desarrollé un e-commerce frontend completo en Angular integrando el nuevo catálogo de productos interno. Alcanzamos un récord de ventas",
    ],
    relatedProjects: [
      {
        label: "Full Movistar Customer Portal",
        labelGerman: "Vollständiges Movistar-Kundenportal",
        labelSpanish: "Portal de cliente completo de Movistar",
        url: "/customer-portal",
      },
      {
        label: "End to End Call Tracking System",
        labelGerman: "End-to-End-Call-Tracking-System",
        labelSpanish: "Sistema de call tracking end-to-end",
        url: "/call-tracking-system",
      },
    ],
  },
  {
    role: "Junior Web Developer",
    roleGerman: "Junior-Webentwickler",
    roleSpanish: "Desarrollador Web Junior",
    company: "Vicerrectorate of Internationalization - Granada University",
    companyLink: "https://internacional.ugr.es",
    period: "Nov 2017 - Jun 2018",
    description:
      "Responsible for the end‑to‑end development of registration forms and maintenance of the databases that enabled volunteers and scholarship recipients to apply for their placements and request funding. Development in PHP.",
    descriptionGerman:
      "Verantwortlich für die End-to-End-Entwicklung von Anmeldeformularen und die Wartung der Datenbanken, die Freiwilligen und Stipendiaten ermöglichten, sich für ihre Platzierungen zu bewerben und Fördermittel anzufordern. Entwicklung in PHP.",
    descriptionSpanish:
      "Responsable del desarrollo end‑to‑end de los formularios de inscripción y del mantenimiento de las bases de datos que permitían a voluntarios y becarios solicitar sus plazas y pedir financiación. Desarrollo en PHP.",
    achievements: [
      "Built an innovative relational database design that enabled data reuse and ensured consistency for volunteer scholarship applicants. Saved 20 tables aprox.",
      "Design and development of the front-end forms with PHP & JavaScript. 300 students inscribed",
    ],
    achievementsGerman: [
      "Entwicklung eines innovativen relationalen Datenbankdesigns, das Datenwiederverwendung ermöglichte und Konsistenz für Bewerber um Freiwilligenstipendien sicherstellte. Ca. 20 Tabellen eingespart.",
      "Design und Entwicklung der Frontend-Formulare mit PHP & JavaScript. 300 Studenten eingeschrieben.",
    ],
    achievementsSpanish: [
      "Diseñé un modelo de base de datos relacional innovador que permitía reutilizar datos y garantizaba la consistencia de las solicitudes de becas de voluntariado. Ahorro de unas 20 tablas.",
      "Diseño y desarrollo de los formularios frontend con PHP y JavaScript. 300 estudiantes inscritos",
    ],
    relatedProjects: [],
  },
];
