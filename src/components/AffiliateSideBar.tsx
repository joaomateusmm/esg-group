"use client";

import {
  DollarSign,
  Home,
  LayoutDashboard,
  Link2,
  Settings,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

// Tipo do usuário (Afiliado)
interface AffiliateSidebarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AffiliateSidebar({ user }: AffiliateSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-white/10 bg-[#0A0A0A] text-white">
      {/* --- HEADER (Logo) --- */}
      <SidebarHeader className="flex h-20 justify-center border-b border-white/5 px-6">
        <div className="flex items-center justify-center gap-2 py-6">
          <Link className="flex items-center justify-center" href="/">
            <Image
              src="/images/icons/logo.png"
              alt="Logo Sub Mind"
              width={50}
              height={50}
              className="object-cover"
            />
            <span className="font-clash-display text-2xl font-medium">
              SubMind
            </span>
          </Link>
        </div>
      </SidebarHeader>

      {/* --- CONTEÚDO (Menu) --- */}
      <SidebarContent className="px-4 py-6">
        <SidebarMenu>
          {/* Visão Geral (Dashboard) */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/afiliados/painel"}
              className="h-12 text-neutral-400 hover:bg-white/5 hover:text-white data-[active=true]:bg-[#D00000]/10 data-[active=true]:text-[#D00000]"
            >
              <Link href="/afiliados/painel">
                <LayoutDashboard className="mr-2 h-5 w-5" />
                <span>Visão Geral</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Vendas & Comissões */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/afiliados/painel/vendas")}
              className="h-12 text-neutral-400 hover:bg-white/5 hover:text-white data-[active=true]:bg-[#D00000]/10 data-[active=true]:text-[#D00000]"
            >
              <Link href="/afiliados/painel/vendas">
                <DollarSign className="mr-2 h-5 w-5" />
                <span>Vendas</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Configurações */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/afiliados/painel/configuracoes")}
              className="h-12 text-neutral-400 hover:bg-white/5 hover:text-white data-[active=true]:bg-[#D00000]/10 data-[active=true]:text-[#D00000]"
            >
              <Link href="/afiliados/painel/configuracoes">
                <Settings className="mr-2 h-5 w-5" />
                <span>Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Separador e Voltar ao Site */}
          <div className="my-4 h-[1px] bg-white/10" />

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-12 text-neutral-400 hover:bg-white/5 hover:text-white"
            >
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                <span>Voltar ao Site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      {/* --- FOOTER (Usuário) --- */}
      <SidebarFooter className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <Avatar className="h-9 w-9 border border-white/10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback className="bg-[#D00000] font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden text-left">
            <span className="truncate text-sm font-medium text-white">
              {user.name}
            </span>
            <span className="truncate text-xs text-neutral-500">Afiliado</span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
