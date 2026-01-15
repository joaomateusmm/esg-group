"use client";

import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";

import { ProductReviewForm } from "@/components/product-review-form"; // Seu formulário existente
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ReviewDialogProps {
  productId: string;
  productName: string;
}

export function ReviewDialog({ productId, productName }: ReviewDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 border-white/10 bg-white/5 text-xs font-medium text-white hover:bg-white/10 hover:text-white"
        >
          <MessageSquarePlus className="h-3 w-3" />
          Avaliar
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[#0A0A0A] sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-white">Avaliar Produto</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Dê sua opinião sobre <strong>{productName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Passamos uma função para fechar o modal após sucesso, se necessário, 
            mas o seu form atual mostra a mensagem de sucesso in-place. 
            Podemos apenas renderizar o form. */}
        <div className="pt-4">
          <ProductReviewForm productId={productId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
