"use client";

import { AppliedFilterSummary, type AppliedFilterItem } from "@/components/filters/applied-filter-summary";
import { FilterBar } from "@/components/filters/filter-bar";
import { Select } from "@/components/ui/select";
import type { ArchiveDirectory } from "../_hooks/use-archive-directory";

export function ArchiveFilters({ directory, participantLabel }: { directory: ArchiveDirectory; participantLabel: string }) {
  const items: AppliedFilterItem[] = [
    ...(directory.participantId ? [{ id: "participant", label: `인물: ${participantLabel}`, onRemove: () => directory.changeParticipant(null) }] : []),
    ...(directory.category ? [{ id: "category", label: { character: "인물", incident: "사건", series: "시리즈", other: "기타" }[directory.category], onRemove: () => directory.changeCategory(null) }] : []),
    ...(directory.status ? [{ id: "status", label: directory.status === "ongoing" ? "진행 중" : "완료", onRemove: () => directory.changeStatus(null) }] : []),
  ];
  return (
    <div className="space-y-3">
      <FilterBar>
        <Select label="아카이브 주제" value={directory.category ?? "all"} onValueChange={(value) => directory.changeCategory(value === "all" ? null : value)} options={[
          { label: "주제 전체", value: "all" }, { label: "인물", value: "character" },
          { label: "사건", value: "incident" }, { label: "시리즈", value: "series" }, { label: "기타", value: "other" },
        ]} />
        <Select label="진행 상태" value={directory.status ?? "all"} onValueChange={(value) => directory.changeStatus(value === "all" ? null : value)} options={[
          { label: "상태 전체", value: "all" }, { label: "진행 중", value: "ongoing" }, { label: "완료", value: "completed" },
        ]} />
        <Select label="아카이브 정렬" value={directory.sort ?? "updated"} onValueChange={directory.changeSort} options={[
          { label: "최근 수정순", value: "updated" }, { label: "최근 공개순", value: "published" }, { label: "추천순", value: "recommended" },
        ]} />
      </FilterBar>
      <AppliedFilterSummary items={items} onClearAll={directory.resetFilters} />
    </div>
  );
}
