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

function getTimestamp(value: Date | string): number | null {
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);

  return Number.isNaN(timestamp) ? null : timestamp;
}
