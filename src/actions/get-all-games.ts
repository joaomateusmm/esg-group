"use server";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { game } from "@/db/schema";

export async function getAllGames() {
  const games = await db.select().from(game).orderBy(desc(game.createdAt));
  // Mapeia para o formato que o Header espera
  return games.map((g) => ({
    label: g.name,
    href: `/jogos/${g.name.toLowerCase().trim().replace(/\s+/g, "-")}`,
  }));
}
