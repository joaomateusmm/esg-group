import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/AdminSidebar"; // Importamos o componente criado acima
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Verificação de Segurança no Servidor
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Se não tiver sessão ou o role não for admin, redireciona
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  return (
    // SidebarProvider gerencia o estado da sidebar (aberta/fechada)
    <SidebarProvider>
      <div className="font-montserrat flex min-h-screen w-full bg-[#050505] text-white">
        {/* Passamos os dados do usuário para a Sidebar */}
        <AdminSidebar user={session.user} />

        {/* SidebarInset é onde o conteúdo da página será renderizado */}
        <SidebarInset className="flex-1 overflow-hidden bg-[#050505]">
          {/* Header Mobile / Trigger da Sidebar */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/5 px-4">
            <SidebarTrigger className="text-white hover:bg-white/10" />
            <div className="mx-2 h-4 w-[1px] bg-white/10" />
            <span className="text-sm font-medium text-neutral-400">
              Área Administrativa
            </span>
          </header>

          {/* Conteúdo das Páginas (Dashboard, Produtos, etc) */}
          <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
