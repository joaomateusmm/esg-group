"use client";

import {
  Blocks,
  Gamepad2,
  Home,
  LayoutDashboard,
  Package,
  TvMinimalPlay,
  Users,
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

// Definimos o tipo do usuário que vem da sessão
interface AdminSidebarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-white/10 bg-[#0A0A0A] text-white">
      {/* --- HEADER (Logo) --- */}
      <SidebarHeader className="flex h-20 justify-center border-b border-white/5 px-6">
        <div className="flex items-center justify-center gap-2 py-6">
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
        </div>
      </SidebarHeader>

      {/* --- CONTEÚDO (Menu) --- */}
      <SidebarContent className="px-4 py-6">
        <SidebarMenu>
          {/* Dashboard */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/admin"}
              className="h-12 text-neutral-400 hover:bg-white/5 hover:text-white data-[active=true]:bg-[#D00000]/10 data-[active=true]:text-[#D00000]"
            >
              <Link href="/admin">
                <LayoutDashboard className="mr-2 h-5 w-5" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Produtos */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/produtos")}
              className="h-12 text-neutral-400 hover:bg-white/5 hover:text-white data-[active=true]:bg-[#D00000]/10 data-[active=true]:text-[#D00000]"
            >
              <Link href="/admin/produtos">
                <Package className="mr-2 h-5 w-5" />
                <span>Produtos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Categorias */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/categorias")}
              className="h-12 text-neutral-400 hover:bg-white/5 hover:text-white data-[active=true]:bg-[#D00000]/10 data-[active=true]:text-[#D00000]"
            >
              <Link href="/admin/categorias">
                <Blocks className="mr-2 h-5 w-5" />
                <span>Categorias</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Jogos */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/jogos")}
              className="h-12 text-neutral-400 hover:bg-white/5 hover:text-white data-[active=true]:bg-[#D00000]/10 data-[active=true]:text-[#D00000]"
            >
              <Link href="/admin/jogos">
                <Gamepad2 className="mr-2 h-5 w-5" />
                <span>Jogos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Streamings */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/streamings")}
              className="h-12 text-neutral-400 hover:bg-white/5 hover:text-white data-[active=true]:bg-[#D00000]/10 data-[active=true]:text-[#D00000]"
            >
              <Link href="/admin/streamings">
                <TvMinimalPlay className="mr-2 h-5 w-5" />
                <span>Streamings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Afiliados */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/afiliados")}
              className="h-12 text-neutral-400 hover:bg-white/5 hover:text-white data-[active=true]:bg-[#D00000]/10 data-[active=true]:text-[#D00000]"
            >
              <Link href="/admin/afiliados">
                <Users className="mr-2 h-5 w-5" />
                <span>Afiliados</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Voltar ao Site */}
          <div className="my-4 h-[1px] bg-white/10" /> {/* Separador */}
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
            <span className="truncate text-xs text-neutral-500">Admin</span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
