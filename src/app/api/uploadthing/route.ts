import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "./core";

// Exporta as rotas GET e POST necessárias para o Next.js App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,

  // Adicione isso se quiser debugar erros no console do servidor
  config: {
    isDev: process.env.NODE_ENV === "development",
    // token: process.env.UPLOADTHING_TOKEN // Opcional, ele pega automático do process.env
  },
});
