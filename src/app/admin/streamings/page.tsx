import { desc } from "drizzle-orm";

import { db } from "@/db";
import { streaming } from "@/db/schema";

import { AddStreamingButton } from "./add-streaming-button";
import { StreamingsTable } from "./streamings-table";

export default async function AdminStreamingsPage() {
  const data = await db
    .select()
    .from(streaming)
    .orderBy(desc(streaming.createdAt));

  return (
    <div className="flex flex-col space-y-8 p-2 pt-6">
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="font-clash-display text-3xl font-medium text-white">
            Streamings
          </h1>
          <p className="text-sm text-neutral-400">
            Gerencie seus Streamings da sua loja.
          </p>
        </div>

        <AddStreamingButton />
      </div>
      <div className="rounded-xl">
        <StreamingsTable data={data} />
      </div>
    </div>
  );
}
