import "server-only";

import { getCurrentUser, type AuthenticatedUser } from "@/features/auth/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

import { ReportRequestError } from "./report-validation";

export async function requireReportUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new ReportRequestError("로그인이 필요합니다.", 401);
  }

  if (user.status !== "active") {
    throw new ReportRequestError("제보가 제한된 계정입니다.", 403);
  }

  const supabase = getSupabaseAdminClient();
  const restrictionResult = await supabase
    .from("report_user_restrictions")
    .select("can_submit, suspended_until")
    .eq("user_id", user.id)
    .maybeSingle();

  if (restrictionResult.error) {
    throw new ReportRequestError("제보 권한을 확인하지 못했습니다.", 500, {
      cause: restrictionResult.error,
    });
  }

  const restriction = restrictionResult.data;
  const isSuspensionActive =
    restriction?.suspended_until === null ||
    (restriction?.suspended_until !== undefined &&
      new Date(restriction.suspended_until).getTime() > Date.now());

  if (restriction && !restriction.can_submit && isSuspensionActive) {
    throw new ReportRequestError("제보가 제한된 계정입니다.", 403);
  }

  return user;
}
