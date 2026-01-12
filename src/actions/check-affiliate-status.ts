"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function checkAffiliateStatus() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return false;
  }

  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: {
      isAffiliate: true,
    },
  });

  return dbUser?.isAffiliate ?? false;
}
