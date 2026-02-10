"use client";

import { useState } from "react";

import { HireServiceForm } from "@/components/hire-service-form";
import { Button } from "@/components/ui/button";

export function HireButton({
  provider,
  categoryId,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any;
  categoryId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        className="w-full cursor-pointer bg-orange-600 font-bold text-white shadow-sm hover:bg-orange-700"
        onClick={() => setIsOpen(true)}
      >
        Solicitar Orçamento
      </Button>

      <HireServiceForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        provider={provider}
        categoryId={categoryId}
      />
    </>
  );
}
