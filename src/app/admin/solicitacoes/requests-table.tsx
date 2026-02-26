"use client";

import {
  Briefcase,
  Calendar,
  CreditCard,
  Eye,
  FileText,
  Fingerprint,
  IdCard,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteRequest } from "@/actions/admin-requests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

interface RequestsTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
}

export function RequestsTable({ data }: RequestsTableProps) {
  const [isPending, startTransition] = useTransition();

  // CORREÇÃO: Adicionado 'selectedRequest' para o destructuring do array funcionar corretamente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const handleDelete = (id: string) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir esta solicitação permanentemente?",
      )
    )
      return;

    startTransition(async () => {
      try {
        const res = await deleteRequest(id);
        if (res.success) {
          toast.success(res.message);
        } else {
          toast.error(res.error);
        }
      } catch {
        toast.error("Erro ao excluir.");
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-yellow-200 bg-yellow-50 text-yellow-700"
          >
            Aguardando
          </Badge>
        );
      case "accepted":
      case "in_progress":
        return (
          <Badge className="border-blue-200 bg-blue-100 text-blue-700 hover:bg-blue-100">
            Em Andamento
          </Badge>
        );
      case "completed":
        return (
          <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Concluído
          </Badge>
        );
      case "rejected":
      case "canceled":
        return (
          <Badge
            variant="destructive"
            className="border-red-200 bg-red-100 text-red-700 hover:bg-red-100"
          >
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Função para formatar o preço na tabela
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format((value || 0) / 100);
  };

  // Função essencial para o scroll funcionar corretamente sem travar o fundo
  const stopPropagation = (
    e: React.UIEvent | React.TouchEvent | React.WheelEvent,
  ) => {
    e.stopPropagation();
  };

  return (
    <div className="rounded-md border border-neutral-200 bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-neutral-50">
          <TableRow>
            <TableHead className="pl-6">Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Prestador</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Pagto.</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-8 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="h-24 text-center text-neutral-500"
              >
                Nenhuma solicitação encontrada.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow className="px-8" key={item.id}>
                <TableCell className="pl-6 text-xs text-neutral-500">
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-medium">
                  {item.customer.name}
                </TableCell>
                <TableCell>{item.provider.user.name}</TableCell>
                <TableCell>{item.category.name}</TableCell>

                {/* MOSTRA O VALOR */}
                <TableCell className="font-semibold text-orange-600">
                  {formatCurrency(item.amount)}
                </TableCell>

                {/* MOSTRA O STATUS DO PAGAMENTO */}
                <TableCell>
                  {item.paymentStatus === "succeeded" ? (
                    <Badge className="border-green-200 bg-green-100 text-green-700 hover:bg-green-100">
                      Pago
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-neutral-500">
                      Pendente
                    </Badge>
                  )}
                </TableCell>

                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell className="pr-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* MODAL DE DETALHES COMPLETO */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedRequest(item)}
                        >
                          <Eye className="h-4 w-4 text-neutral-500" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent
                        className="flex max-h-[90vh] w-full max-w-[95vw] flex-col overflow-hidden border-neutral-200 bg-white p-0 text-neutral-900 shadow-xl md:max-w-3xl lg:max-w-4xl"
                        onWheel={stopPropagation}
                        onTouchMove={stopPropagation}
                      >
                        {/* Header Fixo no topo do Modal */}
                        <DialogHeader className="border-b border-neutral-100 p-6 pb-4">
                          <DialogTitle className="text-xl">
                            Detalhes da Solicitação
                          </DialogTitle>
                          <DialogDescription className="text-xs">
                            ID do Banco:{" "}
                            <span className="font-mono">{item.id}</span>
                          </DialogDescription>
                        </DialogHeader>

                        {/* Div Rolável Interna com solução custom de Scroll */}
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
                          <div className="space-y-6 pb-4">
                            {/* BLOCO 1: Status e Valores */}
                            <div className="grid grid-cols-2 gap-4 rounded-lg border border-neutral-100 bg-neutral-50 p-4 sm:grid-cols-4">
                              <div>
                                <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-neutral-500">
                                  <Briefcase className="h-3 w-3" /> Logística
                                </p>
                                {getStatusBadge(item.status)}
                              </div>
                              <div>
                                <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-neutral-500">
                                  <CreditCard className="h-3 w-3" /> Pagamento
                                </p>
                                {item.paymentStatus === "succeeded" ? (
                                  <Badge className="border-green-200 bg-green-100 text-green-700">
                                    Aprovado (Stripe)
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-neutral-500"
                                  >
                                    Aguardando
                                  </Badge>
                                )}
                              </div>
                              <div>
                                <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-neutral-500">
                                  <Calendar className="h-3 w-3" /> Data
                                </p>
                                <span className="text-xs font-medium">
                                  {new Date(item.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-neutral-500">
                                  Valor Cobrado
                                </p>
                                <span className="text-lg font-bold text-orange-600">
                                  {formatCurrency(item.amount)}
                                </span>
                              </div>
                            </div>

                            {/* Stripe ID */}
                            {item.stripePaymentIntentId && (
                              <div className="text-xs text-neutral-400">
                                <span className="font-semibold text-neutral-500">
                                  Stripe Intent ID:
                                </span>{" "}
                                <span className="font-mono">
                                  {item.stripePaymentIntentId}
                                </span>
                              </div>
                            )}

                            <Separator />

                            {/* BLOCO 2: ENVOLVIDOS (CARTÕES VERTICAIS) */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                              {/* CARTÃO CLIENTE */}
                              <div className="flex flex-col items-center rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
                                <h4 className="mb-6 flex w-full items-center justify-center gap-2 border-b border-neutral-100 pb-3 text-xs font-bold tracking-wider text-neutral-900 uppercase">
                                  <User className="h-4 w-4 text-orange-600" />{" "}
                                  Perfil do Cliente
                                </h4>

                                <div className="mb-6 flex flex-col items-center gap-3">
                                  {item.customer.image ? (
                                    <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-orange-50 shadow-sm">
                                      <Image
                                        src={item.customer.image}
                                        alt="Cliente"
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-3xl font-bold text-orange-600 shadow-sm">
                                      {item.customer.name.charAt(0)}
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-xl font-bold text-neutral-900">
                                      {item.customer.name}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-auto w-full space-y-3 rounded-lg bg-neutral-50 p-4 text-left text-sm text-neutral-700">
                                  <p className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 shrink-0 text-orange-500" />
                                    <span className="truncate">
                                      {item.customer.email}
                                    </span>
                                  </p>
                                  <p className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 shrink-0 text-orange-500" />
                                    <span>
                                      {(() => {
                                        const phone = item.contactPhone || "";
                                        const cleaned = phone.replace(
                                          /\D/g,
                                          "",
                                        );

                                        if (cleaned.length === 11)
                                          return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
                                        if (cleaned.length === 10)
                                          return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
                                        if (cleaned.length === 13)
                                          return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
                                        if (cleaned.length === 12)
                                          return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;

                                        return phone;
                                      })()}
                                    </span>
                                  </p>
                                  <p className="flex items-center gap-3">
                                    <Fingerprint className="h-4 w-4 shrink-0 text-orange-500" />
                                    <span className="font-mono text-xs break-all text-neutral-500">
                                      {item.customer.id}
                                    </span>
                                  </p>
                                </div>
                              </div>

                              {/* CARTÃO PRESTADOR */}
                              <div className="flex flex-col items-center rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
                                <h4 className="mb-6 flex w-full items-center justify-center gap-2 border-b border-neutral-100 pb-3 text-xs font-bold tracking-wider text-neutral-900 uppercase">
                                  <Briefcase className="h-4 w-4 text-orange-600" />{" "}
                                  Perfil do Prestador
                                </h4>

                                <div className="mb-6 flex flex-col items-center gap-3">
                                  {item.provider.user.image ? (
                                    <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-orange-50 shadow-sm">
                                      <Image
                                        src={item.provider.user.image}
                                        alt="Prestador"
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-3xl font-bold text-orange-600 shadow-sm">
                                      {item.provider.user.name.charAt(0)}
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-xl font-bold text-neutral-900">
                                      {item.provider.user.name}
                                    </p>
                                    <Badge className="mt-2 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-50">
                                      {item.category.name}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="mt-auto w-full space-y-3 rounded-lg bg-neutral-50 p-4 text-left text-sm text-neutral-700">
                                  <p className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 shrink-0 text-orange-500" />
                                    <span className="truncate">
                                      {item.provider.user.email}
                                    </span>
                                  </p>
                                  <p className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 shrink-0 text-orange-500" />
                                    <span>
                                      {(() => {
                                        const phone = item.provider.phone || "";
                                        const cleaned = phone.replace(
                                          /\D/g,
                                          "",
                                        );

                                        if (cleaned.length === 11)
                                          return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
                                        if (cleaned.length === 10)
                                          return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
                                        if (cleaned.length === 13)
                                          return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
                                        if (cleaned.length === 12)
                                          return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;

                                        return phone;
                                      })()}
                                    </span>
                                  </p>
                                  <p className="flex items-center gap-3">
                                    <Fingerprint className="h-4 w-4 shrink-0 text-orange-500" />
                                    <span className="font-mono text-xs break-all text-neutral-500">
                                      {item.provider.id}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {/* BLOCO 3: Documentos do Prestador */}
                            <div className="space-y-3">
                              <h4 className="flex items-center gap-2 font-semibold text-neutral-900">
                                <IdCard className="h-4 w-4 text-orange-600" />{" "}
                                Documentos de Verificação (Prestador)
                              </h4>
                              <div className="flex flex-wrap gap-4">
                                {item.provider.documentUrlFront ? (
                                  <a
                                    href={item.provider.documentUrlFront}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group relative block h-28 w-44 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 shadow-sm transition-opacity hover:opacity-80"
                                  >
                                    <Image
                                      src={item.provider.documentUrlFront}
                                      alt="Doc Frente"
                                      fill
                                      className="object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                      <Eye className="h-6 w-6 text-white" />
                                    </div>
                                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                                      Frente
                                    </span>
                                  </a>
                                ) : (
                                  <div className="flex h-28 w-44 items-center justify-center rounded-md border border-dashed border-neutral-200 bg-neutral-50 text-xs text-neutral-400">
                                    Frente ñ enviada
                                  </div>
                                )}

                                {item.provider.documentUrlBack ? (
                                  <a
                                    href={item.provider.documentUrlBack}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group relative block h-28 w-44 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 shadow-sm transition-opacity hover:opacity-80"
                                  >
                                    <Image
                                      src={item.provider.documentUrlBack}
                                      alt="Doc Verso"
                                      fill
                                      className="object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                      <Eye className="h-6 w-6 text-white" />
                                    </div>
                                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                                      Verso
                                    </span>
                                  </a>
                                ) : (
                                  <div className="flex h-28 w-44 items-center justify-center rounded-md border border-dashed border-neutral-200 bg-neutral-50 text-xs text-neutral-400">
                                    Verso ñ enviado
                                  </div>
                                )}
                              </div>
                            </div>

                            <Separator />

                            {/* BLOCO 4: Serviço a ser feito */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="mb-2 flex items-center gap-2 font-semibold text-neutral-900">
                                  <MapPin className="h-4 w-4 text-orange-600" />{" "}
                                  Endereço do Serviço
                                </h4>
                                <p className="text-sm text-neutral-700">
                                  {item.address}
                                </p>
                              </div>
                              <div>
                                <h4 className="mb-2 flex items-center gap-2 font-semibold text-neutral-900">
                                  <FileText className="h-4 w-4 text-orange-600" />{" "}
                                  Descrição do Problema
                                </h4>
                                <div className="rounded-md border border-orange-200 bg-orange-50 p-4 text-sm text-neutral-800 italic shadow-inner">
                                  &quot;{item.description}&quot;
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Menu de Ações (Excluir) */}
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
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.id)}
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
  );
}
