"use client";

import {
  ArrowLeft,
  BriefcaseBusiness,
  Cake,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  History,
  Link2,
  PlayCircle,
  Radio,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  RP_AFFILIATION_BADGE_FALLBACK,
  RP_AFFILIATION_BADGE_STYLES,
} from "@/constants/rp-affiliation-badge-styles";
import {
  getOrderedAffiliations,
  getOrderedStreamerAffiliations,
  type CharacterAffiliation,
  type CharacterListItem,
  type CharacterRoleHistory,
} from "@/features/characters/character";
import { cn } from "@/utils/cn";

import { useCharacters } from "../_hooks/use-characters";
import {
  buildCharacterDirectoryItems,
  getCharacterAffiliationDetailAssets,
  type CharacterAffiliationDetailAssets,
  type CharacterDirectoryItem,
} from "../_utils/character-directory";
import { CharacterAvatar } from "./character-avatar";
import { CharacterModeSwitch } from "./character-mode-switch";

interface CharacterDetailProps {
  kind: "streamer" | "rp";
  identifier: string;
}

interface DetailField {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
}

const FIRST_ENTRY_DATE = "2026.09.14";

export function CharacterDetail({ kind, identifier }: CharacterDetailProps) {
  const charactersQuery = useCharacters();

  if (charactersQuery.isPending) {
    return <DetailMessage>인물 정보를 불러오는 중입니다.</DetailMessage>;
  }

  if (charactersQuery.isError) {
    return (
      <DetailMessage isError>인물 정보를 불러오지 못했습니다.</DetailMessage>
    );
  }

  const characters = charactersQuery.data.characters;
  const character =
    kind === "streamer"
      ? characters.find((item) => item.slug === identifier)
      : characters.find((item) => item.id === identifier && item.rpName);

  if (!character) {
    return (
      <DetailMessage>
        요청한 인물을 찾을 수 없습니다.{" "}
        <Link className="text-brand-text underline" href="/characters">
          인물 도감으로 돌아가기
        </Link>
      </DetailMessage>
    );
  }

  const streamerCharacters = characters.filter(
    (item) => item.streamerId === character.streamerId,
  );
  const rpItems = buildCharacterDirectoryItems(streamerCharacters, "rp");
  const streamerHref = `/characters/streamer/${encodeURIComponent(character.slug)}`;
  const rpHref =
    rpItems.find((item) => item.id === character.id)?.href ??
    rpItems[0]?.href ??
    "/characters?mode=rp";
  const detailAssets = getCharacterAffiliationDetailAssets(character);

  return (
    <div className="space-y-1">
      <DetailBanner assets={detailAssets} />
      <Link
        className="mb-3 flex w-fit cursor-pointer items-center gap-2 text-body-sm font-medium text-secondary transition-colors hover:text-brand-text"
        href="/characters"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        인물 도감으로
      </Link>
      {kind === "streamer" ? (
        <StreamerDetail
          assets={detailAssets}
          character={character}
          rpHref={rpHref}
          rpItems={rpItems}
          streamerHref={streamerHref}
        />
      ) : (
        <RpDetail
          assets={detailAssets}
          character={character}
          rpHref={rpHref}
          streamerHref={streamerHref}
        />
      )}
    </div>
  );
}

function DetailBanner({
  assets,
}: {
  assets: CharacterAffiliationDetailAssets;
}) {
  return (
    <div className="relative h-16 overflow-hidden rounded-xl bg-linear-to-r from-surface-raised via-surface-muted to-surface-inset sm:h-20">
      {assets.bannerDarkUrl ? (
        <Image
          fill
          alt=""
          aria-hidden="true"
          className="pointer-events-none hidden object-cover opacity-80 dark:block"
          sizes="(min-width: 1600px) 1536px, 100vw"
          src={assets.bannerDarkUrl}
        />
      ) : null}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-r from-background/85 via-background/40 to-background/75"
      />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-background/60 to-transparent" />
    </div>
  );
}

function StreamerDetail({
  assets,
  character,
  rpHref,
  rpItems,
  streamerHref,
}: {
  assets: CharacterAffiliationDetailAssets;
  character: CharacterListItem;
  rpHref: string;
  rpItems: CharacterDirectoryItem[];
  streamerHref: string;
}) {
  const affiliation = getOrderedAffiliations(character.affiliations)[0];
  const streamerAffiliations = getOrderedStreamerAffiliations(
    character.streamerAffiliations,
  );
  const affiliationLabel =
    streamerAffiliations.map((item) => item.name).join(" / ") || "-";
  const fields: DetailField[] = [
    { icon: UserRound, label: "스트리머명", value: character.streamerName },
    { icon: UsersRound, label: "모집 구분", value: "최초 입주" },
    { icon: CalendarDays, label: "참여 시즌", value: "봉누도2" },
    {
      icon: BriefcaseBusiness,
      label: "스트리머 소속",
      value: affiliationLabel,
    },
    {
      icon: BriefcaseBusiness,
      label: "RP 소속",
      value: affiliation?.name ?? "-",
    },
    { icon: BriefcaseBusiness, label: "직책", value: affiliation?.role ?? "-" },
  ];

  return (
    <DetailShell
      center={
        <ProfileColumn
          isRpAvailable={rpItems.length > 0}
          mode="streamer"
          name={character.streamerName}
          profileImageUrl={character.profileImageUrl}
          rpHref={rpHref}
          streamerHref={streamerHref}
        />
      }
      left={
        <IdentityPanel
          assets={assets}
          eyebrow="#STREAMER"
          fields={fields}
          name={character.streamerName}
        />
      }
      right={
        <div className="grid content-start gap-4">
          <TimelinePanel />
          <RpCharactersPanel items={rpItems} />
          <StreamerLinksPanel character={character} />
        </div>
      }
    />
  );
}

function RpDetail({
  assets,
  character,
  rpHref,
  streamerHref,
}: {
  assets: CharacterAffiliationDetailAssets;
  character: CharacterListItem;
  rpHref: string;
  streamerHref: string;
}) {
  const affiliation = getOrderedAffiliations(character.affiliations)[0];
  const fields: DetailField[] = [
    { icon: UserRound, label: "RP 이름", value: character.rpName },
    {
      icon: UserRound,
      label: "스트리머명",
      value: (
        <Link
          className="cursor-pointer transition-colors hover:text-brand-text"
          href={streamerHref}
          replace
        >
          {character.streamerName}
        </Link>
      ),
    },
    { icon: UsersRound, label: "RP 소속", value: affiliation?.name ?? "-" },
    { icon: BriefcaseBusiness, label: "직책", value: affiliation?.role ?? "-" },
    { icon: UserRound, label: "나이", value: "-" },
    { icon: Cake, label: "생일", value: "-" },
    { icon: UserRound, label: "성별", value: "-" },
  ];

  return (
    <DetailShell
      center={
        <ProfileColumn
          isRp
          mode="rp"
          name={character.rpName ?? character.streamerName}
          profileImageUrl={null}
          rpHref={rpHref}
          streamerHref={streamerHref}
        />
      }
      left={
        <IdentityPanel
          affiliation={affiliation}
          assets={assets}
          eyebrow="RP 인물"
          fields={fields}
          name={character.rpName ?? "-"}
        />
      }
      right={
        <div className="grid content-start gap-4">
          <TimelinePanel title="주요 사건 타임라인" />
          <RoleHistoryPanel histories={character.roleHistories} />
        </div>
      }
    />
  );
}

function DetailShell({
  center,
  left,
  right,
}: {
  center: ReactNode;
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(16rem,0.75fr)_minmax(20rem,1.05fr)_minmax(20rem,1fr)] xl:items-stretch">
      <div className="order-2 xl:order-none">{left}</div>
      <div className="order-1 xl:order-none">{center}</div>
      <div className="order-3 xl:order-none">{right}</div>
    </div>
  );
}

function IdentityPanel({
  affiliation,
  assets,
  eyebrow,
  fields,
  name,
}: {
  affiliation?: CharacterAffiliation;
  assets: CharacterAffiliationDetailAssets;
  eyebrow: string;
  fields: DetailField[];
  name: string;
}) {
  return (
    <section className="relative isolate flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-default bg-surface-raised/90 p-5 shadow-sm sm:p-6">
      {assets.backgroundDarkUrl ? (
        <Image
          fill
          alt=""
          aria-hidden="true"
          className="pointer-events-none z-base hidden object-cover object-[70%_center] opacity-[0.28] dark:block"
          sizes="320px"
          src={assets.backgroundDarkUrl}
        />
      ) : null}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-base hidden bg-linear-to-br from-background/95 via-background/76 to-background/35 dark:block"
      />
      <div className="relative z-10 border-b border-default pb-5">
        <div className="flex flex-wrap gap-2">
          <Badge className="border border-brand/50 bg-brand/10 text-brand-text">
            {eyebrow}
          </Badge>
          {affiliation ? <AffiliationBadge affiliation={affiliation} /> : null}
        </div>
        <h1 className="mt-4 break-keep text-hero font-bold tracking-tight text-primary">
          {name}
        </h1>
      </div>

      <dl className="relative z-10 mt-3 flex-1 divide-y divide-border-default">
        {fields.map(({ icon: Icon, label, value }) => (
          <div
            className="grid grid-cols-[1.25rem_minmax(5rem,0.75fr)_minmax(0,1fr)] items-center gap-3 py-3"
            key={label}
          >
            <Icon aria-hidden="true" className="size-4 text-brand-text" />
            <dt className="text-body-sm text-primary/75">{label}</dt>
            <dd className="min-w-0 break-words text-body-sm font-semibold text-primary">
              {value ?? "-"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ProfileColumn({
  isRpAvailable = true,
  isRp = false,
  mode,
  name,
  profileImageUrl,
  rpHref,
  streamerHref,
}: {
  isRpAvailable?: boolean;
  isRp?: boolean;
  mode: "streamer" | "rp";
  name: string;
  profileImageUrl: string | null;
  rpHref: string;
  streamerHref: string;
}) {
  return (
    <div className="space-y-3">
      <section className="relative aspect-6/7 w-full overflow-hidden rounded-xl border border-default bg-surface-inset shadow-xl">
        <CharacterAvatar
          className={cn(
            "absolute inset-0 size-full rounded-none text-hero",
            isRp &&
              "bg-linear-to-br from-brand/10 via-surface-muted to-surface-inset",
          )}
          name={name}
          profileImageUrl={profileImageUrl}
          sizes="(min-width: 1280px) 34vw, 100vw"
        />
        {isRp ? (
          <p className="pointer-events-none absolute bottom-5 left-5 rounded-md border border-brand/30 bg-black/55 px-3 py-2 text-caption tracking-widest text-brand-text backdrop-blur-sm">
            RP PROFILE
          </p>
        ) : null}
      </section>
      <CharacterModeSwitch
        isRpAvailable={isRpAvailable}
        mode={mode}
        rpHref={rpHref}
        streamerHref={streamerHref}
        variant="detail"
      />
    </div>
  );
}

function TimelinePanel({ title = "주요 타임라인" }: { title?: string }) {
  return (
    <DetailPanel icon={CalendarDays} title={title}>
      <ol className="relative mt-2 min-h-20 pb-1 before:absolute before:bottom-0 before:left-1.5 before:top-2 before:w-px before:bg-linear-to-b before:from-brand/70 before:via-brand/35 before:to-border-default">
        <li className="relative grid grid-cols-[5.75rem_minmax(0,1fr)] gap-3 pl-5 text-body-sm">
          <span
            aria-hidden="true"
            className="absolute left-0 top-1.5 size-3 rounded-full bg-brand ring-4 ring-surface-raised"
          />
          <time className="text-secondary">{FIRST_ENTRY_DATE}</time>
          <p className="font-medium text-primary">봉누도2 최초 입주</p>
        </li>
      </ol>
    </DetailPanel>
  );
}

function RpCharactersPanel({ items }: { items: CharacterDirectoryItem[] }) {
  return (
    <DetailPanel
      aside={`${items.length}명`}
      icon={UsersRound}
      title="RP 캐릭터"
    >
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => {
            const affiliation = getOrderedAffiliations(item.affiliations)[0];
            const summary = (
              <>
                <CharacterAvatar
                  className="aspect-square w-full rounded-md text-body-sm"
                  name={item.primaryName}
                  profileImageUrl={null}
                  sizes="52px"
                />
                <div className="min-w-0">
                  <p className="truncate text-body-sm font-semibold text-primary">
                    {item.primaryName}
                  </p>
                  <p className="mt-0.5 truncate text-caption text-secondary">
                    {affiliation
                      ? `${affiliation.name}${affiliation.role ? ` · ${affiliation.role}` : ""}`
                      : "소속 정보 없음"}
                  </p>
                </div>
              </>
            );

            return items.length === 1 ? (
              <div
                className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-3 px-1 py-1"
                key={item.id}
              >
                {summary}
              </div>
            ) : (
              <Link
                aria-label={`${item.primaryName} RP 상세 페이지`}
                className="group grid min-h-16 cursor-pointer grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-default bg-background/35 p-2.5 transition-[background-color,border-color,box-shadow] hover:border-brand/45 hover:bg-brand/5 hover:shadow-sm focus-visible:border-focus-ring"
                href={item.href}
                key={item.id}
                replace
              >
                {summary}
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 text-tertiary group-hover:text-brand-text"
                />
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-body-sm text-tertiary">연결된 RP가 없습니다.</p>
      )}
    </DetailPanel>
  );
}

function StreamerLinksPanel({ character }: { character: CharacterListItem }) {
  if (!character.channelUrl) {
    return (
      <DetailPanel icon={Link2} title="관련 링크">
        <p className="text-body-sm text-tertiary">등록된 링크가 없습니다.</p>
      </DetailPanel>
    );
  }

  const replayUrl = `${character.channelUrl}/videos?videoType=&sortType=LATEST&page=1`;

  return (
    <DetailPanel icon={Link2} title="관련 링크">
      <div className="space-y-2">
        <ExternalLinkCard
          href={character.channelUrl}
          icon={Radio}
          label="치지직 채널"
        />
        <ExternalLinkCard href={replayUrl} icon={PlayCircle} label="다시보기" />
      </div>
    </DetailPanel>
  );
}

function RoleHistoryPanel({
  histories,
}: {
  histories: CharacterRoleHistory[];
}) {
  const orderedHistories = [...histories].sort(compareRoleHistories);

  return (
    <DetailPanel icon={History} title="직책 이력">
      {orderedHistories.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-default">
          <div className="grid grid-cols-[minmax(6.5rem,1fr)_minmax(5rem,1fr)_minmax(5rem,1fr)] bg-surface-muted px-3 py-2 text-caption text-secondary">
            <span>기간</span>
            <span>소속</span>
            <span>직책</span>
          </div>
          {orderedHistories.map((history) => (
            <div
              className="grid grid-cols-[minmax(6.5rem,1fr)_minmax(5rem,1fr)_minmax(5rem,1fr)] border-t border-default px-3 py-3 text-body-sm text-primary"
              key={history.id}
            >
              <span>{formatHistoryPeriod(history)}</span>
              <span className="truncate">{history.organizationName}</span>
              <span className="truncate">{history.role ?? "-"}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-body-sm text-tertiary">
          등록된 직책 이력이 없습니다.
        </p>
      )}
    </DetailPanel>
  );
}

function DetailPanel({
  aside,
  children,
  icon: Icon,
  title,
}: {
  aside?: string;
  children: ReactNode;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <section className="min-h-0 rounded-xl border border-default bg-surface-raised/75 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3 border-b border-default pb-3">
        <Icon aria-hidden="true" className="size-5 text-brand-text" />
        <h2 className="text-heading-sm font-semibold text-primary">{title}</h2>
        {aside ? (
          <span className="ml-auto text-caption font-medium text-secondary">
            {aside}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ExternalLinkCard({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <a
      className="group flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-default bg-background/35 px-4 transition-[background-color,border-color,box-shadow] duration-default hover:border-brand/50 hover:bg-brand/5 hover:shadow-sm focus-visible:border-focus-ring"
      href={href}
      rel="noreferrer noopener"
      target="_blank"
    >
      <Icon aria-hidden="true" className="size-4 text-brand-text" />
      <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-primary">
        {label}
      </span>
      <ExternalLink
        aria-hidden="true"
        className="size-4 text-tertiary transition-colors group-hover:text-brand-text"
      />
    </a>
  );
}

function AffiliationBadge({
  affiliation,
}: {
  affiliation: CharacterAffiliation;
}) {
  return (
    <Badge
      className={
        RP_AFFILIATION_BADGE_STYLES[affiliation.slug] ??
        RP_AFFILIATION_BADGE_FALLBACK
      }
    >
      {affiliation.name}
    </Badge>
  );
}

function compareRoleHistories(
  left: CharacterRoleHistory,
  right: CharacterRoleHistory,
) {
  if ((left.endDate === null) !== (right.endDate === null)) {
    return left.endDate === null ? -1 : 1;
  }

  return (right.startDate ?? "").localeCompare(left.startDate ?? "");
}

function formatHistoryPeriod(history: CharacterRoleHistory) {
  const start = formatDate(history.startDate);

  if (!start && !history.endDate) {
    return "-";
  }

  return `${start || "-"}~${formatDate(history.endDate)}`;
}

function formatDate(date: string | null) {
  return date?.replaceAll("-", ".") ?? "";
}

function DetailMessage({
  children,
  isError = false,
}: {
  children: ReactNode;
  isError?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[50vh] items-center justify-center text-body-sm",
        isError ? "text-destructive" : "text-secondary",
      )}
      role={isError ? "alert" : "status"}
    >
      <p>{children}</p>
    </div>
  );
}
