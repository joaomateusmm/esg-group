"use client";

import { MessageSquarePlus, Star } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { createReviewAction } from "@/actions/review";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { Label } from "./ui/label";

interface ProductReviewFormProps {
  productId: string;
}

const initialState = {
  success: false,
  message: "",
  errors: undefined,
};

export function ProductReviewForm({ productId }: ProductReviewFormProps) {
  // Estado da Server Action
  const [state, action, isPending] = useActionState(
    createReviewAction,
    initialState,
  );

  // Estados locais
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [localError, setLocalError] = useState(""); // <--- Novo estado para o erro local

  // Efeito para mostrar toast de sucesso ou erro vindo do servidor
  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast.success(state.message);
        setLocalError(""); // Limpa erros se tiver sucesso
      } else if (!state.success && state.message) {
        toast.error(state.message);
      }
    }
  }, [state]);

  // Função para validar no cliente antes de enviar
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Pegamos o valor do comentário
    const formData = new FormData(e.currentTarget);
    const comment = formData.get("comment") as string;

    // Resetamos erro anterior
    setLocalError("");

    // Validação Manual
    if (!comment || comment.trim().length < 3) {
      e.preventDefault(); // Impede o envio

      const msg = "O comentário precisa ter pelo menos 3 caracteres.";
      toast.warning(msg); // Toast
      setLocalError(msg); // Texto vermelho no card
      return;
    }

    // Se passar, o form segue para a server action
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-5">
      <h4 className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
        <MessageSquarePlus className="h-4 w-4 text-[#D00000]" />
        Avaliar Produto
      </h4>

      {state?.success ? (
        <div className="animate-in fade-in zoom-in flex flex-col items-center justify-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-6 text-center text-sm text-green-500 duration-300">
          <div className="rounded-full bg-green-500/20 p-2">
            <Star className="h-6 w-6 fill-current" />
          </div>
          <div>
            <p className="text-base font-semibold">Avaliação Enviada!</p>
            <p className="opacity-90">{state.message}</p>
          </div>
        </div>
      ) : (
        <form
          action={action}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4"
        >
          <input type="hidden" name="productId" value={productId} />

          {/* Seletor de Estrelas */}
          <div className="space-y-2">
            <Label className="text-xs text-neutral-400">Sua nota:</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-transform hover:scale-110 focus:outline-none"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={cn(
                      "h-6 w-6 transition-colors",
                      (hoverRating || rating) >= star
                        ? "fill-[#D00000] text-[#D00000]"
                        : "fill-transparent text-neutral-600",
                    )}
                  />
                </button>
              ))}
            </div>
            <input type="hidden" name="rating" value={rating} />
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-xs text-neutral-400">
              Seu comentário:
            </Label>
            <Textarea
              id="comment"
              name="comment"
              placeholder="Conte o que achou do produto..."
              className={cn(
                "min-h-[80px] resize-none border-white/10 bg-white/5 text-sm text-white placeholder:text-neutral-600 focus:border-[#D00000]/50 focus:ring-0",
                localError && "border-red-500/50 focus:border-red-500", // Adiciona borda vermelha se tiver erro
              )}
              maxLength={500}
              // Limpa o erro assim que o usuário começa a digitar novamente
              onChange={() => setLocalError("")}
            />

            {/* --- MENSAGENS DE ERRO (LOCAL E SERVIDOR) --- */}
            {localError && (
              <p className="animate-in slide-in-from-left-1 text-xs font-medium text-red-500">
                {localError}
              </p>
            )}

            {state?.errors?.comment && (
              <p className="text-xs text-red-500">{state.errors.comment[0]}</p>
            )}
          </div>

          {/* Mensagem de Erro Geral do Servidor */}
          {state?.message && !state.success && (
            <p className="text-xs text-red-500">{state.message}</p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="h-12 w-full bg-[#D00000] font-medium tracking-wide text-white duration-300 hover:-translate-y-0.5 hover:bg-[#D00000]/90"
          >
            {isPending ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </form>
      )}
    </div>
  );
}
