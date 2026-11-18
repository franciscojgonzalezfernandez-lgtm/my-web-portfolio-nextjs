import { Project } from "@/interfaces/project.interface";

export const CUSTOMER_PORTAL: Project = {
  slug: "customer-portal",
  title: "Customer Portal for Movistar Clients",
  titleGerman: "Kundenportal für Movistar-Kunden",
  titleSpanish: "Portal de cliente para clientes de Movistar",
  projectType: "Professional",
  description:
    "The management portal for Movistar customers. Responsive and embedded within the MiMovistar application. And much more. See the details!",
  descriptionGerman:
    "Das Verwaltungsportal für Movistar-Kunden. Responsiv und eingebettet in die MiMovistar-Anwendung. Und vieles mehr. Details ansehen!",
  descriptionSpanish:
    "El portal de gestión para clientes de Movistar. Responsive e integrado dentro de la app MiMovistar. Y mucho más. ¡Echa un vistazo a los detalles!",
  images: [
    "/miMovistar-cover.webp",
    "/TCOL-environments.webp",
    "/mis-productos.webp",
    "/factura.webp",
    "/configurador.webp",
  ],
  tags: [
    "React",
    "CI/CD",
    "Redux",
    "UI/UX",
    "Workers",
    "Architecture",
    "Jest",
    "Figma",
    "Storybook",
    "JUnit",
    "XD",
    "Stress testing",
  ],
  fullDescription: `This project represented one of the company's key innovation initiatives: the development of the private area for all TELCO customers following several corporate mergers. The main challenge was to unify customer data coming from multiple legacy systems and databases, which required extensive normalization and integration work.

    We designed a middleware API layer to standardize the information and define a common customer model. I was directly involved in designing and defining the API contract, working iteratively with the backend team to ensure consistency, security, and scalability.

    In parallel, I co-led the development of the company's first React application. We collaborated closely with the UX and UI teams to define the design system from scratch, validating prototypes in Figma and Adobe XD, and conducting accessibility audits through Applause.

    The iterations were particularly challenging due to the gap between UX expectations and backend limitations. My role was to mediate between both teams, finding feasible solutions that maintained product consistency and addressed real customer needs.

    Lastly, we worked together with the infrastructure team to properly size and provision the servers, opting for an on‑premise deployment due to the sensitivity of the data involved. The CI/CD setup was also complex, as it required authentication against on‑premise machines and the use of the company's internal certificates for secure deployment pipelines.
    `,
  fullDescriptionGerman: `Dieses Projekt war eine der zentralen Innovationsinitiativen des Unternehmens: die Entwicklung des privaten Bereichs für alle TELCO-Kunden nach mehreren Unternehmensfusionen. Die Hauptaufgabe bestand darin, Kundendaten aus mehreren Legacy-Systemen und Datenbanken zu vereinheitlichen, was umfangreiche Normalisierungs- und Integrationsarbeiten erforderte.

    Wir entwarfen eine Middleware-API-Schicht zur Standardisierung der Informationen und Definition eines einheitlichen Kundenmodells. Ich war direkt an der Gestaltung und Definition des API-Vertrags beteiligt und arbeitete iterativ mit dem Backend-Team zusammen, um Konsistenz, Sicherheit und Skalierbarkeit zu gewährleisten.

    Parallel leitete ich mit die Entwicklung der ersten React-Anwendung des Unternehmens. Wir arbeiteten eng mit den UX- und UI-Teams zusammen, um das Design-System von Grund auf zu definieren, Prototypen in Figma und Adobe XD zu validieren und Barrierefreiheitsprüfungen durch Applause durchzuführen.

    Die Iterationen waren besonders herausfordernd aufgrund der Lücke zwischen UX-Erwartungen und Backend-Beschränkungen. Meine Rolle bestand darin, zwischen beiden Teams zu vermitteln und machbare Lösungen zu finden, die Produktkonsistenz aufrechterhielten und echte Kundenbedürfnisse adressierten.

    Schließlich arbeiteten wir mit dem Infrastrukturteam zusammen, um die Server angemessen zu dimensionieren und bereitzustellen, und entschieden uns für eine On-Premise-Deployment aufgrund der Sensibilität der involvierten Daten. Der CI/CD-Aufbau war ebenfalls komplex, da er Authentifizierung gegenüber On-Premise-Maschinen und die Verwendung interner Unternehmenszertifikate für sichere Deployment-Pipelines erforderte.
    `,
  fullDescriptionSpanish: `Este proyecto fue una de las iniciativas de innovación clave de la compañía: el desarrollo del área privada para todos los clientes de la TELCO tras varias fusiones corporativas. El principal reto era unificar los datos de cliente procedentes de múltiples sistemas legacy y bases de datos, lo que exigió un trabajo intenso de normalización e integración.

    Diseñamos una capa de API middleware para estandarizar la información y definir un modelo de cliente común. Participé directamente en el diseño y la definición del contrato de la API, trabajando de forma iterativa con el equipo de backend para garantizar la consistencia, la seguridad y la escalabilidad.

    En paralelo, co-lideré el desarrollo de la primera aplicación React de la compañía. Trabajamos codo con codo con los equipos de UX y UI para definir el design system desde cero, validando prototipos en Figma y Adobe XD y realizando auditorías de accesibilidad con Applause.

    Las iteraciones fueron especialmente complicadas por la distancia entre las expectativas de UX y las limitaciones del backend. Mi papel fue mediar entre ambos equipos y encontrar soluciones viables que mantuvieran la coherencia del producto y respondieran a las necesidades reales del cliente.

    Por último, trabajamos con el equipo de infraestructura para dimensionar y aprovisionar correctamente los servidores, optando por un despliegue on-premise dada la sensibilidad de los datos. La configuración de CI/CD también fue compleja, ya que requería autenticarse contra máquinas on-premise y usar los certificados internos de la compañía para que los pipelines de despliegue fueran seguros.
    `,
  videoUrl: "tcol.webm",
  releaseDate: "16-07-2021",
};
