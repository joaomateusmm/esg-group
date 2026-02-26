"use client";

import { MessageCircle, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Mesmos dados do FAQ da sua página original
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
    question: "Vocês realizam serviços de reparos?",
    answer:
      "Sim! Além da venda de móveis, o ESG Group conta com uma equipe qualificada para diversos serviços residenciais. Você pode solicitar um orçamento diretamente pelo nosso site ou através do nosso canal de atendimento.",
  },
];

export function SupportFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Previne travamento de rolagem caso o conteúdo interno cresça demais
  const stopPropagation = (
    e: React.UIEvent | React.TouchEvent | React.WheelEvent,
  ) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={menuRef}
      className="fixed right-6 bottom-6 z-50 flex flex-col items-end"
    >
      {/* Menu DropUp */}
      <div
        className={`mb-2 flex w-80 origin-bottom-right flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl transition-all duration-300 ease-out sm:w-96 ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-95 opacity-0"
        }`}
      >
        {/* Cabeçalho do Menu */}
        <div className="flex items-center justify-between bg-orange-600 p-5 text-white">
          <div>
            <h3 className="text-lg font-bold">Precisa de Ajuda?</h3>
            <p className="text-xs text-orange-100">
              Confira as dúvidas comuns ou fale conosco.
            </p>
          </div>
          {/* Botão de Fechar no topo para facilitar acessibilidade */}
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full bg-orange-700 p-1 transition-colors hover:bg-orange-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Lista de Perguntas (FAQ) - Rolável */}
        <div
          className="scrollbar-thin scrollbar-thumb-neutral-200 max-h-[52vh] overflow-y-auto p-4"
          onWheel={stopPropagation}
          onTouchMove={stopPropagation}
        >
          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqData.map((item) => (
              <AccordionItem
                key={item.value}
                value={item.value}
                className="rounded-lg border border-neutral-100 px-3 transition-colors data-[state=open]:border-orange-200 data-[state=open]:bg-orange-50/50"
              >
                <AccordionTrigger className="py-3 text-left text-sm font-semibold hover:text-orange-600 hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-3 text-xs leading-relaxed text-neutral-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-2 cursor-pointer text-center text-xs text-neutral-400 hover:underline">
            <Link href="/faq"> Ver todas as dúvidas.</Link>
          </p>
        </div>

        {/* Footer com Botão do WhatsApp */}
        <div className="border-t border-neutral-100 bg-neutral-50 p-4">
          <Link
            href="https://wa.link/klquec"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#20ba5a] hover:shadow-md active:scale-95"
          >
            <MessageCircle className="h-5 w-5" />
            Atendimento no WhatsApp
          </Link>
          <p className="mt-2 text-center text-[10px] text-neutral-400">
            Respondemos de Segunda a Sexta, das 9h às 18h - UK
          </p>
        </div>
      </div>

      {/* Botão Flutuante (Mascote com efeito Pop-out Cortado Embaixo) */}
      <div className="relative flex items-end justify-center">
        {/* Balãozinho de Fala */}
        <div
          className={`absolute -top-6 -left-28 flex items-center justify-center rounded-2xl rounded-br-none border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 shadow-md transition-all duration-300 ${
            isOpen
              ? "scale-0 opacity-0"
              : "scale-100 animate-bounce opacity-100"
          }`}
        >
          Posso ajudar?
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative flex h-22 w-22 cursor-pointer items-end justify-center duration-300 hover:-translate-y-1 active:scale-95 md:h-28 md:w-28`}
          aria-label="Abrir menu de suporte"
        >
          {/* Círculo de Background (Fica por trás) */}
          <div className="absolute inset-0 rounded-full border-2 border-white bg-orange-500 shadow-xl duration-300 group-hover:bg-orange-600"></div>

          {/* Imagem do Mascote com clip-path preservado */}
          <div
            className="absolute bottom-0 left-1/2 z-10 h-[140%] w-[130%] -translate-x-1/2 drop-shadow-md"
            style={{
              clipPath: "inset(-50% 15% 0 15% round 0 0 999px 999px)",
            }}
          >
            <Image
              src="/mascote-esg.svg"
              alt="Mascote ESG Group"
              fill
              className="object-contain object-bottom"
            />
          </div>
        </button>
      </div>
    </div>
  );
}
