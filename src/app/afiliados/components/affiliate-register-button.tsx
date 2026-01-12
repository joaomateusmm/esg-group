"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner"; // Usando sonner para feedback melhor

import { registerAffiliate } from "@/actions/affiliate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShinyButton } from "@/components/ui/shiny-button";
import { authClient } from "@/lib/auth-client"; // Importar authClient

export function AffiliateRegisterButton() {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Hook para verificar sessão no cliente
  const { data: session } = authClient.useSession();

  const router = useRouter();

  // Estados do formulário
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);

  // Validação simples
  const isValid = name.length > 2 && email.length > 5 && check1 && check2;

  // Função chamada ao clicar no botão PRINCIPAL (antes do modal)
  const handleOpenModal = () => {
    if (!session) {
      toast.error("Você precisa estar logado para se tornar um afiliado.");
      // Opcional: Redirecionar para login
      // router.push("/login");
      return;
    }
    setIsOpen(true);
  };

  const handleRegister = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!isValid) return;

    setLoading(true);
    try {
      const res = await registerAffiliate();

      if (res.success && res.redirectUrl) {
        toast.success("Painel criado com sucesso!");
        router.push(res.redirectUrl);
      } else {
        setIsOpen(false);
        const errorMessage =
          (res as { message?: string }).message || "Erro ao criar conta.";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar solicitação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Removemos o 'asChild' do Trigger e controlamos manualmente o onClick 
        para verificar o login ANTES de abrir o modal.
      */}
      <AlertDialogTrigger
        asChild
        onClick={(e) => {
          e.preventDefault(); // Impede abertura automática
          handleOpenModal();
        }}
      >
        <ShinyButton className="w-full rounded-lg bg-white px-8 py-4 font-bold text-black transition-colors hover:bg-neutral-200 disabled:opacity-50">
          Tornar-se Afiliado
        </ShinyButton>
      </AlertDialogTrigger>

      <AlertDialogContent className="border border-white/10 bg-[#0A0A0A] text-white sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-clash-display text-2xl font-bold">
            Cadastro de Afiliado
          </AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-400">
            Preencha seus dados abaixo para ativar seu painel de parceiro.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* --- FORMULÁRIO VISUAL --- */}
        <div className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-white">
              Nome Completo
            </Label>
            <Input
              id="name"
              placeholder="Digite seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-neutral-600 focus:border-[#D00000] focus:ring-0"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-white">
              E-mail Comercial
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-neutral-600 focus:border-[#D00000] focus:ring-0"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms1"
                checked={check1}
                onCheckedChange={(checked) => setCheck1(checked as boolean)}
                className="border-white/30 data-[state=checked]:border-[#D00000] data-[state=checked]:bg-[#D00000]"
              />
              <Label
                htmlFor="terms1"
                className="cursor-pointer text-sm leading-none font-normal text-neutral-400 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Estou ciente dos valores e regras do programa
                de afiliados SubMind.
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms2"
                checked={check2}
                onCheckedChange={(checked) => setCheck2(checked as boolean)}
                className="border-white/30 data-[state=checked]:border-[#D00000] data-[state=checked]:bg-[#D00000]"
              />
              <Label
                htmlFor="terms2"
                className="cursor-pointer text-sm leading-none font-normal text-neutral-400 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Concordo com os Termos de Uso e Política de Privacidade da
                plataforma.
              </Label>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/10 hover:text-white">
            Cancelar
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleRegister}
            disabled={!isValid || loading}
            className="bg-[#D00000] text-white hover:bg-[#a00000] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando
                Painel...
              </>
            ) : (
              "Confirmar Cadastro"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
