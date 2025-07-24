import { useAnalytics } from "@/hooks/use-analytics";
import { Tag, TrendingDown, Star, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import MetricCard from "@/components/ui/metric-card";

const TopDeals = () => {
  const { topDeals, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  // Calculate deal statistics
  const maxDiscount = Math.max(...(topDeals?.map(deal => deal.discountPercent) || [0]));
  const avgDiscount = topDeals?.reduce((sum, deal) => sum + deal.discountPercent, 0) / (topDeals?.length || 1);
  const totalSavings = topDeals?.reduce((sum, deal) => sum + deal.savings, 0) || 0;
  const dealsCount = topDeals?.length || 0;

  return (
    <div className="space-y-6">
      {/* Deal Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Deals"
          value={dealsCount.toLocaleString()}
          change={{
            value: "+15%",
            type: "increase",
            label: "active deals"
          }}
          icon={Tag}
        />
        
        <MetricCard
          title="Max Discount"
          value={`${maxDiscount}%`}
          change={{
            value: "+5%",
            type: "increase",
            label: "vs last week"
          }}
          icon={TrendingDown}
        />
        
        <MetricCard
          title="Avg Discount"
          value={`${avgDiscount?.toFixed(1)}%`}
          change={{
            value: "+2.3%",
            type: "increase",
            label: "vs last week"
          }}
          icon={Star}
        />
        
        <MetricCard
          title="Total Savings"
          value={`₹${(totalSavings / 100).toLocaleString()}`}
          change={{
            value: "+18.2%",
            type: "increase",
            label: "customer savings"
          }}
          icon={DollarSign}
        />
      </div>

      {/* Top Deals Table */}
      <div className="chart-container">
        <div className="border-b border-gray-100 pb-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Best Deals Available</h3>
          <p className="text-gray-600 text-sm mt-1">Products with highest discounts and maximum savings</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sale Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  You Save
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topDeals?.map((deal, index) => {
                const discountColor = deal.discountPercent >= 30 ? 'bg-red-100 text-red-800' :
                                    deal.discountPercent >= 20 ? 'bg-orange-100 text-orange-800' :
                                    deal.discountPercent >= 10 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800';
                
                return (
                  <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
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
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {deal.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {deal.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 line-through">
                        ₹{(deal.mrp / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${discountColor}`}>
                        {deal.discountPercent}% OFF
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-green-600">
                        ₹{(deal.discountedSellingPrice / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">
                        ₹{(deal.savings / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-medium">
                          {(deal.discountPercent / 10).toFixed(1)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deal Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="chart-container bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <h4 className="font-semibold text-red-800 mb-4">🔥 Hot Deals (30%+ OFF)</h4>
          <div className="space-y-2">
            {topDeals?.filter(deal => deal.discountPercent >= 30).slice(0, 5).map(deal => (
              <div key={deal.id} className="text-sm text-red-700">
                {deal.name} - {deal.discountPercent}% OFF
              </div>
            ))}
          </div>
        </div>
        
        <div className="chart-container bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <h4 className="font-semibold text-orange-800 mb-4">⭐ Great Deals (20-29% OFF)</h4>
          <div className="space-y-2">
            {topDeals?.filter(deal => deal.discountPercent >= 20 && deal.discountPercent < 30).slice(0, 5).map(deal => (
              <div key={deal.id} className="text-sm text-orange-700">
                {deal.name} - {deal.discountPercent}% OFF
              </div>
            ))}
          </div>
        </div>
        
        <div className="chart-container bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <h4 className="font-semibold text-green-800 mb-4">💚 Good Deals (10-19% OFF)</h4>
          <div className="space-y-2">
            {topDeals?.filter(deal => deal.discountPercent >= 10 && deal.discountPercent < 20).slice(0, 5).map(deal => (
              <div key={deal.id} className="text-sm text-green-700">
                {deal.name} - {deal.discountPercent}% OFF
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopDeals;
