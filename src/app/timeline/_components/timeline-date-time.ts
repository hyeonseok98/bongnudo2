export function formatTimelineDateTime(occurredAt: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(occurredAt));
}

export function formatTimelineTime(occurredAt: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(occurredAt));
}
