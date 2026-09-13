import { Building2 } from "lucide-react";

import { ThemeImage } from "@/components/ui/theme-image";
import { cn } from "@/utils/cn";

interface OrganizationImageProps {
  className?: string;
  slug: string;
  sizes: string;
}

export function OrganizationImage({
  className,
  slug,
  sizes,
}: OrganizationImageProps) {
  const encodedSlug = encodeURIComponent(slug);

  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden bg-surface-muted text-tertiary",
        className,
      )}
    >
      <ThemeImage
        className="object-cover"
        darkSrc={`/images/affiliations/organizations/${encodedSlug}_dark.webp`}
        fallback={
          <span className="absolute inset-0 grid place-items-center">
            <Building2 aria-hidden="true" className="size-1/4" />
          </span>
        }
        lightSrc={`/images/affiliations/organizations/${encodedSlug}_light.webp`}
        sizes={sizes}
      />
    </div>
  );
}
