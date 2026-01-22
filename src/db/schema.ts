import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  json, // Necessário para salvar o endereço completo no pedido
  pgTable,
  real, // Necessário para números decimais (peso)
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// --- TABELAS DE AUTENTICAÇÃO (MANTIDAS) ---

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
  phoneNumber: text("phoneNumber"),
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

// --- TABELA DE CATEGORIAS (MANTIDA) ---

export const category = pgTable("category", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  // Adicionado slug para URLs amigáveis (ex: /categoria/moveis-quarto)
  slug: text("slug").unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- TABELA DE PRODUTOS (ATUALIZADA PARA FÍSICO) ---

export const product = pgTable("product", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Em centavos
  discountPrice: integer("discountPrice"), // Em centavos
  images: text("images").array(),
  categories: text("categories").array(), // Array de IDs de categorias
  weight: real("weight").default(0), // Peso em KG (ex: 0.500 para 500g)
  width: integer("width").default(0), // Largura em cm
  height: integer("height").default(0), // Altura em cm
  length: integer("length").default(0), // Comprimento em cm
  sku: text("sku"), // Código de estoque (opcional, mas bom para logística)
  stock: integer("stock").default(0),
  isStockUnlimited: boolean("isStockUnlimited").notNull().default(false),
  status: text("status").notNull().default("draft"), // draft, active, archived
  sales: integer("sales").notNull().default(0),
  affiliateRate: integer("affiliateRate").default(10), // Porcentagem de comissão
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- TABELA DE REVIEWS (MANTIDA) ---

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

// --- TABELA DE PEDIDOS (ATUALIZADA PARA STRIPE & LOGÍSTICA) ---

export const order = pgTable("order", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // Valor TOTAL (Produtos + Frete)
  status: text("status").notNull().default("pending"), // pending, paid, shipped, delivered, canceled
  stripePaymentIntentId: text("stripePaymentIntentId"), // ID para rastrear no Stripe
  stripeClientSecret: text("stripeClientSecret"),
  shippingAddress: json("shippingAddress"),
  shippingCost: integer("shippingCost").default(0), // Custo do frete em centavos
  trackingCode: text("trackingCode"), // Código de rastreio (Correios/Transportadora)

  customerName: text("customerName"), // <--- NOVO: Nome digitado no checkout
  customerEmail: text("customerEmail"), // <--- NOVO: Email usado no checkout (se diferente da conta)
  userPhone: text("userPhone"),
  couponId: text("couponId").references(() => coupon.id, {
    onDelete: "set null",
  }),
  discountAmount: integer("discountAmount").default(0),
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
  productName: text("productName").notNull(), // Salvamos o nome para histórico
  price: integer("price").notNull(), // Preço no momento da compra
  quantity: integer("quantity").notNull(),
  image: text("image"),
});

// --- SISTEMA DE AFILIADOS E CUPONS (MANTIDO) ---

export const affiliate = pgTable("affiliate", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  pixKey: text("pixKey"),
  pixKeyType: text("pixKeyType"),
  balance: integer("balance").notNull().default(0),
  totalEarnings: integer("totalEarnings").notNull().default(0),
  status: text("status").notNull().default("active"),
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
  code: text("code").notNull().unique(),
  type: text("type").notNull().default("percent"),
  value: integer("value").notNull(),
  minValue: integer("minValue").default(0),
  maxUses: integer("maxUses"),
  usedCount: integer("usedCount").default(0).notNull(),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  popupTitle: text("popupTitle"),
  popupDescription: text("popupDescription"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
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

// --- RELAÇÕES ---

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
  commissions: many(commission),
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
