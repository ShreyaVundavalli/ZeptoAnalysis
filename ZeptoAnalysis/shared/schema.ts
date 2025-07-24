import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const zepto = pgTable("zepto", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  mrp: integer("mrp").notNull(), // in paise (e.g., 2500 = ₹25.00)
  discountPercent: integer("discount_percent").notNull(),
  availableQuantity: integer("available_quantity").notNull(),
  discountedSellingPrice: integer("discounted_selling_price").notNull(), // in paise
  weightInGms: integer("weight_in_gms").notNull(),
  outOfStock: boolean("out_of_stock").notNull().default(false),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertZeptoSchema = createInsertSchema(zepto).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectZeptoSchema = z.object({
  id: z.number(),
  category: z.string(),
  name: z.string(),
  mrp: z.number(),
  discountPercent: z.number(),
  availableQuantity: z.number(),
  discountedSellingPrice: z.number(),
  weightInGms: z.number(),
  outOfStock: z.boolean(),
  quantity: z.number(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertZepto = z.infer<typeof insertZeptoSchema>;
export type Zepto = typeof zepto.$inferSelect;

// Analytics types
export type OverviewMetrics = {
  totalProducts: number;
  totalRevenue: number;
  totalCategories: number;
  avgDiscount: number;
  inStockProducts: number;
  outOfStockProducts: number;
};

export type CategoryRevenue = {
  category: string;
  revenue: number;
  productCount: number;
  avgDiscount: number;
};

export type TopDeal = {
  id: number;
  name: string;
  category: string;
  mrp: number;
  discountPercent: number;
  discountedSellingPrice: number;
  savings: number;
};

export type StockStatus = {
  status: string;
  count: number;
  percentage: number;
};

export type InventoryWeight = {
  range: string;
  count: number;
};

export type SqlQueryResult = {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
};
