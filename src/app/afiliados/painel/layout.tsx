import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AffiliateSidebar } from "@/components/AffiliateSideBar"; // <--- Import da nova Sidebar
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

export default async function AffiliateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Pegar sessão para passar os dados do usuário para a Sidebar
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Objeto de usuário formatado para a Sidebar
  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };

  return (
    // SidebarProvider é necessário para controlar o estado (aberto/fechado) da Sidebar
    <SidebarProvider>
      {/* Chamada do componente Sidebar que criamos */}
      <AffiliateSidebar user={user} />

      {/* SidebarInset é o container do conteúdo principal que se ajusta automaticamente */}
      <SidebarInset className="bg-[#0a0a0a] text-white">
        {/* Header interno com o Trigger (Botão Hamburger) para Mobile */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/5 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-white hover:bg-white/10" />
            <div className="mr-2 h-4 w-[1px] bg-white/10" />
            <span className="text-sm font-medium text-neutral-400">
              Painel do Afiliado
            </span>
          </div>
        </header>

        {/* Conteúdo da Página (Children) */}
        <main className="flex flex-1 flex-col gap-4 p-4 pt-4 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
