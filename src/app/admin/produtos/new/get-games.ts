"use server";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { game } from "@/db/schema";

export async function getGames() {
  const data = await db.select().from(game).orderBy(desc(game.createdAt));
  return data.map((g) => ({ id: g.id, name: g.name }));
}
