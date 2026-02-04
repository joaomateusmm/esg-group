import * as React from "react";

interface ProductInfo {
  name: string;
  url: string;
}

interface EmailTemplateProps {
  customerName: string;
  products: ProductInfo[];
  myAccountUrl: string;
}

// Mudamos de "const: React.FC" para "export function" para garantir o tipo de retorno correto
export function EmailTemplate({
  customerName,
  products,
  myAccountUrl,
}: Readonly<EmailTemplateProps>) {
  return (
    <div style={{ fontFamily: "sans-serif", color: "#333" }}>
      <h1>Pagamento Confirmado!</h1>
      <p>
        Olá, <strong>{customerName}</strong>!
      </p>
      <p>Obrigado pela sua compra. Seus arquivos já estão disponíveis.</p>

      <div
        style={{
          background: "#f9f9f9",
          padding: "20px",
          borderRadius: "8px",
          margin: "20px 0",
        }}
      >
        {products.map((product, index) => (
          <div
            key={index}
            style={{
              marginBottom: "15px",
              paddingBottom: "15px",
              borderBottom: "1px solid #eee",
            }}
          >
            <h3 style={{ margin: "0 0 10px" }}>{product.name}</h3>
            {product.url && product.url !== "#" ? (
              <a
                href={product.url}
                style={{
                  backgroundColor: "#000",
                  color: "#fff",
                  padding: "10px 20px",
                  textDecoration: "none",
                  borderRadius: "5px",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                Baixar Arquivo
              </a>
            ) : (
              <span style={{ color: "#666" }}>
                Acesse sua conta para baixar.
              </span>
            )}
          </div>
        ))}
      </div>

      <p>Você também pode acessar seus produtos na área de membros:</p>
      <a href={myAccountUrl} style={{ color: "#D00000" }}>
        Minhas Compras
      </a>
    </div>
  );
}
