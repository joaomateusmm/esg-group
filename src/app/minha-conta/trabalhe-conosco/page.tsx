import { eq } from "drizzle-orm";
import {
  AlertCircle,
  Briefcase,
  ClipboardCheck,
  Clock,
  Info,
  UserCheck,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";

// Imports dos componentes de Auth
import SignInForm from "@/app/authentication/components/sign-in-form";
import SignUpForm from "@/app/authentication/components/sign-up-form";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/db";
import { serviceCategory, serviceProvider } from "@/db/schema";
import { auth } from "@/lib/auth";

import { ProviderForm } from "./provider-form";
import { RetryButton } from "./retry-button";

export default async function TrabalheConoscoPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const categories = await db.query.serviceCategory.findMany({
    where: eq(serviceCategory.isActive, true),
    columns: {
      id: true,
      name: true,
    },
  });

  // CORREÇÃO DOS ERROS DE TYPE ANY:
  const myApplications = session
    ? await db.query.serviceProvider.findMany({
        where: eq(serviceProvider.userId, session.user.id),
        with: {
          category: true,
        },
      })
    : [];

  // Identifica categorias que ele AINDA PODE se inscrever (pendentes e aprovadas)
  const appliedCategoryIds = myApplications
    .filter((app) => app.status === "approved" || app.status === "pending")
    .map((app) => app.categoryId);

  const categoriesWithStatus = categories.map((cat) => ({
    id: cat.id,
    name: appliedCategoryIds.includes(cat.id)
      ? `${cat.name} (Já cadastrado)`
      : cat.name,
    disabled: appliedCategoryIds.includes(cat.id),
  }));

  // Verifica se existe ao menos uma categoria não bloqueada
  const hasAvailableCategories = categoriesWithStatus.some(
    (cat) => !cat.disabled,
  );

  const hasPending = myApplications.find((app) => app.status === "pending");
  const hasRejected = myApplications.find((app) => app.status === "rejected");
  const hasApproved = myApplications.some((app) => app.status === "approved");

  return (
    <main className="min-h-screen bg-neutral-50">
      <Header />

      <div className="container mx-auto px-4 py-20 md:py-38">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="font-clash-display text-3xl font-bold text-neutral-900 md:text-4xl">
              Seja um Parceiro ESG
            </h1>
            <p className="mt-2 text-neutral-500">
              Junte-se à nossa rede de profissionais e aumente sua renda.
            </p>
          </div>

          {!session ? (
            <Card className="border-neutral-200 bg-white shadow-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-bold text-neutral-900">
                  Identifique-se para continuar
                </CardTitle>
                <p className="text-sm text-neutral-500">
                  Para se candidatar, você precisa ter uma conta na ESG Group.
                </p>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="mb-6 grid w-full grid-cols-2">
                    <TabsTrigger value="login">Já tenho conta</TabsTrigger>
                    <TabsTrigger value="register">Criar conta</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <div className="space-y-4">
                      <SignInForm callbackUrl="/minha-conta/trabalhe-conosco" />
                    </div>
                  </TabsContent>

                  <TabsContent value="register">
                    <div className="space-y-4">
                      <SignUpForm callbackUrl="/minha-conta/trabalhe-conosco" />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Se o cara já tem ALGUMA aprovação, damos um "Atalho" para o Painel para ele saber */}
              {hasApproved && (
                <div className="mb-8 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div>
                    <h3 className="font-bold text-emerald-900">
                      Você já é um parceiro aprovado!
                    </h3>
                    <p className="text-sm text-emerald-700">
                      Caso queira se cadastrar em outro serviço, preencha os
                      dados novamente e aguarde a aprovação.
                    </p>
                  </div>
                  <Link href="/painel-prestador">
                    <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                      Ir para o Painel
                    </Button>
                  </Link>
                </div>
              )}

              {/* AVISOS DE PENDÊNCIA / REJEIÇÃO RECENTES */}
              {hasPending && (
                <Card className="mb-8 border-yellow-200 bg-yellow-50 shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="mb-4 rounded-full bg-yellow-100 p-3 text-yellow-600">
                      <Clock className="h-8 w-8" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-yellow-900">
                      Análise em Andamento
                    </h2>
                    <p className="max-w-md text-sm text-yellow-800">
                      Você enviou uma solicitação para atuar como{" "}
                      <strong>{hasPending.category?.name}</strong>. Nossa equipe
                      está analisando seu perfil.
                    </p>
                  </CardContent>
                </Card>
              )}

              {hasRejected && (
                <Card className="mb-8 border-red-200 bg-red-50 shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600">
                      <AlertCircle className="h-8 w-8" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-red-900">
                      Candidatura Não Aprovada
                    </h2>
                    <p className="mb-4 max-w-md text-sm text-red-800">
                      Sua solicitação para atuar como{" "}
                      <strong>{hasRejected.category?.name}</strong> não foi
                      aprovada neste momento.
                    </p>
                    <div className="flex gap-2">
                      <RetryButton />
                      <Link href="/suporte">
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-100"
                        >
                          Suporte
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* SÓ MOSTRA O FORM SE HOUVER CATEGORIAS DISPONÍVEIS */}
              {hasAvailableCategories ? (
                <>
                  <h2 className="mb-4 text-center text-xl font-bold text-neutral-800">
                    Cadastrar nova especialidade
                  </h2>
                  <ProviderForm categories={categoriesWithStatus} />

                  {/* NOVO: ALERTA SOBRE A COMISSÃO GERAL */}
                  <Alert className="my-8 border-neutral-200 bg-white shadow-sm text-neutral-800">
                    <Info className="h-5 w-5 text-neutral-600" />
                    <AlertTitle className="mb-2 font-bold text-neutral-900">
                      Sobre os valores de comissão:
                    </AlertTitle>
                    <AlertDescription className="text-neutral-700">
                      A ESG Group retém uma taxa fixa de apenas 5% sobre o valor
                      dos serviços fechados pela plataforma. Você fica com os
                      95% restantes e ganha visibilidade para centenas de
                      clientes todos os dias.
                    </AlertDescription>
                  </Alert>

                  <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-6 border-b border-neutral-100 pb-2 text-lg font-bold text-neutral-900">
                      Como funciona o processo?
                    </h3>

                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                          <ClipboardCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-neutral-900">
                            1. Cadastro e Definição de Preço
                          </h4>
                          <p className="text-sm leading-relaxed text-neutral-500">
                            Preencha o formulário com a nova especialidade.
                            Lembre-se que o valor que você definir como
                            &quot;Preço Base&quot; já deve levar em consideração
                            a <strong>taxa de 5% da plataforma</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-neutral-900">
                            2. Análise de Segurança
                          </h4>
                          <p className="text-sm leading-relaxed text-neutral-500">
                            Nossa equipe analisará seu perfil, experiência e a
                            foto do seu documento de identidade para garantir a
                            segurança dos clientes.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-neutral-900">
                            3. Aprovação e Recebimento
                          </h4>
                          <p className="text-sm leading-relaxed text-neutral-500">
                            Assim que aprovado, você estará visível no catálogo.
                            Quando um cliente pagar pelo seu serviço, o
                            pagamento é retido pela Stripe de forma segura e
                            você recebe seus 95% direto na sua conta após a
                            conclusão do trabalho.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center text-neutral-500 shadow-sm">
                  <Briefcase className="mx-auto mb-4 h-12 w-12 text-neutral-300" />
                  <p>
                    Você já se candidatou (ou foi aprovado) para todas as
                    categorias disponíveis no momento.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
