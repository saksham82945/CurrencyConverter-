import React from 'react';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  badge?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  badge,
  className = ''
}) => {
  return (
    <div className={`glass-panel rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-slate-400/50 dark:hover:border-slate-600/60 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">{title}</span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{value}</div>
          {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">{subtitle}</p>}
        </div>
        {icon && (
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5 text-emerald-500 dark:text-emerald-400 shadow-inner">
            {icon}
          </div>
        )}
      </div>

      {(trend || badge) && (
        <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
          {trend && (
            <div className="flex items-center gap-1.5 font-mono">
              <span className={trend.isPositive ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                {trend.value}
              </span>
              {trend.label && <span className="text-slate-500 dark:text-slate-400">{trend.label}</span>}
            </div>
          )}
          {badge && <div className="ml-auto">{badge}</div>}
        </div>
      )}
    </div>
  );
};
