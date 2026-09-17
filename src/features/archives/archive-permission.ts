import type { AuthenticatedUser } from "@/features/auth/session";

interface ArchiveContentPermissionTarget {
  archiveKind: string;
  deletedAt: string | null;
  editPolicy: string;
  ownerId: string | null;
  visibility: string;
}

export function canEditArchiveContent(
  archive: ArchiveContentPermissionTarget,
  viewer: AuthenticatedUser | null,
): boolean {
  if (
    archive.archiveKind !== "user" ||
    archive.deletedAt !== null ||
    viewer?.status !== "active"
  ) {
    return false;
  }

  return archive.ownerId === viewer.id || (
    archive.visibility === "public" && archive.editPolicy === "public_edit"
  );
}
