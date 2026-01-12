import { eq } from "drizzle-orm";
import { ChevronsRight, MessageCircle } from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SpotlightCard } from "@/components/spotlight-card";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";

import { AffiliateRegisterButton } from "./components/affiliate-register-button";

export default async function AffiliatePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Lógica de Redirecionamento
  if (session?.user?.id) {
    try {
      const dbUser = await db.query.user.findFirst({
        where: eq(user.id, session.user.id),
        columns: { isAffiliate: true },
      });

      console.log("Status Afiliado:", dbUser?.isAffiliate); // Debug

      if (dbUser?.isAffiliate) {
        redirect("/afiliados/painel");
      }
    } catch (error) {
      // Importante: Deixar o erro de redirect passar
      if ((error as Error).message === "NEXT_REDIRECT") throw error;
      console.error(error);
    }
  }

  return (
    // ... O RESTO DO TEU JSX (Fica igual) ...J
    <div className="min-h-screen bg-[#010000] selection:bg-[#D00000] selection:text-white">
      <div className="z-[100] w-full bg-[#010000]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center">
          <Header />
        </div>
      </div>
      {/* ... */}
      <main className="mx-auto max-w-7xl space-y-24 px-4 pt-40 pb-20 md:px-8">
        <div className="relative flex min-h-[500px] w-full items-center justify-end overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A] lg:min-h-[600px]">
          {/* Imagem de Fundo */}
          <div className="absolute inset-0 h-full w-full">
            <Image
              src="/images/banner/banner_afiliados_submind.webp"
              alt="Banner Afiliados"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-l from-[#000000]/80 via-[#000000]/0 to-transparent sm:via-[#000000]/60" />
          </div>

          {/* Conteúdo do Banner */}
          <div className="relative z-10 flex w-full flex-col items-end justify-center px-6 text-right md:w-2/3 md:px-12 lg:w-1/2">
            <h1 className="font-clash-display text-4xl leading-tight font-bold text-white md:text-5xl lg:text-6xl">
              Programa de Afiliados
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-neutral-200">
              Ganhe <span className="font-bold text-[#D00000]">20%</span> de
              todas as vendas realizadas através do seu link exclusivo. Torne-se
              um afiliado hoje mesmo e comece a ganhar!
            </p>

            <div className="mt-8">
              <Link href="#como-funciona">
                <button className="group flex cursor-pointer items-center justify-center gap-2 rounded-md bg-[#D00000] px-4 py-2 text-white duration-300 hover:scale-[1.03] hover:bg-[#ac0000]">
                  Como Funciona?
                  <ChevronsRight className="h-5 w-5 duration-500 group-hover:rotate-90" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* --- 2. COMO FUNCIONA (BENTO GRID) --- */}
        <section id="como-funciona" className="scroll-mt-32">
          <div className="mb-12 text-center">
            <h2 className="font-clash-display text-3xl font-bold text-white md:text-4xl">
              Simples, Transparente e Lucrativo
            </h2>
            <p className="mt-4 text-neutral-400">
              Entenda o passo a passo para começar a faturar com a SubMind.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-6">
            {/* LINHA 1 */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-10">
              {/* Card 1 (30%) -> md:col-span-3 */}
              <div className="h-full md:col-span-3">
                <SpotlightCard
                  className="flex h-full flex-col justify-between border border-white/10 bg-[#0A0A0A] p-8"
                  spotlightColor="rgba(208, 0, 0, 0.2)"
                >
                  {/* --- MOCKUP DO FORMULÁRIO (Visual) --- */}
                  <div className="relative mb-6 flex flex-col items-center justify-center gap-3 p-5">
                    {/* Input Fake: Nome */}
                    <div className="space-y-1.5">
                      <div className="ml-1 text-[10px] font-medium text-white">
                        Nome
                      </div>
                      <div className="h-8 w-45 rounded-md bg-white/10" />
                    </div>

                    {/* Input Fake: Email */}
                    <div className="space-y-1.5">
                      <div className="ml-1 text-[10px] font-medium text-white">
                        E-mail
                      </div>
                      <div className="h-8 w-45 rounded-md bg-white/10" />
                    </div>

                    {/* Botão Fake: Confirmar */}
                    <div className="mt-2 flex h-9 w-25 cursor-pointer items-center justify-center rounded-md bg-[#D00000] text-xs font-bold text-white duration-300 hover:scale-105 active:scale-95">
                      Confirmar
                    </div>
                  </div>

                  {/* --- TEXTO INFERIOR --- */}
                  <div className="mt-auto">
                    <h3 className="mb-2 text-2xl font-bold text-white">
                      Cadastro
                    </h3>
                    <p className="text-sm leading-relaxed text-neutral-400">
                      Preencha o formulário e concorde com os termos. Acesso
                      imediato ao seu painel.
                    </p>
                  </div>
                </SpotlightCard>
              </div>
              {/* Card 2 (70%) -> md:col-span-7 */}
              <div className="h-full md:col-span-7">
                <SpotlightCard
                  className="flex h-full flex-col justify-between border border-white/10 bg-[#0A0A0A] p-8"
                  spotlightColor="rgba(208, 0, 0, 0.2)"
                >
                  {/* --- TEXTO SUPERIOR ESQUERDO --- */}
                  <div>
                    <h3 className="mb-2 text-2xl font-bold text-white">
                      Divulgação e Links
                    </h3>
                    <p className="max-w-lg text-sm leading-relaxed text-neutral-400">
                      Receba seus links únicos e rastreáveis Compartilhe nas
                      redes sociais, streams ou grupos. Nosso sistema identifica
                      cada clique e venda vinda de você automaticamente.
                    </p>
                  </div>

                  {/* --- MOCKUP DA TABELA (INFERIOR DIREITO) --- */}
                  <div className="mt-8 ml-auto w-full max-w-[400px] rounded-2xl border border-white/5 bg-[#111111] p-5 shadow-inner sm:max-w-[450px]">
                    {/* Cabeçalho da Tabela */}
                    <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-2 text-base font-semibold text-white">
                      <div>Produto</div>
                      <div className="pr-4">Link</div>
                    </div>

                    {/* Linhas da Tabela */}
                    <div className="space-y-4">
                      {/* Produto 01 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-16 rounded-md border border-white/10 bg-[#0A0A0A]"></div>
                          <div className="text-sm font-medium text-white">
                            Produto 01
                          </div>
                        </div>
                        <div className="flex h-9 w-24 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs font-medium text-white transition-colors duration-300 hover:bg-white/10 hover:active:scale-95">
                          Copiar Link
                        </div>
                      </div>

                      {/* Produto 02 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-16 rounded-md border border-white/10 bg-[#0A0A0A]"></div>
                          <div className="text-sm font-medium text-white">
                            Produto 02
                          </div>
                        </div>
                        <div className="flex h-9 w-24 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs font-medium text-white transition-colors duration-300 hover:bg-white/10 hover:active:scale-95">
                          Copiar Link
                        </div>
                      </div>

                      {/* Produto 03 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-16 rounded-md border border-white/10 bg-[#0A0A0A]"></div>
                          <div className="text-sm font-medium text-white">
                            Produto 03
                          </div>
                        </div>
                        <div className="flex h-9 w-24 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs font-medium text-white transition-colors duration-300 hover:bg-white/10 hover:active:scale-95">
                          Copiar Link
                        </div>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </div>
            </div>

            {/* LINHA 2 */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Card 3 (50%) */}
              <div className="h-full">
                <SpotlightCard
                  className="flex h-full flex-col justify-between border-white/10 bg-[#0A0A0A] p-8"
                  spotlightColor="rgba(208, 0, 0, 0.2)"
                >
                  {/* --- MOCKUP DA TABELA DE TRANSAÇÕES (SUPERIOR DIREITO) --- */}
                  <div className="mb-8 ml-auto w-full max-w-[320px] rounded-2xl border border-white/5 bg-[#111111] p-5 shadow-inner sm:max-w-[380px]">
                    <h4 className="mb-4 border-b border-white/5 pb-2 text-base font-semibold text-white">
                      Histórico de Transações
                    </h4>

                    <div className="space-y-4">
                      {/* Transação 1 */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">
                            Venda via link de afiliado
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            14/01/26 | 11:53
                          </div>
                        </div>
                        <div className="text-sm font-bold text-green-500">
                          + R$ 10,50
                        </div>
                      </div>

                      {/* Transação 2 */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">
                            Venda via link de afiliado
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            09/01/26 | 21:43
                          </div>
                        </div>
                        <div className="text-sm font-bold text-green-500">
                          + R$ 12,45
                        </div>
                      </div>

                      {/* Transação 3 */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">
                            Venda via link de afiliado
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            05/01/26 | 06:53
                          </div>
                        </div>
                        <div className="text-sm font-bold text-green-500">
                          + R$ 23,14
                        </div>
                      </div>

                      {/* Transação 4 */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">
                            Venda via link de afiliado
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            02/01/26 | 16:20
                          </div>
                        </div>
                        <div className="text-sm font-bold text-green-500">
                          + R$ 14,26
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- TEXTO INFERIOR ESQUERDO --- */}
                  <div className="mt-auto">
                    <h3 className="mb-2 text-xl font-bold text-white">
                      Lucro de 20%
                    </h3>
                    <p className="text-sm leading-relaxed text-neutral-400">
                      Ganhe <strong>20% de comissão</strong> sobre o valor total
                      de QUALQUER produto vendido. Vendeu, a comissão é sua.
                    </p>
                  </div>
                </SpotlightCard>
              </div>

              {/* Card 4 (50%) */}
              <div className="h-full">
                <SpotlightCard
                  className="flex h-full flex-col justify-between border-white/10 bg-[#0A0A0A] p-8"
                  spotlightColor="rgba(208, 0, 0, 0.2)"
                >
                  {/* --- MOCKUP DO CHAT DISCORD (VISUAL) --- */}
                  <div className="mb-6 w-full max-w-[350px] rounded-2xl border border-white/5 bg-[#111111] p-5 shadow-inner">
                    {/* Cabeçalho do Canal */}
                    <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3 opacity-70">
                      <span className="text-lg font-light text-neutral-500">
                        #
                      </span>
                      <span className="text-xs font-bold text-white">
                        ticket-financeiro
                      </span>
                    </div>

                    {/* Mensagens */}
                    <div className="space-y-4">
                      {/* Mensagem do Usuário */}
                      <div className="flex gap-3">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-white/10"></div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-white">
                              Você
                            </span>
                            <span className="text-[10px] text-neutral-500">
                              Hoje às 14:02
                            </span>
                          </div>
                          <div className="flex items-center gap-2 rounded border border-white/5 bg-black/20 p-2">
                            <div className="h-8 w-8 rounded bg-white/10"></div>
                            <span className="text-[10px] text-neutral-400">
                              print_saldo.png
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mensagem do Admin/Bot */}
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5865F2]">
                          <MessageCircle className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              SubMind Financeiro
                            </span>
                            <span className="rounded-[3px] bg-[#5865F2] px-1 py-[1px] text-[8px] font-bold text-white">
                              BOT
                            </span>
                          </div>
                          <p className="text-xs text-neutral-300">
                            Saque aprovado!{" "}
                            <span className="font-medium text-green-500">
                              PIX enviado com sucesso. 💸
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- TEXTO INFERIOR --- */}
                  <div className="mt-auto">
                    <h3 className="mb-2 text-2xl font-bold text-white">
                      Saque via Discord
                    </h3>
                    <p className="text-sm leading-relaxed text-neutral-400">
                      Simples assim: Abra um ticket no nosso{" "}
                      <strong>Discord</strong>, envie o print do saldo e receba
                      o pagamento via PIX.
                    </p>
                  </div>
                </SpotlightCard>
              </div>
            </div>
          </div>
        </section>
        {/* --- 3. CTA FINAL (REGISTRO) --- */}
        <section className="relative overflow-hidden px-6 py-10 text-center md:px-12">
          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center justify-center">
            <h2 className="font-clash-display mb-6 text-4xl font-bold text-white">
              Comece a lucrar agora mesmo
            </h2>
            <p className="mb-8 text-lg text-neutral-300">
              Não perca tempo. Junte-se a centenas de afiliados que já estão
              faturando com a SubMind. Cadastro rápido e aprovação imediata.
            </p>

            <div className="flex w-[210px] justify-center">
              <AffiliateRegisterButton />
            </div>

            <p className="mt-6 text-xs text-neutral-500">
              Junte-se ao time e ganhe 20% de comissão em todas as vendas.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
