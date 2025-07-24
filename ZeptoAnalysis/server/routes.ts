import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertZeptoSchema } from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Analytics endpoints
  app.get("/api/analytics/overview", async (req, res) => {
    try {
      const metrics = await storage.getOverviewMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch overview metrics" });
    }
  });

  app.get("/api/analytics/category-revenue", async (req, res) => {
    try {
      const categoryRevenue = await storage.getCategoryRevenue();
      res.json(categoryRevenue);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category revenue data" });
    }
  });

  app.get("/api/analytics/top-deals", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const topDeals = await storage.getTopDeals(limit);
      res.json(topDeals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top deals" });
    }
  });

  app.get("/api/analytics/stock-status", async (req, res) => {
    try {
      const stockStatus = await storage.getStockStatus();
      res.json(stockStatus);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock status" });
    }
  });

  app.get("/api/analytics/inventory-weight", async (req, res) => {
    try {
      const inventoryWeight = await storage.getInventoryByWeight();
      res.json(inventoryWeight);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory weight data" });
    }
  });

  // SQL query endpoint
  app.post("/api/query/execute", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Query is required and must be a string" });
      }

      const result = await storage.executeSafeQuery(query);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Product CRUD endpoints
  app.get("/api/products", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const products = await storage.getAllProducts(limit, offset);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const products = await storage.getProductsByCategory(category);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products by category" });
    }
  });

  // Export data endpoint
  app.post("/api/export/data", async (req, res) => {
    try {
      const { format = 'csv' } = req.body;
      const products = await storage.getAllProducts(10000, 0); // Get all products
      
      if (format === 'csv') {
        const csvHeader = 'ID,Name,Category,MRP,Discount %,Available Qty,Sale Price,Weight (g),Out of Stock\n';
        const csvRows = products.map(p => 
          `${p.id},"${p.name}","${p.category}",${p.mrp/100},${p.discountPercent},${p.availableQuantity},${p.discountedSellingPrice/100},${p.weightInGms},${p.outOfStock}`
        ).join('\n');
        
        const csvContent = csvHeader + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="zepto-data.csv"');
        res.send(csvContent);
      } else {
        res.json(products);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertZeptoSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid product data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const updateData = insertZeptoSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, updateData);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid product data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Search and filter endpoints
  app.get("/api/products/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      const products = await storage.searchProducts(query);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to search products" });
    }
  });

  app.get("/api/products/filter/out-of-stock", async (req, res) => {
    try {
      const products = await storage.getOutOfStockProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch out of stock products" });
    }
  });

  app.get("/api/products/filter/discounted", async (req, res) => {
    try {
      const minDiscount = parseInt(req.query.minDiscount as string) || 0;
      const products = await storage.getProductsWithDiscount(minDiscount);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch discounted products" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
