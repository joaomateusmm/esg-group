import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  real,
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
  slug: text("slug").unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- TABELA DE PRODUTOS (ATUALIZADA) ---

export const product = pgTable("product", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Em centavos
  discountPrice: integer("discountPrice"), // Em centavos
  currency: text("currency").notNull().default("GBP"),
  images: text("images").array(),
  categories: text("categories").array(),
  weight: real("weight").default(0),
  width: integer("width").default(0),
  height: integer("height").default(0),
  length: integer("length").default(0),
  sku: text("sku"),
  shippingType: text("shippingType").notNull().default("calculated"),
  fixedShippingPrice: integer("fixedShippingPrice").default(0),
  stock: integer("stock").default(0),
  isStockUnlimited: boolean("isStockUnlimited").notNull().default(false),
  status: text("status").notNull().default("draft"),
  sales: integer("sales").notNull().default(0),
  affiliateRate: integer("affiliateRate").default(10),

  // --- NOVOS CAMPOS: INFORMAÇÕES ÚTEIS ---
  condition: text("condition").default("new"), // 'new', 'used', 'refurbished', etc.
  isAssembled: boolean("isAssembled").default(false), // true = sim, false = não
  hasWarranty: boolean("hasWarranty").default(false),
  warrantyDetails: text("warrantyDetails"), // ex: "12 meses"
  brand: text("brand"), // Se null, é Genérico

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

// --- TABELA DE PEDIDOS (MANTIDA) ---

export const order = pgTable("order", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),

  status: text("status").notNull().default("pending"),
  currency: text("currency").notNull().default("GBP"),
  fulfillmentStatus: text("fulfillmentStatus").notNull().default("idle"),

  stripePaymentIntentId: text("stripePaymentIntentId"),
  stripeClientSecret: text("stripeClientSecret"),
  shippingAddress: json("shippingAddress"),
  shippingCost: integer("shippingCost").default(0),
  trackingCode: text("trackingCode"),

  estimatedDeliveryStart: timestamp("estimatedDeliveryStart"),
  estimatedDeliveryEnd: timestamp("estimatedDeliveryEnd"),

  paymentMethod: text("paymentMethod").default("card"),
  customerName: text("customerName"),
  customerEmail: text("customerEmail"),
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
  productName: text("productName").notNull(),
  price: integer("price").notNull(),
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

// --- RELAÇÕES (MANTIDAS) ---

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

export const orderRelations = relations(order, ({ one, many }) => ({
  user: one(user, {
    fields: [order.userId],
    references: [user.id],
  }),
  items: many(orderItem),
  commission: one(commission),
}));

export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, {
    fields: [orderItem.orderId],
    references: [order.id],
  }),
  product: one(product, {
    fields: [orderItem.productId],
    references: [product.id],
  }),
}));

export const providerStatusEnum = pgEnum("provider_status", [
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

export const serviceOrderStatusEnum = pgEnum("service_order_status", [
  "pending", // Cliente solicitou
  "accepted", // Prestador aceitou
  "in_progress", // Em andamento
  "completed", // Finalizado
  "cancelled", // Cancelado
]);

// --- 1. TABELA DE CATEGORIAS DE SERVIÇO (Criada pelo Admin) ---
export const serviceCategory = pgTable("serviceCategory", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // Nome do serviço
  slug: text("slug").unique().notNull(), // Para a URL (ex: /servicos/encanador)
  description: text("description"), // Descrição geral do que esse profissional faz
  image: text("image"), // Ícone ou foto representativa
  isActive: boolean("isActive").default(true).notNull(), // Se o serviço está sendo ofertado no momento
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// --- 2. TABELA DE PRESTADORES DE SERVIÇO (O Usuário se candidatando) ---
// Linka um User a uma Categoria de Serviço com detalhes profissionais
export const serviceProvider = pgTable("serviceProvider", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  categoryId: text("categoryId")
    .notNull()
    .references(() => serviceCategory.id),

  // Dados do Profissional
  bio: text("bio").notNull(), // "Tenho 10 anos de experiência..."
  experienceYears: integer("experienceYears").notNull().default(0),
  portfolioUrl: text("portfolioUrl"), // Link externo ou imagens
  hourlyRate: integer("hourlyRate"), // Preço base por hora (em centavos) - Opcional
  phone: text("phone"), // Contato direto profissional
  location: text("location"), // Cidade/Região de atendimento (Londres, etc)

  // Aprovação do Admin
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  rejectionReason: text("rejectionReason"), // Se o admin recusar, explica o motivo

  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// --- 3. TABELA DE PEDIDOS DE SERVIÇO (O Cliente contratando) ---
export const serviceOrder = pgTable("serviceOrder", {
  id: text("id").primaryKey(),
  customerId: text("customerId")
    .notNull()
    .references(() => user.id), // Quem contrata
  providerId: text("providerId")
    .notNull()
    .references(() => serviceProvider.id), // Quem executa

  description: text("description").notNull(), // "Preciso montar um guarda-roupa..."
  scheduledDate: timestamp("scheduledDate"), // Data desejada
  address: text("address").notNull(), // Onde será o serviço

  status: text("status").default("pending").notNull(),
  agreedPrice: integer("agreedPrice"), // Preço combinado (em centavos), pode ser nulo inicialmente

  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// --- RELATIONS (Para facilitar as queries no Drizzle) ---

export const serviceCategoryRelations = relations(
  serviceCategory,
  ({ many }) => ({
    providers: many(serviceProvider),
  }),
);

export const serviceProviderRelations = relations(
  serviceProvider,
  ({ one, many }) => ({
    user: one(user, {
      fields: [serviceProvider.userId],
      references: [user.id],
    }),
    category: one(serviceCategory, {
      fields: [serviceProvider.categoryId],
      references: [serviceCategory.id],
    }),
    orders: many(serviceOrder), // Pedidos recebidos
  }),
);

export const serviceOrderRelations = relations(serviceOrder, ({ one }) => ({
  customer: one(user, {
    fields: [serviceOrder.customerId],
    references: [user.id],
  }),
  provider: one(serviceProvider, {
    fields: [serviceOrder.providerId],
    references: [serviceProvider.id],
  }),
}));
