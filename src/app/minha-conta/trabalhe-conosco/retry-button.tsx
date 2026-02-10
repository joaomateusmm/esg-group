"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { resetProviderApplication } from "@/actions/providers";
import { Button } from "@/components/ui/button";

export function RetryButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    try {
      const res = await resetProviderApplication();
      if (res.success) {
        toast.success(res.message);
        router.refresh(); // Recarrega a página para mostrar o formulário
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Erro ao processar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleRetry}
      disabled={loading}
      className="w-full bg-red-600 font-bold text-white hover:bg-red-700"
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      Refazer Solicitação
    </Button>
  );
}
