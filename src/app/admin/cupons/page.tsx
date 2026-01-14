import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { desc } from "drizzle-orm";
import { headers } from "next/headers";
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
  FeatureCouponButton, // <--- IMPORTANTE: Importar o botão
  ToggleCouponButton,
} from "./coupon-buttons";
import { NewCouponDialog } from "./new-coupon-dialog";

// Helper ajustado para ser seguro contra null/undefined
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
    <div className="min-h-screen">
      <div className="">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-clash-display flex items-center gap-3 text-3xl font-medium text-white">
              Cupons de Desconto
            </h1>
            <p className="text-neutral-400">
              Crie e gerencie códigos promocionais para sua loja.
            </p>
          </div>
          <NewCouponDialog />
        </div>

        <Card className="border-white/10 bg-[#0A0A0A]">
          <CardHeader>
            <CardTitle className="text-white">
              Cupons Ativos e Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-neutral-400">Código</TableHead>
                  <TableHead className="text-neutral-400">Desconto</TableHead>
                  <TableHead className="text-neutral-400">Usos</TableHead>
                  <TableHead className="text-neutral-400">Status</TableHead>
                  <TableHead className="text-neutral-400">Validade</TableHead>
                  <TableHead className="text-right text-neutral-400">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((cp) => (
                  <TableRow
                    key={cp.id}
                    className="border-white/10 hover:bg-white/5"
                  >
                    <TableCell className="font-mono text-lg font-bold text-white">
                      {cp.code}
                      {/* Badge visual se estiver destacado */}
                      {cp.isFeatured && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-medium text-yellow-500">
                          Destaque
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-neutral-300">
                      {cp.type === "percent" ? (
                        <Badge
                          variant="secondary"
                          className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                        >
                          {cp.value}% OFF
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-green-500/10 text-green-400 hover:bg-green-500/20"
                        >
                          {formatCurrency(cp.value)} OFF
                        </Badge>
                      )}
                      {/* Verificação segura: só mostra se existir E for maior que 0 */}
                      {cp.minValue !== null && cp.minValue > 0 && (
                        <div className="mt-1 text-xs text-neutral-500">
                          Mín: {formatCurrency(cp.minValue)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-neutral-300">
                      {cp.usedCount} {cp.maxUses ? `/ ${cp.maxUses}` : ""}
                    </TableCell>
                    <TableCell>
                      {cp.isActive ? (
                        <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-neutral-700 text-neutral-500"
                        >
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-neutral-400">
                      {cp.expiresAt
                        ? format(new Date(cp.expiresAt), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : "∞"}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2 text-right">
                      {/* --- BOTÕES AQUI --- */}
                      <FeatureCouponButton
                        id={cp.id}
                        isFeatured={cp.isFeatured}
                      />
                      <ToggleCouponButton id={cp.id} isActive={cp.isActive} />
                      <DeleteCouponButton id={cp.id} />
                    </TableCell>
                  </TableRow>
                ))}

                {coupons.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-neutral-500"
                    >
                      Nenhum cupom criado ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
