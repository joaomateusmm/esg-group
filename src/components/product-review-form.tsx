"use client";

import { Star } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
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

const MAX_CHARS = 155;

export function ProductReviewForm({ productId }: ProductReviewFormProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, action, isPending] = useActionState<any, FormData>(
    createReviewAction,
    initialState,
  );

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [localError, setLocalError] = useState("");
  const [commentText, setCommentText] = useState("");

  // Referência para o formulário para podermos enviar automaticamente
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast.success(state.message);
        setLocalError("");
        setCommentText("");
      } else if (!state.success && state.message) {
        toast.error(state.message);
      }
    }
  }, [state]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Validação básica antes de enviar
    setLocalError("");

    if (commentText.length > MAX_CHARS) {
      e.preventDefault(); // Impede o envio se estiver muito longo
      const msg = `O comentário excede o limite de ${MAX_CHARS} caracteres.`;
      toast.error(msg);
      setLocalError(msg);
      return;
    }
    // Se passar, a action server-side (createReviewAction) será chamada normalmente
  };

  // Função para preencher e enviar comentário rápido
  const handleQuickComment = (text: string) => {
    setCommentText(text);
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    }, 0);
  };

  return (
    // ESTILO: Fundo branco e borda suave
    <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm duration-200 hover:shadow-md">
      {state?.success ? (
        <div className="animate-in fade-in zoom-in flex flex-col items-center justify-center gap-2 rounded-lg border border-green-100 bg-green-50 p-6 text-center text-sm text-green-700 duration-300">
          <div className="rounded-full bg-white p-2 shadow-sm ring-1 ring-green-100">
            <div className="flex gap-1">
              {Array.from({ length: rating }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-orange-400 text-orange-400"
                />
              ))}
            </div>
          </div>
          <div>
            <p className="font-bold text-green-800">Obrigado por Avaliar!</p>
            <p className="text-green-600 opacity-90">{state.message}</p>
          </div>
        </div>
      ) : (
        <form
          ref={formRef}
          action={action}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5"
        >
          <input type="hidden" name="productId" value={productId} />

          {/* Seletor de Estrelas */}
          <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border border-dashed bg-orange-50 py-4">
            <Label className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
              Sua nota
            </Label>
            <div className="flex gap-2">
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
                      "h-8 w-8 transition-all duration-200",
                      (hoverRating || rating) >= star
                        ? "fill-orange-500 text-orange-500 drop-shadow-sm"
                        : "fill-neutral-100 text-neutral-300",
                    )}
                  />
                </button>
              ))}
            </div>
            <input type="hidden" name="rating" value={rating} />
            <p className="h-4 text-xs font-medium text-orange-600">
              {(hoverRating || rating) === 5 && "Excelente!"}
              {(hoverRating || rating) === 4 && "Muito Bom"}
              {(hoverRating || rating) === 3 && "Bom"}
              {(hoverRating || rating) === 2 && "Razoável"}
              {(hoverRating || rating) === 1 && "Ruim"}
            </p>
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <Label
                htmlFor="comment"
                className="text-sm font-medium text-neutral-700"
              >
                Seu comentário
                <span className="ml-1 text-xs font-normal text-neutral-400">
                  (Opcional)
                </span>
              </Label>
              <span
                className={cn(
                  "text-[10px] transition-colors",
                  commentText.length >= MAX_CHARS
                    ? "font-bold text-red-500"
                    : "text-neutral-400",
                )}
              >
                {commentText.length} / {MAX_CHARS}
              </span>
            </div>

            <Textarea
              id="comment"
              name="comment"
              placeholder="O que você achou do produto? Conte detalhes..."
              className={cn(
                "min-h-[100px] resize-none border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500",
                localError &&
                  "border-red-500 focus:border-red-500 focus:ring-red-500",
              )}
              maxLength={MAX_CHARS}
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
                setLocalError("");
              }}
            />

            {localError && (
              <p className="animate-in slide-in-from-left-1 text-xs font-medium text-red-500">
                {localError}
              </p>
            )}

            {state?.errors?.comment && (
              <p className="text-xs text-red-500">{state.errors.comment[0]}</p>
            )}
          </div>

          {state?.message && !state.success && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {state.message}
            </div>
          )}

          {/* Comentários Rápidos */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-neutral-400">
              Comentários Rápidos:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickComment("Fácil e rápido, gostei da loja.")
                }
                className="cursor-pointer rounded-full bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-200 active:scale-95"
              >
                Fácil e rápido, gostei da loja.
              </button>
              <button
                type="button"
                onClick={() => handleQuickComment("Muito fácil de comprar.")}
                className="cursor-pointer rounded-full bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-200 active:scale-95"
              >
                Muito fácil de comprar.
              </button>
              <button
                type="button"
                onClick={() => handleQuickComment("Gostei da loja.")}
                className="cursor-pointer rounded-full bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-200 active:scale-95"
              >
                Gostei da loja.
              </button>
              <button
                type="button"
                onClick={() => handleQuickComment("Gostei da loja.")}
                className="cursor-pointer rounded-full bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-200 active:scale-95"
              >
                Muito bom.
              </button>
              <button
                type="button"
                onClick={() => handleQuickComment("Gostei da loja.")}
                className="cursor-pointer rounded-full bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-200 active:scale-95"
              >
                Produto chegou ótimo, obrigado.
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="h-11 w-full bg-orange-600 font-bold text-white shadow-sm transition-all hover:bg-orange-700 hover:shadow active:scale-[0.98]"
          >
            {isPending ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </form>
      )}
    </div>
  );
}
