import { personal } from "@/data/aboutMe.personal.data";
import { professional } from "@/data/aboutMe.professional.data";
import { experiences } from "@/data/experiences.data";
import { projects } from "@/data/projects.data";

type Language = "english" | "german";

export type NoteLink = { label: string; url?: string; project?: string };
export type Note = {
  id: string;
  title: string;
  meta: string;
  section?: string;
  paragraphs: string[];
  bullets?: string[];
  links?: NoteLink[];
  image?: string;
};
export type NoteFolder = { id: string; title: string; notes: Note[] };

export const DEFAULT_NOTE_ID = "professional";
export const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@javi-tricker";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Related-project urls in experiences.data.ts are site paths ("/this-portfolio").
const projectSlugFromUrl = (url: string) => {
  const slug = url.replace(/^\/(portfolio\/)?/, "");
  return projects.some((project) => project.slug === slug) ? slug : undefined;
};

const HOBBIES = {
  english: {
    title: "Hobbies",
    meta: "Off the keyboard",
    paragraphs: [
      "Snowboarding is where I recharge. In winter I teach as a snowboard instructor at Flumserberg, sharing tricks, technique and a lot of good days on the mountain.",
      "Strength training keeps me healthy, energetic and disciplined — the same consistency I bring to engineering.",
      "I read a lot, and I love telling stories on camera: filming and editing snowboard videos, and recording podcasts.",
    ],
    bullets: ["Snowboarding (instructor at Flumserberg)", "Strength training", "Reading", "Video filmmaking", "Podcasting"],
    channel: "My YouTube channel",
  },
  german: {
    title: "Hobbys",
    meta: "Abseits der Tastatur",
    paragraphs: [
      "Beim Snowboarden tanke ich auf. Im Winter unterrichte ich als Snowboardlehrer am Flumserberg und teile Tricks, Technik und viele gute Tage am Berg.",
      "Krafttraining hält mich gesund, energiegeladen und diszipliniert — dieselbe Konstanz, die ich ins Engineering einbringe.",
      "Ich lese viel und erzähle gerne Geschichten vor der Kamera: Snowboardvideos filmen und schneiden und Podcasts aufnehmen.",
    ],
    bullets: ["Snowboarden (Lehrer am Flumserberg)", "Krafttraining", "Lesen", "Videoproduktion", "Podcasting"],
    channel: "Mein YouTube-Kanal",
  },
} as const;

const FOLDER_TITLES = {
  english: { about: "About me", experience: "Experience", hobbies: "Hobbies", projects: "Projects", professional: "Professional", personal: "Personal" },
  german: { about: "Über mich", experience: "Erfahrung", hobbies: "Hobbys", projects: "Projekte", professional: "Beruflich", personal: "Persönlich" },
} as const;

export const buildNoteFolders = (language: Language): NoteFolder[] => {
  const isGerman = language === "german";
  const titles = FOLDER_TITLES[language];
  const hobbies = HOBBIES[language];

  const skillBullets = (skills: ReadonlyArray<{ title: string; description: string }>) =>
    skills.map((skill) => `${skill.title}: ${skill.description}`);

  return [
    {
      id: "about",
      title: titles.about,
      notes: [
        {
          id: "professional",
          title: titles.professional,
          meta: isGerman ? professional.titleGerman : professional.title,
          paragraphs: isGerman ? professional.paragraphsGerman : professional.paragraphs,
          bullets: skillBullets(isGerman ? professional.skillsGerman : professional.skills),
        },
        {
          id: "personal",
          title: titles.personal,
          meta: isGerman ? personal.titleGerman : personal.title,
          paragraphs: isGerman ? personal.paragraphsGerman : personal.paragraphs,
          bullets: skillBullets(isGerman ? personal.skillsGerman : personal.skills),
          links: [{ label: hobbies.channel, url: YOUTUBE_CHANNEL_URL }],
        },
      ],
    },
    {
      id: "experience",
      title: titles.experience,
      notes: experiences.map((experience) => ({
        id: experienceNoteId(experience),
        title: experience.company,
        meta: experience.period,
        paragraphs: [
          isGerman ? experience.roleGerman : experience.role,
          isGerman ? experience.descriptionGerman : experience.description,
        ],
        bullets: isGerman ? experience.achievementsGerman : experience.achievements,
        links: [
          ...(experience.companyLink
            ? [{ label: experience.company, url: experience.companyLink }]
            : []),
          ...(experience.relatedProjects ?? []).map((related) => {
            const project = projectSlugFromUrl(related.url);
            return {
              label: isGerman ? related.labelGerman : related.label,
              ...(project ? { project } : { url: related.url }),
            };
          }),
        ],
      })),
    },
    {
      id: "hobbies",
      title: titles.hobbies,
      notes: [
        {
          id: "hobbies",
          title: hobbies.title,
          meta: hobbies.meta,
          paragraphs: [...hobbies.paragraphs],
          bullets: [...hobbies.bullets],
          links: [{ label: hobbies.channel, url: YOUTUBE_CHANNEL_URL }],
        },
      ],
    },
    {
      id: "projects",
      title: titles.projects,
      notes: projects.map((project) => ({
        id: `project-${project.slug}`,
        title: isGerman ? project.titleGerman : project.title,
        meta: project.projectType,
        paragraphs: [isGerman ? project.descriptionGerman : project.description],
        links: [{ label: isGerman ? project.titleGerman : project.title, project: project.slug }],
        image: project.images[0],
      })),
    },
  ];
};

export const experienceNoteId = (experience: { company: string; period: string }) =>
  `experience-${slugify(`${experience.company}-${experience.period}`)}`;

export const FIRST_EXPERIENCE_NOTE_ID = experiences[0]
  ? experienceNoteId(experiences[0])
  : DEFAULT_NOTE_ID;

export const findFolderByNoteId = (folders: NoteFolder[], noteId: string) =>
  folders.find((folder) => folder.notes.some((note) => note.id === noteId)) ?? folders[0];
