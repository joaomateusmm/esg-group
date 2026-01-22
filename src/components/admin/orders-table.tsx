"use client";

import {
  CheckCircle2,
  Clock,
  Copy,
  CopyCheck,
  LucideIcon,
  Map,
  MapPin,
  MoreHorizontal,
  Package,
  Phone,
  Truck,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deleteOrders,
  updateOrderStatus,
  updateTrackingCode,
} from "@/actions/admin-orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrderData {
  id: string;
  status: string;
  amount: number;
  userName: string;
  userEmail: string;
  userPhone?: string | null;
  createdAt: Date;
  trackingCode?: string | null;
  itemsCount: number;
  shippingAddress?: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string | null;
  };
}

interface OrdersTableProps {
  data: OrderData[];
  totalOrders: number;
}

const STATUS_MAP: Record<
  string,
  { label: string; color: string; icon: LucideIcon }
> = {
  pending: {
    label: "Pendente",
    color: "bg-purple-200 text-purple-700 border-purple-200",
    icon: Clock,
  },
  paid: {
    label: "Pago",
    color: "bg-green-50 text-green-600 border-green-200",
    icon: Package,
  },
  shipped: {
    label: "Em Trânsito",
    color: "bg-orange-100 text-orange-600 border-orange-200",
    icon: Truck,
  },
  delivered: {
    label: "Entregue",
    color: "bg-green-200 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  canceled: {
    label: "Cancelado",
    color: "bg-red-200 text-red-800 border-red-200",
    icon: XCircle,
  },
};

// Adicione isso no topo do arquivo orders-table.tsx, fora do componente principal
const formatPhoneNumber = (phone: string | null | undefined) => {
  if (!phone) return null;

  // Remove tudo que não for número
  const cleaned = phone.replace(/\D/g, "");

  // Lógica para números do Brasil (assumindo que começam com 55 ou apenas DDD)
  // Remove o 55 se tiver 13 digitos (55 + 11 + 9 + 8 digitos)
  const numbersOnly =
    cleaned.length > 11 && cleaned.startsWith("55")
      ? cleaned.slice(2)
      : cleaned;

  // Formata: (XX) XXXXX-XXXX
  if (numbersOnly.length === 11) {
    return numbersOnly.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  // Formata fixo: (XX) XXXX-XXXX
  if (numbersOnly.length === 10) {
    return numbersOnly.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return phone; // Retorna original se não reconhecer o padrão
};

export function OrdersTable({ data, totalOrders }: OrdersTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPending, startTransition] = useTransition();

  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const [currentOrderData, setCurrentOrderData] = useState<OrderData | null>(
    null,
  );
  const [trackingCodeInput, setTrackingCodeInput] = useState("");

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? data.map((o) => o.id) : []);
  };

  const handleSelectOne = (checked: boolean, id: string) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id),
    );
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updateOrderStatus(id, newStatus);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleBulkDelete = () => {
    if (!confirm("Tem certeza? Isso apagará os pedidos selecionados.")) return;
    startTransition(async () => {
      const res = await deleteOrders(selectedIds);
      if (res.success) {
        toast.success(res.message);
        setSelectedIds([]);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const openTrackingModal = (order: OrderData) => {
    setCurrentOrderData(order);
    setTrackingCodeInput(order.trackingCode || "");
    setTrackingModalOpen(true);
  };

  const openAddressModal = (order: OrderData) => {
    setCurrentOrderData(order);
    setAddressModalOpen(true);
  };

  const saveTracking = async () => {
    if (!currentOrderData) return;

    const res = await updateTrackingCode(
      currentOrderData.id,
      trackingCodeInput,
    );

    if (res.success) {
      await updateOrderStatus(currentOrderData.id, "shipped");
      toast.success("Rastreio salvo e pedido marcado como Em Trânsito!");
      setTrackingModalOpen(false);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  const getGoogleMapsLink = (order: OrderData | null) => {
    if (!order?.shippingAddress) return "#";
    const { street, number, city, state, zipCode } = order.shippingAddress;
    const query = `${street}, ${number}, ${city} - ${state}, ${zipCode}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const copyAddressToClipboard = () => {
    if (!currentOrderData?.shippingAddress) {
      toast.error("Endereço indisponível para cópia.");
      return;
    }
    const { street, number, complement, city, state, zipCode } =
      currentOrderData.shippingAddress;
    const fullAddress = `${street || "Rua não informada"}, ${number || "S/N"} ${complement ? `(${complement})` : ""} - ${city || ""}/${state || ""}\nCEP: ${zipCode || ""}`;

    navigator.clipboard.writeText(fullAddress);
    toast.success("Endereço copiado!");
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val / 100);

  return (
    <>
      <div className="mb-4 flex items-center justify-end gap-3">
        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="flex h-10 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 text-sm text-red-600 transition-colors hover:bg-red-100"
          >
            <XCircle className="h-4 w-4" />
            Excluir ({selectedIds.length})
          </button>
        )}
        <button
          onClick={() => handleSelectAll(true)}
          className="flex h-10 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-600 shadow-sm transition-colors hover:bg-neutral-50"
        >
          <CopyCheck className="h-4 w-4" /> Marcar Todos
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow className="border-neutral-200 hover:bg-neutral-100">
              <TableHead className="w-[40px]">
                <Checkbox
                  className="border-neutral-400 data-[state=checked]:border-orange-600 data-[state=checked]:bg-orange-600"
                  checked={
                    data.length > 0 && selectedIds.length === data.length
                  }
                  onCheckedChange={(c) => handleSelectAll(!!c)}
                />
              </TableHead>
              <TableHead className="font-semibold text-neutral-600">
                Pedido
              </TableHead>
              <TableHead className="font-semibold text-neutral-600">
                Cliente
              </TableHead>
              <TableHead className="font-semibold text-neutral-600">
                Status
              </TableHead>
              <TableHead className="font-semibold text-neutral-600">
                Ação Rápida
              </TableHead>
              <TableHead className="font-semibold text-neutral-600">
                Mapa
              </TableHead>
              <TableHead className="font-semibold text-neutral-600">
                Total
              </TableHead>
              <TableHead className="font-semibold text-neutral-600">
                Rastreio
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow className="border-neutral-100 hover:bg-neutral-50">
                <TableCell
                  colSpan={9}
                  className="h-32 text-center text-neutral-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package className="h-8 w-8 opacity-20" />
                    <p>Nenhum pedido encontrado.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((order) => {
                const statusInfo =
                  STATUS_MAP[order.status] || STATUS_MAP["pending"];
                const StatusIcon = statusInfo.icon;

                // Tenta pegar o telefone do usuário (já vem com fallback da Page)
                // OU do endereço de envio
                const displayPhone =
                  order.userPhone || order.shippingAddress?.phone;

                return (
                  <TableRow
                    key={order.id}
                    className="border-neutral-100 transition-colors hover:bg-neutral-50"
                  >
                    <TableCell>
                      <Checkbox
                        className="border-neutral-400 data-[state=checked]:border-orange-600 data-[state=checked]:bg-orange-600"
                        checked={selectedIds.includes(order.id)}
                        onCheckedChange={(c) => handleSelectOne(!!c, order.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium text-neutral-900">
                      {order.id.slice(0, 8).toUpperCase()}
                      <div className="mt-0.5 text-[10px] text-neutral-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {/* Nome com destaque */}
                        <span className="font-semibold text-neutral-900">
                          {order.userName}
                        </span>

                        {/* Email mais discreto */}
                        <span className="text-xs text-neutral-500">
                          {order.userEmail}
                        </span>

                        {/* TELEFONE COM DESIGN NOVO */}
                        {displayPhone ? (
                          <div
                            className="flex w-fit cursor-pointer items-center gap-1.5 rounded-md border border-neutral-200/20 bg-neutral-50/20 px-2 py-1 transition-colors hover:bg-white"
                            title="Clique para copiar"
                            onClick={(e) => {
                              e.stopPropagation(); // Evita clicar na linha da tabela
                              navigator.clipboard.writeText(displayPhone);
                              toast.success("Telefone copiado!");
                            }}
                          >
                            <Copy className="h-3 w-3 text-neutral-600" />
                            <span className="font-mono text-[11px] font-medium text-neutral-500">
                              {formatPhoneNumber(displayPhone)}
                            </span>
                          </div>
                        ) : (
                          <span className="mt-1 flex items-center gap-1 text-[10px] text-neutral-400 italic">
                            <Phone className="h-3 w-3 opacity-50" />
                            Sem telefone
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`gap-1.5 border px-2 py-1 font-medium ${statusInfo.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {order.status === "paid" && (
                        <Button
                          size="sm"
                          onClick={() => openTrackingModal(order)}
                          className="h-7 cursor-pointer border border-orange-300 bg-orange-100 text-orange-700 hover:bg-orange-200"
                        >
                          <Truck className="mr-0.5 h-3 w-3" /> Em Trânsito
                        </Button>
                      )}
                      {order.status === "shipped" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusChange(order.id, "delivered")
                          }
                          className="h-7 cursor-pointer border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                        >
                          <CheckCircle2 className="mr-2 h-3 w-3" /> Entregue
                        </Button>
                      )}
                      {(order.status === "delivered" ||
                        order.status === "pending" ||
                        order.status === "canceled") && (
                        <span className="text-xs text-neutral-400">-</span>
                      )}
                    </TableCell>

                    {/* COLUNA MAPA */}
                    <TableCell>
                      {order.shippingAddress ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            window.open(getGoogleMapsLink(order), "_blank")
                          }
                          className="h-7 w-7 cursor-pointer border bg-neutral-100 p-0 text-neutral-600 hover:bg-neutral-200"
                          title="Ver no Google Maps"
                        >
                          <Map className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-neutral-400">-</span>
                      )}
                    </TableCell>

                    <TableCell className="font-mono font-medium text-neutral-900">
                      {formatCurrency(order.amount)}
                    </TableCell>
                    <TableCell>
                      {order.trackingCode ? (
                        <span className="rounded border border-green-200 bg-green-50 px-1.5 py-0.5 font-mono text-xs text-green-700">
                          {order.trackingCode}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-56 border-neutral-200 bg-white text-neutral-700 shadow-md"
                        >
                          <DropdownMenuLabel>Ações do Pedido</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-neutral-100" />

                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50"
                            onClick={() => openAddressModal(order)}
                          >
                            <MapPin className="mr-2 h-4 w-4" /> Ver Endereço
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50"
                            asChild
                          >
                            <a
                              href={getGoogleMapsLink(order)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex w-full items-center"
                            >
                              <Map className="mr-2 h-4 w-4" /> Abrir no Google
                              Maps
                            </a>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50"
                            onClick={() => openTrackingModal(order)}
                          >
                            <Truck className="mr-2 h-4 w-4" /> Editar Rastreio
                          </DropdownMenuItem>

                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50">
                              <Package className="mr-2 h-4 w-4" /> Forçar Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="ml-1 border-neutral-200 bg-white text-neutral-700 shadow-md">
                              <DropdownMenuRadioGroup
                                value={order.status}
                                onValueChange={(v) =>
                                  handleStatusChange(order.id, v)
                                }
                              >
                                <DropdownMenuRadioItem
                                  className="cursor-pointer hover:bg-neutral-50"
                                  value="pending"
                                >
                                  Pendente
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem
                                  className="cursor-pointer hover:bg-neutral-50"
                                  value="paid"
                                >
                                  Pago
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem
                                  className="cursor-pointer hover:bg-neutral-50"
                                  value="shipped"
                                >
                                  Em Trânsito
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem
                                  className="cursor-pointer hover:bg-neutral-50"
                                  value="delivered"
                                >
                                  Entregue
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem
                                  className="cursor-pointer hover:bg-neutral-50"
                                  value="canceled"
                                >
                                  Cancelado
                                </DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 text-center text-sm text-neutral-500">
        Total de {totalOrders} pedidos registrados.
      </div>

      {/* --- MODAL DE RASTREIO --- */}
      <Dialog open={trackingModalOpen} onOpenChange={setTrackingModalOpen}>
        <DialogContent className="border-neutral-200 bg-white text-neutral-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Código de Rastreio</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Ex: AA123456789BR"
              value={trackingCodeInput}
              onChange={(e) => setTrackingCodeInput(e.target.value)}
              className="border-neutral-200 bg-neutral-50 text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
            />
            <p className="mt-2 text-xs text-neutral-500">
              Ao salvar, o status mudará automaticamente para &quot;Em
              Trânsito&quot;.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setTrackingModalOpen(false)}
              className="text-neutral-600 hover:bg-neutral-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={saveTracking}
              className="bg-orange-600 text-white shadow-sm hover:bg-orange-700"
            >
              Salvar e Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL DE ENDEREÇO --- */}
      <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
        <DialogContent className="border-neutral-200 bg-white text-neutral-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-neutral-900">
              <MapPin className="h-5 w-5 text-orange-600" /> Endereço de Entrega
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm">
              <p className="text-lg font-semibold text-neutral-900">
                {currentOrderData?.userName}
              </p>

              {/* Exibição do Telefone no Modal também */}
              {(currentOrderData?.userPhone ||
                currentOrderData?.shippingAddress?.phone) && (
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <Phone className="h-3 w-3 text-orange-600" />
                  {currentOrderData.userPhone ||
                    currentOrderData.shippingAddress?.phone}
                </p>
              )}

              {currentOrderData?.shippingAddress ? (
                <>
                  <p className="text-neutral-600">
                    {currentOrderData.shippingAddress.street ||
                      "Rua não informada"}
                    , {currentOrderData.shippingAddress.number || "S/N"}
                  </p>
                  {currentOrderData.shippingAddress.complement && (
                    <p className="text-xs text-neutral-500">
                      Comp: {currentOrderData.shippingAddress.complement}
                    </p>
                  )}
                  <p className="text-neutral-600">
                    {currentOrderData.shippingAddress.city || "Cidade N/A"} -{" "}
                    {currentOrderData.shippingAddress.state || "UF"}
                  </p>
                  <p className="font-mono font-medium text-orange-600">
                    CEP:{" "}
                    {currentOrderData.shippingAddress.zipCode || "00000-000"}
                  </p>
                </>
              ) : (
                <p className="text-red-500 italic">
                  Dados de endereço não encontrados no pedido.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              onClick={() => {
                if (currentOrderData) {
                  window.open(getGoogleMapsLink(currentOrderData), "_blank");
                }
              }}
              className="w-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 sm:w-auto"
            >
              <Map className="mr-2 h-4 w-4" /> Ver no Maps
            </Button>

            <Button
              onClick={copyAddressToClipboard}
              variant="outline"
              className="w-full border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 sm:w-auto"
            >
              <Copy className="mr-2 h-4 w-4" /> Copiar Endereço
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
