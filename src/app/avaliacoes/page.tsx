"use client";

import { motion } from "motion/react";
import Image from "next/image";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

const testimonials = [
  {
    text: "Muito Bom",
    image: "/images/avatar/avatar1.webp",
    name: "again7r",
    role: "12/12/2025",
  },
  {
    text: "Muito boa a config, obrigado",
    image: "/images/avatar/avatar2.webp",
    name: "silva_lispo",
    role: "14/10/2025",
  },
  {
    text: "Muito bom, estão de parabens.",
    image: "/images/avatar/avatar3.webp",
    name: "silva_lispo",
    role: "14/10/2025",
  },
  {
    text: "Som bem dms",
    image: "/images/avatar/avatar4.webp",
    name: "lavinia.lovs",
    role: "12/10/2025",
  },
  {
    text: "Curti bastante é realmente o do goat nota1000",
    image: "/images/avatar/avatar5.webp",
    name: "octavio_barbosa",
    role: "08/10/2025",
  },
  {
    text: "Muito bom mano",
    image: "/images/avatar/avatar6.webp",
    name: "jnzin24fps",
    role: "08/10/2025",
  },
  {
    text: "Slc muito bom",
    image: "/images/avatar/avatar7.webp",
    name: "driftdynamo",
    role: "08/10/2025",
  },
  {
    text: "vamo ver se eu consigo ganhar tbm kkkkkkkk",
    image: "/images/avatar/avatar8.webp",
    name: "kamp",
    role: "07/10/2025",
  },
  {
    text: "Chegou tudo certo no email, vlwww dms",
    image: "/images/avatar/avatar9.webp",
    name: "yuteus26",
    role: "05/01/2026",
  },
];

export default function AvaliacoesPage() {
  return (
    <main className="min-h-screen bg-[#010000] pt-32 pb-12 text-white">
      <Header />
      <div className="container mx-auto max-w-6xl px-6">
        {/* Cabeçalho da Página Atualizado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 flex w-full flex-col items-start justify-between gap-6 md:flex-row md:items-end"
        >
          {/* LADO ESQUERDO: Título e Subtítulo Agrupados */}
          <div className="mt-12 flex max-w-2xl flex-col items-start">
            <h1 className="mb-4 text-left text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              Mural de Clientes
            </h1>

            <p className="text-left text-lg text-neutral-400">
              Veja o que a comunidade diz sobre os nossos produtos.
              Transparência e qualidade em primeiro lugar.
            </p>
          </div>

          {/* LADO DIREITO: O Contador de Avaliações */}
          <div className="inline-flex shrink-0 items-center">
            <span className="text-sm font-medium text-neutral-700">
              Total de avaliações:{" "}
              <span className="font-bold text-neutral-400">
                {testimonials.length}
              </span>
            </span>
          </div>
        </motion.div>

        {/* A Grade (Grid) de Avaliações */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.05 }} // Efeito cascata
              viewport={{ once: true }}
              className="shadow-primary/10 w-full rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 shadow-lg transition-colors hover:border-white/20"
            >
              <div className="min-h-[60px] leading-relaxed text-gray-200">
                &quot;{card.text}&quot;
              </div>

              <div className="mt-6 flex items-center gap-4 border-t border-white/5 pt-6">
                <Image
                  src={card.image}
                  alt={card.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full border border-white/10 object-cover"
                />
                <div className="flex flex-col">
                  <div className="font-semibold tracking-tight text-white">
                    {card.name}
                  </div>
                  <div className="text-sm text-gray-500">{card.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
