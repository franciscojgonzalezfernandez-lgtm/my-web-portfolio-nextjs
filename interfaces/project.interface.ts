export interface Project {
  slug: string;
  title: string;
  titleGerman: string;
  titleSpanish: string;
  description: string;
  descriptionGerman: string;
  descriptionSpanish: string;
  images: string[];
  tags: string[];
  fullDescription: string;
  fullDescriptionGerman: string;
  fullDescriptionSpanish: string;
  videoUrl?: string;
  externalUrl?: string;
  gitHubUrl?: string;
  projectType: string;
  releaseDate: string;
}
