"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AddProductButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    // 1. Previne cliques múltiplos se já estiver carregando
    if (isLoading) return;

    setIsLoading(true);
    router.push("/admin/produtos/new");
  };

  return (
    <Button
      onClick={handleClick}
      className={`font-montserrat min-w-[170px] justify-center font-light transition-all ${
        // 3. Adicionamos estilo visual de "desabilitado" manualmente
        isLoading ? "cursor-not-allowed opacity-70" : ""
      }`}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Carregando...</span>
        </div>
      ) : (
        "Adicionar Produto"
      )}
    </Button>
  );
}
