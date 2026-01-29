import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import EditProductForm from "@/components/admin/edit-product-form";
import { db } from "@/db";
import { product } from "@/db/schema";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;

  // 1. Buscar o produto no banco
  const productData = await db.query.product.findFirst({
    where: eq(product.id, id),
  });

  // 2. Se não existir, retorna 404
  if (!productData) {
    return notFound();
  }

  // 3. Renderiza o formulário passando os dados iniciais
  return (
    <div className="min-h-screen flex-1 space-y-4 p-8 pt-6">
      <EditProductForm initialData={productData} />
    </div>
  );
}
