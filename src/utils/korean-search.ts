import { getChoseong } from "es-hangul";

const CHOSEONG_PATTERN = /^[ㄱ-ㅎ]+$/;

export function matchesKoreanSearch(label: string, query: string): boolean {
  const normalizedLabel = normalizeSearchText(label);
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  if (normalizedLabel.includes(normalizedQuery)) {
    return true;
  }

  return (
    CHOSEONG_PATTERN.test(normalizedQuery) &&
    getChoseong(normalizedLabel).includes(normalizedQuery)
  );
}

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase("ko-KR");
}
