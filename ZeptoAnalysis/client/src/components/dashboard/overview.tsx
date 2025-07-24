import { useAnalytics } from "@/hooks/use-analytics";
import MetricCard from "@/components/ui/metric-card";
import { Package, DollarSign, Grid, Tag, BarChart3, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const Overview = () => {
  const { 
    overviewMetrics, 
    categoryRevenue, 
    stockStatus, 
    topDeals,
    isLoading 
  } = useAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Format currency for display
  const formatCurrency = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${(value / 100).toFixed(0)}`;
  };

  // Prepare chart data
  const stockChartData = stockStatus?.map(status => ({
    name: status.status,
    value: status.count,
    percentage: status.percentage
  })) || [];

  const categoryChartData = categoryRevenue?.slice(0, 6).map(cat => ({
    name: cat.category,
    revenue: cat.revenue / 100, // Convert from paise to rupees
    products: cat.productCount
  })) || [];

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Products"
          value={overviewMetrics?.totalProducts?.toLocaleString() || "0"}
          change={{
            value: "+12.5%",
            type: "increase",
            label: "vs last month"
          }}
          icon={Package}
        />
        
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(overviewMetrics?.totalRevenue || 0)}
          change={{
            value: "+8.2%",
            type: "increase",
            label: "vs last month"
          }}
          icon={DollarSign}
        />
        
        <MetricCard
          title="Categories"
          value={overviewMetrics?.totalCategories || "0"}
          change={{
            value: "+2",
            type: "increase",
            label: "new this month"
          }}
          icon={Grid}
        />
        
        <MetricCard
          title="Avg Discount"
          value={`${overviewMetrics?.avgDiscount?.toFixed(1) || "0"}%`}
          change={{
            value: "-1.5%",
            type: "decrease",
            label: "vs last month"
          }}
          icon={Tag}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category Chart */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue by Category</h3>
            <button 
              onClick={() => window.open('/api/analytics/category-revenue', '_blank')}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View Details
            </button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="revenue"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Status Chart */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Stock Status</h3>
            <button 
              onClick={() => window.open('/api/analytics/stock-status', '_blank')}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View Details
            </button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                />
                <Tooltip 
                  formatter={(value: number) => [value, "Products"]}
                  labelStyle={{ color: "#374151" }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#8B5CF6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="chart-container">
        <div className="border-b border-gray-100 pb-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Products</h3>
          <p className="text-gray-600 text-sm mt-1">Products with highest discounts and best deals</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MRP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Final Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Savings
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topDeals?.slice(0, 10).map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{(product.mrp / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {product.discountPercent}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ₹{(product.discountedSellingPrice / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    ₹{(product.savings / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;
