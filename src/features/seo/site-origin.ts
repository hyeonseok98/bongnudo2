import "server-only";

const PRODUCTION_ORIGIN = "https://www.bongnurok.site";

export function getSiteOrigin(): string {
  const configuredSiteUrl = process.env.SITE_URL?.trim();
  const configuredUrl = configuredSiteUrl
    ? new URL(configuredSiteUrl)
    : new URL(PRODUCTION_ORIGIN);

  if (
    configuredUrl.hostname === "localhost" ||
    configuredUrl.hostname === "127.0.0.1" ||
    configuredUrl.hostname === "[::1]"
  ) {
    return PRODUCTION_ORIGIN;
  }

  return configuredUrl.origin;
}
