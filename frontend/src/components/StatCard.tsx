import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  colorScheme?: 'green' | 'mint' | 'blue' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  colorScheme = 'green'
}) => {
  const colorMap = {
    green: {
      bg: 'bg-forest-50',
      iconBg: 'bg-forest-100',
      iconColor: 'text-forest-700',
      border: 'border-forest-200'
    },
    mint: {
      bg: 'bg-mint-50',
      iconBg: 'bg-mint-100',
      iconColor: 'text-mint-700',
      border: 'border-mint-200'
    },
    blue: {
      bg: 'bg-sky-50',
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-700',
      border: 'border-sky-200'
    },
    amber: {
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      border: 'border-amber-200'
    }
  };

  const scheme = colorMap[colorScheme];

  return (
    <div className="bg-white rounded-2xl border border-cream-300 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-charcoal-900 mt-1">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl ${scheme.iconBg} flex items-center justify-center ${scheme.iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-3 flex items-center space-x-2 text-xs">
          {trend && (
            <span
              className={`font-semibold px-1.5 py-0.5 rounded ${
                trendPositive ? 'bg-forest-100 text-forest-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {trend}
            </span>
          )}
          {subtitle && <span className="text-charcoal-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
