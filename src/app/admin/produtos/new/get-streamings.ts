"use server";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { streaming } from "@/db/schema";

export async function getStreamings() {
  const data = await db
    .select()
    .from(streaming)
    .orderBy(desc(streaming.createdAt));
  return data.map((s) => ({ id: s.id, name: s.name }));
}
