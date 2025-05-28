import {
  users,
  wallets,
  transactions,
  educationProgress,
  paymentAccounts,
  marketplaceItems,
  marketplacePurchases,
  notifications,
  type User,
  type UpsertUser,
  type InsertWallet,
  type Wallet,
  type InsertTransaction,
  type Transaction,
  type InsertEducationProgress,
  type EducationProgress,
  type InsertPaymentAccount,
  type PaymentAccount,
  type InsertMarketplaceItem,
  type MarketplaceItem,
  type InsertMarketplacePurchase,
  type MarketplacePurchase,
  type InsertNotification,
  type Notification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Wallet operations
  getWallet(userId: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWalletBalance(userId: string, newBalance: string): Promise<void>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  getTransactionById(id: number): Promise<Transaction | undefined>;
  
  // Education operations
  getEducationProgress(userId: string): Promise<EducationProgress | undefined>;
  createEducationProgress(progress: InsertEducationProgress): Promise<EducationProgress>;
  updateEducationProgress(userId: string, updates: Partial<InsertEducationProgress>): Promise<void>;
  
  // Payment account operations
  getUserPaymentAccounts(userId: string): Promise<PaymentAccount[]>;
  createPaymentAccount(account: InsertPaymentAccount): Promise<PaymentAccount>;
  
  // Marketplace operations
  getMarketplaceItems(limit?: number): Promise<MarketplaceItem[]>;
  getUserMarketplaceItems(userId: string): Promise<MarketplaceItem[]>;
  createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem>;
  getMarketplaceItemById(id: number): Promise<MarketplaceItem | undefined>;
  createMarketplacePurchase(purchase: InsertMarketplacePurchase): Promise<MarketplacePurchase>;
  
  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations - required for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    // Create wallet if it doesn't exist
    const existingWallet = await this.getWallet(user.id);
    if (!existingWallet) {
      await this.createWallet({
        userId: user.id,
        balanceKz: "0.00",
      });
    }
    
    // Create education progress if it doesn't exist
    const existingProgress = await this.getEducationProgress(user.id);
    if (!existingProgress) {
      await this.createEducationProgress({
        userId: user.id,
        level: 1,
        xp: 0,
        streak: 0,
        completedLessons: [],
        achievements: [],
      });
    }
    
    return user;
  }

  // Wallet operations
  async getWallet(userId: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return wallet;
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const [newWallet] = await db.insert(wallets).values(wallet).returning();
    return newWallet;
  }

  async updateWalletBalance(userId: string, newBalance: string): Promise<void> {
    await db
      .update(wallets)
      .set({ 
        balanceKz: newBalance,
        updatedAt: new Date()
      })
      .where(eq(wallets.userId, userId));
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction;
  }

  // Education operations
  async getEducationProgress(userId: string): Promise<EducationProgress | undefined> {
    const [progress] = await db
      .select()
      .from(educationProgress)
      .where(eq(educationProgress.userId, userId));
    return progress;
  }

  async createEducationProgress(progress: InsertEducationProgress): Promise<EducationProgress> {
    const [newProgress] = await db.insert(educationProgress).values(progress).returning();
    return newProgress;
  }

  async updateEducationProgress(userId: string, updates: Partial<InsertEducationProgress>): Promise<void> {
    await db
      .update(educationProgress)
      .set({ 
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(educationProgress.userId, userId));
  }

  // Payment account operations
  async getUserPaymentAccounts(userId: string): Promise<PaymentAccount[]> {
    return await db
      .select()
      .from(paymentAccounts)
      .where(and(eq(paymentAccounts.userId, userId), eq(paymentAccounts.isActive, true)));
  }

  async createPaymentAccount(account: InsertPaymentAccount): Promise<PaymentAccount> {
    const [newAccount] = await db.insert(paymentAccounts).values(account).returning();
    return newAccount;
  }

  // Marketplace operations
  async getMarketplaceItems(limit = 20): Promise<MarketplaceItem[]> {
    return await db
      .select()
      .from(marketplaceItems)
      .where(eq(marketplaceItems.isActive, true))
      .orderBy(desc(marketplaceItems.createdAt))
      .limit(limit);
  }

  async getUserMarketplaceItems(userId: string): Promise<MarketplaceItem[]> {
    return await db
      .select()
      .from(marketplaceItems)
      .where(eq(marketplaceItems.sellerId, userId))
      .orderBy(desc(marketplaceItems.createdAt));
  }

  async createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem> {
    const [newItem] = await db.insert(marketplaceItems).values(item).returning();
    return newItem;
  }

  async getMarketplaceItemById(id: number): Promise<MarketplaceItem | undefined> {
    const [item] = await db
      .select()
      .from(marketplaceItems)
      .where(and(eq(marketplaceItems.id, id), eq(marketplaceItems.isActive, true)));
    return item;
  }

  async createMarketplacePurchase(purchase: InsertMarketplacePurchase): Promise<MarketplacePurchase> {
    const [newPurchase] = await db.insert(marketplacePurchases).values(purchase).returning();
    return newPurchase;
  }

  // Notification operations
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    
    return result[0]?.count || 0;
  }
}

export const storage = new DatabaseStorage();
