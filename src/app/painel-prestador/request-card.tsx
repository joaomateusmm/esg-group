"use client";

import { Check, MapPin, MessageSquare, Phone, X } from "lucide-react";
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
  const isAccepted = request.status === "accepted";

  return (
    <Card className="overflow-hidden border-neutral-200 bg-white transition-all hover:border-orange-200">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 bg-neutral-50 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full border border-neutral-200 bg-white">
            {request.customer.image ? (
              <Image
                src={request.customer.image}
                alt="Cliente"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-neutral-400">
                {request.customer.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-neutral-900">
              {request.customer.name}
            </h3>
            <p className="text-xs text-neutral-500">
              Solicitado em {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="ml-3">
            <Badge
              className={
                request.status === "pending"
                  ? "border-yellow-200 bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                  : request.status === "accepted"
                    ? "border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-100"
                    : request.status === "completed"
                      ? "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                      : "border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
              }
            >
              {request.status === "pending" && "Pendente"}
              {request.status === "accepted" && "Em Andamento"}
              {request.status === "completed" && "Concluído"}
              {request.status === "rejected" && "Recusado"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-neutral-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
            <span>{request.address}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-neutral-600">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
            <span className="italic">&quot;{request.description}&quot;</span>
          </div>
          <div className="flex items-center gap-2 rounded border border-neutral-100 bg-neutral-50 p-2 text-sm font-medium text-neutral-900">
            <span className="text-neutral-500">Orçamento:</span>
            {request.budgetType === "range"
              ? `£ ${request.budgetValue}`
              : "A Combinar"}
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
                {showContact ? request.contactPhone : "***********"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <button
                onClick={() => setShowContact(!showContact)}
                className="ml-auto cursor-pointer text-xs underline"
              >
                {showContact ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p- flex justify-center gap-2 border-y border-neutral-100 bg-neutral-50 py-5">
        {isPendingRequest && (
          <>
            <Button
              variant="outline"
              className="cursor-pointer border-1 border-red-300 bg-red-500 text-white shadow-md duration-300 hover:border-red-500 hover:bg-red-700 hover:text-white active:scale-95"
              onClick={() => handleStatusChange("reject")}
              disabled={isPending}
            >
              <X className="h-5 w-5" /> Recusar
            </Button>
            <Button
              className="cursor-pointer border-1 border-emerald-300 bg-emerald-500 text-white shadow-md duration-300 hover:border-emerald-500 hover:bg-emerald-600 active:scale-95"
              onClick={() => handleStatusChange("accept")}
              disabled={isPending}
            >
              <Check className="h-5 w-5" /> Aceitar
            </Button>
          </>
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

        {/* Se recusado ou concluído, não mostra botões */}
      </CardFooter>
    </Card>
  );
}
