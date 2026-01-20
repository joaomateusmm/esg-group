import { eq } from "drizzle-orm";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Headphones,
  MapPin,
  Package,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

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

export default async function MyAccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/authentication");
  }

  const user = session.user;

  // Buscar estatísticas do usuário no banco
  const userOrders = await db.query.order.findMany({
    where: eq(order.userId, user.id),
  });

  const totalOrders = userOrders.length;
  const totalSpent = userOrders.reduce((acc, curr) => {
    // Soma apenas pedidos pagos
    return curr.status === "paid" ? acc + curr.amount : acc;
  }, 0);

  // Define o nível do cliente baseado no gasto (Gamificação simples)
  let customerLevel = "Membro";
  if (totalSpent > 50000) customerLevel = "Cliente VIP"; // R$ 500,00
  if (totalSpent > 200000) customerLevel = "Cliente Elite"; // R$ 2.000,00

  const menuItems = [
    {
      title: "Geral",
      items: [
        // REMOVIDO: "Dados Pessoais" (já está no header)
        { label: "Meus Pedidos", icon: Package, href: "/minha-conta/compras" },
        {
          label: "Segurança & Senha",
          icon: Shield,
          href: "/minha-conta/seguranca",
        },
      ],
    },
    {
      title: "Preferências",
      items: [
        {
          label: "Métodos de Pagamento",
          icon: CreditCard,
          href: "/minha-conta/pagamentos",
        },
        { label: "Endereços", icon: MapPin, href: "/minha-conta/enderecos" }, // Adicionei endereços que é comum
        {
          label: "Notificações",
          icon: Bell,
          href: "/minha-conta/notificacoes",
        },
      ],
    },
    {
      title: "Suporte",
      items: [{ label: "Central de Ajuda", icon: Headphones, href: "/faq" }],
    },
  ];

  return (
    <div className="min-h-screen bg-[#010000]">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-42 md:px-8">
        {/* --- CABEÇALHO DO PERFIL (DADOS PESSOAIS AQUI) --- */}
        <div className="mb-10 flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <Avatar className="h-20 w-20 border-2 border-[#D00000]">
              <AvatarImage src={user.image || ""} />
              <AvatarFallback className="bg-[#1A1A1A] text-2xl font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center gap-3 md:justify-start">
                <h1 className="font-clash-display text-2xl font-medium text-white">
                  {user.name}
                </h1>
                <Badge className="bg-[#D00000] text-white hover:bg-[#a00000]">
                  {customerLevel}
                </Badge>
              </div>
              <p className="text-sm text-neutral-400">{user.email}</p>
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-neutral-500 md:justify-start">
                <User className="h-3 w-3" />
                <span>
                  Membro desde {new Date(user.createdAt).getFullYear()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/minha-conta/compras">
              <Button className="bg-white text-black hover:bg-neutral-200">
                Ver meus arquivos
              </Button>
            </Link>
            <Link href="/minha-conta/configuracoes">
              <Button
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5"
              >
                <Settings className="mr-2 h-4 w-4" /> Editar
              </Button>
            </Link>
          </div>
        </div>

        {/* --- GRID DE ESTATÍSTICAS (Client Component) --- */}
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
                className="border-white/10 bg-[#0A0A0A]"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium tracking-wider text-neutral-500 uppercase">
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-1 p-2">
                  {section.items.map((item) => (
                    <Link key={item.label} href={item.href}>
                      <div className="group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-white/5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-neutral-400 transition-colors group-hover:bg-[#D00000]/10 group-hover:text-[#D00000]">
                            <item.icon className="h-5 w-5" />
                          </div>
                          <span className="font-medium text-white">
                            {item.label}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-600 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Botão de Sair */}
            <Card className="border-red-900/20 bg-[#0A0A0A]">
              <CardContent className="p-2">
                <SignOutButton />
              </CardContent>
            </Card>
          </div>

          {/* Coluna Lateral (Banner Promocional / Info) */}
          <div className="space-y-6">
            <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-[#1a0505] to-[#0A0A0A]">
              <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="rounded-full bg-[#D00000]/20 p-4">
                  <Shield className="h-8 w-8 text-[#D00000]" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-medium text-white">
                    Segurança Garantida
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Suas compras e dados estão protegidos com criptografia de
                    ponta a ponta.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#0A0A0A]">
              <CardHeader>
                <CardTitle className="text-white">Precisa de ajuda?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-neutral-400">
                  Nossa equipe está disponível no Discord para tirar suas
                  dúvidas.
                </p>
                <Link href="/discord" target="_blank">
                  <Button className="w-full bg-[#5865F2] text-white hover:bg-[#4752C4]">
                    Entrar no Discord
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
