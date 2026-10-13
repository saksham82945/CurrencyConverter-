import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsApi, AccountsListResponse } from '../api/accounts.api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { CopyButton } from '../components/common/CopyButton';
import { AccountDTO, AccountType } from '@shared/types/account.types';
import { SupportedCurrency, SUPPORTED_CURRENCIES } from '@shared/constants/currencies';
import { WORLD_CURRENCIES, getWorldCurrency } from '@shared/constants/worldCurrencies';
import {
  Wallet,
  Plus,
  ArrowRight,
  ShieldCheck,
  Landmark,
  RefreshCw,
  AlertCircle,
  Search,
  Sparkles,
  CreditCard
} from 'lucide-react';

export const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [accountsData, setAccountsData] = useState<AccountsListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currency, setCurrency] = useState<string>('GBP');
  const [accountType, setAccountType] = useState<AccountType>('CHECKING');
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAccounts = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await accountsApi.listAccounts();
      setAccountsData(data || { accounts: [], totalNetWorthUSDMinorUnits: 0, totalNetWorthUSDFormatted: '$0.00' });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Unable to connect to Bank of Maldives accounts service';
      setFetchError(msg);
      error('Failed to load accounts', msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Compute set of user's existing account keys "CURRENCY_ACCOUNTTYPE"
  const existingAccountsKeySet = useMemo(() => {
    const set = new Set<string>();
    accountsData?.accounts?.forEach((a) => {
      set.add(`${a.currency.toUpperCase()}_${a.accountType.toUpperCase()}`);
    });
    return set;
  }, [accountsData]);

  // Set initial selected currency when modal opens
  const openCreateModal = () => {
    const popularCurrencies = ['GBP', 'EUR', 'CAD', 'JPY', 'INR', 'PKR', 'AED', 'AUD', 'CHF', 'SAR', 'SGD'];
    const available = popularCurrencies.find(
      (c) => !existingAccountsKeySet.has(`${c}_${accountType}`)
    );
    if (available) {
      setCurrency(available);
    }
    setNickname('');
    setIsCreateModalOpen(true);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { account } = await accountsApi.createAccount(currency, accountType, nickname.trim());
      success('Account Created! 🏦', `Opened ${account.currency} ${account.accountType} (${account.accountNumber})`);
      setIsCreateModalOpen(false);
      setNickname('');
      await fetchAccounts();
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || err.message || 'Failed to provision account';
      error('Failed to create account', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter accounts by search query
  const filteredAccounts = useMemo(() => {
    if (!accountsData?.accounts) return [];
    if (!searchQuery.trim()) return accountsData.accounts;
    const q = searchQuery.toLowerCase().trim();
    return accountsData.accounts.filter((acc) => {
      const name = (acc.nickname || '').toLowerCase();
      const curr = acc.currency.toLowerCase();
      const num = acc.accountNumber.toLowerCase();
      const type = acc.accountType.toLowerCase();
      return name.includes(q) || curr.includes(q) || num.includes(q) || type.includes(q);
    });
  }, [accountsData, searchQuery]);

  // Selected account exists check
  const isSelectedPairExisting = existingAccountsKeySet.has(`${currency.toUpperCase()}_${accountType}`);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Landmark className="w-7 h-7 text-emerald-500" />
            Bank Accounts & Balances
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            Manage your personal and commercial checking accounts across global currencies
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAccounts}
            isLoading={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            className="border border-slate-200 dark:border-slate-800"
            title="Refresh accounts"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={openCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Open Currency Account
          </Button>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {fetchError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-3 animate-slide-up">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">Error Loading Accounts</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5">{fetchError}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {(fetchError.toLowerCase().includes('session') ||
              fetchError.toLowerCase().includes('token') ||
              fetchError.toLowerCase().includes('auth') ||
              fetchError.toLowerCase().includes('suspended') ||
              fetchError.toLowerCase().includes('unauthorized')) && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate('/login')}
                className="text-xs whitespace-nowrap bg-red-600 hover:bg-red-700 text-white"
              >
                Log In Again
              </Button>
            )}
            <Button
              size="sm"
              variant="danger"
              onClick={fetchAccounts}
              className="text-xs whitespace-nowrap"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Net Worth Summary Bar */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 dark:border-slate-800/80 transition-all">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Net Worth (USD Equivalent)
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono mt-1 tracking-tight">
            {accountsData?.totalNetWorthUSDFormatted || '$0.00'}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {accountsData?.accounts?.length || 0} active accounts in total
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Accounts Active & Ledger Verified</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/transfers')}
            leftIcon={<CreditCard className="w-3.5 h-3.5" />}
            className="text-xs font-mono"
          >
            Send Money
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      {accountsData && accountsData.accounts.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts by nickname, currency (USD, EUR...), or account number..."
            className="w-full glass-input rounded-xl text-sm py-2.5 pl-10 pr-4"
          />
        </div>
      )}

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Fetching active ledger accounts...</p>
          </div>
        ) : filteredAccounts.length > 0 ? (
          filteredAccounts.map((acc) => {
            const worldCurr = getWorldCurrency(acc.currency);
            const supportedConfig = SUPPORTED_CURRENCIES[acc.currency as SupportedCurrency];
            const symbol = supportedConfig?.symbol || worldCurr?.symbol || '$';
            const flag = worldCurr?.flag || '🌐';

            return (
              <div
                key={acc.id}
                className="glass-panel glass-panel-hover rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between group transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm text-emerald-600 dark:text-emerald-400 font-mono border border-slate-200 dark:border-slate-700 shadow-sm">
                        {symbol}
                      </span>
                      <div>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span>{flag}</span>
                          <span>{acc.currency}</span>
                          <span className="text-slate-400 dark:text-slate-500">•</span>
                          <span>{acc.accountType}</span>
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3 group-hover:text-emerald-500 transition-colors">
                    {acc.nickname || `${worldCurr?.name || acc.currency} Account`}
                  </h3>

                  <div className="my-5">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-mono">Available Balance:</span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5">
                      {acc.balanceFormatted}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800/80 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Account Number:</span>
                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-semibold">
                      <span>{acc.accountNumber}</span>
                      <CopyButton textToCopy={acc.accountNumber} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Routing (ABA):</span>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <span>{acc.routingNumber}</span>
                      <CopyButton textToCopy={acc.routingNumber} />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full mt-2 font-mono text-xs"
                    onClick={() => navigate(`/accounts/${acc.id}`)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    View Account Profile & Statement
                  </Button>
                </div>
              </div>
            );
          })
        ) : accountsData?.accounts && accountsData.accounts.length === 0 ? (
          /* Empty State */
          <div className="col-span-full py-16 px-6 glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center animate-scale-up">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4 shadow-lg shadow-emerald-500/5">
              <Wallet className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Currency Accounts Provisioned</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 max-w-md">
              You haven't opened any currency checking or savings accounts yet. Get started by provisioning your first global currency account.
            </p>
            <Button
              variant="primary"
              onClick={openCreateModal}
              leftIcon={<Plus className="w-4 h-4" />}
              className="mt-5"
            >
              Open Your First Account
            </Button>
          </div>
        ) : (
          /* No search results */
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
            No accounts matched "{searchQuery}". Try a different search term.
          </div>
        )}
      </div>

      {/* Modal: Open New Currency Account */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Open New Simulated Currency Account"
        subtitle="Provision an additional deposit liability ledger account in your preferred world currency."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Select Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full glass-input rounded-xl text-sm py-2.5 px-3 font-mono cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
            >
              <optgroup label="Featured & Core Currencies" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                {WORLD_CURRENCIES.filter((c) => c.popular).map((c) => {
                  const exists = existingAccountsKeySet.has(`${c.code.toUpperCase()}_${accountType}`);
                  return (
                    <option key={c.code} value={c.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono">
                      {c.flag} {c.code} — {c.name} ({c.symbol.trim()}) {exists ? `[Already Created ${accountType}]` : ''}
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="All Global Currencies (190+)" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                {WORLD_CURRENCIES.filter((c) => !c.popular).map((c) => {
                  const exists = existingAccountsKeySet.has(`${c.code.toUpperCase()}_${accountType}`);
                  return (
                    <option key={c.code} value={c.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono">
                      {c.flag} {c.code} — {c.name} ({c.symbol.trim()}) {exists ? `[Already Created ${accountType}]` : ''}
                    </option>
                  );
                })}
              </optgroup>
            </select>
            {isSelectedPairExisting && (
              <p className="text-xs text-amber-500 font-mono mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                You already hold a {currency} {accountType} account. Choose a different currency or change account type.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType('CHECKING')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                  accountType === 'CHECKING'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                CHECKING (Primary)
              </button>
              <button
                type="button"
                onClick={() => setAccountType('SAVINGS')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                  accountType === 'SAVINGS'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                SAVINGS (Vault)
              </button>
            </div>
          </div>

          <Input
            label="Account Nickname (Optional)"
            placeholder="e.g. Travel Wallet, Business Reserve, Tokyo Savings"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            helperText="Custom name to identify this ledger account on statements and receipts"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 mt-3"
            isLoading={isSubmitting}
            disabled={isSelectedPairExisting}
          >
            {isSelectedPairExisting ? 'Account Already Exists' : 'Provision Account in Ledger'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
