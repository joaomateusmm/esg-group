"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  // Se não houver imagens, usa um placeholder
  const safeImages =
    images.length > 0
      ? images
      : ["https://placehold.co/600x600/1a1a1a/FFF.png?text=Sem+Imagem"];

  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      {/* Imagem Principal */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
        <Image
          src={safeImages[selectedIndex]}
          alt={productName}
          fill
          className="object-cover"
          priority // Carrega rápido por ser a principal
        />
      </div>

      {/* Miniaturas */}
      {safeImages.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {safeImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-white/5 transition-all hover:opacity-100",
                selectedIndex === index
                  ? "border-[#D00000] opacity-100 ring-2 ring-[#D00000]/20"
                  : "border-white/10 opacity-60 hover:border-white/30",
              )}
            >
              <Image
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
