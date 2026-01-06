import { desc } from "drizzle-orm";

import { AddGameButton } from "@/app/admin/jogos/add-game-button"; // Vamos criar abaixo
import { GamesTable } from "@/app/admin/jogos/games-table"; // Vamos criar abaixo
import { db } from "@/db";
import { game } from "@/db/schema";

export default async function AdminGamesPage() {
  const games = await db.select().from(game).orderBy(desc(game.createdAt));

  return (
    <div className="flex flex-col space-y-8 p-2 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-clash-display text-3xl font-medium tracking-tight text-white">
            Jogos
          </h2>
          <p className="text-neutral-400">Gerencie os jogos da sua loja.</p>
        </div>
        <AddGameButton />
      </div>

      <div className="rounded-xl">
        <GamesTable data={games} />
      </div>
    </div>
  );
}
