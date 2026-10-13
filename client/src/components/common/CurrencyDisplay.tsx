import React from 'react';
import { SupportedCurrency, formatMinorUnits, SUPPORTED_CURRENCIES } from '@shared/constants/currencies';

interface CurrencyDisplayProps {
  amountMinorUnits: number;
  currency: SupportedCurrency;
  showCode?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  colored?: boolean; // if true, green for positive, red for negative
  isSignExplicit?: boolean; // prepend + if positive
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amountMinorUnits,
  currency,
  showCode = false,
  size = 'md',
  colored = false,
  isSignExplicit = false,
  className = ''
}) => {
  const formatted = formatMinorUnits(Math.abs(amountMinorUnits), currency);
  const isNegative = amountMinorUnits < 0;
  const isPositive = amountMinorUnits > 0;

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold',
    xl: 'text-2xl font-bold tracking-tight',
    '2xl': 'text-3xl font-extrabold tracking-tight',
    '3xl': 'text-4xl sm:text-5xl font-extrabold tracking-tight'
  }[size];

  let colorClass = 'text-white';
  if (colored) {
    if (isNegative) colorClass = 'text-rose-400';
    else if (isPositive) colorClass = 'text-emerald-400';
    else colorClass = 'text-slate-400';
  }

  const sign = isNegative ? '-' : (isSignExplicit && isPositive ? '+' : '');

  return (
    <span className={`inline-flex items-baseline font-mono ${sizeClasses} ${colorClass} ${className}`}>
      {sign && <span className="mr-0.5">{sign}</span>}
      <span>{formatted}</span>
      {showCode && (
        <span className="ml-1.5 text-[0.65em] font-sans font-semibold text-slate-400 uppercase tracking-widest">
          {currency}
        </span>
      )}
    </span>
  );
};
