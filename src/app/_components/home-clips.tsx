"use client";

import { useState } from "react";

import {
  ArchiveClipPreviewDialog,
  type ArchiveClipPreviewItem,
} from "@/app/archives/_components/archive-clip-preview-dialog";
import { useCharacters } from "@/app/characters/_hooks/use-characters";
import { MediaGridSkeleton } from "@/components/media-grid-skeleton";
import type { ClipItem, ClipListFilters } from "@/features/clips/clip";
import { useClips } from "@/app/clips/_hooks/use-clips";

import { ClipCardGrid } from "../clips/_components/clip-card";
import { HomeSectionHeader, HomeSectionMessage } from "./home-section";

const HOME_CLIP_COUNT = 4;

const HOME_CLIP_FILTERS: ClipListFilters = {
  date: null,
  day: null,
  groups: [],
  jobs: [],
  participantIds: [],
  query: "",
  sort: "latest",
  tagIds: [],
};

export function HomeClips() {
  const charactersQuery = useCharacters();
  const clipsQuery = useClips(HOME_CLIP_FILTERS);
  const [previewClip, setPreviewClip] = useState<ClipItem | null>(null);
  const clips = clipsQuery.data?.pages[0]?.items.slice(0, HOME_CLIP_COUNT) ?? [];
  const previewIndex = previewClip
    ? clips.findIndex((clip) => clip.id === previewClip.id)
    : -1;
  const nearbyItems: ArchiveClipPreviewItem[] = clips.map((clip) => ({
    clip,
    id: clip.id,
    note: null,
  }));
  const participantProfileImages = new Map(
    (charactersQuery.data?.characters ?? []).map((character) => [
      character.id,
      {
        rpProfileImageUrl: character.rpProfileImageUrl ?? null,
        streamerProfileImageUrl: character.profileImageUrl,
      },
    ]),
  );

  return (
    <section aria-labelledby="home-clips-heading" className="space-y-4">
      <HomeSectionHeader
        description="봉누도2에서 기록된 최신 순간을 확인해보세요."
        headingId="home-clips-heading"
        href="/clips"
        title="최신 클립"
      />
      {clipsQuery.isPending ? <MediaGridSkeleton count={HOME_CLIP_COUNT} /> : null}
      {clipsQuery.isError ? (
        <HomeSectionMessage isError>클립을 불러오지 못했습니다.</HomeSectionMessage>
      ) : null}
      {!clipsQuery.isPending && !clipsQuery.isError && clips.length > 0 ? (
        <ClipCardGrid
          clips={clips}
          onPreview={setPreviewClip}
          participantProfileImages={participantProfileImages}
        />
      ) : null}
      {!clipsQuery.isPending && !clipsQuery.isError && clips.length === 0 ? (
        <HomeSectionMessage>아직 수집된 클립이 없습니다.</HomeSectionMessage>
      ) : null}
      <ArchiveClipPreviewDialog
        clip={previewClip}
        hasNext={previewIndex >= 0 && previewIndex < clips.length - 1}
        hasPrevious={previewIndex > 0}
        nearbyItems={nearbyItems}
        onClose={() => setPreviewClip(null)}
        onNext={() => {
          if (previewIndex >= 0 && previewIndex < clips.length - 1) {
            setPreviewClip(clips[previewIndex + 1]);
          }
        }}
        onPrevious={() => {
          if (previewIndex > 0) {
            setPreviewClip(clips[previewIndex - 1]);
          }
        }}
        onSelect={(item) => {
          const nextClip = clips.find((clip) => clip.id === item.id);

          if (nextClip) {
            setPreviewClip(nextClip);
          }
        }}
      />
    </section>
  );
}
