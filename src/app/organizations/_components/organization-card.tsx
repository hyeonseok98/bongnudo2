import Link from "next/link";

import {
  getOrganizationTypeLabel,
  type Organization,
} from "@/features/organizations/organization";

import { OrganizationImage } from "./organization-image";

export function OrganizationCard({
  organization,
}: {
  organization: Organization;
}) {
  return (
    <Link
      aria-label={organization.name + " 상세 페이지"}
      className="group block cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      href={`/organizations/${encodeURIComponent(organization.slug)}`}
    >
      <article className="overflow-hidden rounded-xl border border-default bg-surface-raised transition-[border-color,box-shadow] duration-slow group-hover:border-brand/60 group-hover:shadow-lg motion-reduce:transition-none">
        <OrganizationImage
          className="aspect-square w-full"
          sizes="(min-width: 1536px) 18vw, (min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          slug={organization.slug}
        />
        <div className="p-4">
          <p className="text-caption text-tertiary">
            {getOrganizationTypeLabel(organization.type)}
          </p>
          <h3 className="mt-1 truncate text-heading-sm font-semibold text-primary">
            {organization.name}
          </h3>
          <p className="mt-1 text-body-sm text-secondary">
            구성원 {organization.members.length}명
          </p>
        </div>
      </article>
    </Link>
  );
}
