export interface ChzzkClip {
  clipId: string;
  url: string;
}

const CHZZK_CLIP_HOSTNAME = "chzzk.naver.com";
const CHZZK_CLIP_ID_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

export function parseChzzkClipUrl(value: string): ChzzkClip | null {
  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== CHZZK_CLIP_HOSTNAME ||
    url.port !== "" ||
    url.username !== "" ||
    url.password !== ""
  ) {
    return null;
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);

  if (
    pathSegments.length !== 2 ||
    pathSegments[0] !== "clips" ||
    !CHZZK_CLIP_ID_PATTERN.test(pathSegments[1])
  ) {
    return null;
  }

  const clipId = pathSegments[1];

  return {
    clipId,
    url: `https://${CHZZK_CLIP_HOSTNAME}/clips/${clipId}`,
  };
}
