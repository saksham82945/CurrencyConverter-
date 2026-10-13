import React from 'react';

interface SimulatorBadgeProps {
  label?: string;
  text?: string;
  variant?: 'warning' | 'info' | 'success' | 'danger';
  size?: 'sm' | 'md';
}

export const SimulatorBadge: React.FC<SimulatorBadgeProps> = ({
  label,
  text,
  variant = 'info',
  size = 'sm'
}) => {
  const displayText = text || label || 'ENTERPRISE READY • LIVE ARCHITECTURE';

  const colorMap = {
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
  };

  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded border ${colorMap[variant]} ${sizeClasses} tracking-wider uppercase select-none`}
    >
      <span>{displayText}</span>
    </span>
  );
};
