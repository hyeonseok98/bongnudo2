import type { MetadataRoute } from "next";

import { getSiteOrigin } from "@/features/seo/site-origin";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/login",
        "/reports",
        "/my/",
        "/archives/new",
        "/archives/*/edit",
      ],
    },
    sitemap: `${getSiteOrigin()}/sitemap.xml`,
  };
}
