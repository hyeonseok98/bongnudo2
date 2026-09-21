const KST_OFFSET_MILLISECONDS = 9 * 60 * 60 * 1_000;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface KstDateRange {
  end: string;
  start: string;
}

export function getCurrentKstDate(now = new Date()): string {
  return getKstDateFromInstant(now);
}

export function getKstDateFromInstant(instant: Date | string): string {
  return new Date(new Date(instant).getTime() + KST_OFFSET_MILLISECONDS)
    .toISOString()
    .slice(0, 10);
}

export function getKstDateRange(date: string): KstDateRange {
  if (!isKstDate(date)) {
    throw new Error("유효한 날짜가 아님.");
  }

  const [year, month, day] = date.split("-").map(Number);
  const startMilliseconds =
    Date.UTC(year, month - 1, day) - KST_OFFSET_MILLISECONDS;

  return {
    start: new Date(startMilliseconds).toISOString(),
    end: new Date(startMilliseconds + 24 * 60 * 60 * 1_000).toISOString(),
  };
}

export function getKstDateRangeBetween(
  dateFrom: string,
  dateTo: string,
): KstDateRange {
  if (!isKstDate(dateFrom) || !isKstDate(dateTo) || dateFrom > dateTo) {
    throw new Error("유효한 날짜 범위가 아님.");
  }

  const start = getKstDateRange(dateFrom).start;
  const end = getKstDateRange(shiftKstDate(dateTo, 1)).start;

  return { start, end };
}

export function isKstDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);

  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function shiftKstDate(date: string, amount: number): string {
  if (!isKstDate(date)) {
    throw new Error("유효한 날짜가 아님.");
  }

  const [year, month, day] = date.split("-").map(Number);
  const shiftedDate = new Date(Date.UTC(year, month - 1, day + amount));

  return shiftedDate.toISOString().slice(0, 10);
}
