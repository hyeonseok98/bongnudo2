"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { CharacterAvatar } from "@/app/characters/_components/character-avatar";
import { ThemeImage } from "@/components/ui/theme-image";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrganizationTypeLabel } from "@/features/organizations/organization";

import { useOrganizations } from "../_hooks/use-organizations";
import { buildOrganizationRoleGroups } from "../_utils/organization-directory";
import styles from "./organization-detail.module.css";

export function OrganizationDetail({ slug }: { slug: string }) {
  const organizationsQuery = useOrganizations();

  if (organizationsQuery.isPending) {
    return <OrganizationDetailSkeleton />;
  }

  if (organizationsQuery.isError) {
    return (
      <OrganizationDetailMessage isError>
        조직 정보를 불러오지 못했습니다.
      </OrganizationDetailMessage>
    );
  }

  const organization = organizationsQuery.data.find(
    (item) => item.slug === slug,
  );

  if (!organization) {
    return (
      <OrganizationDetailMessage>
        요청한 조직을 찾을 수 없습니다.{" "}
        <Link className="text-brand-text underline" href="/organizations">
          조직 도감으로 돌아가기
        </Link>
      </OrganizationDetailMessage>
    );
  }

  const roleGroups = buildOrganizationRoleGroups(organization);

  return (
    <div className="relative">
      <OrganizationDetailHero slug={organization.slug} />
      <header className="relative z-10 flex h-48 flex-col pt-6 sm:h-56 sm:pt-8">
        <Link
          className="flex w-fit cursor-pointer items-center gap-2 rounded-md bg-background/80 px-3 py-2 text-body-sm font-semibold text-primary shadow-sm backdrop-blur-sm transition-colors duration-default hover:text-brand-text dark:rounded-none dark:bg-transparent dark:px-0 dark:py-0 dark:text-white dark:shadow-none dark:backdrop-blur-none"
          href="/organizations"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          조직 도감으로
        </Link>

        <div className="mt-auto pb-6 sm:pb-8">
          <h1 className="text-title font-bold text-primary">
            {organization.name}
          </h1>
          <p className="mt-1 text-body text-secondary">
            {getOrganizationTypeLabel(organization.type)} · 구성원{" "}
            {organization.members.length}명
          </p>
        </div>
      </header>

      <section
        aria-labelledby="organization-chart-heading"
        className="mt-8 pb-8"
      >
        <h2
          className="text-heading-sm font-semibold text-primary"
          id="organization-chart-heading"
        >
          조직도
        </h2>

        {roleGroups.length > 0 ? (
          <div className="mt-8 space-y-10">
            {roleGroups.map((group) => {
              const headingId = "role-group-" + group.id;
              const isHighestRoleGroup = group.members.some(
                (member) => member.isLeader,
              );

              return (
                <section aria-labelledby={headingId} key={group.id}>
                  <div className="mb-4 flex items-center gap-4">
                    <h3
                      className="shrink-0 text-body-lg font-semibold text-primary"
                      id={headingId}
                    >
                      {group.label}
                      {isHighestRoleGroup
                        ? null
                        : ` · ${group.members.length}명`}
                    </h3>
                    <div
                      aria-hidden="true"
                      className="h-px flex-1 bg-border-default/60"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {group.members.map((member) => (
                      <Link
                        aria-label={member.rpName + " RP 상세 페이지"}
                        className="group flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-default bg-surface-raised p-3 transition-[border-color,box-shadow] duration-slow hover:border-brand/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none"
                        href={"/characters/rp/" + member.id}
                        key={member.id}
                      >
                        <CharacterAvatar
                          className="size-12 rounded-lg"
                          name={member.rpName}
                          profileImageUrl={member.profileImageUrl}
                          sizes="48px"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-body font-semibold text-primary">
                            {member.rpName}
                          </span>
                          <span className="mt-0.5 block truncate text-caption text-secondary">
                            {member.role ?? "직책 없음"}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <p className="mt-8 text-body text-secondary">
            등록된 현재 구성원이 없습니다.
          </p>
        )}
      </section>
    </div>
  );
}

function OrganizationDetailSkeleton() {
  return (
    <div aria-label="조직 정보를 불러오는 중입니다." className="space-y-8" role="status">
      <div className="relative h-48 sm:h-56">
        <Skeleton className="absolute inset-x-0 top-0 h-full rounded-none" />
        <div className="absolute inset-x-0 bottom-6 space-y-2 px-4 sm:px-0">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-44" />
        </div>
      </div>
      <section className="space-y-8">
        <Skeleton className="h-7 w-20" />
        {Array.from({ length: 3 }, (_, groupIndex) => (
          <div className="space-y-4" key={groupIndex}>
            <div className="flex items-center gap-4"><Skeleton className="h-7 w-36" /><div aria-hidden="true" className="h-px flex-1 bg-border-default" /></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 6 }, (_, index) => (
                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-default bg-surface-raised p-3" key={index}>
                  <Skeleton className="size-12 shrink-0 rounded-lg" />
                  <div className="min-w-0 space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-16" /></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function OrganizationDetailHero({ slug }: { slug: string }) {
  const encodedSlug = encodeURIComponent(slug);

  return (
    <div
      aria-hidden="true"
      className={`${styles.hero} pointer-events-none absolute top-0 left-1/2 h-48 -translate-x-1/2 overflow-hidden bg-surface-raised sm:h-56`}
    >
      <ThemeImage
        priority
        className="object-cover opacity-80 dark:opacity-85"
        darkSrc={`/images/affiliations/organizations/detail-background/${encodedSlug}_bg_dark.webp`}
        fallback={
          <ThemeImage
            className="object-cover opacity-80 dark:opacity-85"
            darkSrc={`/images/affiliations/organizations/${encodedSlug}_dark.webp`}
            fallback={
              <ThemeImage
                className="object-cover opacity-80 dark:opacity-85"
                darkSrc="/banner/city_dusk_dark.webp"
                lightSrc="/banner/city_dusk_light.webp"
                sizes="(min-width: 1600px) 1536px, 100vw"
              />
            }
            lightSrc={`/images/affiliations/organizations/${encodedSlug}_light.webp`}
            sizes="(min-width: 1600px) 1536px, 100vw"
          />
        }
        lightSrc={`/images/affiliations/organizations/detail-background/${encodedSlug}_bg_light.webp`}
        sizes="(min-width: 1600px) 1536px, 100vw"
      />
      <div className="absolute inset-0 bg-linear-to-b from-background/5 via-background/25 to-background" />
      <div className="absolute inset-0 bg-linear-to-r from-background/45 via-transparent to-background/35" />
    </div>
  );
}

function OrganizationDetailMessage({
  children,
  isError = false,
}: {
  children: ReactNode;
  isError?: boolean;
}) {
  return (
    <p
      className={
        isError
          ? "py-10 text-body text-destructive"
          : "py-10 text-body text-secondary"
      }
      role={isError ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
