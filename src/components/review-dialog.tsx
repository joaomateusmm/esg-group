"use client";

import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";

import { ProductReviewForm } from "@/components/product-review-form";
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
          className="h-8 gap-2 border-orange-200 bg-white text-xs font-medium text-orange-600 hover:bg-orange-50 hover:text-orange-700"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Avaliar
        </Button>
      </DialogTrigger>
      {/* Modal Branco Clean */}
      <DialogContent className="border-neutral-200 bg-white text-neutral-900 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900">
            Avaliar Produto
          </DialogTitle>
          <DialogDescription className="text-neutral-500">
            Dê sua opinião sobre{" "}
            <strong className="text-neutral-800">{productName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          <ProductReviewForm productId={productId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
