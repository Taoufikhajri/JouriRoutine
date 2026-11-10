"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { assertFamilyChild, requireParent } from "@/server/auth/guards";

export async function selectChildAction(childId: string) {
  const { family } = await requireParent();
  await assertFamilyChild(family.id, childId);
  (await cookies()).set("lsa_child", childId, { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" });
  revalidatePath("/parent", "layout");
}
