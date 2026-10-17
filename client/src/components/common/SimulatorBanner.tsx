import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export const SimulatorBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside aria-label="Simulator notice" className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 border-b border-amber-500/20 text-xs text-amber-200/90 py-1.5 px-4 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-semibold text-[10px] tracking-wider uppercase border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            Simulator
          </span>
          <span className="font-medium text-slate-200 hidden sm:inline">
            DEMO ENVIRONMENT:
          </span>
          <span className="text-slate-300 truncate">
            Bank of Maldives Multi-Currency Banking Engine (Simulated Ledger)
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden md:flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ACID Ledger Active</span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] underline underline-offset-2 transition-colors"
          >
            {isExpanded ? 'Hide Info' : 'Details'}
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-amber-500/10 grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-300 pb-1">
          <div className="bg-slate-900/60 p-2 rounded border border-white/5">
            <span className="font-semibold text-amber-300 block mb-0.5">Zero Real Movement:</span>
            Transfers are isolated within Bank of Maldives' double-entry database engine. No SWIFT/ACH/FedNow interaction.
          </div>
          <div className="bg-slate-900/60 p-2 rounded border border-white/5">
            <span className="font-semibold text-emerald-300 block mb-0.5">Integer Minor Units:</span>
            Ledger arithmetic is stored as safe 64-bit minor integers (cents, pence, yen). Zero floating-point rounding errors.
          </div>
          <div className="bg-slate-900/60 p-2 rounded border border-white/5">
            <span className="font-semibold text-indigo-300 block mb-0.5">Idempotent Mutations:</span>
            All transfers and card charges employ UUID idempotency keys to ensure exactly-once execution.
          </div>
        </div>
      )}
    </aside>
  );
};
