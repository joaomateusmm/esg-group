"use client";

import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

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
import { Separator } from "@/components/ui/separator";

interface ClientServicesListProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
}

export function ClientServicesList({ data }: ClientServicesListProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="border-yellow-200 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Aguardando Prestador
          </Badge>
        );
      case "accepted":
      case "in_progress":
        return (
          <Badge className="border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Em Andamento
          </Badge>
        );
      case "completed":
        return (
          <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            Concluído
          </Badge>
        );
      case "canceled":
      case "rejected":
        return (
          <Badge
            variant="destructive"
            className="border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
          >
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format((value || 0) / 100);
  };

  // Previne travamento de rolagem no Modal
  const stopPropagation = (
    e: React.UIEvent | React.TouchEvent | React.WheelEvent,
  ) => {
    e.stopPropagation();
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white py-20 text-center shadow-sm">
        <Clock className="mb-4 h-12 w-12 text-neutral-300" />
        <h3 className="text-xl font-bold text-neutral-900">
          Você ainda não contratou serviços
        </h3>
        <p className="mt-2 text-neutral-500">
          Quando você contratar um profissional, o pedido aparecerá aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data.map((order) => (
        <div
          key={order.id}
          className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
        >
          {/* Topo do Card */}
          <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-5 py-4">
            <Badge
              variant="outline"
              className="border-orange-200 bg-orange-50 text-[10px] font-bold tracking-wider text-orange-700 uppercase"
            >
              {order.category.name}
            </Badge>
            <span className="text-xs font-medium text-neutral-500">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Corpo do Card */}
          <div className="flex flex-1 flex-col p-5">
            <div className="mb-4 flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-neutral-100 shadow-sm">
                {order.provider.user.image ? (
                  <Image
                    src={order.provider.user.image}
                    alt="Prestador"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-xl font-bold text-neutral-400">
                    {order.provider.user.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase">
                  Profissional
                </p>
                <h3 className="text-lg leading-tight font-bold text-neutral-900">
                  {order.provider.user.name}
                </h3>
              </div>
            </div>

            <div className="mb-6 space-y-2 rounded-xl bg-neutral-50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Status:</span>
                {getStatusBadge(order.status)}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Pagamento:</span>
                {order.paymentStatus === "succeeded" ? (
                  <span className="flex items-center gap-1 font-bold text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> Pago
                  </span>
                ) : (
                  <span className="font-bold text-yellow-600">Pendente</span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Valor:</span>
                <span className="font-bold text-neutral-900">
                  {formatCurrency(order.amount)}
                </span>
              </div>
            </div>

            {/* Modal de Detalhes */}
            <div className="mt-auto">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-orange-600"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="h-4 w-4" />
                    Ver Detalhes Completos
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="flex max-h-[90vh] w-full max-w-[95vw] flex-col overflow-hidden border-neutral-200 bg-white p-0 text-neutral-900 shadow-xl md:max-w-2xl lg:max-w-3xl"
                  onWheel={stopPropagation}
                  onTouchMove={stopPropagation}
                >
                  <DialogHeader className="border-b border-neutral-100 p-6 pb-4">
                    <DialogTitle className="text-xl">
                      Detalhes da Contratação
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Código do Pedido:{" "}
                      <span className="font-mono">{order.id}</span>
                    </DialogDescription>
                  </DialogHeader>

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
                      {/* STATUS GERAL */}
                      <div className="grid grid-cols-2 gap-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4 sm:grid-cols-4">
                        <div>
                          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-neutral-500">
                            <Briefcase className="h-3 w-3" /> Serviço
                          </p>
                          {getStatusBadge(order.status)}
                        </div>
                        <div>
                          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-neutral-500">
                            <CreditCard className="h-3 w-3" /> Pagamento
                          </p>
                          {order.paymentStatus === "succeeded" ? (
                            <Badge className="border-green-200 bg-green-100 text-green-700">
                              Aprovado
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-neutral-500"
                            >
                              Pendente
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-neutral-500">
                            <Calendar className="h-3 w-3" /> Solicitado em
                          </p>
                          <span className="text-sm font-medium">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-neutral-500">
                            Valor Pago
                          </p>
                          <span className="text-lg font-bold text-orange-600">
                            {formatCurrency(order.amount)}
                          </span>
                        </div>
                      </div>

                      <Separator />

                      {/* DADOS DO PRESTADOR */}
                      <div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                        <h4 className="mb-6 flex w-full items-center gap-2 border-b border-neutral-100 pb-3 text-xs font-bold tracking-wider text-neutral-900 uppercase">
                          <User className="h-4 w-4 text-orange-600" />
                          Profissional Responsável
                        </h4>

                        <div className="mb-6 flex items-center gap-4">
                          {/* CORREÇÃO AQUI: Trocado <img> por <Image> */}
                          {order.provider.user.image ? (
                            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-orange-50 shadow-sm">
                              <Image
                                src={order.provider.user.image}
                                alt="Prestador"
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-2xl font-bold text-orange-600 shadow-sm">
                              {order.provider.user.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-xl font-bold text-neutral-900">
                              {order.provider.user.name}
                            </p>
                            <Badge className="mt-1 border-orange-200 bg-orange-50 text-orange-700">
                              {order.category.name}
                            </Badge>
                          </div>
                        </div>

                        {/* Só exibe os dados se o pagamento já foi aprovado */}
                        {order.paymentStatus === "succeeded" ? (
                          <div className="grid gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 text-sm text-neutral-700">
                            <p className="mb-1 text-xs font-bold tracking-wider text-emerald-800 uppercase">
                              Dados de Contato Liberados
                            </p>
                            <p className="flex items-center gap-3">
                              <Phone className="h-4 w-4 shrink-0 text-emerald-600" />
                              <span className="font-medium">
                                {(() => {
                                  const phone = order.provider.phone || "";
                                  const cleaned = phone.replace(/\D/g, "");
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
                              <Mail className="h-4 w-4 shrink-0 text-emerald-600" />
                              <span className="font-medium">
                                {order.provider.user.email}
                              </span>
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4 text-center text-sm text-neutral-500 italic">
                            Os dados de contato do profissional serão liberados
                            após a confirmação do pagamento.
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* INFORMAÇÕES DO SERVIÇO */}
                      <div className="space-y-4">
                        <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-neutral-900 uppercase">
                          <MapPin className="h-4 w-4 text-orange-600" /> O que
                          foi solicitado
                        </h4>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                            <p className="mb-1 text-xs font-semibold text-neutral-400 uppercase">
                              Endereço de Atendimento
                            </p>
                            <p className="text-sm text-neutral-800">
                              {order.address}
                            </p>
                          </div>

                          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                            <p className="mb-1 text-xs font-semibold text-neutral-400 uppercase">
                              Meu Contato (Enviado)
                            </p>
                            <p className="text-sm text-neutral-800">
                              {order.contactPhone}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                          <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-orange-600 uppercase">
                            <FileText className="h-3 w-3" /> Detalhes do
                            Problema
                          </p>
                          <p className="text-sm leading-relaxed text-neutral-700 italic">
                            &quot;{order.description}&quot;
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Utilizando a variável para evitar aviso do linter se desejar usá-la depois */}
                  <div className="hidden">{selectedOrder?.id}</div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
