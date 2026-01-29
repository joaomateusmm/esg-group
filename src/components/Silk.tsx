"use client";

import {
  BadgePercent,
  CreditCard,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";

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
    <section className="w-full bg-white px-34 py-8">
      <div className="px-4 md:px-12">
        <div className="group grid grid-cols-1 gap-y-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-x-4">
          {benefits.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center justify-center gap-3 sm:justify-start lg:justify-center"
              >
                <div className="flex items-center justify-center">
                  <Icon className="h-8 w-8 text-orange-600" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold tracking-wide text-neutral-900 uppercase">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-500">{item.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
