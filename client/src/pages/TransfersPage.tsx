import React, { useState, useEffect } from 'react';
import { accountsApi } from '../api/accounts.api';
import { transfersApi, ReceiptData, TransferResult, FxSwapResult } from '../api/transfers.api';
import { MultiCurrencyTransferForm } from '../components/transfers/MultiCurrencyTransferForm';
import { P2PTransferForm } from '../components/transfers/P2PTransferForm';
import { ExternalTransferForm } from '../components/transfers/ExternalTransferForm';
import { FxSwapForm } from '../components/transfers/FxSwapForm';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { AccountDTO } from '@shared/types/account.types';
import { Send, Globe, ArrowDownUp, ShieldCheck, Zap } from 'lucide-react';

export const TransfersPage: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [activeTab, setActiveTab] = useState<'remittance' | 'p2p' | 'external' | 'fx'>('remittance');
  const [isLoading, setIsLoading] = useState(true);

  // Receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await accountsApi.listAccounts();
      setAccounts(data?.accounts || []);
    } catch (err) {
      console.error('Failed to load accounts for transfers:', err);
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

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

  const handleTransferSuccess = (result: TransferResult | FxSwapResult) => {
    fetchAccounts();
    handleOpenReceipt(result.entryNumber);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Globe className="w-7 h-7 text-emerald-500" />
            Multi-Currency Transfers & Remittance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            Transfer dollars directly converted into Indian Rupee (INR), Pakistani Rupee (PKR), or global currencies at live rates
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" />
          <span>Real-Time Institutional Rails</span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900/90 p-1 border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('remittance')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold font-mono whitespace-nowrap transition-all ${
            activeTab === 'remittance'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Send Money to Bank (USD ➔ INR/PKR/Global)
        </button>

        <button
          onClick={() => setActiveTab('p2p')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold font-mono whitespace-nowrap transition-all ${
            activeTab === 'p2p'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          Transfer to User
        </button>

        <button
          onClick={() => setActiveTab('fx')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold font-mono whitespace-nowrap transition-all ${
            activeTab === 'fx'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowDownUp className="w-3.5 h-3.5" />
          Exchange Currency
        </button>
      </div>

      {/* Active Form */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Loading accounts...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-8 text-center glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
          No accounts found. Please visit Accounts or Faucet to initialize your demo wallet.
        </div>
      ) : (
        <div>
          {activeTab === 'remittance' && (
            <MultiCurrencyTransferForm accounts={accounts} onTransferSuccess={handleTransferSuccess} />
          )}
          {activeTab === 'p2p' && (
            <P2PTransferForm accounts={accounts} onTransferSuccess={handleTransferSuccess} />
          )}
          {activeTab === 'external' && (
            <ExternalTransferForm accounts={accounts} onTransferSuccess={handleTransferSuccess} />
          )}
          {activeTab === 'fx' && (
            <FxSwapForm accounts={accounts} onSwapSuccess={handleTransferSuccess} />
          )}
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
        isLoading={isLoadingReceipt}
      />
    </div>
  );
};
