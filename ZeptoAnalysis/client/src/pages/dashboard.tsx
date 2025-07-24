import { useState } from "react";
import { Download } from "lucide-react";
import Sidebar from "@/components/sidebar";
import Overview from "@/components/dashboard/overview";
import StockManagement from "@/components/dashboard/stock-management";
import TopDeals from "@/components/dashboard/top-deals";
import RevenueAnalysis from "@/components/dashboard/revenue-analysis";
import CategoryAnalytics from "@/components/dashboard/category-analytics";
import InventoryAnalytics from "@/components/dashboard/inventory-analytics";
import SqlInterface from "@/components/dashboard/sql-interface";

export type DashboardView = 
  | "overview" 
  | "stock" 
  | "deals" 
  | "revenue" 
  | "categories" 
  | "inventory" 
  | "sql";

const Dashboard = () => {
  const [activeView, setActiveView] = useState<DashboardView>("overview");
  const [dateFilter, setDateFilter] = useState<string>("30");

  // Update analytics when date filter changes
  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    // Force re-fetch analytics data with new date filter
    // Note: This is a simple implementation - in production you'd pass the filter to the API
    window.location.reload();
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'csv', dateFilter })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zepto-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getViewTitle = (view: DashboardView): string => {
    const titles = {
      overview: "Dashboard Overview",
      stock: "Stock Management",
      deals: "Top Deals",
      revenue: "Revenue Analysis",
      categories: "Category Analytics",
      inventory: "Inventory Analytics",
      sql: "SQL Query Interface"
    };
    return titles[view];
  };

  const renderView = () => {
    switch (activeView) {
      case "overview":
        return <Overview />;
      case "stock":
        return <StockManagement />;
      case "deals":
        return <TopDeals />;
      case "revenue":
        return <RevenueAnalysis />;
      case "categories":
        return <CategoryAnalytics />;
      case "inventory":
        return <InventoryAnalytics />;
      case "sql":
        return <SqlInterface />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {getViewTitle(activeView)}
              </h2>
              <p className="text-gray-600 mt-1">
                E-commerce inventory analytics and insights
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleExport}
                className="px-4 py-2 gradient-bg text-white rounded-lg font-medium transition-transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <Download size={16} />
                <span>Export Data</span>
              </button>
              <div className="relative">
                <select 
                  value={dateFilter}
                  onChange={(e) => handleDateFilterChange(e.target.value)}
                  className="appearance-none bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
