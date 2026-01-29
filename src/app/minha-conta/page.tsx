import { eq } from "drizzle-orm";
import {
  ChevronRight,
  Headphones,
  Package,
  Shield,
  User,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DashboardGrid } from "@/components/dashboard-grid";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SignOutButton } from "@/components/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { order } from "@/db/schema";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MyAccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/authentication");
  }

  const user = session.user;

  const userOrders = await db.query.order.findMany({
    where: eq(order.userId, user.id),
  });

  const totalOrders = userOrders.length;
  const totalSpent = userOrders.reduce((acc, curr) => {
    return curr.status === "paid" ? acc + curr.amount : acc;
  }, 0);

  let customerLevel = "Membro";
  if (totalSpent > 50000) customerLevel = "Cliente VIP";
  if (totalSpent > 200000) customerLevel = "Cliente Elite";

  const menuItems = [
    {
      title: "Geral",
      items: [
        { label: "Meus Pedidos", icon: Package, href: "/minha-conta/compras" },
        {
          label: "Segurança & Senha",
          icon: Shield,
          href: "/minha-conta/seguranca",
        },
        { label: "Central de Ajuda", icon: Headphones, href: "/faq" },
      ],
    },
  ];

  return (
    // MUDANÇA: Fundo claro
    <div className="min-h-screen bg-neutral-50">
      <Suspense fallback={<div className="h-20 w-full bg-white" />}>
        <Header />
      </Suspense>

      <main className="mx-auto max-w-5xl px-4 py-38 md:px-8">
        {/* --- CABEÇALHO DO PERFIL --- */}
        <div className="mb-10 flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-4 md:flex-row">
            {/* MUDANÇA: Borda laranja e fallback claro */}
            <Avatar className="h-20 w-20 border-2 border-orange-600">
              <AvatarImage src={user.image || ""} />
              <AvatarFallback className="bg-orange-100 text-2xl font-bold text-orange-700">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center gap-3 md:justify-start">
                {/* MUDANÇA: Texto escuro */}
                <h1 className="font-clash-display text-2xl font-bold text-neutral-900">
                  {user.name}
                </h1>
                <Badge className="bg-orange-600 text-white hover:bg-orange-700">
                  {customerLevel}
                </Badge>
              </div>
              <p className="text-sm text-neutral-500">{user.email}</p>
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-neutral-400 md:justify-start">
                <User className="h-3 w-3" />
                <span>
                  Membro desde {new Date(user.createdAt).getFullYear()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/minha-conta/compras">
              {/* MUDANÇA: Botão principal laranja */}
              <Button className="bg-orange-600 text-white hover:bg-orange-700">
                Ver meus pedidos
              </Button>
            </Link>
            {/* <Link href="/minha-conta/configuracoes">
              <Button
                variant="outline"
                className="border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
              >
                <Settings className="mr-2 h-4 w-4" /> Editar
              </Button>
            </Link> */}
          </div>
        </div>

        {/* --- GRID DE ESTATÍSTICAS --- */}
        <div className="mb-10">
          <DashboardGrid totalOrders={totalOrders} totalSpent={totalSpent} />
        </div>

        {/* --- MENU DE NAVEGAÇÃO --- */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Coluna Principal (Menus) */}
          <div className="space-y-6 lg:col-span-2">
            {menuItems.map((section) => (
              <Card
                key={section.title}
                // MUDANÇA: Card branco com sombra suave
                className="border-neutral-200 bg-white shadow-sm"
              >
                <CardHeader>
                  <CardTitle className="text-sm font-bold tracking-wider text-neutral-400 uppercase">
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-1 p-2">
                  {section.items.map((item) => (
                    <Link key={item.label} href={item.href}>
                      {/* MUDANÇA: Hover laranja claro */}
                      <div className="group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-orange-50">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 transition-colors group-hover:bg-orange-100 group-hover:text-orange-600">
                            <item.icon className="h-5 w-5" />
                          </div>
                          {/* MUDANÇA: Texto escuro */}
                          <span className="font-medium text-neutral-700 group-hover:text-orange-900">
                            {item.label}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-orange-400" />
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Botão de Sair */}
            <Card className="border-red-100 bg-red-50/50">
              <CardContent className="px-2">
                <SignOutButton />
              </CardContent>
            </Card>
          </div>

          {/* Coluna Lateral (Banner Promocional / Info) */}
          <div className="space-y-6">
            {/* MUDANÇA: Gradiente laranja */}
            <Card className="overflow-hidden border-orange-200 bg-gradient-to-b from-orange-50 to-white">
              <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="rounded-full bg-orange-100 p-4">
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold text-neutral-900">
                    Segurança Garantida
                  </h3>
                  <p className="text-sm text-neutral-500">
                    Suas compras e dados estão protegidos com criptografia de
                    ponta a ponta.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
