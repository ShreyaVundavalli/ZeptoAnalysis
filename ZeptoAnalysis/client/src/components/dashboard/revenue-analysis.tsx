import { useAnalytics } from "@/hooks/use-analytics";
import MetricCard from "@/components/ui/metric-card";
import { DollarSign, TrendingUp, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const RevenueAnalysis = () => {
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

  // Calculate revenue statistics
  const totalRevenue = overviewMetrics?.totalRevenue || 0;
  const topCategory = categoryRevenue?.[0];
  const avgRevenuePerCategory = totalRevenue / (categoryRevenue?.length || 1);
  const avgProductValue = totalRevenue / (overviewMetrics?.totalProducts || 1);

  // Format currency
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
  const barChartData = categoryRevenue?.map(cat => ({
    name: cat.category.length > 15 ? cat.category.substring(0, 15) + "..." : cat.category,
    revenue: cat.revenue / 100, // Convert from paise to rupees
    products: cat.productCount,
    avgDiscount: cat.avgDiscount
  })) || [];

  const pieChartData = categoryRevenue?.slice(0, 6).map(cat => ({
    name: cat.category,
    value: cat.revenue / 100,
    percentage: ((cat.revenue / totalRevenue) * 100).toFixed(1)
  })) || [];

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  return (
    <div className="space-y-6">
      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          change={{
            value: "+12.8%",
            type: "increase",
            label: "vs last month"
          }}
          icon={DollarSign}
        />
        
        <MetricCard
          title="Top Category"
          value={topCategory?.category.substring(0, 15) || "N/A"}
          change={{
            value: formatCurrency(topCategory?.revenue || 0),
            type: "increase",
            label: "revenue"
          }}
          icon={TrendingUp}
        />
        
        <MetricCard
          title="Avg per Category"
          value={formatCurrency(avgRevenuePerCategory)}
          change={{
            value: "+8.4%",
            type: "increase",
            label: "vs last month"
          }}
          icon={BarChart3}
        />
        
        <MetricCard
          title="Avg Product Value"
          value={formatCurrency(avgProductValue)}
          change={{
            value: "+5.2%",
            type: "increase",
            label: "vs last month"
          }}
          icon={PieChartIcon}
        />
      </div>

      {/* Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category Bar Chart */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
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
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                  labelFormatter={(label) => `Category: ${label}`}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#8B5CF6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Distribution Pie Chart */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percentage }) => `${percentage}%`}
                >
                  {pieChartData.map((entry, index) => (
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
      </div>

      {/* Detailed Revenue Table */}
      <div className="chart-container">
        <div className="border-b border-gray-100 pb-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Category Revenue Breakdown</h3>
          <p className="text-gray-600 text-sm mt-1">Detailed revenue analysis by product category</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Revenue/Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market Share
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryRevenue?.map((category, index) => {
                const marketShare = ((category.revenue / totalRevenue) * 100).toFixed(1);
                const avgRevenuePerProduct = category.revenue / category.productCount;
                
                return (
                  <tr key={category.category} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index < 3 ? (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            'bg-orange-500'
                          }`}>
                            {index + 1}
                          </div>
                        ) : (
                          <span className="text-gray-600 font-medium">{index + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-green-600">
                        ₹{(category.revenue / 100).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{category.productCount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        ₹{(avgRevenuePerProduct / 100).toFixed(0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {category.avgDiscount.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{ width: `${marketShare}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{marketShare}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalysis;
