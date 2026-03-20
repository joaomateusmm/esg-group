"use client";

import { ImageIcon, Loader2, PackageCheck } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";

// Import da action que salva no banco
import { completeRequest } from "@/actions/provider-dashboard";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/lib/uploadthing";

export function CompleteServiceButton({ requestId }: { requestId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Estados do formulário
  const [summary, setSummary] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Botão final que chama a Server Action de conclusão
  const handleSubmit = async () => {
    if (!uploadedImageUrl) {
      toast.error("É obrigatório enviar uma foto comprovando a conclusão.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await completeRequest(requestId, summary, uploadedImageUrl);

        if (res.success) {
          toast.success(res.message);
          setIsOpen(false);
        } else {
          toast.error(res.error || "Erro ao confirmar conclusão.");
        }
      } catch (error) {
        toast.error("Ocorreu um erro inesperado.");
      }
    });
  };

  // Reseta o form caso o modal seja fechado/aberto
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSummary("");
      setUploadedImageUrl(null);
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full cursor-pointer bg-emerald-600 py-5 text-white shadow-lg hover:bg-emerald-700">
          <PackageCheck className="mr-2 h-4 w-4" /> Marcar como Concluído
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-neutral-900">
            Confirmar Conclusão
          </DialogTitle>
          <DialogDescription>
            Envie uma foto do serviço finalizado e um breve resumo para
            comprovar o seu trabalho.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Campo de Upload de Foto (Uploadthing) */}
          <div className="space-y-2">
            <Label className="font-bold text-neutral-700">
              Foto do Serviço (Obrigatório)
            </Label>

            <div className="relative flex min-h-[160px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 transition-colors">
              {/* Se a imagem já foi upada, mostra a imagem e um botão pra trocar se quiser */}
              {uploadedImageUrl ? (
                <div className="flex w-full flex-col items-center p-2">
                  <div className="relative mb-3 h-40 w-full overflow-hidden rounded-lg shadow-sm">
                    <Image
                      src={uploadedImageUrl}
                      alt="Comprovante"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadedImageUrl(null)}
                    className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    Remover e enviar outra
                  </Button>
                </div>
              ) : (
                /* Caso contrário, mostra o UploadButton nativo da Uploadthing */
                <div className="flex flex-col items-center py-6">
                  <UploadButton
                    endpoint="imageUploader"
                    onUploadBegin={() => setIsUploadingPhoto(true)}
                    onClientUploadComplete={(res) => {
                      setIsUploadingPhoto(false);
                      if (res && res[0]) {
                        setUploadedImageUrl(res[0].ufsUrl || res[0].url);
                        toast.success("Foto do comprovante enviada!");
                      }
                    }}
                    onUploadError={(error: Error) => {
                      setIsUploadingPhoto(false);
                      toast.error(`Erro: ${error.message}`);
                    }}
                    appearance={{
                      button:
                        "bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 h-10 px-6 cursor-pointer",
                      allowedContent: "text-xs text-neutral-500 mt-2",
                    }}
                    content={{
                      button({ ready }) {
                        if (ready) return "Selecionar Foto";
                        return "Carregando...";
                      },
                      allowedContent() {
                        return "JPG, PNG, WEBP (Max 4MB)";
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Campo de Resumo */}
          <div className="space-y-2">
            <Label className="font-bold text-neutral-700">
              Resumo do Serviço (Opcional)
            </Label>
            <Textarea
              placeholder="Ex: Instalação finalizada com sucesso. O ambiente foi limpo e o cliente testou."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="min-h-[100px] resize-none bg-neutral-50 focus:border-emerald-500"
            />
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending || isUploadingPhoto}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || isUploadingPhoto || !uploadedImageUrl}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="mr-2 h-4 w-4" />
              )}
              Enviar Comprovante
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
