import { BarChart3, Package, Tag, DollarSign, Grid, Weight, Terminal, User } from "lucide-react";
import type { DashboardView } from "@/pages/dashboard";

interface SidebarProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  const menuItems = [
    { id: "overview" as DashboardView, label: "Overview", icon: BarChart3 },
    { id: "stock" as DashboardView, label: "Stock Management", icon: Package },
    { id: "deals" as DashboardView, label: "Top Deals", icon: Tag },
    { id: "revenue" as DashboardView, label: "Revenue Analysis", icon: DollarSign },
    { id: "categories" as DashboardView, label: "Categories", icon: Grid },
    { id: "inventory" as DashboardView, label: "Inventory Analytics", icon: Weight },
    { id: "sql" as DashboardView, label: "SQL Query", icon: Terminal },
  ];

  return (
    <aside className="sidebar-gradient w-72 flex-shrink-0 shadow-2xl">
      <div className="p-6">
        {/* Logo Section */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Zepto Analytics</h1>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`nav-item w-full ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="absolute bottom-0 w-72 p-6 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">Data Analyst</p>
            <p className="text-gray-400 text-xs truncate">Analytics Dashboard</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
