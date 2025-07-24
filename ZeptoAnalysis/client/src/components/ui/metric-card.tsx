import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: "increase" | "decrease";
    label?: string;
  };
  icon: LucideIcon;
  className?: string;
}

const MetricCard = ({ title, value, change, icon: Icon, className = "" }: MetricCardProps) => {
  return (
    <div className={`metric-card ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${
                change.type === "increase" ? "text-green-500" : "text-red-500"
              }`}>
                {change.value}
              </span>
              {change.label && (
                <span className="text-gray-500 text-sm ml-1">{change.label}</span>
              )}
            </div>
          )}
        </div>
        <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
