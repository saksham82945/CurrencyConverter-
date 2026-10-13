import React from 'react';
import { LedgerLineDTO } from '@shared/types/ledger.types';
import { Button } from '../common/Button';
import { FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface LedgerTableProps {
  lines: LedgerLineDTO[];
  onViewReceipt?: (entryNumber: string) => void;
  isLoading?: boolean;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({
  lines,
  onViewReceipt,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono">Loading immutable ledger entries...</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="p-8 text-center glass-panel rounded-2xl border border-slate-800 text-slate-400 font-mono text-xs">
        No ledger entries recorded yet. Try funding via the faucet or running a transfer!
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Direction</th>
              <th className="py-3 px-4">Account</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-right">Balance After</th>
              {onViewReceipt && <th className="py-3 px-4 text-center">Receipt</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
            {lines.map((line) => {
              const isCredit = line.direction === 'CREDIT';
              return (
                <tr key={line.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                    {new Date(line.createdAt).toLocaleDateString()} {new Date(line.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCredit
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                      )}
                      {line.direction}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="text-slate-900 dark:text-white font-semibold">{line.ledgerAccountName || 'Account'}</div>
                    <span className="text-[10px] text-slate-500">{line.ledgerAccountCode}</span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-900 dark:text-white">
                    <span className={isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}>
                      {line.amountFormatted}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono">
                    {line.accountBalanceAfterFormatted}
                  </td>
                  {onViewReceipt && (
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewReceipt(line.journalEntryId)}
                        className="p-1 text-slate-400 hover:text-emerald-400"
                        title="View Full Ledger Receipt"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
