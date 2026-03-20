"use client";

import { Loader2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

// ATENÇÃO: Ajuste o import da sua action
import { rejectRequest } from "@/actions/provider-dashboard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function RejectServiceButton({ requestId }: { requestId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Por favor, informe um motivo para a recusa.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await rejectRequest(requestId, reason);

        if (res.success) {
          toast.success(res.message);
          setIsOpen(false);
        } else {
          toast.error(res.error || "Erro ao recusar solicitação.");
        }
      } catch (error) {
        toast.error("Ocorreu um erro inesperado.");
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) setReason("");
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full cursor-pointer bg-neutral-800 py-5 text-white shadow-md duration-300 hover:bg-neutral-950 active:scale-95">
          <X className="mr-1 h-4 w-4" />
          Recusar Serviço
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-neutral-900">
            Recusar Solicitação
          </DialogTitle>
          <DialogDescription>
            Por favor, informe o motivo pelo qual você não pode realizar este
            serviço no momento. Isso será repassado ao cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Ex: Não tenho disponibilidade nessa data, a distância é muito longa, etc..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] resize-none bg-neutral-50"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              disabled={isPending || !reason.trim()}
              className="bg-neutral-900 ml-2 text-white hover:bg-black"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
