import { desc, eq } from "drizzle-orm";
import { Briefcase } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { db } from "@/db";
import { serviceOrder } from "@/db/schema";
import { auth } from "@/lib/auth";

import { ClientServicesList } from "./client-services-list";

export const dynamic = "force-dynamic";

export default async function MyServicesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?callbackUrl=/minha-conta/servicos");
  }

  // Busca todos os pedidos de serviço ONDE o cliente é o usuário logado
  const orders = await db.query.serviceOrder.findMany({
    where: eq(serviceOrder.customerId, session.user.id),
    with: {
      provider: {
        with: {
          user: {
            columns: { name: true, image: true, email: true },
          },
        },
      },
      category: {
        columns: { name: true },
      },
    },
    orderBy: [desc(serviceOrder.createdAt)],
  });

  return (
    <main className="flex min-h-screen flex-col bg-neutral-50">
      <Header />

      <div className="container mx-auto flex-1 px-4 py-12 pt-38">
        <div className="mb-8 flex items-center gap-3 border-b border-neutral-200 pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-clash-display text-3xl font-bold text-neutral-900">
              Meus Serviços
            </h1>
            <p className="text-neutral-500">
              Acompanhe o status das suas contratações e veja os detalhes dos
              profissionais.
            </p>
          </div>
        </div>

        <ClientServicesList data={orders} />
      </div>

      <Footer />
    </main>
  );
}
