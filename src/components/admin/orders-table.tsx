"use client";

import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  CopyCheck,
  Image as ImageIcon,
  LucideIcon,
  Map,
  MapPin,
  MoreHorizontal,
  Package,
  Search,
  SquareCheck,
  Truck,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deleteOrders,
  getAllOrderIds,
  updateDeliveryDates, // IMPORTANTE: Importar a action de datas
  updateOrderStatus,
  updateTrackingCode,
} from "@/actions/admin-orders";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OrderData {
  id: string;
  status: string;
  fulfillmentStatus: string;
  paymentMethod: string | null;
  amount: number;
  userName: string;
  userEmail: string;
  userPhone?: string | null;
  productImage?: string | null;
  productId?: string | null;
  createdAt: Date;
  trackingCode?: string | null;
  // Adicionar campos de data aqui se eles vierem do banco para a tabela
  estimatedDeliveryStart?: Date | null;
  estimatedDeliveryEnd?: Date | null;
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
  limitParam: string;
}

const FINANCIAL_STATUS_MAP: Record<
  string,
  { label: string; color: string; icon: LucideIcon }
> = {
  pending: {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Clock,
  },
  paid: {
    label: "Pago",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: Banknote,
  },
  failed: {
    label: "Falhou",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
  refunded: {
    label: "Estornado",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: AlertCircle,
  },
};

const FULFILLMENT_STATUS_MAP: Record<
  string,
  { label: string; color: string; icon: LucideIcon }
> = {
  idle: {
    label: "Aguardando",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: Clock,
  },
  processing: {
    label: "Preparando",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Package,
  },
  shipped: {
    label: "Enviado",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: Truck,
  },
  delivered: {
    label: "Entregue",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  returned: {
    label: "Devolvido",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
};

const formatPhoneNumber = (phone: string | null | undefined) => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, "");
  const numbersOnly =
    cleaned.length > 11 && cleaned.startsWith("55")
      ? cleaned.slice(2)
      : cleaned;
  if (numbersOnly.length === 11)
    return numbersOnly.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (numbersOnly.length === 10)
    return numbersOnly.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return phone;
};

export function OrdersTable({
  data,
  totalOrders,
  limitParam,
}: OrdersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [currentOrderData, setCurrentOrderData] = useState<OrderData | null>(
    null,
  );
  const [trackingCodeInput, setTrackingCodeInput] = useState("");

  // ESTADOS PARA AS DATAS DE ENTREGA
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");

  const currentPage = Number(searchParams.get("page")) || 1;
  const limit = limitParam === "all" ? totalOrders : Number(limitParam) || 10;
  const totalPages = Math.ceil(totalOrders / limit);

  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, limitParam, searchParams]);

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  // --- SELEÇÃO ---
  const handleSelectPage = (checked: boolean) => {
    if (checked) {
      const pageIds = data.map((order) => order.id);
      setSelectedIds(pageIds);
      toast.success(`${pageIds.length} pedidos desta página selecionados.`);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectAllGlobal = () => {
    startTransition(async () => {
      try {
        const searchTerm = searchParams.get("search")?.toString();
        const allIds = await getAllOrderIds(searchTerm);
        setSelectedIds(allIds);
        toast.success(`${allIds.length} pedidos selecionados.`);
      } catch (error) {
        console.error(error);
        toast.error("Erro ao selecionar todos os pedidos.");
      }
    });
  };

  const handleSelectOne = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // --- AÇÕES ---
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleFinancialStatusChange = (id: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updateOrderStatus(id, newStatus, "financial");
      if (res.success) {
        toast.success("Status financeiro atualizado!");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleFulfillmentStatusChange = (id: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updateOrderStatus(id, newStatus, "fulfillment");
      if (res.success) {
        toast.success("Status logístico atualizado!");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleBulkDelete = () => {
    startTransition(async () => {
      const res = await deleteOrders(selectedIds);
      if (res.success) {
        toast.success(res.message);
        setSelectedIds([]);
        setShowDeleteDialog(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const openTrackingModal = (order: OrderData) => {
    setCurrentOrderData(order);
    setTrackingCodeInput(order.trackingCode || "");

    // Preenche as datas se existirem, senão deixa vazio (mantendo o atual do banco se não mexer)
    // Para o input date funcionar, o formato deve ser YYYY-MM-DD
    if (order.estimatedDeliveryStart) {
      setStartDateInput(
        new Date(order.estimatedDeliveryStart).toISOString().split("T")[0],
      );
    } else {
      setStartDateInput("");
    }

    if (order.estimatedDeliveryEnd) {
      setEndDateInput(
        new Date(order.estimatedDeliveryEnd).toISOString().split("T")[0],
      );
    } else {
      setEndDateInput("");
    }

    setTrackingModalOpen(true);
  };

  const openAddressModal = (order: OrderData) => {
    setCurrentOrderData(order);
    setAddressModalOpen(true);
  };

  const saveTracking = async () => {
    if (!currentOrderData) return;

    // 1. Atualiza o código de rastreio
    const resTracking = await updateTrackingCode(
      currentOrderData.id,
      trackingCodeInput,
    );

    // 2. Atualiza as datas de entrega (SE TIVEREM SIDO PREENCHIDAS)
    if (startDateInput && endDateInput) {
      await updateDeliveryDates(
        currentOrderData.id,
        new Date(startDateInput),
        new Date(endDateInput),
      );
    }

    if (resTracking.success) {
      // 3. Atualiza status para enviado
      await updateOrderStatus(currentOrderData.id, "shipped", "fulfillment");

      toast.success("Pedido atualizado e enviado!");
      setTrackingModalOpen(false);
      router.refresh();
    } else {
      toast.error(resTracking.message);
    }
  };

  const getGoogleMapsLink = (order: OrderData | null) => {
    if (!order?.shippingAddress) return "#";
    const { street, number, city, state, zipCode } = order.shippingAddress;
    const query = `${street}, ${number}, ${city} - ${state}, ${zipCode}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const copyProductId = (id: string | null | undefined) => {
    if (!id) {
      toast.error("ID indisponível.");
      return;
    }
    navigator.clipboard.writeText(id);
    toast.success("ID copiado!");
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val / 100);

  return (
    <>
      <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-600 shadow-sm duration-300">
          <Search className="mr-1 h-4 w-4 text-neutral-500" />
          <input
            placeholder="Pesquisar Pedido..."
            type="text"
            defaultValue={searchParams.get("search")?.toString()}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-auto p-1 duration-300 hover:bg-neutral-50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none active:scale-95"
          />
        </div>

        <div className="ml-auto flex items-center justify-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="animate-in fade-in zoom-in flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 text-sm text-red-600 duration-300 hover:bg-red-100"
            >
              <SquareCheck className="h-4 w-4" />
              Excluir ({selectedIds.length})
            </button>
          )}

          <button
            onClick={() => handleSelectPage(true)}
            className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-600 shadow-sm duration-300 hover:bg-neutral-50 active:scale-95"
          >
            <SquareCheck className="h-4 w-4" />
            Marcar Página
          </button>

          <button
            onClick={handleSelectAllGlobal}
            className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-600 shadow-sm duration-300 hover:bg-neutral-50 active:scale-95"
          >
            <CopyCheck className="h-4 w-4" />
            Marcar Todos
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow className="border-neutral-200 hover:bg-neutral-100">
              <TableHead className="w-[40px]">
                <Checkbox
                  className="border-neutral-400 data-[state=checked]:border-orange-600 data-[state=checked]:bg-orange-600"
                  checked={
                    data.length > 0 &&
                    selectedIds.length >= data.length &&
                    data.every((item) => selectedIds.includes(item.id))
                  }
                  onCheckedChange={(c) => handleSelectPage(!!c)}
                />
              </TableHead>
              <TableHead className="font-semibold text-neutral-600">
                Pedido
              </TableHead>
              <TableHead className="font-semibold text-neutral-600">
                Prod. Comprado
              </TableHead>
              <TableHead className="font-semibold text-neutral-600">
                Cliente
              </TableHead>
              <TableHead className="font-semibold text-neutral-600">
                Financeiro
              </TableHead>
              <TableHead className="font-semibold text-neutral-600">
                Logística
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
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-96 text-center text-neutral-500"
                >
                  <div className="flex h-full w-full flex-col items-center justify-center gap-4 py-10 md:translate-x-25">
                    <Image
                      src="/images/illustration.svg"
                      alt="Sem produtos"
                      width={200}
                      height={200}
                      className="opacity-50 grayscale"
                    />
                    <p className="text-lg font-light text-neutral-400">
                      Nenhum pedido encontrado.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((order) => {
                const financialInfo =
                  FINANCIAL_STATUS_MAP[order.status] ||
                  FINANCIAL_STATUS_MAP["pending"];
                const FinancialIcon = financialInfo.icon;
                const fulfillmentInfo =
                  FULFILLMENT_STATUS_MAP[order.fulfillmentStatus] ||
                  FULFILLMENT_STATUS_MAP["idle"];
                const FulfillmentIcon = fulfillmentInfo.icon;
                const displayPhone =
                  order.userPhone || order.shippingAddress?.phone;

                return (
                  <TableRow
                    key={order.id}
                    className="border-neutral-100 transition-colors hover:bg-neutral-50"
                    data-state={
                      selectedIds.includes(order.id) ? "selected" : ""
                    }
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
                      <Badge
                        variant="secondary"
                        className="mt-1 h-5 px-1.5 text-[10px] font-normal"
                      >
                        {order.paymentMethod === "cod"
                          ? "Na Entrega"
                          : order.paymentMethod === "free"
                            ? "Grátis"
                            : "Cartão"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-white">
                          {order.productImage ? (
                            <Image
                              src={order.productImage}
                              alt="Produto"
                              fill
                              className="object-cover"
                              sizes="33vw"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-neutral-300" />
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={!order.productId}
                          className="h-8 w-8 text-neutral-500 hover:bg-neutral-100 hover:text-orange-600 disabled:opacity-30"
                          onClick={() => copyProductId(order.productId)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-neutral-900">
                          {order.userName}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {order.userEmail}
                        </span>
                        {displayPhone && (
                          <div
                            className="flex w-fit cursor-pointer items-center gap-1.5 rounded-md border border-neutral-200/20 bg-neutral-50/20 px-2 py-1 transition-colors hover:bg-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(displayPhone);
                              toast.success("Telefone copiado!");
                            }}
                          >
                            <Copy className="h-3 w-3 text-neutral-600" />
                            <span className="font-mono text-[11px] font-medium text-neutral-500">
                              {formatPhoneNumber(displayPhone)}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`gap-1.5 border px-2 py-1 font-medium ${financialInfo.color}`}
                      >
                        <FinancialIcon className="h-3 w-3" />
                        {financialInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`gap-1.5 border px-2 py-1 font-medium ${fulfillmentInfo.color}`}
                      >
                        <FulfillmentIcon className="h-3 w-3" />
                        {fulfillmentInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1.5">
                        {order.paymentMethod === "cod" &&
                          order.status === "pending" && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleFinancialStatusChange(
                                        order.id,
                                        "paid",
                                      )
                                    }
                                    className="h-6 w-full max-w-[110px] cursor-pointer border border-green-200 bg-green-50 px-2 text-[10px] font-medium text-green-700 hover:bg-green-100"
                                  >
                                    <Banknote className="mr-1.5 h-3 w-3" />{" "}
                                    Confirmar $
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Confirmar recebimento do dinheiro</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        {order.fulfillmentStatus === "processing" && (
                          <Button
                            size="sm"
                            onClick={() => openTrackingModal(order)}
                            className="h-6 w-full max-w-[110px] cursor-pointer border border-orange-300 bg-orange-100 px-2 text-[10px] font-medium text-orange-700 hover:bg-orange-200"
                          >
                            <Truck className="mr-1.5 h-3 w-3" /> Enviar
                          </Button>
                        )}
                        {order.fulfillmentStatus === "shipped" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleFulfillmentStatusChange(
                                order.id,
                                "delivered",
                              )
                            }
                            className="h-6 w-full max-w-[110px] cursor-pointer border border-green-200 bg-green-50 px-2 text-[10px] font-medium text-green-700 hover:bg-green-100"
                          >
                            <CheckCircle2 className="mr-1.5 h-3 w-3" /> Entregue
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.shippingAddress ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            window.open(getGoogleMapsLink(order), "_blank")
                          }
                          className="h-7 w-7 cursor-pointer border bg-neutral-100 p-0 text-neutral-600 hover:bg-neutral-200"
                        >
                          <Map className="h-4 w-4" />
                        </Button>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-medium text-neutral-900">
                      {formatCurrency(order.amount)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-neutral-500 hover:bg-neutral-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-56 border-neutral-200 bg-white shadow-md"
                        >
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openAddressModal(order)}
                          >
                            <MapPin className="mr-2 h-4 w-4" /> Ver Endereço
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openTrackingModal(order)}
                          >
                            <Truck className="mr-2 h-4 w-4" /> Rastreio
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Package className="mr-2 h-4 w-4" /> Forçar
                              Logística
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuRadioGroup
                                value={order.fulfillmentStatus}
                                onValueChange={(v) =>
                                  handleFulfillmentStatusChange(order.id, v)
                                }
                              >
                                <DropdownMenuRadioItem value="idle">
                                  Aguardando
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="processing">
                                  Preparando
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="shipped">
                                  Enviado
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="delivered">
                                  Entregue
                                </DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Banknote className="mr-2 h-4 w-4" /> Forçar
                              Financeiro
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuRadioGroup
                                value={order.status}
                                onValueChange={(v) =>
                                  handleFinancialStatusChange(order.id, v)
                                }
                              >
                                <DropdownMenuRadioItem value="pending">
                                  Pendente
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="paid">
                                  Pago
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="failed">
                                  Falhou
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="refunded">
                                  Estornado
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

      {/* MODAL DE RASTREIO E PRAZO DE ENTREGA (ATUALIZADO) */}
      <Dialog open={trackingModalOpen} onOpenChange={setTrackingModalOpen}>
        <DialogContent className="border-neutral-200 bg-white text-neutral-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Prazo de Entrega e Rastreio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* SEÇÃO DE DATAS */}
            <div>
              <h1 className="mb-2 text-sm font-medium text-neutral-700">
                Datas do prazo de entrega:
              </h1>
              <div className="flex w-full gap-3">
                <div className="flex w-full flex-col">
                  <label className="mb-1 text-xs text-neutral-500">
                    Início
                  </label>
                  <Input
                    type="date"
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    className="border-neutral-200 bg-neutral-50 text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div className="flex w-full flex-col">
                  <label className="mb-1 text-xs text-neutral-500">Fim</label>
                  <Input
                    type="date"
                    value={endDateInput}
                    onChange={(e) => setEndDateInput(e.target.value)}
                    className="border-neutral-200 bg-neutral-50 text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-neutral-400">
                Se não alterar, manterá o prazo padrão calculado na compra.
              </p>
            </div>

            <div className="border-t border-neutral-100 pt-4">
              <h1 className="mb-2 text-sm font-medium text-neutral-700">
                Código de rastreio:
              </h1>
              <Input
                placeholder="Ex: AA123456789BR"
                value={trackingCodeInput}
                onChange={(e) => setTrackingCodeInput(e.target.value)}
                className="border-neutral-200 bg-neutral-50 text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
              />
              <p className="mt-2 text-xs text-neutral-500">
                Ao salvar, o status mudará automaticamente para
                &quot;Enviado&quot;.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTrackingModalOpen(false)}>
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
              {currentOrderData?.shippingAddress && (
                <>
                  <p className="text-neutral-600">
                    {currentOrderData.shippingAddress.street},{" "}
                    {currentOrderData.shippingAddress.number}
                  </p>
                  <p className="text-neutral-600">
                    {currentOrderData.shippingAddress.city} -{" "}
                    {currentOrderData.shippingAddress.state}
                  </p>
                  <p className="font-mono font-medium text-orange-600">
                    CEP: {currentOrderData.shippingAddress.zipCode}
                  </p>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-neutral-200 bg-white text-neutral-900 shadow-lg sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500">
              Isso excluirá permanentemente{" "}
              <strong>{selectedIds.length}</strong> pedidos selecionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 text-white shadow-sm hover:bg-red-700"
              disabled={isPending}
            >
              {isPending ? "Excluindo..." : "Excluir Selecionados"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
