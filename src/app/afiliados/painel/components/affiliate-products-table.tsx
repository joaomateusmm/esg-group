"use client";

import { Check, Copy, ImageIcon, Search } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProductData {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  images: string[] | null;
  affiliateRate: number | null;
}

interface AffiliateProductsTableProps {
  data: ProductData[];
  affiliateCode: string;
  domain: string;
}

export function AffiliateProductsTable({
  data,
  affiliateCode,
  domain,
}: AffiliateProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCopyLink = (productId: string) => {
    const link = `${domain}/produto/${productId}?ref=${affiliateCode}`;
    navigator.clipboard.writeText(link);
    setCopiedId(productId);
    toast.success("Link de afiliado copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Função auxiliar para formatar dinheiro
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val / 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            placeholder="Buscar produto para divulgar..."
            className="h-10 border-white/10 bg-white/5 pl-10 text-white placeholder:text-neutral-500 focus:border-[#D00000] focus:ring-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A]">
        <Table>
          <TableHeader className="bg-white/5 hover:bg-white/5">
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-neutral-400">Produto</TableHead>
              <TableHead className="text-neutral-400">Comissão (%)</TableHead>
              <TableHead className="text-right text-neutral-400">
                Preço Atual
              </TableHead>
              <TableHead className="text-right text-neutral-400">
                Você Ganha
              </TableHead>
              <TableHead className="w-[250px] text-right text-neutral-400">
                Link
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-64 text-center text-neutral-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 opacity-20" />
                    <p>Nenhum produto encontrado.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => {
                const mainImage =
                  item.images && item.images.length > 0 ? item.images[0] : null;

                // Se discountPrice existir, usamos ele. Senão, usamos price.
                const effectivePrice = item.discountPrice
                  ? item.discountPrice
                  : item.price;

                const rate =
                  !item.affiliateRate || item.affiliateRate === 10
                    ? 20
                    : item.affiliateRate;

                // Calculamos a comissão
                const commissionValue = (effectivePrice * rate) / 100;

                return (
                  <TableRow
                    key={item.id}
                    className="border-white/10 transition-colors hover:bg-white/5"
                  >
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
                        <span className="max-w-[200px] truncate md:max-w-xs">
                          {item.name}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="border-0 bg-neutral-500/10 text-neutral-400 hover:bg-neutral-500/20"
                      >
                        {rate}%
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right font-mono text-sm">
                      {item.discountPrice ? (
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-neutral-600 line-through decoration-neutral-600">
                            {formatMoney(item.price)}
                          </span>
                          <span className="text-neutral-300">
                            {formatMoney(item.discountPrice)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-400">
                          {formatMoney(item.price)}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-green-300">
                      {formatMoney(commissionValue)}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyLink(item.id)}
                        className={`border-white/10 bg-white/5 transition-all hover:bg-white/10 ${
                          copiedId === item.id
                            ? "border-green-500/30 bg-green-500/10 text-green-400"
                            : "text-white"
                        }`}
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="mr-2 h-3 w-3" /> Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-3 w-3" /> Copiar Link
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-center text-xs text-neutral-500">
        * As comissões são calculadas sobre o valor final pago pelo cliente
        (considerando descontos).
      </p>
    </div>
  );
}
