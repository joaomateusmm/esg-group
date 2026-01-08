"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { deleteReviewAction } from "@/actions/review";
import { cn } from "@/lib/utils";

interface DeleteReviewButtonProps {
  reviewId: string;
  productId: string;
  className?: string;
}

export function DeleteReviewButton({
  reviewId,
  productId,
  className,
}: DeleteReviewButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    // Confirmação simples do navegador
    if (!confirm("Tem certeza que deseja apagar sua avaliação?")) return;

    setIsDeleting(true);

    const result = await deleteReviewAction(reviewId, productId);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }

    setIsDeleting(false);
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={cn(
        "text-neutral-600 transition-colors hover:text-red-500 disabled:opacity-50",
        className,
      )}
      title="Apagar avaliação"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
