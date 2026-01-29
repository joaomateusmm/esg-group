"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Copy, Ticket, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface CouponPopupProps {
  coupon: {
    code: string;
    value: number;
    type: "percent" | "fixed";
    title?: string | null;
    description?: string | null;
  } | null;
}

const SHOW_AGAIN_HOURS = 24;

export function CouponPopup({ coupon }: CouponPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!coupon) return;

    const storageKey = `seen_coupon_${coupon.code}`;
    const lastSeen = localStorage.getItem(storageKey);
    const now = new Date().getTime();
    const expirationTime = SHOW_AGAIN_HOURS * 60 * 60 * 1000;

    if (!lastSeen || now - Number(lastSeen) > expirationTime) {
      const timer = setTimeout(() => setIsOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [coupon]);

  const handleClose = () => {
    setIsOpen(false);
    if (coupon) {
      localStorage.setItem(
        `seen_coupon_${coupon.code}`,
        new Date().getTime().toString(),
      );
    }
  };

  const handleCopy = () => {
    if (coupon) {
      navigator.clipboard.writeText(coupon.code);
      toast.success("Código copiado! Aproveite.");
    }
  };

  if (!coupon) return null;

  const formatValue = (val: number, type: string) => {
    if (type === "percent") return `${val}% OFF`;
    return (
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(val / 100) + " OFF"
    );
  };

  // --- LÓGICA DE TEXTO DINÂMICO ---
  const displayTitle = coupon.title || "Presente para você! 🎁";

  const discountText = (
    <span className="font-bold text-orange-600">
      {formatValue(coupon.value, coupon.type)}
    </span>
  );

  const displayDescription = coupon.description ? (
    <span>{coupon.description}</span>
  ) : (
    <span>Use o cupom abaixo e ganhe {discountText} na sua compra agora.</span>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed right-4 bottom-4 z-[9999] w-full max-w-sm px-4 md:right-8 md:bottom-8 md:px-0"
        >
          <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl">
            {/* Efeito decorativo sutil */}
            <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-orange-100 blur-3xl" />

            <button
              onClick={handleClose}
              className="absolute top-2 right-2 p-2 text-neutral-400 transition-colors hover:text-neutral-900"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600 shadow-lg">
                <Ticket className="h-6 w-6" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg leading-tight font-bold text-neutral-900">
                  {displayTitle}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {displayDescription}
                </p>

                <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-1 pl-3">
                  <code className="flex-1 font-mono text-lg font-bold tracking-wider text-neutral-900">
                    {coupon.code}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    className="text-neutral-500 hover:bg-white hover:text-orange-600 hover:shadow-sm"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
