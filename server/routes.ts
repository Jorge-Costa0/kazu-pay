import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertTransactionSchema,
  insertEducationProgressSchema,
  insertPaymentAccountSchema,
  insertMarketplaceItemSchema,
  insertMarketplacePurchaseSchema,
  insertNotificationSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Wallet routes
  app.get('/api/wallet', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wallet = await storage.getWallet(userId);
      res.json(wallet);
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });

  app.patch('/api/wallet/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { newBalance } = req.body;
      
      if (!newBalance || isNaN(parseFloat(newBalance))) {
        return res.status(400).json({ message: "Invalid balance amount" });
      }

      await storage.updateWalletBalance(userId, newBalance);
      res.json({ message: "Balance updated successfully" });
    } catch (error) {
      console.error("Error updating wallet balance:", error);
      res.status(500).json({ message: "Failed to update balance" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getUserTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wallet = await storage.getWallet(userId);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        userId,
        walletId: wallet.id
      });

      const transaction = await storage.createTransaction(transactionData);

      // Update wallet balance if transaction affects balance
      if (transactionData.type !== 'received') {
        const currentBalance = parseFloat(wallet.balanceKz);
        const transactionAmount = parseFloat(transactionData.amountKz);
        const newBalance = currentBalance - transactionAmount;
        
        if (newBalance < 0) {
          return res.status(400).json({ message: "Insufficient funds" });
        }
        
        await storage.updateWalletBalance(userId, newBalance.toFixed(2));
      } else {
        const currentBalance = parseFloat(wallet.balanceKz);
        const transactionAmount = parseFloat(transactionData.amountKz);
        const newBalance = currentBalance + transactionAmount;
        await storage.updateWalletBalance(userId, newBalance.toFixed(2));
      }

      // Create notification for transaction
      await storage.createNotification({
        userId,
        title: "Nova Transação",
        message: `${transactionData.description} - ${transactionData.amountKz} Kz`,
        type: "transaction",
        isRead: false
      });

      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Education routes
  app.get('/api/education/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getEducationProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching education progress:", error);
      res.status(500).json({ message: "Failed to fetch education progress" });
    }
  });

  app.patch('/api/education/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      
      await storage.updateEducationProgress(userId, updates);
      res.json({ message: "Education progress updated successfully" });
    } catch (error) {
      console.error("Error updating education progress:", error);
      res.status(500).json({ message: "Failed to update education progress" });
    }
  });

  app.post('/api/education/complete-lesson', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { lessonId, xpGained } = req.body;
      
      const progress = await storage.getEducationProgress(userId);
      if (!progress) {
        return res.status(404).json({ message: "Education progress not found" });
      }

      const completedLessons = Array.isArray(progress.completedLessons) ? progress.completedLessons : [];
      const newXP = progress.xp + (xpGained || 50);
      const newLevel = Math.floor(newXP / 1000) + 1; // Level up every 1000 XP
      
      await storage.updateEducationProgress(userId, {
        xp: newXP,
        level: newLevel,
        completedLessons: [...completedLessons, lessonId],
        lastActivityDate: new Date()
      });

      // Create notification for lesson completion
      await storage.createNotification({
        userId,
        title: "Lição Concluída!",
        message: `Você ganhou ${xpGained || 50} XP. Continue aprendendo!`,
        type: "education",
        isRead: false
      });

      res.json({ message: "Lesson completed successfully", newXP, newLevel });
    } catch (error) {
      console.error("Error completing lesson:", error);
      res.status(500).json({ message: "Failed to complete lesson" });
    }
  });

  // Payment account routes
  app.get('/api/payment-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getUserPaymentAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching payment accounts:", error);
      res.status(500).json({ message: "Failed to fetch payment accounts" });
    }
  });

  app.post('/api/payment-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accountData = insertPaymentAccountSchema.parse({
        ...req.body,
        userId
      });

      const account = await storage.createPaymentAccount(accountData);
      res.json(account);
    } catch (error) {
      console.error("Error creating payment account:", error);
      res.status(500).json({ message: "Failed to create payment account" });
    }
  });

  // Marketplace routes
  app.get('/api/marketplace/items', isAuthenticated, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const items = await storage.getMarketplaceItems(limit);
      res.json(items);
    } catch (error) {
      console.error("Error fetching marketplace items:", error);
      res.status(500).json({ message: "Failed to fetch marketplace items" });
    }
  });

  app.get('/api/marketplace/my-items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const items = await storage.getUserMarketplaceItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching user marketplace items:", error);
      res.status(500).json({ message: "Failed to fetch user marketplace items" });
    }
  });

  app.post('/api/marketplace/items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const itemData = insertMarketplaceItemSchema.parse({
        ...req.body,
        sellerId: userId
      });

      const item = await storage.createMarketplaceItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating marketplace item:", error);
      res.status(500).json({ message: "Failed to create marketplace item" });
    }
  });

  app.post('/api/marketplace/purchase/:itemId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const itemId = parseInt(req.params.itemId);
      
      const item = await storage.getMarketplaceItemById(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      const wallet = await storage.getWallet(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      const currentBalance = parseFloat(wallet.balanceKz);
      const itemPrice = parseFloat(item.priceKz);
      
      if (currentBalance < itemPrice) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      // Create purchase transaction
      const transaction = await storage.createTransaction({
        userId,
        walletId: wallet.id,
        type: "payment",
        category: "marketplace",
        description: `Compra: ${item.title}`,
        amountKz: item.priceKz,
        status: "completed"
      });

      // Create marketplace purchase record
      const purchase = await storage.createMarketplacePurchase({
        buyerId: userId,
        sellerId: item.sellerId,
        itemId: item.id,
        amountKz: item.priceKz,
        status: "completed",
        transactionId: transaction.id
      });

      // Update buyer's wallet balance
      const newBalance = currentBalance - itemPrice;
      await storage.updateWalletBalance(userId, newBalance.toFixed(2));

      // Update seller's wallet balance
      const sellerWallet = await storage.getWallet(item.sellerId);
      if (sellerWallet) {
        const sellerBalance = parseFloat(sellerWallet.balanceKz);
        const commission = itemPrice * 0.05; // 5% commission
        const sellerEarnings = itemPrice - commission;
        const newSellerBalance = sellerBalance + sellerEarnings;
        await storage.updateWalletBalance(item.sellerId, newSellerBalance.toFixed(2));

        // Create income transaction for seller
        await storage.createTransaction({
          userId: item.sellerId,
          walletId: sellerWallet.id,
          type: "received",
          category: "marketplace",
          description: `Venda: ${item.title}`,
          amountKz: sellerEarnings.toFixed(2),
          status: "completed"
        });
      }

      res.json(purchase);
    } catch (error) {
      console.error("Error purchasing marketplace item:", error);
      res.status(500).json({ message: "Failed to purchase item" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Bill payment simulation routes
  app.post('/api/payments/bills', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { provider, accountNumber, amount } = req.body;
      
      const wallet = await storage.getWallet(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      const currentBalance = parseFloat(wallet.balanceKz);
      const paymentAmount = parseFloat(amount);
      
      if (currentBalance < paymentAmount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      // Create transaction
      const transaction = await storage.createTransaction({
        userId,
        walletId: wallet.id,
        type: "payment",
        category: provider.toLowerCase(),
        description: `${provider} - ${accountNumber}`,
        amountKz: amount,
        status: "completed",
        metadata: { accountNumber, provider }
      });

      // Update wallet balance
      const newBalance = currentBalance - paymentAmount;
      await storage.updateWalletBalance(userId, newBalance.toFixed(2));

      res.json({ 
        message: "Payment processed successfully",
        transactionId: transaction.id
      });
    } catch (error) {
      console.error("Error processing bill payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // Mobile recharge simulation
  app.post('/api/payments/recharge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { phoneNumber, operator, amount } = req.body;
      
      const wallet = await storage.getWallet(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      const currentBalance = parseFloat(wallet.balanceKz);
      const rechargeAmount = parseFloat(amount);
      
      if (currentBalance < rechargeAmount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      // Create transaction
      const transaction = await storage.createTransaction({
        userId,
        walletId: wallet.id,
        type: "recharge",
        category: "mobile",
        description: `Recarga ${operator} - ${phoneNumber}`,
        amountKz: amount,
        status: "completed",
        metadata: { phoneNumber, operator }
      });

      // Update wallet balance
      const newBalance = currentBalance - rechargeAmount;
      await storage.updateWalletBalance(userId, newBalance.toFixed(2));

      res.json({ 
        message: "Recharge processed successfully",
        transactionId: transaction.id
      });
    } catch (error) {
      console.error("Error processing recharge:", error);
      res.status(500).json({ message: "Failed to process recharge" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
