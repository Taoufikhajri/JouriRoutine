import "server-only";
import { cookies } from "next/headers";
import { resolveParentChild } from "@/server/auth/guards";

export const SELECTED_CHILD_COOKIE = "lsa_child";

/** The child the parent is currently viewing. The cookie is only a hint — ownership is re-checked. */
export async function selectedChild(familyId: string) {
  const hint = (await cookies()).get(SELECTED_CHILD_COOKIE)?.value;
  return resolveParentChild(familyId, hint);
}
