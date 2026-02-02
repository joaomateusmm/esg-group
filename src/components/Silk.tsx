"use client";

import {
  BadgePercent,
  CreditCard,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";

// Se você tiver o cn configurado, pode descomentar.
// Caso contrário, o template literal abaixo funciona perfeitamente.
// import { cn } from "@/lib/utils";

const benefits = [
  {
    icon: Truck,
    title: "Frete",
    subtitle: "entrega rápida e segura",
  },
  {
    icon: BadgePercent,
    title: "Descontos",
    subtitle: "5% utilizando cupons",
  },
  {
    icon: Package,
    title: "Produto Montado",
    subtitle: "mais praticidade",
  },
  {
    icon: CreditCard,
    title: "Pague com Cartão",
    subtitle: "confira valores s/ juros",
  },
  {
    icon: ShieldCheck,
    title: "Segurança",
    subtitle: "loja oficial",
  },
];

export default function Silk() {
  return (
    <section className="w-full bg-white py-8">
      <div className="mx-auto max-w-[100rem] px-4 md:px-8">
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 lg:grid-cols-5 lg:gap-x-8">
          {benefits.map((item, index) => {
            const Icon = item.icon;
            // Verifica se é o último item (índice 4)
            const isLastItem = index === benefits.length - 1;

            return (
              <div
                key={index}
                className={`flex items-center gap-3 ${/* LÓGICA MOBILE: O último item ocupa 2 colunas e centraliza. Os outros alinham à esquerda */ ""} ${isLastItem ? "col-span-2 justify-center lg:col-span-1" : "justify-start"} ${/* LÓGICA DESKTOP (CORREÇÃO): Força TODOS a ficarem no centro de suas colunas */ ""} lg:justify-center`}
              >
                <div className="flex shrink-0 items-center justify-center rounded-full bg-orange-50 p-2.5">
                  <Icon className="h-6 w-6 text-orange-600" strokeWidth={1.5} />
                </div>

                <div className="flex flex-col">
                  <h3 className="text-xs font-bold tracking-wide text-neutral-900 uppercase sm:text-sm">
                    {item.title}
                  </h3>
                  <p className="text-[10px] leading-tight text-neutral-500 sm:text-xs">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
