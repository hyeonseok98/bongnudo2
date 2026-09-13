import { describe, expect, it } from "vitest";

import type { CharacterListItem } from "@/features/characters/character";
import type { LiveBroadcast } from "@/features/live/live-stream";

import {
  buildLiveStreams,
  filterLiveStreams,
  sortLiveStreams,
} from "./live-directory";

const characters: CharacterListItem[] = [
  createCharacter({
    id: "potato",
    chzzkChannelId: "channel-potato",
    rpName: "정감자",
    streamerName: "강지",
    jobSlug: "police",
  }),
  createCharacter({
    id: "apple",
    chzzkChannelId: "channel-apple",
    rpName: "김사과",
    streamerName: "나나",
    jobSlug: "ems",
  }),
];

const broadcasts: LiveBroadcast[] = [
  createBroadcast("channel-potato", 120),
  createBroadcast("channel-apple", 340),
  createBroadcast("not-participant", 999),
];

describe("live directory", () => {
  it("joins only broadcasts that belong to season participants", () => {
    expect(buildLiveStreams(broadcasts, characters).map(getStreamId)).toEqual([
      "potato",
      "apple",
    ]);
  });

  it("searches RP and streamer names and combines job filters", () => {
    const streams = buildLiveStreams(broadcasts, characters);
    const searchResult = filterLiveStreams(
      streams,
      {
        query: "ㄱㅈ",
        jobSelection: { ids: [] },
        streamerAffiliationSelection: { ids: [] },
      },
      [],
    );
    const filteredResult = filterLiveStreams(
      streams,
      {
        query: "",
        jobSelection: { ids: ["police"] },
        streamerAffiliationSelection: { ids: [] },
      },
      [],
    );

    expect(searchResult.map(getStreamId)).toEqual(["potato"]);
    expect(filteredResult.map(getStreamId)).toEqual(["potato"]);
  });

  it("sorts by viewers or RP name", () => {
    const streams = buildLiveStreams(broadcasts, characters);

    expect(sortLiveStreams(streams, "viewers").map(getStreamId)).toEqual([
      "apple",
      "potato",
    ]);
    expect(sortLiveStreams(streams, "viewers-asc").map(getStreamId)).toEqual([
      "potato",
      "apple",
    ]);
    expect(sortLiveStreams(streams, "desc").map(getStreamId)).toEqual([
      "potato",
      "apple",
    ]);
  });
});

function getStreamId(
  stream: ReturnType<typeof buildLiveStreams>[number],
): string {
  return stream.character.id;
}

function createBroadcast(
  channelId: string,
  concurrentUserCount: number,
): LiveBroadcast {
  return {
    liveId: concurrentUserCount,
    title: "봉누도2",
    thumbnailUrl: "https://example.com/thumbnail.jpg",
    concurrentUserCount,
    channelId,
    channelName: channelId,
  };
}

function createCharacter({
  id,
  chzzkChannelId,
  rpName,
  streamerName,
  jobSlug,
}: {
  id: string;
  chzzkChannelId: string;
  rpName: string;
  streamerName: string;
  jobSlug: string;
}): CharacterListItem {
  return {
    id,
    streamerId: "streamer-" + id,
    chzzkChannelId,
    slug: id,
    streamerName,
    rpName,
    profileImageUrl: null,
    streamerAffiliations: [],
    affiliations: [
      {
        id: "membership-" + id,
        slug: jobSlug,
        name: jobSlug,
        category: "public-service",
        role: null,
        isPrimary: true,
        displayOrder: 0,
        isLeader: false,
      },
    ],
  };
}
