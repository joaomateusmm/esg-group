import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { serviceCategory } from "@/db/schema";

import { EditServiceForm } from "./edit-service-form";

interface EditServicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({
  params,
}: EditServicePageProps) {
  const { id } = await params;

  // 1. Busca os dados no banco
  const data = await db.query.serviceCategory.findFirst({
    where: eq(serviceCategory.id, id),
  });

  // 2. Se não existir, 404
  if (!data) {
    return notFound();
  }

  // 3. Renderiza o formulário com os dados
  return <EditServiceForm initialData={data} />;
}
