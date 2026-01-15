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

const FaqSection = () => {
  return (
    <section className="relative my-20 bg-[#010000] py-10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto mb-12 flex max-w-[600px] flex-col items-center text-center"
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Perguntas Frequentes
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Algumas perguntas básicas sobre a loja e sobre nós.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((item) => (
              <AccordionItem key={item.value} value={item.value}>
                <AccordionTrigger className="text-left text-lg font-medium">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
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
