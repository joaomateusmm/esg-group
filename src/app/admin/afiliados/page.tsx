import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { affiliate, user } from "@/db/schema";
import { auth } from "@/lib/auth";

import { AffiliatesTable } from "./affiliates-table";

export default async function AdminAffiliatesPage() {
  // 1. Verificação de Auth e Permissão de Admin
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  // 2. Buscar Afiliados no Banco
  // Fazemos um JOIN para pegar os dados do usuário (nome, email, foto)
  const affiliatesList = await db
    .select({
      id: affiliate.id,
      code: affiliate.code,
      balance: affiliate.balance,
      totalEarnings: affiliate.totalEarnings,
      status: affiliate.status,
      createdAt: affiliate.createdAt,
      user: {
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
    .from(affiliate)
    .leftJoin(user, eq(affiliate.userId, user.id))
    .orderBy(desc(affiliate.createdAt));

  return (
    <div className="space-y-8 p-2 pt-6">
      {/* --- HEADER DA PÁGINA --- */}

      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="font-clash-display text-3xl font-medium text-black">
            Meus Afiliados
          </h1>

          <p className="text-sm text-neutral-700">
            Gerencie os afiliados da sua loja.
          </p>
        </div>
      </div>

      <AffiliatesTable data={affiliatesList} />
    </div>
  );
}
