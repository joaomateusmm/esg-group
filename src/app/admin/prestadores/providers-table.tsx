"use client";

import {
  Briefcase,
  CheckCircle,
  Eye,
  Link as LinkIcon,
  Megaphone,
  MoreHorizontal,
  Phone,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  approveProvider,
  deleteProvider,
  rejectProvider,
} from "@/actions/admin-providers";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface ProvidersTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
}

export function ProvidersTable({ data }: ProvidersTableProps) {
  const [isPending, startTransition] = useTransition();

  // Estados para o Modal de Rejeição
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [providerToReject, setProviderToReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleAction = (action: "approve" | "delete", id: string) => {
    if (
      action === "delete" &&
      !confirm("Tem certeza que deseja excluir este registro permanentemente?")
    ) {
      return;
    }

    startTransition(async () => {
      try {
        let res;
        if (action === "approve") res = await approveProvider(id);
        else res = await deleteProvider(id);

        if (res.success) {
          toast.success(res.message);
        } else {
          toast.error(res.error);
        }
      } catch {
        toast.error("Erro na operação.");
      }
    });
  };

  const handleRejectSubmit = () => {
    if (!providerToReject) return;

    // Validação básica do motivo
    if (rejectionReason.trim().length < 10) {
      toast.error(
        "Por favor, forneça um motivo mais detalhado (mín. 10 caracteres).",
      );
      return;
    }

    startTransition(async () => {
      try {
        // Agora passamos o motivo para a Action
        const res = await rejectProvider(providerToReject, rejectionReason);

        if (res.success) {
          toast.success(res.message);
          setIsRejectModalOpen(false);
          setRejectionReason("");
          setProviderToReject(null);
        } else {
          toast.error(res.error);
        }
      } catch {
        toast.error("Erro na operação de rejeição.");
      }
    });
  };

  const openRejectModal = (id: string) => {
    setProviderToReject(id);
    setRejectionReason(""); // Limpa o motivo anterior
    setIsRejectModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="destructive"
            className="border-red-200 bg-red-100 text-red-700 hover:bg-red-100"
          >
            Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-yellow-200 bg-yellow-50 text-yellow-700"
          >
            Pendente
          </Badge>
        );
    }
  };

  const stopPropagation = (
    e: React.UIEvent | React.TouchEvent | React.WheelEvent,
  ) => {
    e.stopPropagation();
  };

  return (
    <>
      <div className="rounded-md border border-neutral-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow>
              <TableHead>Prestador</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Experiência</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-neutral-500"
                >
                  Nenhuma solicitação encontrada.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-neutral-900">
                        {item.user?.name || "Sem Nome"}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {item.user?.email || "Sem Email"}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {item.phone} • {item.location}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.category?.name || "Sem Categoria"}
                  </TableCell>
                  <TableCell>{item.experienceYears} anos</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Modal de Ver Detalhes */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-neutral-100 hover:text-orange-600"
                            title="Ver Cadastro Completo"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        {/* - max-w-4xl (MUITO MAIOR que o padrão)
                           - p-0 (Tirei o padding do Content pra colocar a div scrollável dentro preenchendo tudo)
                        */}
                        <DialogContent
                          className="flex max-h-[90vh] w-full max-w-[95vw] flex-col overflow-hidden border-neutral-200 bg-white p-0 text-neutral-900 shadow-xl md:max-w-3xl lg:max-w-4xl"
                          onWheel={stopPropagation}
                          onTouchMove={stopPropagation}
                        >
                          {/* Header Fixo no topo do Modal */}
                          <DialogHeader className="border-b border-neutral-100 p-6 pb-4">
                            <DialogTitle className="text-2xl font-bold">
                              Ficha de Cadastro: {item.user?.name}
                            </DialogTitle>
                            <DialogDescription>
                              Revise todas as informações enviadas pelo
                              candidato antes de aprovar.
                            </DialogDescription>
                          </DialogHeader>

                          {/* Div Rolável Interna (Com a solução do Scroll) */}
                          <div
                            className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-200 hover:scrollbar-thumb-neutral-300 flex-1 overflow-y-auto p-6"
                            onWheel={stopPropagation}
                            onTouchMove={stopPropagation}
                            data-lenis-prevent="true"
                            data-scroll-lock-scrollable
                            style={{
                              scrollbarWidth: "thin",
                              WebkitOverflowScrolling: "touch",
                            }}
                          >
                            <div className="grid gap-8 pb-4">
                              {/* DADOS PROFISSIONAIS E CONTATO */}
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-4 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                                  <h4 className="flex items-center gap-2 border-b border-neutral-200 pb-2 font-semibold text-neutral-800">
                                    <Briefcase className="h-4 w-4 text-orange-600" />{" "}
                                    Profissional
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <p>
                                      <span className="font-medium text-neutral-500">
                                        Categoria:
                                      </span>{" "}
                                      {item.category?.name}
                                    </p>
                                    <p>
                                      <span className="font-medium text-neutral-500">
                                        Experiência:
                                      </span>{" "}
                                      {item.experienceYears} anos
                                    </p>
                                    <p>
                                      <span className="font-medium text-neutral-500">
                                        Escolaridade:
                                      </span>{" "}
                                      {item.educationLevel || "Não informado"}
                                    </p>
                                    {item.portfolioUrl && (
                                      <p className="flex items-center gap-1">
                                        <span className="font-medium text-neutral-500">
                                          Portfólio:
                                        </span>
                                        <a
                                          href={item.portfolioUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center gap-1 text-orange-600 hover:underline"
                                        >
                                          Link <LinkIcon className="h-3 w-3" />
                                        </a>
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-4 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                                  <h4 className="flex items-center gap-2 border-b border-neutral-200 pb-2 font-semibold text-neutral-800">
                                    <Phone className="h-4 w-4 text-orange-600" />{" "}
                                    Contato e Local
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <p>
                                      <span className="font-medium text-neutral-500">
                                        Email:
                                      </span>{" "}
                                      {item.user?.email}
                                    </p>
                                    <p>
                                      <span className="font-medium text-neutral-500">
                                        Telefone:
                                      </span>{" "}
                                      {item.phone}
                                    </p>
                                    <p>
                                      <span className="font-medium text-neutral-500">
                                        Região Base:
                                      </span>{" "}
                                      {item.location}
                                    </p>
                                    <p>
                                      <span className="font-medium text-neutral-500">
                                        Endereço Residencial:
                                      </span>{" "}
                                      {item.detailedAddress || "Não informado"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* BIO / APRESENTAÇÃO */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-neutral-800">
                                  Sobre o Profissional
                                </h4>
                                <p className="rounded-md border border-neutral-200 bg-white p-4 text-sm whitespace-pre-wrap text-neutral-600">
                                  {item.bio}
                                </p>
                              </div>

                              <Separator />

                              {/* DADOS EXTRAS DE PESQUISA E CONTATOS */}
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-4 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                                  <h4 className="flex items-center gap-2 border-b border-neutral-200 pb-2 font-semibold text-neutral-800">
                                    <Megaphone className="h-4 w-4 text-orange-600" />{" "}
                                    Pesquisa
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <p>
                                      <span className="font-medium text-neutral-500">
                                        Como conheceu a ESG?
                                      </span>{" "}
                                      <br />
                                      {item.howDidYouHear || "Não informado"}
                                    </p>
                                    {item.howDidYouHear === "Indicacao" &&
                                      item.referralName && (
                                        <p>
                                          <span className="font-medium text-neutral-500">
                                            Indicado por:
                                          </span>{" "}
                                          <br />
                                          {item.referralName}
                                        </p>
                                      )}
                                  </div>
                                </div>

                                <div className="space-y-4 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                                  <h4 className="flex items-center gap-2 border-b border-neutral-200 pb-2 font-semibold text-neutral-800">
                                    <Users className="h-4 w-4 text-orange-600" />{" "}
                                    Contatos Locais
                                  </h4>
                                  <div className="text-sm whitespace-pre-wrap text-neutral-600">
                                    {item.localContacts ||
                                      "Nenhum contato informado."}
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              {/* DOCUMENTAÇÃO */}
                              <div className="space-y-4">
                                <h4 className="font-semibold text-neutral-800">
                                  Documentação Pessoal (Segurança)
                                </h4>
                                <div className="grid gap-6 md:grid-cols-2">
                                  {/* Frente */}
                                  <div className="space-y-2">
                                    <span className="text-sm font-medium text-neutral-500">
                                      1. Frente
                                    </span>
                                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                                      {item.documentUrlFront ? (
                                        <a
                                          href={item.documentUrlFront}
                                          target="_blank"
                                          rel="noreferrer"
                                          title="Clique para ampliar"
                                          className="block h-full w-full"
                                        >
                                          <Image
                                            src={item.documentUrlFront}
                                            alt="Frente do Documento"
                                            fill
                                            className="cursor-pointer object-cover transition-transform hover:scale-105"
                                          />
                                        </a>
                                      ) : (
                                        <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                                          Não enviado
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Verso */}
                                  <div className="space-y-2">
                                    <span className="text-sm font-medium text-neutral-500">
                                      2. Verso
                                    </span>
                                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                                      {item.documentUrlBack ? (
                                        <a
                                          href={item.documentUrlBack}
                                          target="_blank"
                                          rel="noreferrer"
                                          title="Clique para ampliar"
                                          className="block h-full w-full"
                                        >
                                          <Image
                                            src={item.documentUrlBack}
                                            alt="Verso do Documento"
                                            fill
                                            className="cursor-pointer object-cover transition-transform hover:scale-105"
                                          />
                                        </a>
                                      ) : (
                                        <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                                          Não enviado
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* BOTOES DE AÇÃO DENTRO DA FICHA */}
                              {(item.status === "pending" ||
                                item.status === "rejected") && (
                                <div className="mt-4 flex flex-col items-center justify-center gap-4 border-t border-neutral-100 pt-6 sm:flex-row">
                                  {item.status !== "rejected" && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => openRejectModal(item.id)}
                                      disabled={isPending}
                                      className="w-full cursor-pointer border-red-300 bg-red-600 text-white hover:bg-red-700 hover:text-white sm:w-auto"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />{" "}
                                      Rejeitar Cadastro
                                    </Button>
                                  )}

                                  {item.status !== "approved" && (
                                    <Button
                                      type="button"
                                      onClick={() =>
                                        handleAction("approve", item.id)
                                      }
                                      disabled={isPending}
                                      className="w-full cursor-pointer border border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />{" "}
                                      Aprovar Cadastro
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Menu de Ações Rápidas da Tabela */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="border-neutral-200 bg-white"
                        >
                          <DropdownMenuLabel>Mudar Status</DropdownMenuLabel>

                          {/* Aprovar */}
                          {item.status !== "approved" && (
                            <DropdownMenuItem
                              onClick={() => handleAction("approve", item.id)}
                              disabled={isPending}
                              className="cursor-pointer text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                              Cadastro
                            </DropdownMenuItem>
                          )}

                          {/* Rejeitar */}
                          {item.status !== "rejected" && (
                            <DropdownMenuItem
                              onClick={() => openRejectModal(item.id)}
                              disabled={isPending}
                              className="cursor-pointer text-orange-600 focus:bg-orange-50 focus:text-orange-700"
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Rejeitar
                              Cadastro
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator className="bg-neutral-100" />

                          {/* Excluir */}
                          <DropdownMenuItem
                            onClick={() => handleAction("delete", item.id)}
                            disabled={isPending}
                            className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir Registro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL DE REJEIÇÃO */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="border-neutral-200 bg-white text-neutral-900 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rejeitar Cadastro</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O prestador verá essa mensagem em
              seu painel para que possa corrigir o problema e tentar novamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Ex: A foto do documento enviada está ilegível ou cortada. Por favor, envie novamente."
              className="col-span-4 min-h-[100px] border-neutral-200 focus:border-orange-500"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectModalOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleRejectSubmit}
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isPending ? "Processando..." : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
