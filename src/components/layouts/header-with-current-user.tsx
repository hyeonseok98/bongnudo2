import { getCurrentUser } from "@/features/auth/session";

import { Header } from "./header";

export async function HeaderWithCurrentUser() {
  const currentUser = await getCurrentUser();

  return <Header currentUser={currentUser} />;
}
