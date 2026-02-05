"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Adicionei "export default" aqui
export default function CopyIdButton({ id }: { id: string }) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(id.slice(0, 8).toUpperCase());
    setHasCopied(true);
    toast.success("ID copiado!");

    // Volta para o ícone de cópia após 2 segundos
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="group rounded-md bg-orange-50 p-1.5 shadow-sm shadow-neutral-200 transition-colors hover:bg-orange-50 hover:text-orange-600"
      title="Copiar ID do pedido"
    >
      {hasCopied ? (
        <Check className="animate-in zoom-in-50 h-3.5 w-3.5 text-emerald-600 duration-200" />
      ) : (
        <Copy className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
      )}
    </button>
  );
}
