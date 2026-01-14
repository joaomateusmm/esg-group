"use client";

import { Loader2, Megaphone, Power, PowerOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  deleteCouponAction,
  removeFeaturedCouponAction,
  setFeaturedCouponAction,
  toggleCouponStatusAction,
} from "@/actions/coupons";
import { Button } from "@/components/ui/button";

// --- BOTÃO DE EXCLUIR ---
export function DeleteCouponButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este cupom?")) return;
    setLoading(true);
    const res = await deleteCouponAction(id);
    setLoading(false);
    if (res.success) toast.success("Cupom excluído.");
    else toast.error("Erro ao excluir.");
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-400"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}

// --- BOTÃO DE ATIVAR/DESATIVAR ---
export function ToggleCouponButton({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    const res = await toggleCouponStatusAction(id, isActive);
    setLoading(false);
    if (res.success)
      toast.success(isActive ? "Cupom desativado." : "Cupom ativado.");
    else toast.error("Erro ao atualizar.");
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-8 w-8 text-neutral-400 hover:text-white"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isActive ? (
        <Power className="h-4 w-4 text-green-500" />
      ) : (
        <PowerOff className="h-4 w-4 text-neutral-500" />
      )}
    </Button>
  );
}

// --- NOVO: BOTÃO DE DIVULGAR (FEATURE) ---
export function FeatureCouponButton({
  id,
  isFeatured,
}: {
  id: string;
  isFeatured: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleFeature = async () => {
    setLoading(true);
    // Se já estiver destacado, removemos. Se não, ativamos.
    const res = isFeatured
      ? await removeFeaturedCouponAction()
      : await setFeaturedCouponAction(id);

    setLoading(false);

    if (res.success) toast.success(res.message);
    else toast.error(res.message);
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className={`h-8 w-8 transition-colors ${
        isFeatured
          ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
          : "text-neutral-500 hover:bg-white/5 hover:text-white"
      }`}
      onClick={handleFeature}
      disabled={loading}
      title={isFeatured ? "Parar divulgação" : "Divulgar este cupom"}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Megaphone className={`h-4 w-4 ${isFeatured ? "fill-current" : ""}`} />
      )}
    </Button>
  );
}
