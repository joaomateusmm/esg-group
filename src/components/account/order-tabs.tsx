"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { id: "all", label: "Tudo" },
  { id: "pending", label: "A Pagar" },
  { id: "paid", label: "Preparando" },
  { id: "shipped", label: "A Caminho" },
  { id: "delivered", label: "Finalizado" },
  { id: "canceled", label: "Cancelado" },
];

export function OrderTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "all";

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tabId === "all") {
      params.delete("tab");
    } else {
      params.set("tab", tabId);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="sticky top-[64px] z-30 w-full border-b border-neutral-200 bg-white">
      <div className="scrollbar-hide mx-auto flex w-full max-w-5xl overflow-x-auto px-4 md:px-0">
        <div className="flex w-full min-w-max gap-8">
          {TABS.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "relative py-4 text-sm font-medium transition-colors hover:text-orange-600 focus:outline-none",
                  isActive ? "font-bold text-orange-600" : "text-neutral-600",
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-t-full bg-orange-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
