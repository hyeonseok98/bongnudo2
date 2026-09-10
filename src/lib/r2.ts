export function getR2PublicUrl(objectKey: string | null): string | null {
  const normalizedKey = objectKey?.trim().replace(/^\/+/, "");

  if (!normalizedKey) {
    return null;
  }

  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim();

  if (!publicUrl) {
    throw new Error("R2 공개 URL 환경변수가 설정되지 않음.");
  }

  const encodedKey = normalizedKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  try {
    return new URL(encodedKey, publicUrl.replace(/\/+$/, "") + "/").toString();
  } catch {
    throw new Error("R2 공개 URL 환경변수가 올바르지 않음.");
  }
}
