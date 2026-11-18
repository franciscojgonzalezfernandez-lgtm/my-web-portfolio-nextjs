import { Project } from "@/interfaces/project.interface";

export const FULL_STACK_CALENDAR: Project = {
  slug: "full-stack-calendar",
  title: "Full-Stack Calendar App",
  titleGerman: "Full-Stack-Kalender-App",
  titleSpanish: "App de calendario full stack",
  projectType: "Side Project",
  description:
    "Core full-stack calendar for future online booking systems. React 19 frontend + Node.js/Express backend + MongoDB Atlas.",
  descriptionGerman:
    "Kern-Full-Stack-Kalender für zukünftige Online-Buchungssysteme. React 19 Frontend + Node.js/Express Backend + MongoDB Atlas.",
  descriptionSpanish:
    "Núcleo de calendario full stack para futuros sistemas de reservas online. Frontend en React 19 + backend en Node.js/Express + MongoDB Atlas.",
  images: [
    "/calendar-cover.webp",
    "/calendar-diagram.webp",
    "/calendar-screencapture.webp",
  ],
  tags: [
    "React 19",
    "Vite",
    "Redux Toolkit",
    "Node.js",
    "Express",
    "MongoDB Atlas",
    "Mongoose",
    "Axios",
    "UseForm hook",
    "API REST",
    "JWT Authentication",
    "GitHub Pages",
    "Railway",
    "GitHub Actions",
    "Bootstrap",
  ],
  fullDescription: `Developed a fully functional full-stack calendar app that serves as the <b>core foundation</b> for a future online booking management system. Demonstrates end-to-end development from authentication to database operations.

  <h3 className="text-xl"><strong>Tech Stack & Architecture</strong></h3>
  - <b>Frontend</b>: React 19 + Vite for ultra-fast builds, Redux Toolkit for state management (auth, events, modals), Axios with JWT for API calls, Bootstrap for styling.
  - <b>Backend</b>: Node.js + Express framework handling REST APIs for CRUD operations, error management, and JWT authentication.
  - <b>Database</b>: MongoDB Atlas cluster with Mongoose ODM for schema validation and data mapping.
  - <b>Deployment</b>: GitHub Pages (frontend), Railway (backend), GitHub Actions CI/CD pipeline.

  <h3 className="text-xl"><strong>My Strategic Role</strong></h3>
  - <b>End-to-end ownership</b>: Designed scalable architecture reusable for production booking platforms.
  - <b>Security & UX focus</b>: JWT-based auth, role-based event editing (own events in blue, others in gray), comprehensive form validation.
  - <b>Production-ready deployment</b>: Multi-environment setup with seamless CI/CD integration.
  - <b>Performance optimization</b>: Fast, responsive calendar views (monthly/weekly/daily) with real-time error handling.

  <h3 className="text-xl"><strong>Challenges Solved</strong></h3>
  - Integrated modern React 19 with stable Node.js backend while maintaining JWT security across stack.
  - <b>Balanced schemaless MongoDB</b> with Mongoose validation for reliable data operations.
  - Delivered <b>multi-view calendar</b> with user-specific CRUD permissions in minimal footprint.
  - Achieved smooth deployment across GitHub Pages + Railway with zero-downtime CI/CD.

  <h3 className="text-xl"><strong>Results</strong></h3>
   ✅ Production-ready full-stack calendar with auth, multi-view, CRUD operations
   ✅ Reusable backend core for future booking management systems
   ✅ Secure JWT auth + role-based access (own events editable, others read-only)
   ✅ Fast deployment: GitHub Pages + Railway + GitHub Actions CI/CD
   ✅ Complete source code available on GitHub
`,
  fullDescriptionGerman: `Entwickelte eine vollständig funktionale Full-Stack-Kalender-App als <b>Kernbaustein</b> für ein zukünftiges Online-Buchungssystem. Demonstriert End-to-End-Entwicklung von Authentifizierung bis Datenbankoperationen.

  <h3 className="text-xl"><strong>Tech Stack & Architektur</strong></h3>
  - <b>Frontend</b>: React 19 + Vite für ultraschnelle Builds, Redux Toolkit für State Management (Auth, Events, Modals), Axios mit JWT für API-Calls, Bootstrap für Styling.
  - <b>Backend</b>: Node.js + Express Framework für REST APIs mit CRUD-Operationen, Error-Management und JWT-Authentifizierung.
  - <b>Datenbank</b>: MongoDB Atlas Cluster mit Mongoose ODM für Schema-Validierung und Data-Mapping.
  - <b>Deployment</b>: GitHub Pages (Frontend), Railway (Backend), GitHub Actions CI/CD Pipeline.

  <h3 className="text-xl"><strong>Meine strategische Rolle</strong></h3>
  - <b>End-to-End-Verantwortung</b>: Skalierbare Architektur entworfen, wiederverwendbar für Produktions-Buchungsplattformen.
  - <b>Security & UX-Fokus</b>: JWT-basierte Auth, rollenbasierte Event-Bearbeitung (eigene Events blau, fremde grau), umfassende Formular-Validierung.
  - <b>Production-ready Deployment</b>: Multi-Environment-Setup mit nahtloser CI/CD-Integration.
  - <b>Performance-Optimierung</b>: Schnelle, responsive Kalender-Ansichten (monatlich/wöchentlich/täglich) mit Echtzeit-Error-Handling.

  <h3 className="text-xl"><strong>Gelöste Herausforderungen</strong></h3>
  - Modernes React 19 mit stabilem Node.js Backend integriert, JWT-Sicherheit stack-weit beibehalten.
  - <b>Schemaloses MongoDB</b> mit Mongoose-Validierung für zuverlässige Datenoperationen balanciert.
  - <b>Multi-View-Kalender</b> mit benutzerspezifischen CRUD-Berechtigungen in minimalem Footprint geliefert.
  - Smooth Deployment über GitHub Pages + Railway mit Zero-Downtime CI/CD erreicht.

  <h3 className="text-xl"><strong>Ergebnisse</strong></h3>
   ✅ Production-ready Full-Stack-Kalender mit Auth, Multi-View, CRUD-Operationen
   ✅ Wiederverwendbarer Backend-Kern für zukünftige Buchungsmanagement-Systeme
   ✅ Sichere JWT-Auth + rollenbasierter Zugriff (eigene Events editierbar, fremde read-only)
   ✅ Schnelles Deployment: GitHub Pages + Railway + GitHub Actions CI/CD
   ✅ Kompletter Quellcode auf GitHub verfügbar
`,
  fullDescriptionSpanish: `Desarrollé una app de calendario full stack totalmente funcional que sirve como <b>base principal</b> de un futuro sistema de gestión de reservas online. Demuestra un desarrollo end-to-end, desde la autenticación hasta las operaciones con base de datos.

  <h3 className="text-xl"><strong>Stack tecnológico y arquitectura</strong></h3>
  - <b>Frontend</b>: React 19 + Vite para builds ultrarrápidos, Redux Toolkit para la gestión del estado (auth, eventos, modales), Axios con JWT para las llamadas a la API y Bootstrap para los estilos.
  - <b>Backend</b>: Node.js + Express con APIs REST para operaciones CRUD, gestión de errores y autenticación JWT.
  - <b>Base de datos</b>: cluster de MongoDB Atlas con Mongoose como ODM para la validación de esquemas y el mapeo de datos.
  - <b>Deploy</b>: GitHub Pages (frontend), Railway (backend) y pipeline de CI/CD con GitHub Actions.

  <h3 className="text-xl"><strong>Mi papel estratégico</strong></h3>
  - <b>Ownership end-to-end</b>: diseñé una arquitectura escalable y reutilizable para plataformas de reservas en producción.
  - <b>Foco en seguridad y UX</b>: auth basada en JWT, edición de eventos según rol (los propios en azul, los de otros en gris) y validación completa de formularios.
  - <b>Deploy listo para producción</b>: configuración multientorno con una integración de CI/CD sin fricciones.
  - <b>Optimización del rendimiento</b>: vistas de calendario rápidas y responsive (mensual/semanal/diaria) con gestión de errores en tiempo real.

  <h3 className="text-xl"><strong>Retos resueltos</strong></h3>
  - Integré React 19 con un backend estable en Node.js manteniendo la seguridad JWT en todo el stack.
  - <b>Equilibré la flexibilidad schemaless de MongoDB</b> con la validación de Mongoose para tener operaciones de datos fiables.
  - Entregué un <b>calendario multivista</b> con permisos CRUD por usuario y un footprint mínimo.
  - Conseguí un deploy fluido en GitHub Pages + Railway con CI/CD sin downtime.

  <h3 className="text-xl"><strong>Resultados</strong></h3>
   ✅ Calendario full stack listo para producción con auth, multivista y operaciones CRUD
   ✅ Núcleo de backend reutilizable para futuros sistemas de gestión de reservas
   ✅ Auth JWT segura + acceso basado en roles (eventos propios editables, los de otros en solo lectura)
   ✅ Deploy rápido: GitHub Pages + Railway + CI/CD con GitHub Actions
   ✅ Código fuente completo disponible en GitHub
`,
  videoUrl: "/calendar-demo.webm",
  releaseDate: "19-03-2026",
  externalUrl: "https://franciscojgonzalezfernandez-lgtm.github.io/calendar/",
  gitHubUrl: "https://github.com/franciscojgonzalezfernandez-lgtm/calendar",
};
