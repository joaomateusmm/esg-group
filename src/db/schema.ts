import { relations } from "drizzle-orm";
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
  isAffiliate: boolean("isAffiliate").notNull().default(false),
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

// --- TABELA DE STREAMING ---

export const streaming = pgTable("streaming", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  // Removido o campo image conforme solicitado
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- TABELA DE JOGOS ---

export const game = pgTable("game", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  image: text("image"), // Opcional
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
  gameId: text("gameId").references(() => game.id, { onDelete: "set null" }),
  streamings: text("streamings").array(),
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
  affiliateRate: integer("affiliateRate").default(10),
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
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  infinitePayUrl: text("infinitePayUrl"),
  transactionId: text("transactionId"),
  metadata: text("metadata"),
  couponId: text("couponId").references(() => coupon.id, {
    onDelete: "set null",
  }),
  discountAmount: integer("discountAmount").default(0), // Quanto foi descontado em centavos
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
    .references(() => product.id),

  productName: text("productName").notNull(),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
  image: text("image"),
});

export const affiliate = pgTable("affiliate", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .unique() // Garante que um usuário só tem 1 conta de afiliado
    .references(() => user.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  pixKey: text("pixKey"),
  pixKeyType: text("pixKeyType"), // email, cpf, phone, random
  balance: integer("balance").notNull().default(0),
  totalEarnings: integer("totalEarnings").notNull().default(0),
  status: text("status").notNull().default("active"), // active, suspended, banned
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const coupon = pgTable("coupon", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(), // O código que o cliente digita (ex: "BEMVINDO10")
  type: text("type").notNull().default("percent"), // 'percent' (porcentagem) ou 'fixed' (valor em centavos)
  value: integer("value").notNull(), // O valor do desconto (ex: 10 para 10% ou 500 para R$ 5,00)
  minValue: integer("minValue").default(0), // Valor mínimo do pedido para usar o cupom (em centavos)
  maxUses: integer("maxUses"), // Limite global de usos (ex: apenas para os primeiros 100)
  usedCount: integer("usedCount").default(0).notNull(), // Contador de quantas vezes já foi usado
  expiresAt: timestamp("expiresAt"), // Data de validade (opcional)
  isActive: boolean("isActive").default(true).notNull(), // Se o cupom está ativo ou não
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  popupTitle: text("popupTitle"),
  popupDescription: text("popupDescription"),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const commission = pgTable("commission", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  affiliateId: text("affiliateId")
    .notNull()
    .references(() => affiliate.id, { onDelete: "cascade" }),
  orderId: text("orderId")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const userRelations = relations(user, ({ one }) => ({
  affiliateProfile: one(affiliate, {
    fields: [user.id],
    references: [affiliate.userId],
  }),
}));

export const affiliateRelations = relations(affiliate, ({ one, many }) => ({
  user: one(user, {
    fields: [affiliate.userId],
    references: [user.id],
  }),
  commissions: many(commission), // <--- Isto permite usar with: { commissions: true }
}));

export const commissionRelations = relations(commission, ({ one }) => ({
  affiliate: one(affiliate, {
    fields: [commission.affiliateId],
    references: [affiliate.id],
  }),
  order: one(order, {
    fields: [commission.orderId],
    references: [order.id],
  }),
}));
