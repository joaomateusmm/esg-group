"use client";

import {
  CheckCircle2,
  Clock,
  Copy,
  CopyCheck,
  LucideIcon, // Importação adicionada
  MapPin,
  MoreHorizontal,
  Package,
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

// Tipos
interface OrderData {
  id: string;
  status: string;
  amount: number;
  userName: string;
  userEmail: string;
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
  };
}

interface OrdersTableProps {
  data: OrderData[];
  totalOrders: number;
}

// CORREÇÃO: Substituído 'any' por 'LucideIcon'
const STATUS_MAP: Record<
  string,
  { label: string; color: string; icon: LucideIcon }
> = {
  pending: {
    label: "Pendente",
    color: "bg-yellow-500/10 text-yellow-500",
    icon: Clock,
  },
  paid: {
    label: "Pago/Preparando",
    color: "bg-blue-500/10 text-blue-500",
    icon: Package,
  },
  shipped: {
    label: "Enviado",
    color: "bg-purple-500/10 text-purple-500",
    icon: Truck,
  },
  delivered: {
    label: "Entregue",
    color: "bg-green-500/10 text-green-500",
    icon: CheckCircle2,
  },
  canceled: {
    label: "Cancelado",
    color: "bg-red-500/10 text-red-500",
    icon: XCircle,
  },
};

export function OrdersTable({ data, totalOrders }: OrdersTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPending, startTransition] = useTransition();

  // --- ESTADOS DOS MODAIS ---
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
    // Validação mais permissiva: abre mesmo que incompleto para mostrar o que tem
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
      toast.success("Rastreio salvo e pedido marcado como Enviado!");
      setTrackingModalOpen(false);
      router.refresh();
    } else {
      toast.error(res.message);
    }
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
            className="flex h-10 items-center gap-2 rounded-md border border-red-500/10 bg-red-500/5 px-3 text-sm text-white hover:bg-red-500/20"
          >
            <XCircle className="h-4 w-4" />
            Excluir ({selectedIds.length})
          </button>
        )}
        <button
          onClick={() => handleSelectAll(true)}
          className="flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white hover:bg-white/10"
        >
          <CopyCheck className="h-4 w-4" /> Marcar Todos
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A]">
        <Table>
          <TableHeader className="bg-white/5 hover:bg-white/5">
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="w-[40px]">
                <Checkbox
                  className="border-white/50 data-[state=checked]:border-[#D00000] data-[state=checked]:bg-[#D00000]"
                  checked={
                    data.length > 0 && selectedIds.length === data.length
                  }
                  onCheckedChange={(c) => handleSelectAll(!!c)}
                />
              </TableHead>
              <TableHead className="text-neutral-400">Pedido</TableHead>
              <TableHead className="text-neutral-400">Cliente</TableHead>
              <TableHead className="text-neutral-400">Status</TableHead>
              <TableHead className="text-neutral-400">Ação Rápida</TableHead>
              <TableHead className="text-neutral-400">Total</TableHead>
              <TableHead className="text-neutral-400">Rastreio</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-neutral-500"
                >
                  Nenhum pedido encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((order) => {
                const statusInfo =
                  STATUS_MAP[order.status] || STATUS_MAP["pending"];
                const StatusIcon = statusInfo.icon;

                return (
                  <TableRow
                    key={order.id}
                    className="border-white/10 hover:bg-white/5"
                  >
                    <TableCell>
                      <Checkbox
                        className="border-white/50 data-[state=checked]:border-[#D00000] data-[state=checked]:bg-[#D00000]"
                        checked={selectedIds.includes(order.id)}
                        onCheckedChange={(c) => handleSelectOne(!!c, order.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-white">
                      {order.id.slice(0, 8).toUpperCase()}
                      <div className="text-[10px] text-neutral-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white">{order.userName}</div>
                      <div className="text-xs text-neutral-500">
                        {order.userEmail}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`gap-1.5 border-0 px-2 py-1 font-normal ${statusInfo.color}`}
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
                          className="h-7 border border-purple-500/20 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 hover:text-purple-300"
                        >
                          <Truck className="mr-2 h-3 w-3" /> Enviar
                        </Button>
                      )}
                      {order.status === "shipped" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusChange(order.id, "delivered")
                          }
                          className="h-7 border border-green-500/20 bg-green-600/20 text-green-400 hover:bg-green-600/30 hover:text-green-300"
                        >
                          <CheckCircle2 className="mr-2 h-3 w-3" /> Entregue
                        </Button>
                      )}
                      {(order.status === "delivered" ||
                        order.status === "pending" ||
                        order.status === "canceled") && (
                        <span className="text-xs text-neutral-600">-</span>
                      )}
                    </TableCell>

                    <TableCell className="font-medium text-white">
                      {formatCurrency(order.amount)}
                    </TableCell>
                    <TableCell>
                      {order.trackingCode ? (
                        <span className="font-mono text-xs text-green-400">
                          {order.trackingCode}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-600">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-neutral-400 hover:text-white"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-56 border-white/10 bg-[#111] text-white"
                        >
                          <DropdownMenuLabel>Ações do Pedido</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/10" />

                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-white/10"
                            onClick={() => openAddressModal(order)}
                          >
                            <MapPin className="mr-2 h-4 w-4" /> Ver Endereço
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-white/10"
                            onClick={() => openTrackingModal(order)}
                          >
                            <Truck className="mr-2 h-4 w-4" /> Editar Rastreio
                          </DropdownMenuItem>

                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="cursor-pointer hover:bg-white/10">
                              <Package className="mr-2 h-4 w-4" /> Forçar Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="border-white/10 bg-[#111] text-white">
                              <DropdownMenuRadioGroup
                                value={order.status}
                                onValueChange={(v) =>
                                  handleStatusChange(order.id, v)
                                }
                              >
                                <DropdownMenuRadioItem value="pending">
                                  Pendente
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="paid">
                                  Pago / Preparando
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="shipped">
                                  Enviado
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="delivered">
                                  Entregue
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="canceled">
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
        <DialogContent className="border-white/10 bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle>Código de Rastreio</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Ex: AA123456789BR"
              value={trackingCodeInput}
              onChange={(e) => setTrackingCodeInput(e.target.value)}
              className="border-white/10 bg-white/5 text-white"
            />
            <p className="mt-2 text-xs text-neutral-500">
              Ao salvar, o status mudará automaticamente para
              &quot;Enviado&quot;.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTrackingModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={saveTracking}
              className="bg-[#D00000] text-white hover:bg-[#a00000]"
            >
              Salvar e Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL DE ENDEREÇO (CORRIGIDO) --- */}
      <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
        <DialogContent className="border-white/10 bg-[#111] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#D00000]" /> Endereço de Entrega
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1 rounded-md border border-white/10 bg-white/5 p-4 text-sm">
              <p className="text-lg font-semibold text-white">
                {currentOrderData?.userName}
              </p>
              {currentOrderData?.shippingAddress ? (
                <>
                  <p className="text-neutral-300">
                    {currentOrderData.shippingAddress.street ||
                      "Rua não informada"}
                    , {currentOrderData.shippingAddress.number || "S/N"}
                  </p>
                  {currentOrderData.shippingAddress.complement && (
                    <p className="text-xs text-neutral-400">
                      Comp: {currentOrderData.shippingAddress.complement}
                    </p>
                  )}
                  <p className="text-neutral-300">
                    {currentOrderData.shippingAddress.city || "Cidade N/A"} -{" "}
                    {currentOrderData.shippingAddress.state || "UF"}
                  </p>
                  <p className="font-mono text-[#D00000]">
                    CEP:{" "}
                    {currentOrderData.shippingAddress.zipCode || "00000-000"}
                  </p>
                </>
              ) : (
                <p className="text-red-400 italic">
                  Dados de endereço não encontrados no pedido.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setAddressModalOpen(false)}>
              Fechar
            </Button>
            <Button
              onClick={copyAddressToClipboard}
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <Copy className="mr-2 h-4 w-4" /> Copiar Endereço
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
