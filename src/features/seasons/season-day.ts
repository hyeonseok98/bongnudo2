export interface SeasonDay {
  dayNumber: number;
  endsAt: string;
  id: string;
  seasonId: number;
  sessionDate: string;
  startsAt: string;
}

export function getSeasonDayByDateTime(
  seasonDays: readonly SeasonDay[],
  targetTime: Date | string,
): SeasonDay | null {
  const targetTimestamp = getTimestamp(targetTime);

  if (targetTimestamp === null) return null;

  return (
    seasonDays.find((seasonDay) => {
      const startsAt = getTimestamp(seasonDay.startsAt);
      const endsAt = getTimestamp(seasonDay.endsAt);

      return (
        startsAt !== null &&
        endsAt !== null &&
        startsAt <= targetTimestamp &&
        targetTimestamp < endsAt
      );
    }) ?? null
  );
}

export function getSeasonDayById(
  seasonDays: readonly SeasonDay[],
  seasonDayId: string,
): SeasonDay | null {
  return seasonDays.find((seasonDay) => seasonDay.id === seasonDayId) ?? null;
}

export function getDefaultSeasonDayByDateTime<
  T extends Pick<SeasonDay, "endsAt" | "startsAt">,
>(seasonDays: readonly T[], targetTime: Date | string): T | null {
  const targetTimestamp = getTimestamp(targetTime);

  if (targetTimestamp === null || seasonDays.length === 0) return null;

  const activeSeasonDay = seasonDays.find((seasonDay) => {
    const startsAt = getTimestamp(seasonDay.startsAt);
    const endsAt = getTimestamp(seasonDay.endsAt);

    return (
      startsAt !== null &&
      endsAt !== null &&
      startsAt <= targetTimestamp &&
      targetTimestamp < endsAt
    );
  });

  if (activeSeasonDay) return activeSeasonDay;

  const previousSeasonDays = seasonDays
    .map((seasonDay) => ({ seasonDay, endsAt: getTimestamp(seasonDay.endsAt) }))
    .filter((item): item is { seasonDay: T; endsAt: number } => (
      item.endsAt !== null && item.endsAt <= targetTimestamp
    ))
    .sort((left, right) => right.endsAt - left.endsAt);

  if (previousSeasonDays[0]) return previousSeasonDays[0].seasonDay;

  return seasonDays
    .map((seasonDay) => ({ seasonDay, startsAt: getTimestamp(seasonDay.startsAt) }))
    .filter((item): item is { seasonDay: T; startsAt: number } => item.startsAt !== null)
    .sort((left, right) => left.startsAt - right.startsAt)[0]?.seasonDay ?? null;
}

function getTimestamp(value: Date | string): number | null {
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);

  return Number.isNaN(timestamp) ? null : timestamp;
}
