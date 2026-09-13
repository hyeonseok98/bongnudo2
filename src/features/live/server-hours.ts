const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function isBongnudoServerHours(date: Date): boolean {
  const kstDate = new Date(date.getTime() + KST_OFFSET_MS);
  const hour = kstDate.getUTCHours();
  const minute = kstDate.getUTCMinutes();

  return hour >= 17 || hour < 4 || (hour === 4 && minute === 0);
}
