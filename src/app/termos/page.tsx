import { Suspense } from "react"; // 1. IMPORTAR SUSPENSE

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SpotlightCard } from "@/components/spotlight-card";

// 2. FORÇAR MODO DINÂMICO
export const dynamic = "force-dynamic";

export default function TermsPage() {
  const terms = [
    {
      title: "1. Aceitação dos Termos",
      content:
        "Ao acessar o site ESG-Group, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis.",
    },
    {
      title: "2. Licença de Uso",
      content:
        "É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site ESG-Group, apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título.",
    },
    {
      title: "3. Produtos Digitais e Reembolsos",
      content:
        "Por se tratar de produtos digitais com acesso imediato ou envio de código, reembolsos só serão processados em caso de falha técnica comprovada do produto que impeça sua utilização, conforme o Código de Defesa do Consumidor.",
    },
    {
      title: "4. Limitações",
      content:
        "Em nenhum caso a ESG-Group ou seus fornecedores serão responsáveis ​​por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais em nosso site.",
    },
    {
      title: "5. Contas e Segurança",
      content:
        "Você é responsável por manter a confidencialidade de sua conta e senha. A ESG-Group não se responsabiliza por perdas decorrentes do uso não autorizado de sua conta.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#010000] selection:bg-[#D00000] selection:text-white">
      <div className="z-[100] w-full bg-[#010000]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center">
          {/* 3. ENVOLVER HEADER COM SUSPENSE */}
          <Suspense fallback={<div className="h-20 w-full bg-[#010000]" />}>
            <Header />
          </Suspense>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-42 md:px-8">
        {/* --- CABEÇALHO --- */}
        <div className="mb-12 text-center">
          <h1 className="font-clash-display mb-4 text-3xl font-bold text-white md:text-5xl">
            Termos de Uso
          </h1>
          <p className="text-neutral-400">
            Regras e diretrizes para uso da plataforma ESG-Group.
          </p>
        </div>

        {/* --- CONTEÚDO --- */}
        <div className="space-y-6">
          {terms.map((term, index) => (
            <SpotlightCard
              key={index}
              className="flex flex-col gap-3 rounded-2xl bg-[#010000] p-8 transition-colors hover:border-white/20"
              spotlightColor="rgba(208, 0, 0, 0)"
            >
              <h2 className="font-clash-display text-xl font-semibold text-white">
                {term.title}
              </h2>
              <p className="text-sm leading-relaxed text-neutral-400">
                {term.content}
              </p>
            </SpotlightCard>
          ))}

          {/* --- AVISO LEGAL --- */}
          <div className="mt-8 rounded-xl border border-dashed border-white/20 p-4 text-center">
            <p className="text-xs text-neutral-500">
              A ESG-Group se reserva o direito de alterar estes termos a
              qualquer momento. Recomendamos que você revise esta página
              periodicamente.
            </p>
          </div>
        </div>
      </main>

      {/* 4. ENVOLVER FOOTER COM SUSPENSE */}
      <Suspense fallback={<div className="h-20 w-full bg-[#010000]" />}>
        <Footer />
      </Suspense>
    </div>
  );
}
