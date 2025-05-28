import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wallet for each user
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  balanceKz: decimal("balance_kz", { precision: 15, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  walletId: integer("wallet_id").notNull().references(() => wallets.id),
  type: varchar("type").notNull(), // 'payment', 'recharge', 'international', 'transfer', 'received'
  category: varchar("category").notNull(), // 'electricity', 'water', 'internet', 'mobile', 'international', 'freelancer'
  description: text("description").notNull(),
  amountKz: decimal("amount_kz", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("completed"), // 'pending', 'completed', 'failed'
  metadata: jsonb("metadata"), // Additional transaction data
  createdAt: timestamp("created_at").defaultNow(),
});

// Educational progress for users
export const educationProgress = pgTable("education_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  level: integer("level").default(1),
  xp: integer("xp").default(0),
  streak: integer("streak").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  completedLessons: jsonb("completed_lessons").default("[]"), // Array of lesson IDs
  achievements: jsonb("achievements").default("[]"), // Array of achievement IDs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment accounts (for international payments, freelancer receiving, etc.)
export const paymentAccounts = pgTable("payment_accounts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'multicaixa', 'mcx_express', 'international', 'freelancer'
  accountData: jsonb("account_data").notNull(), // Encrypted account details
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketplace items
export const marketplaceItems = pgTable("marketplace_items", {
  id: serial("id").primaryKey(),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  priceKz: decimal("price_kz", { precision: 15, scale: 2 }).notNull(),
  digitalContent: jsonb("digital_content"), // File URLs, download links, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Marketplace purchases
export const marketplacePurchases = pgTable("marketplace_purchases", {
  id: serial("id").primaryKey(),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull().references(() => marketplaceItems.id),
  amountKz: decimal("amount_kz", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("completed"),
  transactionId: integer("transaction_id").references(() => transactions.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(), // 'transaction', 'education', 'security', 'system'
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
  transactions: many(transactions),
  educationProgress: one(educationProgress, {
    fields: [users.id],
    references: [educationProgress.userId],
  }),
  paymentAccounts: many(paymentAccounts),
  marketplaceItems: many(marketplaceItems, {
    relationName: "seller",
  }),
  purchases: many(marketplacePurchases, {
    relationName: "buyer",
  }),
  sales: many(marketplacePurchases, {
    relationName: "seller",
  }),
  notifications: many(notifications),
}));

export const walletRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
}));

export const educationProgressRelations = relations(educationProgress, ({ one }) => ({
  user: one(users, {
    fields: [educationProgress.userId],
    references: [users.id],
  }),
}));

export const paymentAccountRelations = relations(paymentAccounts, ({ one }) => ({
  user: one(users, {
    fields: [paymentAccounts.userId],
    references: [users.id],
  }),
}));

export const marketplaceItemRelations = relations(marketplaceItems, ({ one, many }) => ({
  seller: one(users, {
    fields: [marketplaceItems.sellerId],
    references: [users.id],
    relationName: "seller",
  }),
  purchases: many(marketplacePurchases),
}));

export const marketplacePurchaseRelations = relations(marketplacePurchases, ({ one }) => ({
  buyer: one(users, {
    fields: [marketplacePurchases.buyerId],
    references: [users.id],
    relationName: "buyer",
  }),
  seller: one(users, {
    fields: [marketplacePurchases.sellerId],
    references: [users.id],
    relationName: "seller",
  }),
  item: one(marketplaceItems, {
    fields: [marketplacePurchases.itemId],
    references: [marketplaceItems.id],
  }),
  transaction: one(transactions, {
    fields: [marketplacePurchases.transactionId],
    references: [transactions.id],
  }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertWalletSchema = createInsertSchema(wallets).pick({
  userId: true,
  balanceKz: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  walletId: true,
  type: true,
  category: true,
  description: true,
  amountKz: true,
  status: true,
  metadata: true,
});

export const insertEducationProgressSchema = createInsertSchema(educationProgress).pick({
  userId: true,
  level: true,
  xp: true,
  streak: true,
  lastActivityDate: true,
  completedLessons: true,
  achievements: true,
});

export const insertPaymentAccountSchema = createInsertSchema(paymentAccounts).pick({
  userId: true,
  type: true,
  accountData: true,
  isActive: true,
});

export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItems).pick({
  sellerId: true,
  title: true,
  description: true,
  category: true,
  priceKz: true,
  digitalContent: true,
  isActive: true,
});

export const insertMarketplacePurchaseSchema = createInsertSchema(marketplacePurchases).pick({
  buyerId: true,
  sellerId: true,
  itemId: true,
  amountKz: true,
  status: true,
  transactionId: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  message: true,
  type: true,
  isRead: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertEducationProgress = z.infer<typeof insertEducationProgressSchema>;
export type EducationProgress = typeof educationProgress.$inferSelect;
export type InsertPaymentAccount = z.infer<typeof insertPaymentAccountSchema>;
export type PaymentAccount = typeof paymentAccounts.$inferSelect;
export type InsertMarketplaceItem = z.infer<typeof insertMarketplaceItemSchema>;
export type MarketplaceItem = typeof marketplaceItems.$inferSelect;
export type InsertMarketplacePurchase = z.infer<typeof insertMarketplacePurchaseSchema>;
export type MarketplacePurchase = typeof marketplacePurchases.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
