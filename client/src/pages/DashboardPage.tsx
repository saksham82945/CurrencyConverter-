import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { accountsApi, AccountsListResponse } from '../api/accounts.api';
import { cardsApi } from '../api/cards.api';
import { transfersApi, ReceiptData } from '../api/transfers.api';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { CopyButton } from '../components/common/CopyButton';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { LedgerTable } from '../components/ledger/LedgerTable';
import { InvariantChecker } from '../components/ledger/InvariantChecker';
import { AccountDTO, VirtualCardDTO } from '@shared/types/account.types';
import { LedgerLineDTO } from '@shared/types/ledger.types';
import {
  Wallet,
  ArrowLeftRight,
  CreditCard,
  Droplets,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  TrendingUp,
  ExternalLink,
  FileDown
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { generateAccountStatementPDF } from '../utils/pdfReport.util';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [accountsData, setAccountsData] = useState<AccountsListResponse | null>(null);
  const [cards, setCards] = useState<VirtualCardDTO[]>([]);
  const [recentLines, setRecentLines] = useState<LedgerLineDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Receipt Modal state
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const handleExportStatement = () => {
    if (!accountsData?.accounts || accountsData.accounts.length === 0) {
      error('No Active Accounts', 'Please provision an account first.');
      return;
    }
    try {
      const primaryAccount = accountsData.accounts[0];
      generateAccountStatementPDF(primaryAccount, recentLines, user);
      success('Statement Exported', `Generated official PDF statement for ${primaryAccount.currency} account.`);
    } catch (err: any) {
      error('Export Failed', err.message || 'Unable to generate statement');
    }
  };

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [accResult, cardsResult] = await Promise.allSettled([
        accountsApi.listAccounts(),
        cardsApi.listCards()
      ]);

      let loadedAccounts: AccountsListResponse | null = null;
      if (accResult.status === 'fulfilled') {
        loadedAccounts = accResult.value;
        setAccountsData(loadedAccounts);

        // Fetch entries from primary account
        if (loadedAccounts?.accounts && loadedAccounts.accounts.length > 0) {
          try {
            const primaryAcc = loadedAccounts.accounts[0];
            const entriesRes = await accountsApi.getAccountEntries(primaryAcc.id, 1, 6);
            setRecentLines(entriesRes.items || []);
          } catch (entryErr) {
            console.error('Failed to load recent entries:', entryErr);
          }
        }
      }

      if (cardsResult.status === 'fulfilled') {
        setCards(cardsResult.value?.cards || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleOpenReceipt = async (journalEntryId: string) => {
    setIsLoadingReceipt(true);
    setIsReceiptModalOpen(true);
    try {
      const receipt = await transfersApi.getReceipt(journalEntryId);
      setSelectedReceipt(receipt);
    } catch (err) {
      console.error('Failed to load receipt:', err);
    } finally {
      setIsLoadingReceipt(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome & KYC Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome, {user?.fullName || 'Fintech Explorer'} 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            Simulated Ledger Account ID: <span className="text-slate-700 dark:text-slate-300">{user?.id}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="primary"
            onClick={handleExportStatement}
            leftIcon={<FileDown className="w-3.5 h-3.5" />}
          >
            Export Statement (PDF)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/faucet')}
            leftIcon={<Droplets className="w-3.5 h-3.5" />}
          >
            Treasury Influx
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Consolidated Net Worth"
          value={accountsData?.totalNetWorthUSDFormatted || '$0.00'}
          subtitle="Equiv. USD (Real-time FX conversion)"
          icon={<Wallet className="w-5 h-5" />}
          trend={{ value: '100% Backed', isPositive: true, label: 'Vault Reserves' }}
        />

        <StatCard
          title="Active Currency Accounts"
          value={accountsData?.accounts?.length || 0}
          subtitle="Multi-currency checking & savings"
          icon={<ArrowLeftRight className="w-5 h-5" />}
          badge={
            <button
              onClick={() => navigate('/accounts')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono"
            >
              Manage <ExternalLink className="w-3 h-3" />
            </button>
          }
        />

        <StatCard
          title="Virtual Debit Cards"
          value={cards.length}
          subtitle="Active point-of-sale virtual cards"
          icon={<CreditCard className="w-5 h-5" />}
          badge={
            <button
              onClick={() => navigate('/cards')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-mono"
            >
              Open Cards <ExternalLink className="w-3 h-3" />
            </button>
          }
        />

        <StatCard
          title="Simulated KYC Tier"
          value={user?.kycTier === 'TIER_2_SIMULATED' ? 'Tier 2 (Verified)' : 'Tier 1 (Basic)'}
          subtitle={
            user?.kycTier === 'TIER_2_SIMULATED'
              ? 'Transfer Limit: $50,000/day'
              : 'Transfer Limit: $2,500/day'
          }
          icon={<ShieldCheck className="w-5 h-5" />}
          badge={
            user?.kycTier !== 'TIER_2_SIMULATED' ? (
              <button
                onClick={() => navigate('/settings')}
                className="text-xs text-amber-500 hover:underline font-mono font-medium"
              >
                Upgrade
              </button>
            ) : undefined
          }
        />
      </div>

      {/* Quick Action Hub */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase">Quick Operations</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Trigger core simulated banking actions</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('/transfers')}
            leftIcon={<ArrowUpRight className="w-4 h-4" />}
          >
            P2P Transfer
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/transfers')}
            leftIcon={<ArrowLeftRight className="w-4 h-4" />}
          >
            Currency Swap
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/cards')}
            leftIcon={<CreditCard className="w-4 h-4" />}
          >
            POS Charge Test
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/faucet')}
            leftIcon={<Droplets className="w-3.5 h-3.5" />}
          >
            Deposit Faucet
          </Button>
        </div>
      </div>

      {/* Multi-Currency Accounts Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Your Currency Accounts</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Individual balances calculated directly from immutable ledger lines
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/accounts')}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Account
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountsData?.accounts && accountsData.accounts.length > 0 ? (
            accountsData.accounts.map((acc) => (
              <div
                key={acc.id}
                onClick={() => navigate(`/accounts/${acc.id}`)}
                className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-200 dark:border-slate-800 cursor-pointer relative overflow-hidden group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      {acc.currency} • {acc.accountType}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 group-hover:text-emerald-500 transition-colors">
                      {acc.nickname || `${acc.currency} Checking Account`}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {acc.status}
                  </span>
                </div>

                <div className="my-4">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-mono">Ledger Balance:</span>
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                    {acc.balanceFormatted}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span>Acc: {acc.accountNumber}</span>
                  <CopyButton textToCopy={acc.accountNumber} label="Copy" />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-mono">
              No accounts created yet. Click "Add Account" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Recent Ledger Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Recent Ledger Journal Entries</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Append-only double-entry audit records with cryptographic hashes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportStatement}
              leftIcon={<FileDown className="w-3.5 h-3.5 text-emerald-400" />}
              className="text-xs font-mono"
            >
              Export PDF
            </Button>
            {accountsData?.accounts[0] && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/accounts/${accountsData.accounts[0].id}`)}
                className="text-xs font-mono text-emerald-400"
              >
                Full History →
              </Button>
            )}
          </div>
        </div>

        <LedgerTable
          lines={recentLines}
          isLoading={isLoading}
          onViewReceipt={handleOpenReceipt}
        />
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
