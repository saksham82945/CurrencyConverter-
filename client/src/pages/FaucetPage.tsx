import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { accountsApi } from '../api/accounts.api';
import { faucetApi, FaucetInjectResponse } from '../api/faucet.api';
import { transfersApi, ReceiptData } from '../api/transfers.api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { AccountDTO } from '@shared/types/account.types';
import { Droplets, Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

const FAUCET_PRESETS = [
  { label: '$10,000', minorUnits: 1000000, desc: 'Working Capital Influx' },
  { label: '$50,000', minorUnits: 5000000, desc: 'Commercial Liquidity Buffer' },
  { label: '$250,000', minorUnits: 25000000, desc: 'Institutional Credit Facility' },
  { label: '$1,000,000', minorUnits: 100000000, desc: 'Enterprise Treasury Influx' },
  { label: '$10,000,000', minorUnits: 1000000000, desc: 'Sovereign Reserve Liquidity' }
];

export const FaucetPage: React.FC = () => {
  const { success, error } = useToast();
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedAmountMinorUnits, setSelectedAmountMinorUnits] = useState(100000); // 1,000 units
  const [isInjecting, setIsInjecting] = useState(false);
  const [lastInject, setLastInject] = useState<FaucetInjectResponse | null>(null);

  // Receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const fetchAccounts = async () => {
    try {
      const data = await accountsApi.listAccounts();
      const accs = data?.accounts || [];
      setAccounts(accs);
      if (accs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accs[0].id);
      }
    } catch (err: any) {
      error('Failed to load accounts', err.response?.data?.error?.message || err.message);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#6366f1', '#38bdf8', '#fbbf24']
    });
  };

  const handleInject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) {
      error('No Account Selected', 'Please choose an account to receive test liquidity.');
      return;
    }

    setIsInjecting(true);
    setLastInject(null);
    try {
      const res = await faucetApi.injectLiquidity(selectedAccountId, selectedAmountMinorUnits);
      setLastInject(res);
      triggerConfetti();
      success(
        'Liquidity Injected! 💧',
        `Credited ${res.amountFormatted} into your ${res.currency} account.`
      );
      fetchAccounts();
    } catch (err: any) {
      error('Faucet Injection Failed', err.response?.data?.error?.message || err.message);
    } finally {
      setIsInjecting(false);
    }
  };

  const handleOpenReceipt = async (entryNumber: string) => {
    setIsLoadingReceipt(true);
    setIsReceiptModalOpen(true);
    try {
      const receipt = await transfersApi.getReceipt(entryNumber);
      setSelectedReceipt(receipt);
    } catch (err) {
      console.error('Failed to load receipt:', err);
    } finally {
      setIsLoadingReceipt(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Droplets className="w-7 h-7 text-emerald-500" />
            Treasury Liquidity Influx & Capital Facility
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            Direct central vault liquidity allocation into your accounts with unlimited capacity for enterprise operations
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <Sparkles className="w-4 h-4" />
          <span>Instant Provisioning</span>
        </div>
      </div>

      {/* Faucet Injector Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
        <form onSubmit={handleInject} className="space-y-6">
          {/* Target Account */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Select Receiving Account
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full glass-input rounded-xl text-sm py-3 px-3 font-mono cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {acc.nickname || `${acc.currency} Checking`} ({acc.currency}) — Balance: {acc.balanceFormatted}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Choose Test Liquidity Amount
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FAUCET_PRESETS.map((p) => {
                const isSelected = selectedAmountMinorUnits === p.minorUnits;
                return (
                  <button
                    key={p.minorUnits}
                    type="button"
                    onClick={() => setSelectedAmountMinorUnits(p.minorUnits)}
                    className={`p-3.5 rounded-xl border text-left font-mono transition-all duration-200 ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span
                      className={`block font-bold text-sm ${
                        isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-200'
                      }`}
                    >
                      {p.label}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ledger Accounting Explanation */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 font-mono text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <span className="text-slate-900 dark:text-white font-bold block mb-1">Double-Entry Mechanics:</span>
            <p>• Debit: Bank of Maldives Simulated Vault Reserve ({selectedAccount?.currency || 'USD'})</p>
            <p>• Credit: Customer Deposit Liability Account ({selectedAccount?.accountNumber || 'Account'})</p>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3.5 text-base"
            isLoading={isInjecting}
            leftIcon={<Zap className="w-5 h-5" />}
          >
            Inject Simulated Liquidity ⚡
          </Button>
        </form>

        {/* Feedback block post injection */}
        {lastInject && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-emerald-400 font-bold text-sm block">
                  Deposit Successfully Posted!
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  New Balance: {lastInject.newAccountBalanceFormatted}
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenReceipt(lastInject.entryNumber)}
              className="text-xs font-mono"
            >
              Inspect Journal Receipt
            </Button>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
        isLoading={isLoadingReceipt}
      />
    </div>
  );
};
