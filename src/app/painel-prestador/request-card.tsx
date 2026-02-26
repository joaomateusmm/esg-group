"use client";

import { Check, CreditCard, MapPin, MessageSquare, Phone } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  acceptRequest,
  completeRequest,
  rejectRequest,
} from "@/actions/provider-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

interface RequestCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any;
}

export function RequestCard({ request }: RequestCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showContact, setShowContact] = useState(false);

  const handleStatusChange = (action: "accept" | "reject" | "complete") => {
    startTransition(async () => {
      try {
        let res;
        if (action === "accept") res = await acceptRequest(request.id);
        else if (action === "reject") res = await rejectRequest(request.id);
        else res = await completeRequest(request.id);

        if (res.success) toast.success(res.message);
        else toast.error(res.error);
      } catch {
        toast.error("Erro na operação.");
      }
    });
  };

  const isPendingRequest = request.status === "pending";

  const isAccepted =
    request.status === "accepted" || request.status === "in_progress";

  const formattedValue = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format((request.amount || 0) / 100);

  return (
    <Card className="overflow-hidden border-neutral-200 bg-white transition-all hover:border-orange-200">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 bg-neutral-50 py-3">
        <div className="flex w-full items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border border-neutral-200 bg-white">
              {request.customer?.image ? (
                <Image
                  src={request.customer.image}
                  alt="Cliente"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-bold text-neutral-400">
                  {request.customer?.name?.charAt(0) || "C"}
                </div>
              )}
            </div>
            <div className="flex flex-col items-start gap-1">
              <h3 className="leading-none font-bold text-neutral-900">
                {request.customer?.name || "Cliente"}
              </h3>

              {/* BADGE DA CATEGORIA FICA AQUI, BEM VISÍVEL */}
              <Badge
                variant="secondary"
                className="border-orange-200 bg-orange-100 px-2 py-0 text-[10px] font-bold tracking-wider text-orange-700 uppercase hover:bg-orange-100"
              >
                {request.category?.name || "Serviço"}
              </Badge>

              <p className="text-[11px] text-neutral-500">
                Solicitado em {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="ml-2">
            <Badge
              className={
                request.status === "pending"
                  ? "border-yellow-200 bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                  : isAccepted
                    ? "border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-100"
                    : request.status === "completed"
                      ? "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                      : "border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
              }
            >
              {request.status === "pending" && "Pendente"}
              {isAccepted && "Em Andamento"}
              {request.status === "completed" && "Concluído"}
              {(request.status === "rejected" ||
                request.status === "canceled") &&
                "Recusado"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-neutral-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
            <span>{request.address}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-neutral-600">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
            <span className="italic">&quot;{request.description}&quot;</span>
          </div>

          {/* SEÇÃO DE VALOR E PAGAMENTO */}
          <div className="mt-4 flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50 p-3 text-sm font-medium text-neutral-900">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-600" />
              <span className="text-neutral-700">Valor do Serviço:</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-lg font-bold text-orange-600">
                {formattedValue}
              </span>
              {request.paymentStatus === "succeeded" ? (
                <span className="text-[10px] font-bold tracking-wider text-green-600 uppercase">
                  Pago via Stripe
                </span>
              ) : (
                <span className="text-[10px] font-bold tracking-wider text-yellow-600 uppercase">
                  Aguardando Pagamento
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Informações de Contato (Só mostra se aceito) */}
        {isAccepted && (
          <div className="animate-in fade-in zoom-in-95 mt-4 flex items-center justify-between rounded-md border border-blue-100 bg-blue-50 px-5 py-2">
            <div className="flex flex-col">
              <p className="mb-1 text-xs font-bold text-blue-800">
                Dados de Contato:
              </p>
              <p className="flex items-center gap-2 text-sm text-blue-700">
                <Phone className="h-3 w-3" />
                {showContact ? (
                  <span>
                    {(() => {
                      const phone = request.contactPhone || "";
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
                ) : (
                  "***********"
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <button
                onClick={() => setShowContact(!showContact)}
                className="ml-auto cursor-pointer text-xs font-medium underline"
              >
                {showContact ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-center gap-2 border-t border-neutral-100 bg-neutral-50 py-5">
        {isPendingRequest && (
          <Button
            className="w-full cursor-pointer bg-emerald-600 text-white shadow-md duration-300 hover:bg-emerald-700 active:scale-95"
            onClick={() => handleStatusChange("accept")}
            disabled={isPending}
          >
            <Check className="mr-1 h-4 w-4" />
            Dar Inicio ao Serviço
          </Button>
        )}

        {isAccepted && (
          <Button
            className="w-full bg-neutral-900 text-white hover:bg-neutral-800"
            onClick={() => handleStatusChange("complete")}
            disabled={isPending}
          >
            <Check className="mr-2 h-4 w-4" /> Marcar como Concluído
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
