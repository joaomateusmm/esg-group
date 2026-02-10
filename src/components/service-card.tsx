"use client";

import { motion } from "framer-motion";
import { ArrowRight, Hammer } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
  };
  index: number;
}

export function ServiceCard({ service, index }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all duration-300 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5"
    >
      {/* Área da Imagem */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {service.image ? (
          <Image
            src={service.image}
            alt={service.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-300">
            <Hammer className="h-12 w-12" />
          </div>
        )}

        {/* Overlay sutil no hover */}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-clash-display mb-2 text-xl font-bold text-neutral-900 transition-colors group-hover:text-orange-600">
          {service.name}
        </h3>

        <p className="mb-6 line-clamp-3 flex-1 text-sm leading-relaxed text-neutral-500">
          {service.description ||
            "Serviço especializado com profissionais verificados."}
        </p>

        {/* Rodapé do Card */}
        <div className="mt-auto border-t border-neutral-100 pt-4">
          <Link href={`/servicos/${service.slug}`} className="w-full">
            <Button className="w-full justify-between border border-neutral-200 bg-white text-neutral-900 transition-all duration-300 group-hover:border-orange-600 group-hover:bg-orange-600 group-hover:text-white hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700">
              Contratar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
