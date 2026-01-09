"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteReviewAction } from "@/actions/admin-review";
import { Button } from "@/components/ui/button";

interface DeleteReviewButtonProps {
  reviewId: string;
}

export function DeleteReviewButton({ reviewId }: DeleteReviewButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    // Pergunta simples de confirmação
    const confirm = window.confirm(
      "Tem certeza que deseja apagar esta avaliação?",
    );
    if (!confirm) return;

    startTransition(async () => {
      const result = await deleteReviewAction(reviewId);
      if (result.success) {
        toast.success("Avaliação removida!");
      } else {
        toast.error("Erro ao remover avaliação.");
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={isPending}
      className="h-8 w-8 text-neutral-500 hover:bg-red-500/10 hover:text-red-500"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
