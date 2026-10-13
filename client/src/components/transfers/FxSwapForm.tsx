import React, { useState, useEffect } from 'react';
import { AccountDTO } from '@shared/types/account.types';
import { Button } from '../common/Button';
import { transfersApi, FxSwapResult } from '../../api/transfers.api';
import { fxApi, FxQuoteResponse } from '../../api/fx.api';
import { useToast } from '../../context/ToastContext';
import { parseToMinorUnits, formatMinorUnits, SUPPORTED_CURRENCIES } from '@shared/constants/currencies';
import { ArrowDownUp, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';

interface FxSwapFormProps {
  accounts: AccountDTO[];
  onSwapSuccess: (result: FxSwapResult) => void;
}

export const FxSwapForm: React.FC<FxSwapFormProps> = ({ accounts, onSwapSuccess }) => {
  const { success, error } = useToast();
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [amountInput, setAmountInput] = useState('100.00');
  const [quote, setQuote] = useState<FxQuoteResponse | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const fromAccount = accounts.find((a) => a.id === fromAccountId) || accounts[0];
  const toAccount = accounts.find((a) => a.id === toAccountId) || accounts[1];

  useEffect(() => {
    if (accounts.length > 0) {
      if (!fromAccountId || !accounts.some((a) => a.id === fromAccountId)) {
        setFromAccountId(accounts[0].id);
      }
      if (!toAccountId || !accounts.some((a) => a.id === toAccountId)) {
        setToAccountId(accounts[1]?.id || accounts[0]?.id || '');
      }
    }
  }, [accounts, fromAccountId, toAccountId]);

  // Fetch live quote when amounts or accounts change
  useEffect(() => {
    if (!fromAccount || !toAccount || fromAccount.id === toAccount.id) {
      setQuote(null);
      return;
    }

    const minorUnits = parseToMinorUnits(amountInput, fromAccount.currency);
    if (minorUnits <= 0) {
      setQuote(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingQuote(true);
      try {
        const q = await fxApi.getQuote(fromAccount.currency, toAccount.currency, minorUnits);
        setQuote(q);
      } catch (err) {
        // quiet fail on draft input
      } finally {
        setIsLoadingQuote(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [fromAccount, toAccount, amountInput]);

  const handleSwapDirection = () => {
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
  };

  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccount || !toAccount) return;

    if (fromAccount.id === toAccount.id) {
      error('Same Currency Account', 'Please choose two different currency accounts.');
      return;
    }

    const minorUnits = parseToMinorUnits(amountInput, fromAccount.currency);
    if (minorUnits <= 0) {
      error('Invalid Amount', 'Please enter an amount greater than 0.');
      return;
    }

    if (minorUnits > fromAccount.balanceMinorUnits) {
      error(
        'Insufficient Balance',
        `Available: ${fromAccount.balanceFormatted}, requested: ${formatMinorUnits(minorUnits, fromAccount.currency)}.`
      );
      return;
    }

    setIsSwapping(true);
    try {
      const result = await transfersApi.transferFxSwap({
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        fromAmountMinorUnits: minorUnits
      });

      success(
        'FX Swap Executed! 💱',
        `Swapped ${formatMinorUnits(result.debitedMinorUnits, fromAccount.currency)} for ${formatMinorUnits(
          result.creditedMinorUnits,
          toAccount.currency
        )} (Rate: ${result.appliedRate})`
      );
      onSwapSuccess(result);
    } catch (err: any) {
      error('Swap Failed', err.response?.data?.error?.message || err.message);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <form onSubmit={handleExecuteSwap} className="glass-panel rounded-2xl p-6 space-y-5">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <ArrowDownUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            Real-Time Currency Swap (FX)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Convert between your multi-currency balances with instant double-entry settlement.
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          50 bps Spread
        </span>
      </div>

      {/* From Account & Amount */}
      <div className="p-4 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold uppercase tracking-wider">You Pay</span>
          {fromAccount && (
            <span className="font-mono">
              Available: <span className="text-slate-900 dark:text-white font-bold">{fromAccount.balanceFormatted}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            required
            className="w-full bg-transparent text-2xl font-bold font-mono text-slate-900 dark:text-white focus:outline-none"
            placeholder="0.00"
          />

          <select
            value={fromAccountId}
            onChange={(e) => setFromAccountId(e.target.value)}
            className="glass-input rounded-xl text-sm py-2 px-3 font-mono font-bold cursor-pointer"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                {acc.currency}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invert Swap Button */}
      <div className="flex justify-center -my-2 relative z-10">
        <button
          type="button"
          onClick={handleSwapDirection}
          className="p-2 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 shadow-md transition-transform hover:rotate-180 active:scale-95"
          title="Invert swap currencies"
        >
          <ArrowDownUp className="w-4 h-4" />
        </button>
      </div>

      {/* To Account & Estimated Amount */}
      <div className="p-4 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold uppercase tracking-wider">You Receive</span>
          {toAccount && (
            <span className="font-mono">
              Current: <span className="text-slate-900 dark:text-white font-bold">{toAccount.balanceFormatted}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="w-full text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {isLoadingQuote ? (
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 animate-pulse">Calculating rate...</span>
            ) : quote ? (
              quote.toAmountFormatted
            ) : (
              '0.00'
            )}
          </div>

          <select
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            className="glass-input rounded-xl text-sm py-2 px-3 font-mono font-bold cursor-pointer"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                {acc.currency}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quote Transparency Breakdown */}
      {quote && (
        <div className="p-3.5 rounded-xl bg-slate-100/90 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Indicative Rate:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              1 {quote.fromCurrency} = {quote.appliedRate} {quote.toCurrency}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Simulated Spread Fee (0.5%):</span>
            <span className="text-slate-700 dark:text-slate-300">{quote.feeFormatted}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1">
            <span className="text-slate-500 dark:text-slate-400">Ledger Settlement:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Instant & Balanced</span>
          </div>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        className="w-full py-3"
        isLoading={isSwapping}
        disabled={fromAccountId === toAccountId || !quote}
        leftIcon={<RefreshCw className="w-4 h-4" />}
      >
        Execute FX Currency Swap
      </Button>
    </form>
  );
};
