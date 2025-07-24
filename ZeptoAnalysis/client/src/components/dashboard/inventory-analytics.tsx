import { useAnalytics } from "@/hooks/use-analytics";
import MetricCard from "@/components/ui/metric-card";
import { Weight, Package, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const InventoryAnalytics = () => {
  const { inventoryWeight, overviewMetrics, categoryRevenue, isLoading } = useAnalytics();

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

  // Calculate inventory statistics
  const totalProducts = overviewMetrics?.totalProducts || 0;
  const totalWeight = inventoryWeight?.reduce((sum, item) => {
    // Extract weight from range like "100g - 500g" or "Under 100g"
    const range = item.range || '';
    let weight = 0;
    if (range.includes('Under')) {
      weight = 50; // Average for "Under 100g"
    } else if (range.includes('-')) {
      const parts = range.split('-');
      weight = parseFloat(parts[0].replace(/[^\d.]/g, '')) || 0;
    } else if (range.includes('Over')) {
      weight = 5000; // Average for "Over 5kg"
    }
    return sum + (item.count * weight);
  }, 0) || 0;
  
  const avgWeightPerProduct = totalProducts > 0 ? totalWeight / totalProducts : 0;
  const heaviestCategory = inventoryWeight && inventoryWeight.length > 0 
    ? inventoryWeight.reduce((max, item) => (item.count > (max?.count || 0) ? item : max), inventoryWeight[0])
    : null;

  // Format weight for display
  const formatWeight = (weight: number) => {
    if (weight >= 1000) {
      return `${(weight / 1000).toFixed(1)}kg`;
    }
    return `${weight.toFixed(0)}g`;
  };

  // Prepare chart data
  const weightChartData = inventoryWeight?.map(item => ({
    name: item.range,
    value: item.count,
    percentage: Math.round((item.count / totalProducts) * 100)
  })) || [];

  // Create inventory value data by combining weight and category data
  const inventoryValueData = categoryRevenue?.slice(0, 6).map(cat => ({
    name: cat.category.length > 15 ? cat.category.substring(0, 15) + "..." : cat.category,
    products: cat.productCount,
    value: cat.revenue / 100,
    avgValue: (cat.revenue / cat.productCount) / 100
  })) || [];

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  return (
    <div className="space-y-6">
      {/* Inventory Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Products"
          value={totalProducts.toLocaleString()}
          change={{
            value: "+3.2%",
            type: "increase",
            label: "vs last month"
          }}
          icon={Package}
        />
        
        <MetricCard
          title="Avg Product Weight"
          value={formatWeight(avgWeightPerProduct)}
          change={{
            value: "-2.1%",
            type: "decrease",
            label: "lighter products"
          }}
          icon={Weight}
        />
        
        <MetricCard
          title="Weight Categories"
          value={inventoryWeight?.length.toString() || "0"}
          change={{
            value: "5 ranges",
            type: "increase",
            label: "distribution"
          }}
          icon={BarChart3}
        />
        
        <MetricCard
          title="Heaviest Category"
          value={heaviestCategory?.range || "N/A"}
          change={{
            value: `${heaviestCategory?.count || 0} items`,
            type: "increase",
            label: "products"
          }}
          icon={PieChartIcon}
        />
      </div>

      {/* Inventory Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Distribution Chart */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Weight Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={weightChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  labelLine={false}
                >
                  {weightChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, "Products"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Value by Category */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Inventory Value by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryValueData}>
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
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'products' ? `${value} products` : `₹${value.toLocaleString()}`,
                    name === 'products' ? 'Product Count' : 'Total Value'
                  ]}
                />
                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weight Analysis Table */}
      <div className="chart-container">
        <div className="border-b border-gray-100 pb-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Weight Category Analysis</h3>
          <p className="text-gray-600 text-sm mt-1">Detailed breakdown of products by weight ranges</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distribution
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryWeight?.map((weight) => {
                const categoryLabel = weight.range.includes('Under') ? 'Very Light' :
                                    weight.range.includes('100g - 500g') ? 'Light' :
                                    weight.range.includes('500g - 1kg') ? 'Medium' :
                                    weight.range.includes('1kg - 5kg') ? 'Heavy' : 'Very Heavy';
                
                const categoryColor = weight.range.includes('Under') ? 'bg-blue-100 text-blue-800' :
                                    weight.range.includes('100g - 500g') ? 'bg-green-100 text-green-800' :
                                    weight.range.includes('500g - 1kg') ? 'bg-yellow-100 text-yellow-800' :
                                    weight.range.includes('1kg - 5kg') ? 'bg-orange-100 text-orange-800' :
                                    'bg-red-100 text-red-800';
                
                return (
                  <tr key={weight.range} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{weight.range}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-gray-900">{weight.count.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{Math.round((weight.count / totalProducts) * 100)}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${Math.round((weight.count / totalProducts) * 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${categoryColor}`}>
                        {categoryLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="chart-container bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-4">📦 Lightweight Products</h4>
          <div className="space-y-2">
            <div className="text-sm text-blue-700">
              Under 100g: {inventoryWeight?.find(w => w.range.includes('Under'))?.count || 0} products
            </div>
            <div className="text-sm text-blue-700">
              100g-500g: {inventoryWeight?.find(w => w.range.includes('100g - 500g'))?.count || 0} products
            </div>
            <div className="text-xs text-blue-600 mt-2">
              Perfect for quick delivery and low shipping costs
            </div>
          </div>
        </div>
        
        <div className="chart-container bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <h4 className="font-semibold text-orange-800 mb-4">⚖️ Medium Weight Range</h4>
          <div className="space-y-2">
            <div className="text-sm text-orange-700">
              500g-1kg: {inventoryWeight?.find(w => w.range.includes('500g - 1kg'))?.count || 0} products
            </div>
            <div className="text-sm text-orange-700">
              1kg-5kg: {inventoryWeight?.find(w => w.range.includes('1kg - 5kg'))?.count || 0} products
            </div>
            <div className="text-xs text-orange-600 mt-2">
              Balanced weight for standard delivery
            </div>
          </div>
        </div>
        
        <div className="chart-container bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <h4 className="font-semibold text-red-800 mb-4">🏋️ Heavy Products</h4>
          <div className="space-y-2">
            <div className="text-sm text-red-700">
              Over 5kg: {inventoryWeight?.find(w => w.range.includes('Over'))?.count || 0} products
            </div>
            <div className="text-xs text-red-600 mt-2">
              Requires special handling and higher shipping costs
            </div>
            <div className="text-xs text-red-600">
              Consider bulk pricing strategies
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryAnalytics;