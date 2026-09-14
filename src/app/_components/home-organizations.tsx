"use client";

import { OrganizationCard } from "@/app/organizations/_components/organization-card";
import { useOrganizations } from "@/app/organizations/_hooks/use-organizations";

import {
  HomeDirectoryLink,
  HomeSectionMessage,
} from "./home-section";

const HOME_ORGANIZATION_COUNT = 5;

export function HomeOrganizations() {
  const organizationsQuery = useOrganizations();
  const organizations = (organizationsQuery.data ?? [])
    .filter((organization) => organization.type === "institution")
    .slice(0, HOME_ORGANIZATION_COUNT);

  return (
    <section aria-labelledby="home-organizations-heading" className="space-y-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h2
            className="text-heading-sm font-semibold text-primary"
            id="home-organizations-heading"
          >
            조직 도감
          </h2>
          <p className="mt-1 text-body-sm text-secondary">
            서로 다른 목적, 하나의 도시.
          </p>
        </div>
        <HomeDirectoryLink href="/organizations">전체보기</HomeDirectoryLink>
      </header>

      {organizationsQuery.isPending ? (
        <HomeSectionMessage>조직 정보를 불러오는 중입니다.</HomeSectionMessage>
      ) : organizationsQuery.isError ? (
        <HomeSectionMessage isError>
          조직 정보를 불러오지 못했습니다.
        </HomeSectionMessage>
      ) : organizations.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {organizations.map((organization) => (
            <OrganizationCard
              key={organization.id}
              organization={organization}
            />
          ))}
        </div>
      ) : (
        <HomeSectionMessage>
          등록된 공무직 조직이 없습니다.
        </HomeSectionMessage>
      )}
    </section>
  );
}
