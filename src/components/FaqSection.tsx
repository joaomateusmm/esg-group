"use client";

import { motion } from "motion/react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    value: "item-1",
    question: "Quem é o ESG Group?",
    answer:
      "Somos uma empresa especializada na venda de móveis de alta qualidade e prestação de serviços residenciais no Reino Unido. Nosso foco é oferecer soluções, conforto e praticidade com o melhor custo-benefício do mercado.",
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

const FaqSection = () => {
  return (
    <section className="relative mb-15 bg-white py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="mx-auto mb-12 flex max-w-[700px] flex-col items-center text-center"
        >
          <h2 className="font-montserrat text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl">
            Perguntas Frequentes
          </h2>
          <p className="mt-4 text-lg text-neutral-500">
            Tire suas dúvidas sobre nossos produtos, entregas e serviços.
          </p>
          <div className="mt-4 h-1 w-20 rounded-full bg-orange-600" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((item) => (
              <AccordionItem
                key={item.value}
                value={item.value}
                className="border-b border-neutral-200"
              >
                <AccordionTrigger className="text-left text-lg font-medium text-neutral-900 transition-all hover:text-orange-600 hover:no-underline data-[state=open]:text-orange-600">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-neutral-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FaqSection;
