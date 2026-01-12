import Link from "next/link";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SpotlightCard } from "@/components/spotlight-card";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "1. Coleta de Informações",
      content:
        "Coletamos informações que você nos fornece diretamente ao criar uma conta, fazer uma compra ou entrar em contato conosco. Isso inclui seu nome, endereço de e-mail, informações de pagamento (processadas de forma segura por terceiros) e dados de perfil do Discord.",
    },
    {
      title: "2. Uso das Informações",
      content:
        "Utilizamos seus dados para processar pedidos, liberar acessos automáticos aos produtos digitais, enviar atualizações sobre sua conta e responder a solicitações de suporte. Não vendemos seus dados para terceiros.",
    },
    {
      title: "3. Segurança de Dados",
      content:
        "Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações. Utilizamos criptografia para dados sensíveis e parcerias com gateways de pagamento certificados.",
    },
    {
      title: "4. Cookies e Rastreamento",
      content:
        "Utilizamos cookies essenciais para manter sua sessão ativa e garantir o funcionamento do carrinho de compras. Também podemos usar ferramentas de análise anônima para melhorar a experiência na loja.",
    },
    {
      title: "5. Seus Direitos",
      content:
        "Você tem o direito de acessar, corrigir ou solicitar a exclusão de seus dados pessoais a qualquer momento. Para exercer esses direitos, entre em contato através dos nossos canais de suporte.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#010000] selection:bg-[#D00000] selection:text-white">
      <div className="z-[100] w-full bg-[#010000]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center">
          <Header />
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-42 md:px-8">
        {/* --- CABEÇALHO --- */}
        <div className="mb-12 text-center">
          <h1 className="font-clash-display mb-4 text-3xl font-bold text-white md:text-5xl">
            Política de Privacidade
          </h1>
          <p className="text-neutral-400">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* --- CONTEÚDO --- */}
        <div className="space-y-6">
          <div>
            <p className="text-base leading-relaxed text-neutral-300">
              A sua privacidade é importante para nós. É política da{" "}
              <strong>SubMind</strong> respeitar a sua privacidade em relação a
              qualquer informação sua que possamos coletar no site e outros
              meios que possuímos e operamos.
            </p>
          </div>

          {sections.map((section, index) => (
            <SpotlightCard
              key={index}
              className="flex flex-col gap-3 rounded-2xl bg-[#010000] p-8"
              spotlightColor="rgba(208, 0, 0, 0)"
            >
              <h2 className="font-clash-display text-xl font-semibold text-white">
                {section.title}
              </h2>
              <p className="text-sm leading-relaxed text-neutral-400">
                {section.content}
              </p>
            </SpotlightCard>
          ))}

          {/* --- RODAPÉ DO DOCUMENTO --- */}
          <div className="mt-12 text-center">
            <p className="text-sm text-neutral-500">
              Tem dúvidas sobre nossa política?{" "}
              <Link
                href="/contato"
                className="text-[#D00000] underline transition-colors hover:text-white"
              >
                Entre em contato.
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
