import { useQuery } from '@tanstack/react-query';

export interface OverviewData {
  totalProducts: string;
  totalRevenue: string;
  avgDiscount: string;
  outOfStockCount: string;
  stockStatus: Array<{ status: string; count: number }>;
  topCategories: Array<{ category: string; count: number }>;
  lowStockProducts: Array<{ name: string; available_quantity: number }>;
}

export interface StockStatusData {
  status: string;
  count: number;
}

export interface TopDealsData {
  name: string;
  discount_percent: number;
  mrp: number;
  discounted_selling_price: number;
  savings: number;
}

export interface CategoryRevenueData {
  category: string;
  revenue: number;
  count: number;
}

export interface InventoryWeightData {
  range: string;
  count: number;
}

export const useOverview = () => {
  return useQuery<OverviewData>({
    queryKey: ['/api/analytics/overview'],
  });
};

export const useStockStatus = () => {
  return useQuery<StockStatusData[]>({
    queryKey: ['/api/analytics/stock-status'],
  });
};

export const useTopDeals = () => {
  return useQuery<TopDealsData[]>({
    queryKey: ['/api/analytics/top-deals'],
  });
};

export const useCategoryRevenue = () => {
  return useQuery<CategoryRevenueData[]>({
    queryKey: ['/api/analytics/category-revenue'],
  });
};

export const useInventoryWeight = () => {
  return useQuery<InventoryWeightData[]>({
    queryKey: ['/api/analytics/inventory-weight'],
  });
};

// Combined analytics hook that components are expecting
export const useAnalytics = (dateFilter?: string) => {
  const queryKey = dateFilter ? ['analytics', dateFilter] : ['analytics'];
  
  const overviewQuery = useOverview();
  const stockStatusQuery = useStockStatus();
  const topDealsQuery = useTopDeals();
  const categoryRevenueQuery = useCategoryRevenue();
  const inventoryWeightQuery = useInventoryWeight();

  return {
    overviewMetrics: overviewQuery.data,
    stockStatus: stockStatusQuery.data,
    topDeals: topDealsQuery.data,
    categoryRevenue: categoryRevenueQuery.data,
    inventoryWeight: inventoryWeightQuery.data,
    isLoading: overviewQuery.isLoading || stockStatusQuery.isLoading || topDealsQuery.isLoading || categoryRevenueQuery.isLoading || inventoryWeightQuery.isLoading,
    error: overviewQuery.error || stockStatusQuery.error || topDealsQuery.error || categoryRevenueQuery.error || inventoryWeightQuery.error,
    refetch: () => {
      overviewQuery.refetch();
      stockStatusQuery.refetch();
      topDealsQuery.refetch();
      categoryRevenueQuery.refetch();
      inventoryWeightQuery.refetch();
    }
  };
};