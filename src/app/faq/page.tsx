"use client";

import { motion } from "framer-motion";
import { ChevronsRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react"; // 1. IMPORTAR SUSPENSE

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// 2. FORÇAR MODO DINÂMICO
// Isso impede o Next.js de tentar gerar essa página estaticamente no build.
export const dynamic = "force-dynamic";

const faqData = [
  {
    value: "item-1",
    question: "Quem nós somos?",
    answer:
      "Somos um serviço online de revenda de citizens, mods de som, configs e etc para Fivem, com a disponibilidade de vendas de contas Rockstar para os que não tem e para os 'banidinhos', oferecendo o melhor preço e melhor serviço desde 2020.",
  },
  {
    value: "item-2",
    question: "Corre risco de banimentos?",
    answer:
      "Como todos os mods e citizens o usuario dos mesmos se torna sujeito a algum tipo de punição dependendo da cidade, porém nós sempre mantemos nossas citizens, mods e etc o mais atualizados possivel para evitar banimentos ou punições vindas das próprias cidades.",
  },
  {
    value: "item-3",
    question: "Como recebo meu produto?",
    answer:
      "O seu produto é enviado automaticamente pro seu email após a confirmação do pagamento. (Coloque um email valido para recebimento.)",
  },
  {
    value: "item-4",
    question: "E se eu tiver algum problema com a compra ou produto?",
    answer:
      "Você deverá abrir ticket no Discord e informar seu problema para podermos lhe ajudar da melhor forma.",
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-[#010000] text-white">
      {/* 3. ENVOLVER HEADER COM SUSPENSE */}
      <Suspense fallback={<div className="h-20 w-full bg-[#010000]" />}>
        <Header />
      </Suspense>

      <div className="container mx-auto px-4 pt-42 pb-20">
        {/* Cabeçalho da Secção com Delay Aumentado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mb-16 flex max-w-[600px] flex-col items-center text-center"
        >
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
            Perguntas Frequentes
          </h1>
          <p className="mt-6 text-lg text-neutral-400">
            Algumas perguntas básicas sobre a loja e sobre nós.
          </p>
        </motion.div>

        {/* O Accordion com Delay em Cascata */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mx-auto max-w-3xl"
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqData.map((item) => (
              <AccordionItem
                key={item.value}
                value={item.value}
                className="border-white/10 px-2"
              >
                <AccordionTrigger className="py-6 text-left text-lg font-medium hover:text-white/90 hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-base leading-relaxed text-neutral-400">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>

      {/* Footer Section com Delay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="mx-auto flex w-full flex-col items-center justify-center gap-4 pb-12"
      >
        <h1 className="text-3xl font-bold">Tem uma dúvida mais especídifca?</h1>
        <p className="text-sm text-neutral-400">
          Vá no nosso servidor no Discord e abra um Ticket com sua dúvida!
        </p>
        <Link href="https://discord.com/invite/RTahhx6Pvp">
          <button className="group flex cursor-pointer items-center justify-center gap-2 rounded-md border border-neutral-800/30 bg-black/30 px-6 py-[10px] backdrop-blur-md duration-300 hover:scale-[1.03]">
            Servidor Discord{" "}
            <ChevronsRight className="h-5 w-5 duration-500 group-hover:-rotate-90" />
          </button>
        </Link>
      </motion.div>

      {/* 4. ENVOLVER FOOTER COM SUSPENSE */}
      <Suspense fallback={<div className="h-20 w-full bg-[#010000]" />}>
        <Footer />
      </Suspense>
    </main>
  );
}
