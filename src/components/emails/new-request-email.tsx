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
  address: string;
  dashboardUrl: string;
}

export const NewRequestEmail = ({
  providerName,
  customerName,
  description,
  address,
  dashboardUrl,
}: NewRequestEmailProps) => {
  const previewText = `Nova solicitação de serviço de ${customerName}`;

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
              Você recebeu uma nova solicitação através do{" "}
              <strong>ESG Group</strong>.
            </Text>

            <Section className="my-4 rounded-md bg-gray-50 p-4">
              <Text className="m-0 font-bold text-gray-800">Cliente:</Text>
              <Text className="m-0 mb-2 text-gray-600">{customerName}</Text>

              <Text className="m-0 font-bold text-gray-800">
                Descrição do Serviço:
              </Text>
              <Text className="m-0 mb-2 text-gray-600 italic">
                &quot;{description}&quot;
              </Text>

              <Text className="m-0 font-bold text-gray-800">Localização:</Text>
              <Text className="m-0 mb-2 text-gray-600">{address}</Text>
            </Section>

            <Text className="text-[14px] leading-[24px] text-black">
              Acesse seu painel agora para visualizar os detalhes completos e
              responder ao cliente.
            </Text>

            <Section className="mt-[32px] mb-[32px] text-center">
              <Button
                className="rounded bg-[#ea580c] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={dashboardUrl}
              >
                Ver Solicitação no Painel
              </Button>
            </Section>

            <Hr className="mx-0 my-[26px] border border-solid border-[#eaeaea]" />
            <Text className="text-[12px] leading-[24px] text-[#666666]">
              ESG Group - Conectando serviços com sustentabilidade.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default NewRequestEmail;
