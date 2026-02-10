import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

interface NewRequestEmailProps {
  providerName: string;
  customerName: string;
  description: string;
  budgetType: string;
  budgetValue?: string | null;
  address: string;
  dashboardUrl: string;
}

export const NewRequestEmail = ({
  providerName,
  customerName,
  description,
  budgetType,
  budgetValue,
  address,
  dashboardUrl,
}: NewRequestEmailProps) => {
  const previewText = `Novo pedido de orçamento de ${customerName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              Nova Solicitação de Serviço
            </Heading>
            <Text className="text-[14px] leading-[24px] text-black">
              Olá, <strong>{providerName}</strong>!
            </Text>
            <Text className="text-[14px] leading-[24px] text-black">
              Você recebeu uma nova solicitação de orçamento através do{" "}
              <strong>ESG Group</strong>.
            </Text>

            <Section className="my-4 rounded-md bg-gray-50 p-4">
              <Text className="m-0 font-bold text-gray-800">Cliente:</Text>
              <Text className="m-0 mb-2 text-gray-600">{customerName}</Text>

              <Text className="m-0 font-bold text-gray-800">Descrição:</Text>
              <Text className="m-0 mb-2 text-gray-600 italic">
                &quot;{description}&quot;
              </Text>

              <Text className="m-0 font-bold text-gray-800">Local:</Text>
              <Text className="m-0 mb-2 text-gray-600">{address}</Text>

              <Text className="m-0 font-bold text-gray-800">
                Orçamento Proposto:
              </Text>
              <Text className="m-0 font-semibold text-orange-600">
                {budgetType === "range" ? `£ ${budgetValue}` : "A Combinar"}
              </Text>
            </Section>

            <Text className="text-[14px] leading-[24px] text-black">
              Acesse seu painel para aceitar ou recusar este pedido e ver os
              dados de contato do cliente.
            </Text>

            <Section className="mt-[32px] mb-[32px] text-center">
              <Button
                className="rounded bg-[#ea580c] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={dashboardUrl}
              >
                Acessar Painel do Prestador
              </Button>
            </Section>
            <Hr className="mx-0 my-[26px] border border-solid border-[#eaeaea]" />
            <Text className="text-[12px] leading-[24px] text-[#666666]">
              Se você não esperava este e-mail, pode ignorá-lo.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default NewRequestEmail;
