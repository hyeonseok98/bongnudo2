"use client";

import { useCharacters } from "@/app/characters/_hooks/use-characters";
import { ParticipantFilter } from "@/components/filters/participant-filter";
import type { ArchiveListFilters } from "@/features/archives/archive";

import { useArchiveDirectory } from "../_hooks/use-archive-directory";
import { useArchives } from "../_hooks/use-archives";
import { ArchiveCard } from "./archive-card";

export function ArchivePeopleView() {
  const directory = useArchiveDirectory();
  const charactersQuery = useCharacters();
  const selectedCharacter = charactersQuery.data?.characters.find(
    (character) => character.id === directory.participantId,
  ) ?? null;

  return (
    <section aria-labelledby="archive-people-heading" className="space-y-5">
      <div>
        <h2 className="text-heading font-semibold text-primary" id="archive-people-heading">인물별 탐색</h2>
        <p className="mt-1 text-body-sm text-secondary">인물을 선택하면 전체 클립과 관련된 사용자 제작 아카이브를 함께 볼 수 있습니다.</p>
      </div>

      <ParticipantFilter
        className="w-full sm:max-w-sm"
        onValueChange={(participantIds) => directory.changeParticipant(participantIds[0] ?? null)}
        selectionMode="single"
        value={directory.participantId ? [directory.participantId] : []}
      />

      {charactersQuery.isPending ? <ArchivePeopleMessage>인물 정보를 불러오는 중입니다.</ArchivePeopleMessage> : null}
      {charactersQuery.isError ? <ArchivePeopleMessage>인물 정보를 불러오지 못했습니다.</ArchivePeopleMessage> : null}
      {!charactersQuery.isPending && !charactersQuery.isError && !selectedCharacter ? (
        <ArchivePeopleMessage>인물을 검색해 선택해주세요.</ArchivePeopleMessage>
      ) : null}
      {selectedCharacter ? <SelectedPersonArchives participantId={selectedCharacter.id} /> : null}
    </section>
  );
}

function SelectedPersonArchives({ participantId }: { participantId: string }) {
  const baseFilters: Omit<ArchiveListFilters, "type"> = {
    category: null,
    participantId,
    query: "",
    sort: "updated",
    status: null,
  };
  const systemArchivesQuery = useArchives({ ...baseFilters, type: "system" });
  const userArchivesQuery = useArchives({ ...baseFilters, type: "user" });
  const systemArchive = systemArchivesQuery.data?.pages[0]?.items[0] ?? null;
  const userArchives = userArchivesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const isPending = systemArchivesQuery.isPending || userArchivesQuery.isPending;
  const isError = systemArchivesQuery.isError || userArchivesQuery.isError;

  if (isPending) return <ArchivePeopleMessage>인물별 아카이브를 불러오는 중입니다.</ArchivePeopleMessage>;
  if (isError) return <ArchivePeopleMessage>인물별 아카이브를 불러오지 못했습니다.</ArchivePeopleMessage>;

  return (
    <div className="space-y-8">
      <section aria-labelledby="all-clips-archive-heading" className="space-y-3">
        <div>
          <h3 className="text-body font-semibold text-primary" id="all-clips-archive-heading">전체 클립 아카이브</h3>
          <p className="mt-1 text-body-sm text-secondary">해당 인물의 시즌 클립을 시간순으로 살펴볼 수 있습니다.</p>
        </div>
        {systemArchive ? (
          <div className="max-w-sm"><ArchiveCard archive={systemArchive} /></div>
        ) : <ArchivePeopleMessage>연결된 전체 클립 아카이브가 없습니다.</ArchivePeopleMessage>}
      </section>

      <section aria-labelledby="related-user-archives-heading" className="space-y-3">
        <div>
          <h3 className="text-body font-semibold text-primary" id="related-user-archives-heading">관련 사용자 제작 아카이브</h3>
          <p className="mt-1 text-body-sm text-secondary">이 인물이 포함된 공개 아카이브입니다.</p>
        </div>
        {userArchives.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {userArchives.map((archive) => <ArchiveCard archive={archive} key={archive.id} />)}
          </div>
        ) : <ArchivePeopleMessage>관련 사용자 제작 아카이브가 없습니다.</ArchivePeopleMessage>}
      </section>
    </div>
  );
}

function ArchivePeopleMessage({ children }: { children: string }) {
  return (
    <p className="rounded-xl border border-dashed border-default px-4 py-12 text-center text-body-sm text-secondary">
      {children}
    </p>
  );
}
