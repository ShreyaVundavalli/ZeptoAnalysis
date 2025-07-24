import { useAnalytics } from "@/hooks/use-analytics";
import MetricCard from "@/components/ui/metric-card";
import { Package, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const StockManagement = () => {
  const { overviewMetrics, stockStatus, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const COLORS = {
    'In Stock': '#10B981',
    'Low Stock': '#F59E0B', 
    'Out of Stock': '#EF4444'
  };

  const chartData = stockStatus?.map(status => ({
    name: status.status,
    value: status.count,
    percentage: status.percentage
  })) || [];

  // Ensure we have data to display
  const hasData = chartData && chartData.length > 0 && chartData.some(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Stock Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="In Stock Products"
          value={overviewMetrics?.inStockProducts?.toLocaleString() || "0"}
          change={{
            value: "+5.2%",
            type: "increase",
            label: "vs last week"
          }}
          icon={CheckCircle}
          className="border-l-4 border-green-500"
        />
        
        <MetricCard
          title="Low Stock Alert"
          value={stockStatus?.find(s => s.status === 'Low Stock')?.count?.toLocaleString() || "0"}
          change={{
            value: "-2.1%",
            type: "decrease",
            label: "vs last week"
          }}
          icon={AlertTriangle}
          className="border-l-4 border-yellow-500"
        />
        
        <MetricCard
          title="Out of Stock"
          value={overviewMetrics?.outOfStockProducts?.toLocaleString() || "0"}
          change={{
            value: "+1.8%",
            type: "increase",
            label: "needs attention"
          }}
          icon={XCircle}
          className="border-l-4 border-red-500"
        />
      </div>

      {/* Stock Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Stock Distribution</h3>
          <div className="h-80">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, "Products"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Package className="w-12 h-12 mx-auto mb-4" />
                  <p>Loading stock distribution...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stock Status Summary */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Stock Status Summary</h3>
          <div className="space-y-4">
            {stockStatus?.map((status) => (
              <div key={status.status} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[status.status] }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{status.status}</p>
                    <p className="text-sm text-gray-600">{status.percentage}% of total inventory</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">{status.count.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">products</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="chart-container">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
            <Package className="w-8 h-8 text-primary mb-2" />
            <h4 className="font-medium text-gray-900">Restock Low Items</h4>
            <p className="text-sm text-gray-600">Generate restock orders</p>
          </button>
          
          <button 
            onClick={() => window.open(`/api/products?limit=1000&filter=low_stock`, '_blank')}
            className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
          >
            <AlertTriangle className="w-8 h-8 text-yellow-500 mb-2" />
            <h4 className="font-medium text-gray-900">Low Stock Report</h4>
            <p className="text-sm text-gray-600">View detailed report</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
            <h4 className="font-medium text-gray-900">Update Inventory</h4>
            <p className="text-sm text-gray-600">Bulk update quantities</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
            <XCircle className="w-8 h-8 text-red-500 mb-2" />
            <h4 className="font-medium text-gray-900">Out of Stock Alert</h4>
            <p className="text-sm text-gray-600">Manage alerts</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockManagement;
