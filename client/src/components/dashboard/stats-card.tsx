import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: ReactNode;
  iconBgColor: string;
  changeDirection?: "up" | "down" | "none";
  changeColor?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  icon,
  iconBgColor,
  changeDirection = "none",
  changeColor = "text-green-600"
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${iconBgColor} p-3 rounded-full`}>
          {icon}
        </div>
      </div>
      {change && (
        <div className={`mt-2 text-sm ${changeColor} flex items-center`}>
          {changeDirection === "up" && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )}
          {changeDirection === "down" && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          {change}
        </div>
      )}
    </div>
  );
}
