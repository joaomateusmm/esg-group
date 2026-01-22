"use client";

import {
  ChevronDown,
  CopyCheck,
  ImageIcon,
  Search,
  SquareCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
// 1. ADICIONADOS IMPORTS DE NAVEGAÇÃO
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { deleteProducts } from "../../../../actions/create-product";
import { ProductActions } from "./product-actions";

interface CategoryData {
  id: string;
  name: string;
}

interface ProductsTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  totalProducts: number;
  limitParam: string;
  allCategories: CategoryData[];
}

export function ProductsTable({
  data,
  totalProducts,
  limitParam,
  allCategories,
}: ProductsTableProps) {
  const router = useRouter();
  // 2. HOOKS PARA LER A URL
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 3. FUNÇÃO DE PESQUISA (Atualiza a URL)
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);

    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }

    // Substitui a URL atual mantendo o scroll na mesma posição
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(data.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleSelectPage = () => {
    const pageIds = data.map((product) => product.id);
    setSelectedIds(pageIds);
    toast.success(`${pageIds.length} itens desta página selecionados.`);
  };

  const handleBulkDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteProducts(selectedIds);

        if (result.success) {
          setSelectedIds([]);
          setShowDeleteDialog(false);
          toast.success(result.message);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Erro ao excluir produtos.");
      }
    });
  };

  const getCategoryName = (id: string) => {
    const cat = allCategories.find((c) => c.id === id);
    return cat ? cat.name : "Desconhecido";
  };

  return (
    <>
      {/* --- FILTROS E BOTÕES --- */}
      <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-600 shadow-sm duration-300">
          <Search className="mr-1 h-4 w-4 text-neutral-500" />
          <input
            // 4. INPUT CONECTADO
            placeholder="Pesquisar Produto..."
            type="text"
            // Pega o valor atual da URL para não perder ao recarregar
            defaultValue={searchParams.get("search")?.toString()}
            // Atualiza a URL quando o usuário digita
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
            onClick={handleSelectPage}
            className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-600 shadow-sm duration-300 hover:bg-neutral-50 active:scale-95"
          >
            <SquareCheck className="h-4 w-4" />
            Marcar Página
          </button>

          <button
            onClick={() => handleSelectAll(true)}
            className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-600 shadow-sm duration-300 hover:bg-neutral-50 active:scale-95"
          >
            <CopyCheck className="h-4 w-4" />
            Marcar Todos
          </button>
        </div>
      </div>

      {/* --- TABELA DE PRODUTOS --- */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow className="border-neutral-200 hover:bg-neutral-100">
              <TableHead className="w-[40px]">
                <Checkbox
                  className="border-neutral-400 data-[state=checked]:border-orange-600 data-[state=checked]:bg-orange-600"
                  checked={
                    data.length > 0 &&
                    selectedIds.length === data.length &&
                    data.every((item) => selectedIds.includes(item.id))
                  }
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead className="font-semibold text-neutral-600">
                Nome
              </TableHead>
              <TableHead className="font-semibold text-neutral-600">
                Status
              </TableHead>
              <TableHead className="hidden font-semibold text-neutral-600 md:table-cell">
                Categoria(s)
              </TableHead>
              <TableHead className="text-right font-semibold text-neutral-600">
                Preço
              </TableHead>
              <TableHead className="hidden text-right font-semibold text-neutral-600 md:table-cell">
                Vendas
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
                  <div className="flex h-full w-full flex-col items-center justify-center gap-4 py-10">
                    <ImageIcon className="h-16 w-16 text-neutral-200" />
                    <p className="text-lg font-light text-neutral-400">
                      Nenhum produto encontrado.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => {
                const mainImage =
                  item.images && item.images.length > 0 ? item.images[0] : null;

                return (
                  <TableRow
                    key={item.id}
                    className="border-neutral-100 transition-colors hover:bg-neutral-50"
                    data-state={selectedIds.includes(item.id) ? "selected" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        className="border-neutral-400 data-[state=checked]:border-orange-600 data-[state=checked]:bg-orange-600"
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(!!checked, item.id)
                        }
                      />
                    </TableCell>

                    <TableCell className="font-medium text-neutral-900">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
                          {mainImage ? (
                            <Image
                              src={mainImage}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-neutral-400" />
                            </div>
                          )}
                        </div>
                        <span
                          className="max-w-[200px] truncate"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`border px-2 py-1 font-medium capitalize ${
                          item.status === "active"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : item.status === "inactive"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-yellow-200 bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {item.status === "active"
                          ? "Ativo"
                          : item.status === "inactive"
                            ? "Inativo"
                            : "Rascunho"}
                      </Badge>
                    </TableCell>

                    {/* Categoria */}
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {item.categories && item.categories.length > 0 ? (
                          item.categories.map((catId: string) => (
                            <Badge
                              key={catId}
                              variant="secondary"
                              className="border border-neutral-200 bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                            >
                              {getCategoryName(catId)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-mono font-medium text-neutral-900">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(item.price / 100)}
                    </TableCell>

                    <TableCell className="hidden text-right text-neutral-600 md:table-cell">
                      {item.sales}
                    </TableCell>

                    <TableCell>
                      <ProductActions id={item.id} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- RODAPÉ --- */}
      <div className="mt-4 flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-neutral-500">
          Exibindo {data.length} de {totalProducts} produtos.
        </p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">Visualizar</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                >
                  {limitParam === "all" ? "Todos" : limitParam}
                  <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-neutral-200 bg-white text-neutral-700 shadow-md"
              >
                <Link href="?limit=10" scroll={false}>
                  <DropdownMenuItem className="cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50">
                    10
                  </DropdownMenuItem>
                </Link>
                <Link href="?limit=20" scroll={false}>
                  <DropdownMenuItem className="cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50">
                    20
                  </DropdownMenuItem>
                </Link>
                <Link href="?limit=30" scroll={false}>
                  <DropdownMenuItem className="cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50">
                    30
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-neutral-100" />
                <Link href="?limit=all" scroll={false}>
                  <DropdownMenuItem className="cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50">
                    Todos
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              disabled
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>

      {/* --- DIALOG DE EXCLUSÃO EM MASSA --- */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-neutral-200 bg-white text-neutral-900 shadow-lg sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500">
              Isso excluirá permanentemente{" "}
              <strong>{selectedIds.length}</strong> produtos selecionados.
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
