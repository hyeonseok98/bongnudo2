import type { CharacterFilterCriteria } from "@/app/characters/_utils/character-directory";
import { filterCharacters } from "@/app/characters/_utils/character-directory";
import type {
  CharacterListItem,
  StreamerAffiliation,
} from "@/features/characters/character";
import type {
  LiveBroadcast,
  LiveSort,
  LiveStream,
  LiveStreamCharacter,
} from "@/features/live/live-stream";

export function buildLiveStreams(
  broadcasts: LiveBroadcast[],
  characters: CharacterListItem[],
): LiveStream[] {
  const charactersByChannelId = new Map(
    characters
      .filter(hasChzzkChannelId)
      .map((character) => [character.chzzkChannelId, character]),
  );

  return broadcasts.flatMap((broadcast) => {
    const character = charactersByChannelId.get(broadcast.channelId);

    return character ? [{ broadcast, character }] : [];
  });
}

function hasChzzkChannelId(
  character: CharacterListItem,
): character is LiveStreamCharacter {
  return character.chzzkChannelId !== null;
}

export function filterLiveStreams(
  streams: LiveStream[],
  criteria: CharacterFilterCriteria,
  streamerAffiliations: StreamerAffiliation[],
): LiveStream[] {
  const matchedCharacterIds = new Set(
    filterCharacters(
      streams.map((stream) => stream.character),
      criteria,
      streamerAffiliations,
    ).map((character) => character.id),
  );

  return streams.filter((stream) =>
    matchedCharacterIds.has(stream.character.id),
  );
}

export function sortLiveStreams(
  streams: LiveStream[],
  sort: LiveSort,
): LiveStream[] {
  return [...streams].sort((left, right) => {
    if (sort === "viewers" || sort === "viewers-asc") {
      const viewerCountDifference =
        left.broadcast.concurrentUserCount -
        right.broadcast.concurrentUserCount;
      const direction = sort === "viewers-asc" ? 1 : -1;

      return viewerCountDifference * direction || compareLiveStreamNames(
        left,
        right,
      );
    }

    const direction = sort === "asc" ? 1 : -1;

    return compareLiveStreamNames(left, right) * direction;
  });
}

function compareLiveStreamNames(left: LiveStream, right: LiveStream): number {
  const leftName = left.character.rpName ?? left.character.streamerName;
  const rightName = right.character.rpName ?? right.character.streamerName;

  return leftName.localeCompare(rightName, "ko-KR");
}
