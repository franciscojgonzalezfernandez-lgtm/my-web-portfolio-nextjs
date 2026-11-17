// Javi's photo library, shared by Photos (f-017) and, later, the Instagram-style
// app (f-023). Captions and dates are the owner's to refine; dates only order
// the library and group it by month.
import { projects } from "@/data/projects.data";

export type LibraryPhoto = {
  id: string;
  src: string;
  width: number;
  height: number;
  color: string;
  location: string;
  caption: string;
  date: string;
  album: "me" | "work" | "projects" | "memes";
};

// Pixel sizes of the project covers, keyed by image path (read from the files).
const PROJECT_COVER_SIZES: Record<string, [number, number]> = {
  "/portfolio-cover.webp": [1600, 896],
  "/moby-cover.webp": [2848, 1600],
  "/ecommerce-1.png": [2874, 1520],
  "/next-ecosystem-cover.webp": [2880, 1440],
  "/aem-cover.webp": [2848, 1600],
  "/miMovistar-cover.webp": [1408, 934],
  "/call-tracking-cover.webp": [1472, 704],
  "/editable-cms-cover.webp": [1408, 736],
  "/better-auth-cover.webp": [1733, 908],
};

const PERSONAL_PHOTOS: LibraryPhoto[] = [
  {
    id: "portrait-smiling",
    src: "/smiling.webp",
    width: 2048,
    height: 2048,
    color: "#3a3f47",
    location: "Switzerland",
    caption: "Hi, I'm Javi — full-stack engineer and snowboard instructor.",
    date: "March 3, 2026",
    album: "me",
  },
  {
    id: "portrait-seated",
    src: "/seated.webp",
    width: 2048,
    height: 2048,
    color: "#2f3338",
    location: "Switzerland",
    caption: "Portrait session.",
    date: "March 3, 2026",
    album: "me",
  },
  {
    id: "portrait-manager",
    src: "/manager.webp",
    width: 1248,
    height: 1248,
    color: "#44474d",
    location: "Switzerland",
    caption: "Technical manager mode.",
    date: "February 14, 2026",
    album: "me",
  },
  {
    id: "portrait-developer",
    src: "/developer.webp",
    width: 1122,
    height: 1122,
    color: "#2b2e33",
    location: "Switzerland",
    caption: "Developer mode.",
    date: "February 14, 2026",
    album: "me",
  },
  {
    id: "telefonica-farewell",
    src: "/Despedida.webp",
    width: 2048,
    height: 1152,
    color: "#8b8a86",
    location: "Telefónica",
    caption: "Farewell with the Digital Channels team at Telefónica.",
    date: "December 19, 2025",
    album: "work",
  },
  {
    id: "talento-joven",
    src: "/talento-joven-todos.webp",
    width: 2048,
    height: 1365,
    color: "#1d2a52",
    location: "Telefónica",
    caption: "Talento Joven event at Telefónica.",
    date: "October 9, 2025",
    album: "work",
  },
  {
    id: "power-ia",
    src: "/PowerIA.webp",
    width: 1600,
    height: 1200,
    color: "#8a5a45",
    location: "Telefónica",
    caption: "Panel talk on AI.",
    date: "June 12, 2025",
    album: "work",
  },
  {
    id: "adobe-experience-makers",
    src: "/adobe-seminar.webp",
    width: 1195,
    height: 896,
    color: "#2a2f8a",
    location: "Adobe Experience Makers",
    caption: "Recognised at the Adobe Experience Makers bootcamp.",
    date: "May 22, 2025",
    album: "work",
  },
];

const MEME_PHOTOS: LibraryPhoto[] = [
  {
    id: "meme-iq",
    src: "/os/iq-bell-curve.jpg",
    width: 1024,
    height: 757,
    color: "#d9d4c7",
    location: "Internet",
    caption: "meme.jpg",
    date: "January 10, 2026",
    album: "memes",
  },
  {
    id: "meme-smart-rich",
    src: "/os/so-smart-why-not-rich.jpg",
    width: 896,
    height: 829,
    color: "#efefef",
    location: "Internet",
    caption: "meme 2.jpg",
    date: "January 10, 2026",
    album: "memes",
  },
];

const PROJECT_PHOTOS: LibraryPhoto[] = projects.flatMap((project) => {
  const cover = project.images[0];
  const size = cover ? PROJECT_COVER_SIZES[cover] : undefined;
  if (!cover || !size) return [];
  const [day, month, year] = project.releaseDate.split("-").map(Number);
  const released = new Date(year || 2025, (month || 1) - 1, day || 1);
  return [
    {
      id: `project-${project.slug}`,
      src: cover,
      width: size[0],
      height: size[1],
      color: "#1f2933",
      location: project.title,
      caption: project.description,
      date: released.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      album: "projects" as const,
    },
  ];
});

export const libraryPhotos: LibraryPhoto[] = [...PERSONAL_PHOTOS, ...PROJECT_PHOTOS, ...MEME_PHOTOS];

const photoSources = new Map(libraryPhotos.map((photo) => [photo.id, photo.src]));
export const photoSrc = (id: string) => photoSources.get(id) ?? "";

export const photoIdsInAlbum = (album: LibraryPhoto["album"]) =>
  libraryPhotos.filter((photo) => photo.album === album).map((photo) => photo.id);
