import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { desc } from "drizzle-orm";
import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { coupon } from "@/db/schema";
import { auth } from "@/lib/auth";

import {
  DeleteCouponButton,
  FeatureCouponButton,
  ToggleCouponButton,
} from "./coupon-buttons";
import { NewCouponDialog } from "./new-coupon-dialog";

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
};

export default async function AdminCouponsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/");

  const coupons = await db.query.coupon.findMany({
    orderBy: [desc(coupon.createdAt)],
  });

  return (
    <div className="min-h-screen bg-[#fff]">
      {" "}
      {/* Fundo geral claro */}
      <div className="mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-clash-display flex items-center gap-3 text-3xl font-medium text-neutral-900">
              Cupons de Desconto
            </h1>
            <p className="text-neutral-500">
              Crie e gerencie códigos promocionais para sua loja.
            </p>
          </div>
          <NewCouponDialog />
        </div>

        <Card className="border-neutral-200 bg-white shadow-sm">
          <CardHeader className="border-b border-neutral-100 pb-4">
            <CardTitle className="text-lg font-semibold text-neutral-900">
              Cupons Ativos e Inativos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader className="bg-neutral-50 px-8">
                <TableRow className="border-neutral-200 hover:bg-neutral-100">
                  <TableHead className="font-semibold text-neutral-600">
                    Código
                  </TableHead>
                  <TableHead className="font-semibold text-neutral-600">
                    Desconto
                  </TableHead>
                  <TableHead className="font-semibold text-neutral-600">
                    Usos
                  </TableHead>
                  <TableHead className="font-semibold text-neutral-600">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-neutral-600">
                    Validade
                  </TableHead>
                  <TableHead className="text-right font-semibold text-neutral-600">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-96 text-center text-neutral-500"
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center gap-4 py-10">
                        <Image
                          src="/images/illustration.svg"
                          alt="Sem cupons"
                          width={300}
                          height={300}
                          className="opacity-50 grayscale"
                        />
                        <p className="text-lg font-light text-neutral-400">
                          Nenhum cupom encontrado.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons.map((cp) => (
                    <TableRow
                      key={cp.id}
                      className="border-neutral-100 transition-colors hover:bg-neutral-50"
                    >
                      <TableCell className="font-mono text-lg font-bold text-neutral-900">
                        {cp.code}
                        {cp.isFeatured && (
                          <span className="ml-2 inline-flex items-center rounded-full border border-yellow-200 bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
                            Destaque
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-neutral-700">
                        {cp.type === "percent" ? (
                          <Badge
                            variant="secondary"
                            className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                          >
                            {cp.value}% OFF
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                          >
                            {formatCurrency(cp.value)} OFF
                          </Badge>
                        )}
                        {cp.minValue !== null && cp.minValue > 0 && (
                          <div className="mt-1 text-xs text-neutral-500">
                            Mín: {formatCurrency(cp.minValue)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-neutral-600">
                        {cp.usedCount} {cp.maxUses ? `/ ${cp.maxUses}` : ""}
                      </TableCell>
                      <TableCell>
                        {cp.isActive ? (
                          <Badge className="border-green-200 bg-green-100 text-green-700 hover:bg-green-200">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-neutral-300 bg-neutral-50 text-neutral-500"
                          >
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-500">
                        {cp.expiresAt
                          ? format(new Date(cp.expiresAt), "dd/MM/yyyy", {
                              locale: ptBR,
                            })
                          : "∞"}
                      </TableCell>
                      <TableCell className="flex justify-end gap-2 text-right">
                        <FeatureCouponButton
                          id={cp.id}
                          isFeatured={cp.isFeatured}
                        />
                        <ToggleCouponButton id={cp.id} isActive={cp.isActive} />
                        <DeleteCouponButton id={cp.id} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
