import type { CharacterListItem } from "@/features/characters/character";

export interface LiveBroadcast {
  liveId: number;
  title: string;
  thumbnailUrl: string;
  concurrentUserCount: number;
  channelId: string;
  channelName: string;
}

export interface LiveBroadcastsResponse {
  broadcasts: LiveBroadcast[];
  refreshedAt: string | null;
}

export type LiveStreamCharacter = CharacterListItem & {
  chzzkChannelId: string;
};

export interface LiveStream {
  broadcast: LiveBroadcast;
  character: LiveStreamCharacter;
}

export const LIVE_SORT_VALUES = ["viewers", "asc", "desc"] as const;

export type LiveSort = (typeof LIVE_SORT_VALUES)[number];

export function isLiveSort(value: string): value is LiveSort {
  return LIVE_SORT_VALUES.some((sort) => sort === value);
}
