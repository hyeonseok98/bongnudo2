const KST_OFFSET_MILLISECONDS = 9 * 60 * 60 * 1000;
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

export const SEASON2_START_DATE = "2026-09-14T18:00:00+09:00";
export const SEASON2_CLOSED_DATES: readonly string[] = [];

export interface Season2OperationalDay {
  day: number;
  end: string;
  label: string;
  start: string;
  startDate: string;
}

// 봉누도2 운영일은 KST 18시에 시작하며, 금요일 시작 운영일은 휴식일입니다.
export function getSeason2OperationalRange(
  day: number,
): Season2OperationalDay | null {
  if (!Number.isInteger(day) || day < 1) return null;

  let currentDate = getKstDateFromInstant(SEASON2_START_DATE);
  let currentDay = 0;

  while (currentDay < day) {
    if (!isSeason2ClosedDate(currentDate)) currentDay += 1;
    if (currentDay < day) currentDate = shiftDate(currentDate, 1);
  }

  const start = toOperationalStart(currentDate);

  return {
    day,
    end: new Date(new Date(start).getTime() + DAY_MILLISECONDS).toISOString(),
    label: `${day}일차`,
    start,
    startDate: currentDate,
  };
}

export function getSeason2DayNumber(
  instant: Date | string,
): number | null {
  const operationalDate = getOperationalDate(instant);
  const seasonStartDate = getKstDateFromInstant(SEASON2_START_DATE);

  if (operationalDate < seasonStartDate || isSeason2ClosedDate(operationalDate)) {
    return null;
  }

  let currentDate = seasonStartDate;
  let day = 0;

  while (currentDate <= operationalDate) {
    if (!isSeason2ClosedDate(currentDate)) day += 1;
    currentDate = shiftDate(currentDate, 1);
  }

  return day;
}

export function getLatestSeason2DayNumber(
  instant: Date | string = new Date(),
): number {
  let timestamp = new Date(instant).getTime();
  const startTimestamp = new Date(SEASON2_START_DATE).getTime();

  while (timestamp >= startTimestamp) {
    const day = getSeason2DayNumber(new Date(timestamp));
    if (day) return day;
    timestamp -= DAY_MILLISECONDS;
  }

  return 1;
}

export function getSeason2OperationalDays(
  instant: Date | string = new Date(),
): Season2OperationalDay[] {
  const lastDay = getLatestSeason2DayNumber(instant);
  return Array.from({ length: lastDay }, (_, index) =>
    getSeason2OperationalRange(index + 1),
  ).filter((day): day is Season2OperationalDay => day !== null);
}

export function isSeason2ClosedDate(date: string): boolean {
  if (SEASON2_CLOSED_DATES.includes(date)) return true;
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 5;
}

function getOperationalDate(instant: Date | string): string {
  const date = new Date(instant);
  return new Date(
    date.getTime() + KST_OFFSET_MILLISECONDS - 18 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10);
}

function getKstDateFromInstant(instant: Date | string): string {
  return new Date(new Date(instant).getTime() + KST_OFFSET_MILLISECONDS)
    .toISOString()
    .slice(0, 10);
}

function toOperationalStart(date: string): string {
  return new Date(`${date}T18:00:00+09:00`).toISOString();
}

function shiftDate(date: string, amount: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + amount))
    .toISOString()
    .slice(0, 10);
}
