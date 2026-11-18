interface RelatedProject {
  label: string;
  labelGerman: string;
  labelSpanish: string;
  url: string;
}

export interface Experience {
  role: string;
  roleGerman: string;
  roleSpanish: string;
  company: string;
  period: string;
  description: string;
  descriptionGerman: string;
  descriptionSpanish: string;
  achievements: string[];
  achievementsGerman: string[];
  achievementsSpanish: string[];
  companyLink?: string;
  relatedProjects?: RelatedProject[];
}
