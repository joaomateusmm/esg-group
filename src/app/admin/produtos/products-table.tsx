"use client";

import { CopyCheck, ImageIcon, Search, SquareCheck } from "lucide-react";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation"; // <--- 1. IMPORTADO AQUI
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { deleteProducts } from "./actions";
import { ProductActions } from "./product-actions";

// Tipo auxiliar para as categorias
interface CategoryData {
  id: string;
  name: string;
}

interface ProductsTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  totalProducts: number;
  limitParam: string;
  // NOVO: Recebe todas as categorias para fazer o "match" do ID com o Nome
  allCategories: CategoryData[];
}

export function ProductsTable({
  data,
  totalProducts,
  limitParam,
  allCategories,
}: ProductsTableProps) {
  const router = useRouter(); // <--- 2. INICIALIZADO AQUI
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Checkbox do Header (Seleciona/Deseleciona a página atual)
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(data.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Checkbox da Linha (Seleciona um)
  const handleSelectOne = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // --- NOVA FUNÇÃO: Botão "Marcar Página" ---
  const handleSelectPage = () => {
    // Pega apenas os IDs dos dados que estão sendo exibidos (data)
    const pageIds = data.map((product) => product.id);
    setSelectedIds(pageIds);
    toast.success(`${pageIds.length} itens desta página selecionados.`);
  };

  const handleBulkDelete = () => {
    startTransition(async () => {
      try {
        await deleteProducts(selectedIds);
        setSelectedIds([]);
        setShowDeleteDialog(false);
        toast.success(`${selectedIds.length} produtos excluídos.`);

        router.refresh(); // <--- 3. CHAMADO AQUI (Agora funciona!)
      } catch {
        // CORREÇÃO: Removido a variável (error)
        toast.error("Erro ao excluir produtos.");
      }
    });
  };

  // Função auxiliar para encontrar o nome da categoria pelo ID
  const getCategoryName = (id: string) => {
    const cat = allCategories.find((c) => c.id === id);
    return cat ? cat.name : "Desconhecido";
  };

  return (
    <>
      {/* --- FILTROS E BOTÕES --- */}
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="relative w-52">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            placeholder="Procurar por nome..."
            className="h-10 border-white/10 bg-white/5 pl-10 text-white placeholder:text-neutral-500 focus:border-[#D00000] focus:ring-0"
          />
        </div>
        <div className="flex items-center justify-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="animate-in fade-in zoom-in flex h-10 items-center justify-center gap-2 rounded-md border border-red-500/10 bg-red-500/5 px-3 text-sm text-white duration-300 hover:bg-red-500/20"
            >
              <SquareCheck className="h-4 w-4" />
              Excluir ({selectedIds.length})
            </button>
          )}

          {/* --- BOTÃO MARCAR PÁGINA (Com função agora) --- */}
          <button
            onClick={handleSelectPage}
            className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white duration-300 hover:bg-white/10 active:scale-95"
          >
            <SquareCheck className="h-4 w-4" />
            Marcar Página
          </button>

          <button
            onClick={() => handleSelectAll(true)}
            className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white duration-300 hover:bg-white/10 active:scale-95"
          >
            <CopyCheck className="h-4 w-4" />
            Marcar Todos
          </button>
        </div>
      </div>

      {/* --- TABELA DE PRODUTOS --- */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A]">
        <Table>
          <TableHeader className="bg-white/5 hover:bg-white/5">
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="w-[40px]">
                <Checkbox
                  className="border-white/50 data-[state=checked]:border-[#D00000] data-[state=checked]:bg-[#D00000]"
                  checked={
                    data.length > 0 &&
                    selectedIds.length === data.length &&
                    data.every((item) => selectedIds.includes(item.id))
                  }
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead className="text-neutral-400">Nome</TableHead>
              <TableHead className="text-neutral-400">Status</TableHead>
              <TableHead className="hidden text-neutral-400 md:table-cell">
                Categoria(s)
              </TableHead>
              <TableHead className="text-right text-neutral-400">
                Preço
              </TableHead>
              <TableHead className="hidden text-right text-neutral-400 md:table-cell">
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
                    <Image
                      src="/images/illustration.svg"
                      alt="Sem produtos"
                      width={300}
                      height={300}
                      className="opacity-40 grayscale"
                    />
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
                    className="border-white/10 transition-colors hover:bg-white/5"
                    data-state={selectedIds.includes(item.id) ? "selected" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        className="border-white/50 data-[state=checked]:border-[#D00000] data-[state=checked]:bg-[#D00000]"
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(!!checked, item.id)
                        }
                      />
                    </TableCell>

                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-13 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white/5">
                          {mainImage ? (
                            <Image
                              src={mainImage}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-neutral-600" />
                            </div>
                          )}
                        </div>
                        <span className="truncate">{item.name}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`border-0 px-2 py-1 font-normal capitalize ${
                          item.status === "active"
                            ? "bg-green-500/10 text-green-500"
                            : item.status === "inactive"
                              ? "bg-red-500/10 text-red-500"
                              : "bg-yellow-500/10 text-yellow-500"
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
                              className="border-0 bg-white/10 text-white hover:bg-white/20"
                            >
                              {getCategoryName(catId)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-neutral-500">-</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-mono text-white">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(item.price / 100)}
                    </TableCell>

                    <TableCell className="hidden text-right text-neutral-400 md:table-cell">
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
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-neutral-600">
          Exibindo {data.length} de {totalProducts} produtos.
        </p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">Visualizar</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-white/10 bg-transparent text-white hover:bg-white/10"
                >
                  {limitParam === "all" ? "Todos" : limitParam}
                  <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-white/10 bg-[#111] text-white"
              >
                <Link href="?limit=10" scroll={false}>
                  <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white">
                    10
                  </DropdownMenuItem>
                </Link>
                <Link href="?limit=20" scroll={false}>
                  <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white">
                    20
                  </DropdownMenuItem>
                </Link>
                <Link href="?limit=30" scroll={false}>
                  <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white">
                    30
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-white/10" />
                <Link href="?limit=all" scroll={false}>
                  <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white">
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
              className="border-white/10 bg-transparent text-white hover:bg-white/10 disabled:opacity-50"
              disabled
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-transparent text-white hover:bg-white/10"
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>

      {/* --- DIALOG DE EXCLUSÃO EM MASSA --- */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-white/10 bg-[#111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Isso excluirá permanentemente{" "}
              <strong>{selectedIds.length}</strong> produtos selecionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/10 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 text-white hover:bg-red-700"
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
