import { headers } from "next/headers";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { auth } from "@/lib/auth"; // Ajuste conforme sua autenticação

const f = createUploadthing();

// Função de autenticação fake ou real
const handleAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Se não estiver logado, lança erro
  if (!session?.user) throw new UploadThingError("Unauthorized");

  // Retorna o ID do usuário para metadata
  return { userId: session.user.id };
};

export const ourFileRouter = {
  // Define a rota "imageUploader" que você está chamando no frontend
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
    .middleware(async () => {
      // Esse código roda no servidor ANTES do upload
      const user = await handleAuth();
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Esse código roda no servidor DEPOIS do upload
      console.log("Upload finished for user:", metadata.userId);
      console.log("File url:", file.url);

      // !!! IMPORTANTE: Retorne algo para o cliente se necessário
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
