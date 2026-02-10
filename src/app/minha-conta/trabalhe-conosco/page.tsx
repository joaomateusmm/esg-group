import { eq } from "drizzle-orm";
import {
  AlertCircle,
  Briefcase,
  ClipboardCheck,
  Clock,
  UserCheck,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

// Imports dos componentes de Auth
import SignInForm from "@/app/authentication/components/sign-in-form";
import SignUpForm from "@/app/authentication/components/sign-up-form";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/db";
import { serviceCategory, serviceProvider } from "@/db/schema";
import { auth } from "@/lib/auth";

import { ProviderForm } from "./provider-form";
import { RetryButton } from "./retry-button"; // IMPORTAR O NOVO BOTÃO

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

  let existingProvider = null;

  if (session) {
    existingProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.userId, session.user.id),
      with: {
        category: true,
      },
    });

    if (existingProvider?.status === "approved") {
      redirect("/painel-prestador");
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <Header />

      <div className="container mx-auto px-4 py-20 md:py-32">
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
              {existingProvider?.status === "pending" && (
                <Card className="border-yellow-200 bg-yellow-50 shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                    <div className="mb-4 rounded-full bg-yellow-100 p-4 text-yellow-600">
                      <Clock className="h-12 w-12" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-yellow-900">
                      Análise em Andamento
                    </h2>
                    <p className="max-w-md text-yellow-800">
                      Você já enviou uma solicitação para atuar como{" "}
                      <strong>{existingProvider.category.name}</strong>. Nossa
                      equipe está analisando seu perfil.
                    </p>
                    <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto">
                      <Link href="/minha-conta">
                        <Button
                          variant="outline"
                          className="w-full border-yellow-200 bg-white text-yellow-900 hover:bg-yellow-100"
                        >
                          Voltar para Minha Conta
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* SEÇÃO REJEITADA COM BOTÃO DE REFAZER */}
              {existingProvider?.status === "rejected" && (
                <Card className="border-red-200 bg-red-50 shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                    <div className="mb-4 rounded-full bg-red-100 p-4 text-red-600">
                      <AlertCircle className="h-12 w-12" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-red-900">
                      Candidatura Não Aprovada
                    </h2>
                    <p className="mb-6 max-w-md text-red-800">
                      Infelizmente, sua solicitação para atuar como{" "}
                      {existingProvider.category.name} não foi aprovada neste
                      momento.
                    </p>

                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                      <RetryButton /> {/* Botão Novo */}
                      <Link href="/suporte">
                        <Button
                          variant="outline"
                          className="w-full border-red-200 bg-white text-red-700 hover:bg-red-100"
                        >
                          Falar com Suporte
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!existingProvider && (
                <>
                  <ProviderForm categories={categories} />

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
                            1. Cadastro
                          </h4>
                          <p className="text-sm leading-relaxed text-neutral-500">
                            Preencha o formulário acima com seus dados pessoais
                            e profissionais.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-neutral-900">
                            2. Análise
                          </h4>
                          <p className="text-sm leading-relaxed text-neutral-500">
                            Nossa equipe administrativa analisará seu perfil e
                            experiência.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-neutral-900">
                            3. Aprovação
                          </h4>
                          <p className="text-sm leading-relaxed text-neutral-500">
                            Assim que aprovado, você terá acesso ao Painel do
                            Prestador para aceitar serviços.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-2 rounded-md bg-neutral-50 p-3 text-xs text-neutral-500">
                      <Clock className="h-3 w-3" />
                      Tempo médio de análise:{" "}
                      <strong>24 a 48 horas úteis</strong>.
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
