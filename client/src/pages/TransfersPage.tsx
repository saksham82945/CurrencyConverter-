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

      {/* Bank of Maldives Quick Pay & Receipt Preview Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-600/10 via-slate-900/40 to-emerald-500/10 border border-red-500/20 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-[#ED1C24] rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-7 h-7 text-white fill-current">
              <path d="M52 14 L52 64 C43 62 33 60 27 63 C34 47 43 28 52 14 Z" fill="#ffffff" />
              <path d="M23 70 C35 70 65 70 78 70 L72 76 C48 76 30 76 27 76 Z" fill="#ffffff" />
              <path d="M24 80 C36 80 62 80 75 80 C73 82 71 83 69 83 C47 83 31 83 29 83 Z" fill="#ffffff" />
              <path d="M27 86 C38 86 60 86 67 86 C65 88 63 89 61 89 C45 89 33 89 31 89 Z" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Bank of Maldives Transfer Receipt (500.00 MVR)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                SUCCESS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              To: ALI SHAVIN (7730000852744) • Ref: BLAZ896331324224
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleOpenReceipt('BLAZ896331324224')}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white font-bold text-xs transition-all shadow-md active:scale-95 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5"
          >
            <span>View Receipt Preview</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('p2p');
            }}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#ED1C24] hover:bg-[#c8161d] text-white font-bold text-xs transition-all shadow-md shadow-red-900/30 active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Pay MVR Now</span>
          </button>
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
          Send Money to Bank (USD ➔ MVR/INR/Global)
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
          Transfer to User (BML P2P)
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
