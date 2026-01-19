"use server";

interface ShippingItem {
  id: string;
  quantity: number;
  // Na vida real, você buscaria peso/dimensões do banco pelo ID
  // Aqui vamos simular que o frontend já manda ou buscamos aqui
  weight?: number; // kg
  width?: number; // cm
  height?: number; // cm
  length?: number; // cm
}

interface ShippingRequest {
  destinationPostalCode: string;
  destinationCountry: string;
  items: ShippingItem[];
}

export async function calculateShippingAction({
  destinationPostalCode,
  destinationCountry,
  items,
}: ShippingRequest) {
  const originCep = process.env.STORE_ORIGIN_CEP || "01001000";

  // 1. Simulação de Busca de Dados Físicos do Produto
  // Num cenário real, você faria: const dbProducts = await prisma.product.findMany(...)
  // E somaria o peso real.

  // Vamos simular uma lógica de "Cubagem/Peso Total"
  let totalWeight = 0;

  // Exemplo de lógica simulada (Você substituirá pela chamada ao Melhor Envio/Frenet)
  // Digamos que cada item tem um peso base se não vier especificado
  items.forEach((item) => {
    // Se o item tiver peso definido, usa ele, senão chuta 1kg por item
    const itemWeight = item.weight || 1;
    totalWeight += itemWeight * item.quantity;
  });

  // 2. Lógica de Preço baseada no Peso e País
  let shippingCost = 0; // em centavos

  if (destinationCountry === "BR") {
    // Lógica para o Brasil
    if (totalWeight < 5) {
      shippingCost = 2500; // Leve (até 5kg): R$ 25,00
    } else if (totalWeight < 30) {
      shippingCost = 8000; // Médio (Cadeira): R$ 80,00
    } else {
      shippingCost = 25000; // Pesado (Geladeira): R$ 250,00 (Transportadora)
    }

    // Bônus: Se for o mesmo estado da origem (simulação simples pelo CEP)
    if (destinationPostalCode.substring(0, 2) === originCep.substring(0, 2)) {
      shippingCost *= 0.6; // 40% de desconto para frete local
    }
  } else {
    // Lógica Internacional (Simplificada)
    // Europa/EUA geralmente cobra caro por peso volumétrico
    if (totalWeight < 2) {
      shippingCost = 15000; // Packet Standard: R$ 150,00
    } else if (totalWeight < 10) {
      shippingCost = 40000; // Box: R$ 400,00
    } else {
      shippingCost = 120000; // Heavy Cargo: R$ 1.200,00
    }
  }

  // Retorna o valor em centavos
  return {
    price: Math.round(shippingCost),
    estimatedDays: destinationCountry === "BR" ? 5 : 15,
  };
}
