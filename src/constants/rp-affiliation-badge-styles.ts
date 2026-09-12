interface RpAffiliationBadgeStyleVariants {
  overlay: string;
  surface: string;
}

export const RP_AFFILIATION_BADGE_STYLES: Record<
  string,
  RpAffiliationBadgeStyleVariants
> = {
  ems: {
    overlay: "bg-job-ems/55 text-job-ems-foreground",
    surface:
      "border border-job-ems/30 bg-job-ems/15 text-primary dark:border-transparent dark:bg-job-ems/55",
  },
  police: {
    overlay: "bg-job-police/75 text-job-police-foreground",
    surface:
      "border border-job-police/30 bg-job-police/15 text-primary dark:border-transparent dark:bg-job-police/75",
  },
  media: {
    overlay: "bg-job-media/40 text-job-media-foreground",
    surface:
      "border border-job-media/30 bg-job-media/15 text-primary dark:border-transparent dark:bg-job-media/40",
  },
  "transport-maintenance": {
    overlay: "bg-job-transport/40 text-job-transport-foreground",
    surface:
      "border border-job-transport/30 bg-job-transport/15 text-primary dark:border-transparent dark:bg-job-transport/40",
  },
  "city-hall": {
    overlay: "bg-job-city-hall/30 text-job-city-hall-foreground",
    surface:
      "border border-job-city-hall/30 bg-job-city-hall/15 text-primary dark:border-transparent dark:bg-job-city-hall/30",
  },
  business: {
    overlay: "bg-job-business/10 text-job-business-foreground",
    surface:
      "border border-default bg-surface-muted text-primary dark:border-transparent dark:bg-job-business/10",
  },
  "illegal-business": {
    overlay:
      "bg-job-illegal-business/10 text-job-illegal-business-foreground",
    surface:
      "border border-default bg-surface-muted text-primary dark:border-transparent dark:bg-job-illegal-business/10",
  },
  gang: {
    overlay: "bg-job-gang/10 text-job-gang-foreground",
    surface:
      "border border-default bg-surface-muted text-primary dark:border-transparent dark:bg-job-gang/10",
  },
  crew: {
    overlay: "bg-job-crew/10 text-job-crew-foreground",
    surface:
      "border border-default bg-surface-muted text-primary dark:border-transparent dark:bg-job-crew/10",
  },
  citizen: {
    overlay: "bg-job-citizen/10 text-job-citizen-foreground",
    surface:
      "border border-default bg-surface-muted text-primary dark:border-transparent dark:bg-job-citizen/10",
  },
};

export const RP_AFFILIATION_BADGE_FALLBACK: RpAffiliationBadgeStyleVariants = {
  overlay: "bg-white/10 text-white/90",
  surface:
    "border border-default bg-surface-muted text-primary dark:border-transparent dark:bg-white/10",
};
