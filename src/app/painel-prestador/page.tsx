/* eslint-disable @typescript-eslint/no-explicit-any */
import { desc, eq, inArray } from "drizzle-orm";
import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  Clock,
  Info,
  LayoutDashboard,
  Percent,
  ShieldCheck,
} from "lucide-react";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/db";
import { serviceOrder, serviceProvider } from "@/db/schema";
import { auth } from "@/lib/auth";

import { RequestCard } from "./request-card";

export const dynamic = "force-dynamic";

export default async function ProviderDashboardPage() {
  // 1. Verifica Sessão
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("https://esggroup.shop/painel-prestador");
  }

  // 2. Busca TODOS os perfis de prestador desse usuário (pode ter vários agora)
  const providers = await db.query.serviceProvider.findMany({
    where: eq(serviceProvider.userId, session.user.id),
    with: {
      category: true,
    },
  });

  // --- ACTION PARA SAIR DE TODOS OS SERVIÇOS (RESETA O PRESTADOR) ---
  const handleLeaveService = async () => {
    "use server";
    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (currentSession?.user) {
      await db
        .delete(serviceProvider)
        .where(eq(serviceProvider.userId, currentSession.user.id));

      revalidatePath("/painel-prestador");
      redirect("/painel-prestador");
    }
  };

  // 3. Lógica de Redirecionamento e Bloqueio baseada no Status

  // Caso 1: Não é prestador
  if (providers.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-neutral-50">
        <Header />
        <main className="mx-auto flex w-full flex-1 flex-col items-center justify-center px-4 pt-40 pb-16 text-center">
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
        </main>
        <Footer />
      </div>
    );
  }

  // Identifica se há ALGO aprovado. Se não houver nada aprovado, mostra tela de pendente ou rejeitado.
  const hasApproved = providers.some((p) => p.status === "approved");
  const firstPending = providers.find((p) => p.status === "pending");
  const firstRejected = providers.find((p) => p.status === "rejected");

  if (!hasApproved) {
    // Caso 2: Se tem algo pendente (e nada aprovado ainda)
    if (firstPending) {
      return (
        <div className="flex min-h-screen flex-col bg-neutral-50">
          <Header />
          <main className="mx-auto flex w-full flex-1 flex-col items-center justify-center px-4 pt-42 pb-15 text-center">
            <div className="mb-4 rounded-full bg-yellow-100 p-4 shadow-md">
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-neutral-900">
              Análise em Andamento
            </h1>
            <p className="mb-6 max-w-md text-neutral-500">
              Olá, <strong>{session.user.name}</strong>. Sua candidatura para{" "}
              <strong>{firstPending.category.name}</strong> foi recebida e está
              sendo analisada pela nossa equipe.
            </p>
            <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-neutral-600">
                Tempo médio: 24 a 48 horas.
              </p>
            </div>
          </main>
          <Footer />
        </div>
      );
    }

    // Caso 3: Rejeitado (e não tem nada pendente nem aprovado)
    if (firstRejected) {
      return (
        <div className="flex min-h-screen flex-col bg-neutral-50">
          <Header />
          <main className="mx-auto flex w-full flex-1 flex-col items-center justify-center px-4 py-20 text-center">
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
            <Link href="/suporte">
              <Button variant="outline">Falar com Suporte</Button>
            </Link>
          </main>
          <Footer />
        </div>
      );
    }
  }

  // Caso 4: APROVADO (Dashboard Real)
  const approvedCategoriesNames = providers
    .filter((p) => p.status === "approved")
    .map((p) => p.category.name)
    .join(", ");

  const providerIds = providers.map((p) => p.id);

  const requests = await db.query.serviceOrder.findMany({
    where: inArray(serviceOrder.providerId, providerIds),
    with: {
      customer: {
        columns: { name: true, image: true, email: true },
      },
      category: {
        columns: { name: true },
      },
    },
    orderBy: [desc(serviceOrder.createdAt)],
  });

  const pendingRequests = requests.filter((r: any) => r.status === "pending");
  const activeRequests = requests.filter(
    (r: any) =>
      r.status === "in_progress" ||
      r.status === "accepted" ||
      r.status === "provider_completed" ||
      r.status === "client_completed",
  );
  const historyRequests = requests.filter((r: any) =>
    ["completed", "canceled"].includes(r.status),
  );

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Header />

      <main className="flex-1">
        <div className="border-b border-neutral-200 bg-white">
          <div className="container mx-auto px-4 py-8 pt-38">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Título e Boas-vindas */}
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <LayoutDashboard className="h-6 w-6 text-orange-600" />
                  <h1 className="font-clash-display text-2xl font-bold text-neutral-900">
                    Painel do Prestador
                  </h1>
                </div>
                <p className="text-neutral-500">
                  Bem-vindo, {session.user.name}. Gerencie seus serviços de{" "}
                  <span className="font-medium text-orange-700">
                    {approvedCategoriesNames}
                  </span>
                  .
                </p>
              </div>

              {/* Ações do Prestador */}
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/minha-conta/trabalhe-conosco">
                  <Button
                    variant="outline"
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    Prestar Novo Serviço
                  </Button>
                </Link>

                <form action={handleLeaveService}>
                  <Button
                    type="submit"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    Sair dos Serviços Atuais
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto space-y-10 px-4 py-8">
          {/* NOVO: ÁREA DE INFORMAÇÕES IMPORTANTES */}
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-bold text-neutral-900">
                Como funciona a ESG Group
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-orange-100 bg-orange-50/50 shadow-sm">
                <CardContent className="flex gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
                    <CheckCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-bold text-orange-900">
                      1. Fluxo de Trabalho
                    </h3>
                    <p className="text-xs leading-relaxed text-orange-700">
                      Você recebe a solicitação e{" "}
                      <strong>avalia os detalhes</strong>. Se aceitar, o cliente
                      será notificado para realizar o pagamento na plataforma.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-neutral-100 bg-white shadow-md">
                <CardContent className="flex gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                    <ShieldCheck className="text-emneutralerald-600 h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-bold text-neutral-900">
                      2. Pagamento Garantido
                    </h3>
                    <p className="text-xs leading-relaxed text-neutral-700">
                      <strong>
                        Só vá até o local após o status mudar para Pago.
                      </strong>{" "}
                      O valor fica retido na Stripe de forma segura até a
                      conclusão do serviço.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-100 bg-blue-50/50 shadow-sm">
                <CardContent className="flex gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Percent className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-bold text-blue-900">
                      3. Sua Comissão
                    </h3>
                    <p className="text-xs leading-relaxed text-blue-700">
                      Transparência total:{" "}
                      <strong>95% do valor cobrado é seu</strong>. Apenas 5% é
                      destinado à manutenção e segurança da plataforma.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

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
                {pendingRequests.map((req: any) => (
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
              <h2 className="mb-4 text-lg font-bold text-neutral-900">
                Em Andamento
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeRequests.map((req: any) => (
                  <RequestCard key={req.id} request={req} />
                ))}
              </div>
            </section>
          )}

          {/* Histórico Recente */}
          {historyRequests.length > 0 && (
            <section className="opacity-70 transition-opacity hover:opacity-100">
              <h2 className="mb-4 text-lg font-bold text-neutral-900">
                Histórico Recente
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {historyRequests.slice(0, 6).map((req: any) => (
                  <RequestCard key={req.id} request={req} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
