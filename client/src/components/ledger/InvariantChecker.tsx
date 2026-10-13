import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface InvariantCheckerProps {
  isBalanced?: boolean;
  totalDebits?: number;
  totalCredits?: number;
  label?: string;
  className?: string;
}

export const InvariantChecker: React.FC<InvariantCheckerProps> = ({
  isBalanced = true,
  totalDebits,
  totalCredits,
  label = 'Double-Entry Invariant Status',
  className = ''
}) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
        isBalanced
          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
          : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
      } ${className}`}
    >
      {isBalanced ? (
        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 animate-bounce" />
      )}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white">{label}:</span>
        <span className={isBalanced ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
          {isBalanced ? 'Σ(Debits) - Σ(Credits) = 0 (BALANCED)' : 'UNBALANCED VIOLATION'}
        </span>
      </div>
    </div>
  );
};
