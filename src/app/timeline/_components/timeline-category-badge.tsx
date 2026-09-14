import { Badge } from "@/components/ui/badge";

export function TimelineCategoryBadge({
  categorySlug,
  children,
}: {
  categorySlug: string;
  children: string;
}) {
  const categoryClassNames: Record<string, string> = {
    "incident-accident": "text-status-danger",
    daily: "text-status-info",
    humor: "text-status-warning",
    "romance-relationship": "text-job-ems",
    promotion: "text-brand-text",
    "organization-news": "text-job-police",
    article: "text-status-info",
    crime: "text-status-danger",
    "notice-guide": "text-job-city-hall",
    other: "text-secondary",
  };

  return (
    <Badge
      className={categoryClassNames[categorySlug] ?? "text-secondary"}
      variant="outline"
    >
      {children}
    </Badge>
  );
}
