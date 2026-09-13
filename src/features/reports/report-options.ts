export type UserReportType = "timeline" | "bug" | "idea";

export interface ReportCategoryOption {
  id: string;
  name: string;
  reportType: UserReportType;
  slug: string;
}

export interface ReportTagOption {
  id: string;
  name: string;
  slug: string;
}

export interface ReportOptions {
  categories: ReportCategoryOption[];
  tags: ReportTagOption[];
}
