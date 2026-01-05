import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// --- TABELAS DE AUTENTICAÇÃO (BETTER AUTH) ---

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  role: text("role").notNull().default("user"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

// --- TABELA DE CATEGORIAS ---

export const category = pgTable("category", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- TABELAS DA LOJA ---

export const product = pgTable("product", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  name: text("name").notNull(),
  description: text("description"),

  price: integer("price").notNull(),
  discountPrice: integer("discountPrice"),

  downloadUrl: text("downloadUrl"),

  images: text("images").array(),
  categories: text("categories").array(),

  paymentLink: text("paymentLink").notNull(),
  deliveryMode: text("deliveryMode").notNull().default("email"),
  paymentMethods: text("paymentMethods")
    .array()
    .notNull()
    .default(["Pix", "Cartão de Crédito", "Cartão de Débito", "Boleto"]),

  stock: integer("stock").default(0),
  isStockUnlimited: boolean("isStockUnlimited").notNull().default(false),

  status: text("status").notNull().default("draft"),
  sales: integer("sales").notNull().default(0),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const review = pgTable("review", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  rating: integer("rating").notNull(),
  comment: text("comment"),

  productId: text("productId")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),

  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// --- NOVAS TABELAS DE PEDIDOS (INTEGRAÇÃO INFINITEPAY) ---

export const order = pgTable("order", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()), // Usaremos este ID como 'order_nsu' na InfinitePay

  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  amount: integer("amount").notNull(), // Valor total em centavos (R$ 10,00 = 1000)
  status: text("status").notNull().default("pending"), // pending, paid, failed, canceled

  // Campos específicos da integração
  infinitePayUrl: text("infinitePayUrl"), // O link de pagamento gerado
  transactionId: text("transactionId"), // O ID da transação (transaction_nsu) retornado por eles

  metadata: text("metadata"), // Para guardar JSON extra se precisar

  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const orderItem = pgTable("orderItem", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  orderId: text("orderId")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),

  productId: text("productId")
    .notNull()
    .references(() => product.id), // Mantém referência ao produto original

  // Salvamos um snapshot dos dados para caso o produto mude de preço/nome depois
  productName: text("productName").notNull(),
  price: integer("price").notNull(), // Preço em centavos no momento da compra
  quantity: integer("quantity").notNull(),
  image: text("image"),
});
