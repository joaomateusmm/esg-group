"use client";

import { motion } from "motion/react";
import Link from "next/link";

import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";

const testimonials = [
  {
    text: "Muito Bom",
    image: "/images/avatar/", // Caminho corrigido
    name: "again7r",
    role: "12/12/2025",
  },
  {
    text: "Muito boa a config, obrigado",
    image: "/images/avatar/", // Assumindo que tens avatar2.png
    name: "silva_lispo",
    role: "14/10/2025",
  },
  {
    text: "Muito bom, estão de parabens.",
    image: "/images/avatar/",
    name: "silva_lispo",
    role: "14/10/2025",
  },
  {
    text: "Som bem dms",
    image: "/images/avatar/",
    name: "lavinia.lovs",
    role: "12/10/2025",
  },
  {
    text: "Curti bastante é realmente o do goat nota1000",
    image: "/images/avatar/",
    name: "octavio_barbosa",
    role: "08/10/2025",
  },
  {
    text: "Muito bom mano",
    image: "/images/avatar/",
    name: "jnzin24fps",
    role: "08/10/2025",
  },
  {
    text: "Slc muito bom",
    image: "/images/avatar/",
    name: "driftdynamo",
    role: "08/10/2025",
  },
  {
    text: "vamo ver se eu consigo ganhar tbm kkkkkkkk",
    image: "/images/avatar/",
    name: "kamp",
    role: "07/10/2025",
  },
  {
    text: "Chegou tudo certo no email, vlwww dms",
    image: "/images/avatar/",
    name: "yuteus26",
    role: "05/01/2026",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const TestimonialsSection = () => {
  return (
    <section className="relative my-20">
      <div className="z-10 container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto flex max-w-[540px] flex-col items-center justify-center"
        >
          <Link
            href="/avaliacoes"
            className="z-90 cursor-pointer rounded-lg border px-4 py-2 duration-300 hover:scale-105 active:scale-95"
          >
            <button className="flex cursor-pointer justify-center">
              Avaliações
            </button>
          </Link>

          <h2 className="mt-5 text-xl font-bold tracking-tighter sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
            Avaliações dos clientes
          </h2>
          <p className="mt-5 text-center opacity-75">
            Descubra as experiências reais de quem já comprou conosco e veja o
            que estão dizendo sobre a nossa loja.
          </p>
        </motion.div>

        <div className="mt-10 flex max-h-[740px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={19}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={17}
          />
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
