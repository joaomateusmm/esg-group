import { desc, eq } from "drizzle-orm";
import { AlertCircle, Briefcase, Clock, LayoutDashboard } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/db";
import { serviceProvider, serviceRequest } from "@/db/schema";
import { auth } from "@/lib/auth";

import { RequestCard } from "./request-card";

export const dynamic = "force-dynamic";

export default async function ProviderDashboardPage() {
  // 1. Verifica Sessão
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?callbackUrl=/painel-prestador");
  }

  // 2. Busca o Perfil de Prestador
  const provider = await db.query.serviceProvider.findFirst({
    where: eq(serviceProvider.userId, session.user.id),
    with: {
      category: true,
    },
  });

  // 3. Lógica de Redirecionamento e Bloqueio baseada no Status

  // Caso 1: Não é prestador
  if (!provider) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <Header />
        <div className="container flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <Briefcase className="mb-4 h-16 w-16 text-neutral-300" />
          <h1 className="mb-2 text-2xl font-bold text-neutral-900">
            Torne-se um Parceiro
          </h1>
          <p className="mb-6 max-w-md text-neutral-500">
            Você ainda não tem um perfil profissional cadastrado. Comece agora
            para receber serviços.
          </p>
          <Link href="/minha-conta/trabalhe-conosco">
            <Button className="bg-orange-600 font-bold text-white hover:bg-orange-700">
              Cadastrar Agora
            </Button>
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  // Caso 2: Pendente
  if (provider.status === "pending") {
    return (
      <main className="min-h-screen bg-neutral-50">
        <Header />
        <div className="container flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 rounded-full bg-yellow-100 p-4">
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-neutral-900">
            Análise em Andamento
          </h1>
          <p className="mb-6 max-w-md text-neutral-500">
            Olá, <strong>{session.user.name}</strong>. Sua candidatura para{" "}
            <strong>{provider.category.name}</strong> foi recebida e está sendo
            analisada pela nossa equipe.
          </p>
          <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-neutral-600">
              Tempo médio: 24 a 48 horas.
            </p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // Caso 3: Rejeitado
  if (provider.status === "rejected") {
    return (
      <main className="min-h-screen bg-neutral-50">
        <Header />
        <div className="container flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 rounded-full bg-red-100 p-4">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-neutral-900">
            Candidatura Não Aprovada
          </h1>
          <p className="mb-6 max-w-md text-neutral-500">
            Infelizmente seu perfil não atendeu aos nossos critérios neste
            momento. Entre em contato com o suporte para mais detalhes.
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  // Caso 4: APROVADO (Dashboard Real)
  // Busca pedidos para este prestador
  const requests = await db.query.serviceRequest.findMany({
    where: eq(serviceRequest.providerId, provider.id),
    with: {
      customer: {
        columns: { name: true, image: true, email: true },
      },
    },
    orderBy: [desc(serviceRequest.createdAt)],
  });

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const activeRequests = requests.filter((r) => r.status === "accepted");
  const historyRequests = requests.filter((r) =>
    ["completed", "rejected"].includes(r.status),
  );

  return (
    <main className="min-h-screen bg-neutral-50">
      <Header />

      <div className="border-b border-neutral-200 bg-white">
        <div className="container mx-auto px-4 py-8 pt-38">
          <div className="mb-2 flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6 text-orange-600" />
            <h1 className="font-clash-display text-2xl font-bold text-neutral-900">
              Painel do Prestador
            </h1>
          </div>
          <p className="text-neutral-500">
            Bem-vindo, {session.user.name}. Gerencie seus serviços de{" "}
            {provider.category.name}.
          </p>
        </div>
      </div>

      <div className="container mx-auto space-y-10 px-4 py-8">
        {/* Novos Pedidos */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-900">
            Novas Solicitações
            {pendingRequests.length > 0 && (
              <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs text-white">
                {pendingRequests.length}
              </span>
            )}
          </h2>
          {pendingRequests.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingRequests.map((req) => (
                <RequestCard key={req.id} request={req} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-neutral-300 bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center text-neutral-500">
                <Clock className="mb-2 h-10 w-10 opacity-20" />
                <p>Nenhum pedido novo no momento.</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Em Andamento */}
        {activeRequests.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-bold  text-neutral-900">
              Em Andamento
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeRequests.map((req) => (
                <RequestCard key={req.id} request={req} />
              ))}
            </div>
          </section>
        )}

        {/* Histórico Recente (Últimos 5, por exemplo) */}
        {historyRequests.length > 0 && (
          <section className="opacity-70 transition-opacity hover:opacity-100">
            <h2 className="mb-4 text-lg font-bold text-neutral-900">
              Histórico Recente
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {historyRequests.slice(0, 6).map((req) => (
                <RequestCard key={req.id} request={req} />
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </main>
  );
}
