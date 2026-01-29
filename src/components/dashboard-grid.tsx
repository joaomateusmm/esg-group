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
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      href: "/minha-conta/compras",
    },
    {
      label: "Pedidos Feitos",
      value: totalOrders,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      href: "/minha-conta/compras",
    },
    {
      label: "No Carrinho",
      value: cartCount,
      icon: ShoppingCart,
      color: "text-orange-600", // Mudado para Laranja
      bgColor: "bg-orange-100",
      href: "/minha-conta/carrinho",
    },
    {
      label: "Favoritos",
      value: wishlistCount,
      icon: Heart,
      color: "text-rose-600",
      bgColor: "bg-rose-100",
      href: "/minha-conta/favoritos",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Link key={index} href={stat.href}>
          <Card className="group cursor-pointer border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-md">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-neutral-500 transition-colors group-hover:text-orange-600">
                  {stat.label}
                </span>
                <span className="font-clash-display text-2xl font-bold text-neutral-900">
                  {stat.value}
                </span>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-110 ${stat.bgColor} ${stat.color}`}
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
