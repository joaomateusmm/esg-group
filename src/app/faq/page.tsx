"use client";

import { motion } from "framer-motion";
import { ChevronsRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    value: "item-1",
    question: "Quem é a empresa ESG Group?",
    answer:
      "Somos uma empresa especializada na venda de móveis de alta qualidade e prestação de serviços residenciais no Reino Unido. Nosso foco é oferecer design, conforto e praticidade com o melhor custo-benefício do mercado.",
  },
  {
    value: "item-2",
    question: "Quais regiões vocês atendem?",
    answer:
      "Atualmente realizamos entregas e serviços em toda a região de Londres e arredores. Para outras localidades no Reino Unido, por favor, consulte a disponibilidade inserindo seu código postal no checkout ou entrando em contato com nosso suporte.",
  },
  {
    value: "item-3",
    question: "Como funciona a entrega e montagem?",
    answer:
      "Nossos produtos são entregues com todo cuidado pela nossa equipe logística. Oferecemos também o serviço de montagem profissional, que pode ser contratado à parte ou estar incluso em promoções específicas. Verifique os detalhes na página do produto.",
  },
  {
    value: "item-4",
    question: "Qual o prazo de garantia e devolução?",
    answer:
      "Todos os nossos móveis possuem garantia contra defeitos de fabricação. Caso não fique satisfeito, você tem um prazo para solicitar a devolução, desde que o produto esteja nas condições originais. Consulte nossos Termos de Uso para mais detalhes.",
  },
  {
    value: "item-5",
    question: "Vocês realizam serviços de reforma ou reparos?",
    answer:
      "Sim! Além da venda de móveis, o ESG Group conta com uma equipe qualificada para diversos serviços residenciais. Você pode solicitar um orçamento diretamente pelo nosso site ou através do nosso canal de atendimento.",
  },
];

export default function FaqPage() {
  return (
    // Fundo claro
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <Suspense fallback={<div className="h-20 w-full bg-white" />}>
        <Header />
      </Suspense>

      <div className="container mx-auto px-4 pt-42 pb-20">
        {/* Cabeçalho da Secção */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mb-16 flex max-w-[700px] flex-col items-center text-center"
        >
          <h1 className="font-montserrat text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Perguntas Frequentes
          </h1>
          <p className="mt-6 text-lg text-neutral-500">
            Tire suas dúvidas sobre nossos produtos, entregas e serviços.
          </p>
        </motion.div>

        {/* O Accordion */}
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
                // Bordas e fundo branco para cada item
                className="border-b border-neutral-200 bg-white px-4 shadow-sm first:rounded-t-lg last:rounded-b-lg"
              >
                <AccordionTrigger className="py-6 text-left text-lg font-medium transition-colors hover:text-orange-600 hover:no-underline data-[state=open]:text-orange-600">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-base leading-relaxed text-neutral-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>

      {/* Footer Section (CTA Discord) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="mx-auto flex w-full flex-col items-center justify-center gap-4 px-4 pb-20 text-center"
      >
        <h2 className="text-2xl font-bold text-neutral-900">
          Tem uma dúvida mais específica?
        </h2>
        <p className="max-w-md text-sm text-neutral-500">
          Nossa equipe de suporte está pronta para ajudar você no nosso canal
          oficial.
        </p>
        <Link href="https://wa.link/klquec" target="_blank">
          <button className="group flex cursor-pointer items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-6 py-[10px] text-neutral-700 shadow-sm transition-all duration-300 hover:border-orange-500 hover:text-orange-600 hover:shadow-md">
            Entrar em Contato{" "}
            <ChevronsRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1" />
          </button>
        </Link>
      </motion.div>

      <Suspense fallback={<div className="h-20 w-full bg-white" />}>
        <Footer />
      </Suspense>
    </main>
  );
}
