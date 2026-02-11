"use client";

import {
  Bell,
  Blocks,
  Hammer,
  Home,
  LayoutDashboard,
  Package,
  Star,
  TicketPercent,
  Truck,
  UserRoundCog,
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
    <Sidebar className="border-r border-neutral-200 bg-white text-neutral-900">
      {/* --- HEADER (Logo) --- */}
      <SidebarHeader className="flex h-20 justify-center border-b border-neutral-100 px-6">
        <div className="flex items-center justify-center gap-2 py-6">
          <Image
            src="/images/logo.png" // Certifique-se que o logo funciona em fundo claro ou use uma versão dark do logo
            alt="Logo ESG Group"
            width={35}
            height={35}
            className="object-cover"
          />
          <span className="text-xl font-semibold text-neutral-700">
            ESG Group
          </span>
        </div>
      </SidebarHeader>

      {/* --- CONTEÚDO (Menu) --- */}
      <SidebarContent className="px-4 py-7">
        <SidebarMenu>
          {/* Dashboard */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/admin"}
              className="h-12 font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 data-[active=true]:bg-orange-50 data-[active=true]:text-orange-600 data-[active=true]:shadow-md data-[active=true]:shadow-neutral-200"
            >
              <Link href="/admin">
                <LayoutDashboard className="mr-2 h-5 w-5" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Pedidos */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/admin/pedidos"}
              className="h-10 font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 data-[active=true]:bg-orange-50 data-[active=true]:text-orange-600 data-[active=true]:shadow-md data-[active=true]:shadow-neutral-200"
            >
              <Link href="/admin/pedidos">
                <Truck className="mr-2 h-5 w-5" />
                <span>Pedidos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Produtos */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/produtos")}
              className="h-10 font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 data-[active=true]:bg-orange-50 data-[active=true]:text-orange-600 data-[active=true]:shadow-md data-[active=true]:shadow-neutral-200"
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
              className="h-10 font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 data-[active=true]:bg-orange-50 data-[active=true]:text-orange-600 data-[active=true]:shadow-md data-[active=true]:shadow-neutral-200"
            >
              <Link href="/admin/categorias">
                <Blocks className="mr-2 h-5 w-5" />
                <span>Categorias</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Serviços */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/servicos")}
              className="h-10 font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 data-[active=true]:bg-orange-50 data-[active=true]:text-orange-600 data-[active=true]:shadow-md data-[active=true]:shadow-neutral-200"
            >
              <Link href="/admin/servicos ">
                <Hammer className="mr-2 h-5 w-5" />
                <span>Serviços</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Prestadores */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/prestadores")}
              className="h-10 font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 data-[active=true]:bg-orange-50 data-[active=true]:text-orange-600 data-[active=true]:shadow-md data-[active=true]:shadow-neutral-200"
            >
              <Link href="/admin/prestadores ">
                <UserRoundCog className="mr-2 h-5 w-5" />
                <span>Prestadores</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Solicitações de Serviços */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/solicitacoes")}
              className="h-10 font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 data-[active=true]:bg-orange-50 data-[active=true]:text-orange-600 data-[active=true]:shadow-md data-[active=true]:shadow-neutral-200"
            >
              <Link href="/admin/solicitacoes ">
                <Bell className="mr-2 h-5 w-5" />
                <span>Solicitações de Serviços</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Afiliados */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/afiliados")}
              className="h-10 font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 data-[active=true]:bg-orange-50 data-[active=true]:text-orange-600 data-[active=true]:shadow-md data-[active=true]:shadow-neutral-200"
            >
              <Link href="/admin/afiliados">
                <Users className="mr-2 h-5 w-5" />
                <span>Afiliados</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Avaliações */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/admin/avaliacoes"}
              className="h-10 font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 data-[active=true]:bg-orange-50 data-[active=true]:text-orange-600 data-[active=true]:shadow-md data-[active=true]:shadow-neutral-200"
            >
              <Link href="/admin/avaliacoes">
                <Star className="mr-2 h-5 w-5" />
                <span>Avaliações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Cupons */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/cupons")}
              className="h-10 font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 data-[active=true]:bg-orange-50 data-[active=true]:text-orange-600 data-[active=true]:shadow-md data-[active=true]:shadow-neutral-200"
            >
              <Link href="/admin/cupons">
                <TicketPercent className="mr-2 h-5 w-5" />
                <span>Cupons</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Separador */}
          <div className="my-4 h-[1px] bg-neutral-100" />

          {/* Voltar ao Site */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-10 font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
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
      <SidebarFooter className="border-t border-neutral-100 p-4">
        <div className="flex cursor-pointer items-center gap-3 rounded-xl bg-neutral-50 p-3 transition-colors hover:bg-neutral-100">
          <Avatar className="h-9 w-9 border border-neutral-200">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback className="bg-orange-600 font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden text-left">
            <span className="truncate text-sm font-semibold text-neutral-900">
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
