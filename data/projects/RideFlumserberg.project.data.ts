import { Project } from "@/interfaces/project.interface";

export const RIDE_FLUMSERBERG: Project = {
  slug: "ride-flumserberg",
  title: "Ride Flumserberg — My Snowboard School and Booking Platform",
  titleGerman: "Ride Flumserberg — Meine Snowboardschule und Buchungsplattform",
  titleSpanish: "Ride Flumserberg — Mi escuela de snowboard y su plataforma de reservas",
  projectType: "Professional",
  description:
    "My own snowboard school in the Swiss Alps, and the production booking platform I built for it: trilingual booking, Stripe + TWINT payments, admin and instructor panels.",
  descriptionGerman:
    "Meine eigene Snowboardschule in den Schweizer Alpen und die produktive Buchungsplattform, die ich dafür gebaut habe: dreisprachige Buchung, Zahlungen mit Stripe und TWINT, Admin- und Instructor-Panel.",
  descriptionSpanish:
    "Mi propia escuela de snowboard en los Alpes suizos y la plataforma de reservas en producción que he construido para ella: reservas en tres idiomas, pagos con Stripe y TWINT, panel de administración y panel de instructor.",
  images: [
    "/ride-flumserberg-cover.webp",
    "/ride-flumserberg-calendar.webp",
    "/ride-flumserberg-instructor.webp",
    "/ride-flumserberg-admin.webp",
    "/ride-flumserberg-emails.webp",
    "/ride-flumserberg-architecture.webp",
    "/ride-flumserberg-dataflow.webp",
  ],
  tags: [
    "Next.js 15",
    "React 19",
    "TypeScript",
    "Tailwind v4",
    "Prisma",
    "Neon Postgres",
    "Better Auth",
    "Stripe",
    "TWINT",
    "Resend",
    "Google Calendar API",
    "next-intl",
    "Sentry",
    "Vercel",
    "Playwright",
    "Vitest",
    "GitHub Actions",
    "Claude Code",
  ],
  fullDescription: `<strong>Ride Flumserberg</strong> is my own snowboard school in Flumserberg, Switzerland, which I registered as a sole proprietorship. I teach the private lessons myself, in English, German and Spanish, and I built the whole platform behind it: <strong>a real product that takes real bookings and real money</strong>, not a demo.


    <h3 className="text-xl"><strong>Why I built it</strong></h3>
    - Generic booking tools (Bókun, Peek, FareHarbor) work, but they look generic and keep a commission on every booking
    - A small independent school deserves a premium brand and a booking flow without friction in three languages
    - It is also my reference for how I build software in 2026: <strong>AI-first with Claude Code</strong>, strict conventions, a ticket per change and a review loop before every merge


    <h3 className="text-xl"><strong>The product</strong></h3>
    - <strong>Booking flow in five steps</strong> (lesson, date, time and instructor, details, payment) on a single page, mobile-first, so a booking never loses its progress
    - <strong>Smart calendar</strong>: a day shows as available only when an instructor is free; the teaching language is chosen with the instructor, not as a filter that hides supply
    - <strong>Stripe Payment Element</strong> with card, <strong>TWINT</strong>, Apple Pay and Google Pay; the booking is confirmed only by a signed, idempotent webhook inside one Prisma transaction
    - <strong>Admin cockpit</strong> to run the business: prices per lesson with promo prices, season calendar, discount codes for partners, home banners, campaign attribution with QR codes and UTM links, and a bad-weather tool that cancels a day and refunds every booking
    - <strong>Instructor panel</strong> with weekly agenda, availability, public profile and private notes per student
    - <strong>Emails</strong> in the booker's language: confirmation with a calendar invite, reminder the day before, post-lesson email with a Google review link, cancellations with account credit


    <h3 className="text-xl"><strong>Engineering</strong></h3>
    - Next.js 15 App Router with Server Components and Server Actions, TypeScript strict, Tailwind v4
    - Prisma 6 on Neon Postgres with a database branch per environment and automatic migrations from GitHub Actions
    - Better Auth (password, magic link, Google), next-intl with translated URLs per language
    - CI on every PR (lint, types, Vitest, Playwright) and a Playwright smoke test against production after every deploy
    - Sentry and Vercel Speed Insights in production: real-user p75 LCP 1.65 s and CLS 0.003


    <h3 className="text-xl"><strong>What it means to me</strong></h3>
    This project brings together the two things I enjoy most: building software and being on a snowboard. Founding a business in Switzerland meant doing everything myself — brand, marketing, legal setup, prices, the product and the teaching. The platform went live in May 2026, and the first lessons were paid for in the autumn, ahead of the 2026/27 season.`,
  fullDescriptionGerman: `<strong>Ride Flumserberg</strong> ist meine eigene Snowboardschule in Flumserberg in der Schweiz, angemeldet als Einzelfirma. Die Privatstunden gebe ich selbst, auf Englisch, Deutsch und Spanisch, und die gesamte Plattform dahinter habe ich gebaut: <strong>ein echtes Produkt mit echten Buchungen und echtem Umsatz</strong>, keine Demo.


    <h3 className="text-xl"><strong>Warum ich es gebaut habe</strong></h3>
    - Generische Buchungstools (Bókun, Peek, FareHarbor) funktionieren, sehen aber austauschbar aus und behalten bei jeder Buchung eine Provision
    - Eine kleine, unabhängige Schule verdient eine hochwertige Marke und einen reibungslosen Buchungsablauf in drei Sprachen
    - Gleichzeitig ist es meine Referenz dafür, wie ich 2026 Software baue: <strong>AI-first mit Claude Code</strong>, klare Konventionen, ein Ticket pro Änderung und ein Review vor jedem Merge


    <h3 className="text-xl"><strong>Das Produkt</strong></h3>
    - <strong>Buchung in fünf Schritten</strong> (Lektion, Datum, Uhrzeit und Instructor, Angaben, Zahlung) auf einer einzigen Seite, mobile-first, damit eine Buchung nie ihren Fortschritt verliert
    - <strong>Intelligenter Kalender</strong>: Ein Tag erscheint nur dann als verfügbar, wenn ein Instructor frei ist; die Unterrichtssprache wird mit dem Instructor gewählt, nicht als Filter, der Angebot versteckt
    - <strong>Stripe Payment Element</strong> mit Karte, <strong>TWINT</strong>, Apple Pay und Google Pay; bestätigt wird die Buchung nur über einen signierten, idempotenten Webhook in einer einzigen Prisma-Transaktion
    - <strong>Admin-Cockpit</strong> für das Geschäft: Preise pro Lektion mit Aktionspreisen, Saisonkalender, Rabattcodes für Partner, Banner auf der Startseite, Kampagnen-Attribution mit QR-Codes und UTM-Links und ein Schlechtwetter-Tool, das einen Tag absagt und jede Buchung erstattet
    - <strong>Instructor-Panel</strong> mit Wochenagenda, Verfügbarkeiten, öffentlichem Profil und privaten Notizen pro Schüler
    - <strong>E-Mails</strong> in der Sprache der buchenden Person: Bestätigung mit Kalendereinladung, Erinnerung am Vortag, E-Mail nach der Lektion mit Link zur Google-Bewertung, Stornierungen mit Guthaben


    <h3 className="text-xl"><strong>Engineering</strong></h3>
    - Next.js 15 App Router mit Server Components und Server Actions, TypeScript strict, Tailwind v4
    - Prisma 6 auf Neon Postgres mit einem Datenbank-Branch pro Umgebung und automatischen Migrationen über GitHub Actions
    - Better Auth (Passwort, Magic Link, Google), next-intl mit übersetzten URLs pro Sprache
    - CI bei jedem PR (Lint, Typen, Vitest, Playwright) und ein Playwright-Smoke-Test gegen Produktion nach jedem Deploy
    - Sentry und Vercel Speed Insights in Produktion: p75 LCP von 1,65 s und CLS von 0,003 bei echten Nutzern


    <h3 className="text-xl"><strong>Was es mir bedeutet</strong></h3>
    In diesem Projekt kommen die zwei Dinge zusammen, die ich am liebsten mache: Software bauen und auf dem Snowboard stehen. Ein Unternehmen in der Schweiz zu gründen hieß, alles selbst zu machen — Marke, Marketing, rechtliche Anmeldung, Preise, das Produkt und den Unterricht. Die Plattform ging im Mai 2026 live, und die ersten Lektionen wurden im Herbst bezahlt, vor der Saison 2026/27.`,
  fullDescriptionSpanish: `<strong>Ride Flumserberg</strong> es mi propia escuela de snowboard en Flumserberg (Suiza), que registré como empresa individual (Einzelfirma). Las clases particulares las doy yo mismo, en inglés, alemán y español, y he construido toda la plataforma que hay detrás: <strong>un producto real, con reservas reales y dinero real</strong>, no una demo.


    <h3 className="text-xl"><strong>Por qué lo construí</strong></h3>
    - Las herramientas genéricas de reservas (Bókun, Peek, FareHarbor) funcionan, pero todas se parecen y se quedan una comisión de cada reserva
    - Una escuela pequeña e independiente merece una marca cuidada y un proceso de reserva sin fricciones en tres idiomas
    - Además es mi referencia de cómo construyo software en 2026: <strong>AI-first con Claude Code</strong>, convenciones estrictas, un ticket por cambio y una revisión antes de cada merge


    <h3 className="text-xl"><strong>El producto</strong></h3>
    - <strong>Reserva en cinco pasos</strong> (clase, fecha, hora e instructor, datos, pago) en una sola página, mobile-first, para que una reserva nunca pierda su progreso
    - <strong>Calendario inteligente</strong>: un día solo aparece como disponible si hay un instructor libre; el idioma de la clase se elige con el instructor, no como un filtro que esconde oferta
    - <strong>Stripe Payment Element</strong> con tarjeta, <strong>TWINT</strong>, Apple Pay y Google Pay; la reserva solo se confirma con un webhook firmado e idempotente dentro de una única transacción de Prisma
    - <strong>Panel de administración</strong> para llevar el negocio: precios por clase con precios promocionales, calendario de temporada, códigos de descuento para partners, banners en la home, atribución de campañas con códigos QR y enlaces UTM, y una herramienta para días de mal tiempo que cancela un día entero y reembolsa cada reserva
    - <strong>Panel de instructor</strong> con agenda semanal, disponibilidad, perfil público y notas privadas por alumno
    - <strong>Emails</strong> en el idioma de quien reserva: confirmación con invitación de calendario, recordatorio el día antes, email después de la clase con enlace a la reseña de Google y cancelaciones con saldo a favor


    <h3 className="text-xl"><strong>Ingeniería</strong></h3>
    - Next.js 15 App Router con Server Components y Server Actions, TypeScript strict, Tailwind v4
    - Prisma 6 sobre Neon Postgres, con una rama de base de datos por entorno y migraciones automáticas desde GitHub Actions
    - Better Auth (contraseña, magic link, Google) y next-intl con URLs traducidas por idioma
    - CI en cada PR (lint, tipos, Vitest, Playwright) y un smoke test de Playwright contra producción después de cada deploy
    - Sentry y Vercel Speed Insights en producción: p75 LCP de 1,65 s y CLS de 0,003 con usuarios reales


    <h3 className="text-xl"><strong>Lo que significa para mí</strong></h3>
    Este proyecto une las dos cosas que más disfruto: construir software y estar encima de una tabla. Montar un negocio en Suiza ha significado hacerlo todo yo: la marca, el marketing, el alta legal, los precios, el producto y las clases. La plataforma salió a producción en mayo de 2026 y las primeras clases se pagaron en otoño, antes de la temporada 2026/27.`,
  externalUrl: "https://rideflumserberg.ch",
  gitHubUrl: "https://github.com/franciscojgonzalezfernandez-lgtm/snowboard-booking-platform",
  releaseDate: "16-05-2026",
};
