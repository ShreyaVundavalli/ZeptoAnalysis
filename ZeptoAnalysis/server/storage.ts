import { zepto, type Zepto, type InsertZepto, type OverviewMetrics, type CategoryRevenue, type TopDeal, type StockStatus, type InventoryWeight, type SqlQueryResult } from "../shared/schema";
import { db } from "./db";
import { eq, sql, desc, asc, and, or } from "drizzle-orm";

export interface IStorage {
  // Analytics methods
  getOverviewMetrics(): Promise<OverviewMetrics>;
  getCategoryRevenue(): Promise<CategoryRevenue[]>;
  getTopDeals(limit?: number): Promise<TopDeal[]>;
  getStockStatus(): Promise<StockStatus[]>;
  getInventoryByWeight(): Promise<InventoryWeight[]>;
  executeSafeQuery(query: string): Promise<SqlQueryResult>;
  
  // Product CRUD
  getAllProducts(limit?: number, offset?: number): Promise<Zepto[]>;
  getProductById(id: number): Promise<Zepto | undefined>;
  getProductsByCategory(category: string): Promise<Zepto[]>;
  createProduct(product: InsertZepto): Promise<Zepto>;
  updateProduct(id: number, product: Partial<InsertZepto>): Promise<Zepto | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Search and filter
  searchProducts(query: string): Promise<Zepto[]>;
  getOutOfStockProducts(): Promise<Zepto[]>;
  getProductsWithDiscount(minDiscount?: number): Promise<Zepto[]>;
}

export class DatabaseStorage implements IStorage {
  async getOverviewMetrics(): Promise<OverviewMetrics> {
    const [metrics] = await db
      .select({
        totalProducts: sql<number>`count(*)`,
        totalRevenue: sql<number>`sum(${zepto.discountedSellingPrice})`,
        avgDiscount: sql<number>`avg(${zepto.discountPercent})`,
        inStockProducts: sql<number>`sum(case when ${zepto.outOfStock} = false then 1 else 0 end)`,
        outOfStockProducts: sql<number>`sum(case when ${zepto.outOfStock} = true then 1 else 0 end)`,
      })
      .from(zepto);

    const categoriesResult = await db
      .select({
        totalCategories: sql<number>`count(distinct ${zepto.category})`,
      })
      .from(zepto);

    return {
      totalProducts: metrics.totalProducts || 0,
      totalRevenue: metrics.totalRevenue || 0,
      totalCategories: categoriesResult[0]?.totalCategories || 0,
      avgDiscount: Math.round((metrics.avgDiscount || 0) * 100) / 100,
      inStockProducts: metrics.inStockProducts || 0,
      outOfStockProducts: metrics.outOfStockProducts || 0,
    };
  }

  async getCategoryRevenue(): Promise<CategoryRevenue[]> {
    const results = await db
      .select({
        category: zepto.category,
        revenue: sql<number>`sum(${zepto.discountedSellingPrice})`,
        productCount: sql<number>`count(*)`,
        avgDiscount: sql<number>`avg(${zepto.discountPercent})`,
      })
      .from(zepto)
      .groupBy(zepto.category)
      .orderBy(desc(sql`sum(${zepto.discountedSellingPrice})`));

    return results.map(r => ({
      category: r.category,
      revenue: r.revenue || 0,
      productCount: r.productCount || 0,
      avgDiscount: Math.round((r.avgDiscount || 0) * 100) / 100,
    }));
  }

  async getTopDeals(limit: number = 20): Promise<TopDeal[]> {
    const results = await db
      .select({
        id: zepto.id,
        name: zepto.name,
        category: zepto.category,
        mrp: zepto.mrp,
        discountPercent: zepto.discountPercent,
        discountedSellingPrice: zepto.discountedSellingPrice,
      })
      .from(zepto)
      .where(and(
        sql`${zepto.discountPercent} > 0`,
        eq(zepto.outOfStock, false)
      ))
      .orderBy(desc(zepto.discountPercent))
      .limit(limit);

    return results.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      mrp: r.mrp,
      discountPercent: r.discountPercent,
      discountedSellingPrice: r.discountedSellingPrice,
      savings: r.mrp - r.discountedSellingPrice,
    }));
  }

  async getStockStatus(): Promise<StockStatus[]> {
    const [results] = await db
      .select({
        total: sql<number>`count(*)`,
        inStock: sql<number>`sum(case when ${zepto.outOfStock} = false and ${zepto.availableQuantity} > 5 then 1 else 0 end)`,
        lowStock: sql<number>`sum(case when ${zepto.outOfStock} = false and ${zepto.availableQuantity} <= 5 and ${zepto.availableQuantity} > 0 then 1 else 0 end)`,
        outOfStock: sql<number>`sum(case when ${zepto.outOfStock} = true or ${zepto.availableQuantity} = 0 then 1 else 0 end)`,
      })
      .from(zepto);

    const total = results.total || 1;
    return [
      {
        status: 'In Stock',
        count: results.inStock || 0,
        percentage: Math.round(((results.inStock || 0) / total) * 100),
      },
      {
        status: 'Low Stock',
        count: results.lowStock || 0,
        percentage: Math.round(((results.lowStock || 0) / total) * 100),
      },
      {
        status: 'Out of Stock',
        count: results.outOfStock || 0,
        percentage: Math.round(((results.outOfStock || 0) / total) * 100),
      },
    ];
  }

  async getInventoryByWeight(): Promise<InventoryWeight[]> {
    try {
      const results = await db
        .select({
          range: sql<string>`
            case 
              when weight_in_gms < 100 then 'Under 100g'
              when weight_in_gms < 500 then '100g - 500g'
              when weight_in_gms < 1000 then '500g - 1kg'
              when weight_in_gms < 5000 then '1kg - 5kg'
              else 'Over 5kg'
            end`,
          count: sql<number>`count(*)`,
        })
        .from(zepto)
        .groupBy(sql`
          case 
            when weight_in_gms < 100 then 'Under 100g'
            when weight_in_gms < 500 then '100g - 500g'
            when weight_in_gms < 1000 then '500g - 1kg'
            when weight_in_gms < 5000 then '1kg - 5kg'
            else 'Over 5kg'
          end`)
        .orderBy(sql`
          case 
            when weight_in_gms < 100 then 1
            when weight_in_gms < 500 then 2
            when weight_in_gms < 1000 then 3
            when weight_in_gms < 5000 then 4
            else 5
          end`);

      return results.map(r => ({
        range: r.range || 'Unknown',
        count: r.count || 0
      }));
    } catch (error) {
      console.error('Error in getInventoryByWeight:', error);
      return [
        { range: 'Under 100g', count: 0 },
        { range: '100g - 500g', count: 0 },
        { range: '500g - 1kg', count: 0 },
        { range: '1kg - 5kg', count: 0 },
        { range: 'Over 5kg', count: 0 }
      ];
    }
  }

  async executeSafeQuery(query: string): Promise<SqlQueryResult> {
    const startTime = Date.now();
    
    // Basic SQL injection protection - only allow SELECT statements
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select')) {
      throw new Error('Only SELECT queries are allowed for security reasons');
    }

    // Prevent certain dangerous keywords
    const dangerousKeywords = ['drop', 'delete', 'update', 'insert', 'alter', 'create', 'truncate'];
    for (const keyword of dangerousKeywords) {
      if (trimmedQuery.includes(keyword)) {
        throw new Error(`Keyword '${keyword}' is not allowed in queries`);
      }
    }

    try {
      const results = await db.execute(sql.raw(query));
      const executionTime = Date.now() - startTime;

      // Extract column names from the first row if available
      const columns = results.rows.length > 0 ? Object.keys(results.rows[0]) : [];
      const rows = results.rows.map(row => columns.map(col => row[col]));

      return {
        columns,
        rows,
        rowCount: results.rows.length,
        executionTime,
      };
    } catch (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  async getAllProducts(limit: number = 50, offset: number = 0): Promise<Zepto[]> {
    return await db
      .select()
      .from(zepto)
      .limit(limit)
      .offset(offset)
      .orderBy(zepto.name);
  }

  async getProductById(id: number): Promise<Zepto | undefined> {
    const [product] = await db.select().from(zepto).where(eq(zepto.id, id));
    return product || undefined;
  }

  async getProductsByCategory(category: string): Promise<Zepto[]> {
    return await db.select().from(zepto).where(eq(zepto.category, category));
  }

  async createProduct(product: InsertZepto): Promise<Zepto> {
    const [created] = await db.insert(zepto).values(product).returning();
    return created;
  }

  async updateProduct(id: number, product: Partial<InsertZepto>): Promise<Zepto | undefined> {
    const [updated] = await db
      .update(zepto)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(zepto.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(zepto).where(eq(zepto.id, id));
    return result.rowCount > 0;
  }

  async searchProducts(query: string): Promise<Zepto[]> {
    return await db
      .select()
      .from(zepto)
      .where(
        or(
          sql`${zepto.name} ILIKE ${'%' + query + '%'}`,
          sql`${zepto.category} ILIKE ${'%' + query + '%'}`
        )
      )
      .limit(50);
  }

  async getOutOfStockProducts(): Promise<Zepto[]> {
    return await db.select().from(zepto).where(eq(zepto.outOfStock, true));
  }

  async getProductsWithDiscount(minDiscount: number = 0): Promise<Zepto[]> {
    return await db
      .select()
      .from(zepto)
      .where(sql`${zepto.discountPercent} >= ${minDiscount}`)
      .orderBy(desc(zepto.discountPercent));
  }
}

export const storage = new DatabaseStorage();
