import { eq } from "drizzle-orm";
import { Briefcase, ClipboardCheck, Clock, UserCheck } from "lucide-react";
import { headers } from "next/headers";

import SignInForm from "@/app/authentication/components/sign-in-form";
import SignUpForm from "@/app/authentication/components/sign-up-form";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/db";
import { serviceCategory } from "@/db/schema";
import { auth } from "@/lib/auth";

import { ProviderForm } from "./provider-form";

export default async function TrabalheConoscoPage() {
  // 1. Verificar Autenticação (sem redirect automático)
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 2. Buscar categorias ativas (sempre necessário para o ProviderForm, mas só buscamos se tiver sessão para otimizar, ou buscamos sempre se quiser mostrar algo)
  // Vamos buscar sempre para deixar pronto
  const categories = await db.query.serviceCategory.findMany({
    where: eq(serviceCategory.isActive, true),
    columns: {
      id: true,
      name: true,
    },
  });

  return (
    <main className="min-h-screen bg-neutral-50">
      <Header />

      <div className="container mx-auto px-4 py-20 md:py-38">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="font-clash-display text-3xl font-medium text-neutral-900 md:text-4xl">
              Seja um Parceiro ESG
            </h1>
            <p className="mt-2 text-neutral-500">
              Junte-se à nossa rede de profissionais e aumente sua renda.
            </p>
          </div>

          {session ? (
            // --- USUÁRIO LOGADO: MOSTRA FORMULÁRIO DE CANDIDATURA ---
            <>
              <ProviderForm categories={categories} />

              {/* CARD "COMO FUNCIONA" */}
              <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 border-b border-neutral-100 pb-2 text-lg font-bold text-neutral-900">
                  Como funciona o processo?
                </h3>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                      <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900">
                        1. Cadastro
                      </h4>
                      <p className="text-sm leading-relaxed text-neutral-500">
                        Preencha o formulário acima com seus dados.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900">
                        2. Análise
                      </h4>
                      <p className="text-sm leading-relaxed text-neutral-500">
                        Nossa equipe validará seu perfil e experiência.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900">
                        3. Aprovação
                      </h4>
                      <p className="text-sm leading-relaxed text-neutral-500">
                        Comece a receber pedidos de serviço na sua região.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 rounded-md bg-neutral-50 p-3 text-xs text-neutral-500">
                  <Clock className="h-3 w-3" />
                  Tempo médio de análise: <strong>24 a 48 horas úteis</strong>.
                </div>
              </div>
            </>
          ) : (
            // --- USUÁRIO NÃO LOGADO: MOSTRA LOGIN/CADASTRO ---
            <Card className="border-neutral-200 bg-white shadow-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-bold text-neutral-900">
                  Identifique-se para continuar
                </CardTitle>
                <CardDescription>
                  Para se candidatar, você precisa ter uma conta na ESG Group.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="mx-auto mb-6 grid w-[300px] grid-cols-2">
                    <TabsTrigger
                      className="cursor-pointer duration-200 active:scale-95"
                      value="login"
                    >
                      Já tenho conta
                    </TabsTrigger>
                    <TabsTrigger
                      className="cursor-pointer duration-200 active:scale-95"
                      value="register"
                    >
                      Criar conta
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <div className="space-y-4 px-12">
                      <SignInForm callbackUrl="/minha-conta/trabalhe-conosco" />
                    </div>
                  </TabsContent>

                  <TabsContent value="register">
                    <div className="space-y-4 px-12">
                      <SignUpForm callbackUrl="/minha-conta/trabalhe-conosco" />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
