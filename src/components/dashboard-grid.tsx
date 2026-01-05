"use client";

import { Heart, Package, ShoppingCart, Wallet } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";

interface DashboardGridProps {
  totalOrders: number;
  totalSpent: number;
}

export function DashboardGrid({ totalOrders, totalSpent }: DashboardGridProps) {
  // Pegando dados do LocalStorage via Zustand
  const cartCount = useCartStore((state) => state.items.length);
  const wishlistCount = useWishlistStore((state) => state.items.length);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  const stats = [
    {
      label: "Total Gasto",
      value: formatCurrency(totalSpent),
      icon: Wallet,
      color: "text-green-500",
      href: "/minha-conta/compras",
    },
    {
      label: "Pedidos Feitos",
      value: totalOrders,
      icon: Package,
      color: "text-blue-500",
      href: "/minha-conta/compras",
    },
    {
      label: "No Carrinho",
      value: cartCount,
      icon: ShoppingCart,
      color: "text-[#D00000]",
      href: "/minha-conta/carrinho",
    },
    {
      label: "Favoritos",
      value: wishlistCount,
      icon: Heart,
      color: "text-pink-500",
      href: "/minha-conta/favoritos",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Link key={index} href={stat.href}>
          <Card className="group cursor-pointer border-white/10 bg-[#0A0A0A] transition-all hover:border-white/20 hover:bg-white/5">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-neutral-400">
                  {stat.label}
                </span>
                <span className="font-clash-display text-2xl font-semibold text-white">
                  {stat.value}
                </span>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-white/5 transition-transform group-hover:scale-110 ${stat.color}`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
