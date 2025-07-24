import { useAnalytics } from "@/hooks/use-analytics";
import MetricCard from "@/components/ui/metric-card";
import { Grid, Package, TrendingUp, Tag } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const CategoryAnalytics = () => {
  const { categoryRevenue, overviewMetrics, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Calculate category statistics
  const totalCategories = overviewMetrics?.totalCategories || 0;
  const topCategoryByProducts = categoryRevenue?.reduce((max, cat) => 
    cat.productCount > (max?.productCount || 0) ? cat : max, categoryRevenue[0]);
  const avgProductsPerCategory = (overviewMetrics?.totalProducts || 0) / totalCategories;
  const avgDiscountAcrossCategories = categoryRevenue?.reduce((sum, cat) => sum + cat.avgDiscount, 0) / 
    (categoryRevenue?.length || 1);

  // Prepare chart data for products by category
  const productCountData = categoryRevenue?.map(cat => ({
    name: cat.category.length > 15 ? cat.category.substring(0, 15) + "..." : cat.category,
    products: cat.productCount,
    revenue: cat.revenue / 100,
    avgDiscount: cat.avgDiscount
  })) || [];

  // Prepare chart data for average discount by category
  const discountData = categoryRevenue?.map(cat => ({
    name: cat.category.length > 15 ? cat.category.substring(0, 15) + "..." : cat.category,
    discount: cat.avgDiscount,
    products: cat.productCount
  })).sort((a, b) => b.discount - a.discount) || [];

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  return (
    <div className="space-y-6">
      {/* Category Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Categories"
          value={totalCategories.toString()}
          change={{
            value: "+2",
            type: "increase",
            label: "new categories"
          }}
          icon={Grid}
        />
        
        <MetricCard
          title="Top by Products"
          value={topCategoryByProducts?.category.substring(0, 15) || "N/A"}
          change={{
            value: `${topCategoryByProducts?.productCount || 0} items`,
            type: "increase",
            label: "products"
          }}
          icon={Package}
        />
        
        <MetricCard
          title="Avg Products/Category"
          value={avgProductsPerCategory.toFixed(0)}
          change={{
            value: "+8.3%",
            type: "increase",
            label: "vs last month"
          }}
          icon={TrendingUp}
        />
        
        <MetricCard
          title="Avg Discount"
          value={`${avgDiscountAcrossCategories.toFixed(1)}%`}
          change={{
            value: "-2.1%",
            type: "decrease",
            label: "vs last month"
          }}
          icon={Tag}
        />
      </div>

      {/* Category Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products by Category */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Products by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productCountData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'products' ? `${value} products` : `₹${value.toLocaleString()}`,
                    name === 'products' ? 'Product Count' : 'Revenue'
                  ]}
                />
                <Bar dataKey="products" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Discount by Category */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Average Discount by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={discountData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, "Avg Discount"]}
                />
                <Bar dataKey="discount" radius={[4, 4, 0, 0]}>
                  {discountData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Performance Table */}
      <div className="chart-container">
        <div className="border-b border-gray-100 pb-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Category Performance Analysis</h3>
          <p className="text-gray-600 text-sm mt-1">Comprehensive breakdown of all product categories</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Revenue/Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryRevenue?.map((category, index) => {
                const avgRevenuePerProduct = category.revenue / category.productCount;
                const totalRevenue = overviewMetrics?.totalRevenue || 1;
                const marketShare = ((category.revenue / totalRevenue) * 100);
                
                // Performance score based on revenue share and product count
                const performanceScore = (marketShare + (category.productCount / 100)) / 2;
                const performanceLevel = performanceScore > 15 ? 'Excellent' :
                                       performanceScore > 10 ? 'Good' :
                                       performanceScore > 5 ? 'Average' : 'Below Average';
                
                const performanceColor = performanceScore > 15 ? 'bg-green-100 text-green-800' :
                                       performanceScore > 10 ? 'bg-blue-100 text-blue-800' :
                                       performanceScore > 5 ? 'bg-yellow-100 text-yellow-800' : 
                                       'bg-red-100 text-red-800';
                
                return (
                  <tr key={category.category} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{category.productCount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">
                        {((category.productCount / (overviewMetrics?.totalProducts || 1)) * 100).toFixed(1)}% of total
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        ₹{(category.revenue / 100).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {marketShare.toFixed(1)}% share
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ₹{(avgRevenuePerProduct / 100).toFixed(0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        {category.avgDiscount.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${performanceColor}`}>
                        {performanceLevel}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        Score: {performanceScore.toFixed(1)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="chart-container bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <h4 className="font-semibold text-green-800 mb-4">🏆 Top Performers</h4>
          <div className="space-y-2">
            {categoryRevenue?.slice(0, 3).map((cat, index) => (
              <div key={cat.category} className="flex justify-between items-center">
                <span className="text-sm text-green-700">{index + 1}. {cat.category}</span>
                <span className="text-xs font-semibold text-green-800">
                  ₹{(cat.revenue / 100000).toFixed(1)}L
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="chart-container bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-4">📊 Most Products</h4>
          <div className="space-y-2">
            {categoryRevenue?.sort((a, b) => b.productCount - a.productCount).slice(0, 3).map((cat, index) => (
              <div key={cat.category} className="flex justify-between items-center">
                <span className="text-sm text-blue-700">{index + 1}. {cat.category}</span>
                <span className="text-xs font-semibold text-blue-800">
                  {cat.productCount} items
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="chart-container bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <h4 className="font-semibold text-purple-800 mb-4">🏷️ Best Discounts</h4>
          <div className="space-y-2">
            {categoryRevenue?.sort((a, b) => b.avgDiscount - a.avgDiscount).slice(0, 3).map((cat, index) => (
              <div key={cat.category} className="flex justify-between items-center">
                <span className="text-sm text-purple-700">{index + 1}. {cat.category}</span>
                <span className="text-xs font-semibold text-purple-800">
                  {cat.avgDiscount.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryAnalytics;
