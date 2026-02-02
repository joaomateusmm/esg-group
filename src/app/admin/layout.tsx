import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/AdminSidebar";
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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <div className="font-montserrat flex min-h-screen w-full bg-[#e4e4e4] text-black">
        <AdminSidebar user={session.user} />
        <SidebarInset className="flex flex-1 flex-col bg-[#FFFFFF]">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-neutral-100 bg-white/80 px-4 backdrop-blur-md">
            <SidebarTrigger className="text-neutral-700 hover:bg-neutral-100" />
            <div className="mx-2 h-4 w-[1px] bg-neutral-200" />
            <span className="text-sm font-medium text-neutral-700">
              Área Administrativa
            </span>
          </header>
          <main className="flex-1 p-6 pb-20 md:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
