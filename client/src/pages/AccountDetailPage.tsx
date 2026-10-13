import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountsApi, AccountEntriesResponse } from '../api/accounts.api';
import { transfersApi, ReceiptData } from '../api/transfers.api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { CopyButton } from '../components/common/CopyButton';
import { LedgerTable } from '../components/ledger/LedgerTable';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { InvariantChecker } from '../components/ledger/InvariantChecker';
import { AccountDTO } from '@shared/types/account.types';
import { LedgerLineDTO } from '@shared/types/ledger.types';
import { useAuth } from '../context/AuthContext';
import { generateAccountStatementPDF } from '../utils/pdfReport.util';
import {
  ArrowLeft,
  ArrowUpRight,
  Droplets,
  Landmark,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileDown,
  CheckCircle2
} from 'lucide-react';

export const AccountDetailPage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [account, setAccount] = useState<AccountDTO | null>(null);
  const [entriesData, setEntriesData] = useState<AccountEntriesResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const handleDownloadPdf = () => {
    if (!account) return;
    try {
      generateAccountStatementPDF(account, entriesData?.items || [], user);
      success('PDF Report Generated', `Statement for ${account.currency} ${account.accountNumber} downloaded successfully.`);
    } catch (err: any) {
      error('PDF Generation Failed', err.message || 'Unable to generate statement');
    }
  };

  // Receipt Modal state
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const fetchDetails = useCallback(async (page: number) => {
    if (!accountId) return;
    setIsLoading(true);
    try {
      const [detailRes, entriesRes] = await Promise.all([
        accountsApi.getAccountById(accountId),
        accountsApi.getAccountEntries(accountId, page, 15)
      ]);
      setAccount(detailRes.account);
      setEntriesData(entriesRes);
    } catch (err: any) {
      error('Failed to load account details', err.response?.data?.error?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchDetails(currentPage);
  }, [fetchDetails, currentPage]);

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

  if (!isLoading && !account) {
    return (
      <div className="py-12 text-center glass-panel rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">Account not found or no access.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/accounts')}>
          Back to Accounts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/accounts')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="border border-slate-200 dark:border-slate-800"
          >
            All Accounts
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{account?.nickname || `${account?.currency} Account`}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Ledger Account ID: <span className="text-slate-700 dark:text-slate-300">{account?.ledgerAccountId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={handleDownloadPdf}
            leftIcon={<FileDown className="w-4 h-4" />}
          >
            Download PDF Statement
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/transfers')}
            leftIcon={<ArrowUpRight className="w-4 h-4" />}
          >
            Transfer Funds
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/faucet')}
            leftIcon={<Droplets className="w-4 h-4" />}
          >
            Treasury Influx
          </Button>
        </div>
      </div>

      {/* Official Bank Account Profile Card matching template */}
      <div className="bg-white text-gray-900 border border-gray-200 rounded-lg p-6 sm:p-8 relative overflow-hidden shadow-xl font-sans">
        {/* Diagonal Watermark */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-[0.05] flex flex-wrap items-center justify-around gap-12 rotate-[-25deg] scale-125 z-0">
          {Array.from({ length: 28 }).map((_, i) => (
            <span key={i} className="text-lg sm:text-xl font-black text-red-600 tracking-wider whitespace-nowrap">
              Bank of Maldives
            </span>
          ))}
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-black uppercase">
                BANK ACCOUNT PROFILE
              </h2>
              <span className="text-xs text-gray-500 font-medium">Verified Commercial Account Certificate</span>
            </div>
            <div className="flex items-center gap-2 text-right">
              <div className="w-7 h-7 rounded-lg bg-[#E11932] flex items-center justify-center text-white font-mono font-black text-[11px] shadow-sm">
                BML
              </div>
              <div className="leading-none text-right">
                <span className="text-xs sm:text-sm font-black text-[#E11932] tracking-wide block">
                  BANK OF MALDIVES
                </span>
                <span className="text-[9px] font-bold text-gray-700 tracking-widest block uppercase">
                  INTERNET BANKING
                </span>
              </div>
            </div>
          </div>

          <div className="w-full h-[2px] bg-black mb-3"></div>

          {/* Key-Value Rows */}
          <div className="divide-y divide-gray-200/90 text-xs sm:text-sm">
            <div className="grid grid-cols-12 py-2.5 px-1 items-center">
              <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Account Holder:</span>
              <span className="col-span-7 sm:col-span-8 text-gray-900 font-semibold">{user?.fullName || 'Darren Trader'}</span>
            </div>

            <div className="grid grid-cols-12 py-2.5 px-1 items-center">
              <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Account Name:</span>
              <span className="col-span-7 sm:col-span-8 text-gray-900 font-semibold">{account?.nickname || `${account?.currency} Checking Account`}</span>
            </div>

            <div className="grid grid-cols-12 py-2.5 px-1 items-center">
              <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Account Number:</span>
              <div className="col-span-7 sm:col-span-8 flex items-center gap-2 font-mono font-bold text-gray-900">
                <span>{account?.accountNumber}</span>
                {account && <CopyButton textToCopy={account.accountNumber} />}
              </div>
            </div>

            <div className="grid grid-cols-12 py-2.5 px-1 items-center">
              <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Routing Number (ABA):</span>
              <div className="col-span-7 sm:col-span-8 flex items-center gap-2 font-mono text-gray-900">
                <span>{account?.routingNumber}</span>
                {account && <CopyButton textToCopy={account.routingNumber} />}
              </div>
            </div>

            <div className="grid grid-cols-12 py-2.5 px-1 items-center">
              <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Account Type:</span>
              <span className="col-span-7 sm:col-span-8 text-gray-900 uppercase font-semibold">{account?.accountType} (Direct Deposit)</span>
            </div>

            <div className="grid grid-cols-12 py-2.5 px-1 items-center">
              <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Currency:</span>
              <span className="col-span-7 sm:col-span-8 text-gray-900 font-semibold">{account?.currency}</span>
            </div>

            <div className="grid grid-cols-12 py-2.5 px-1 items-center">
              <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Available Balance:</span>
              <span className="col-span-7 sm:col-span-8 text-emerald-700 font-extrabold text-base sm:text-lg">
                {account?.balanceFormatted}
              </span>
            </div>

            <div className="grid grid-cols-12 py-2.5 px-1 items-center">
              <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Account Status:</span>
              <div className="col-span-7 sm:col-span-8 flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                <span>Active & Verified (Unlimited Volume)</span>
              </div>
            </div>

            <div className="grid grid-cols-12 py-2.5 px-1 items-center border-b border-gray-200">
              <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Clearing Network:</span>
              <span className="col-span-7 sm:col-span-8 text-gray-900 font-medium">Real-Time Clearing (FedWire, NEFT, RAAST, SEPA Instant)</span>
            </div>
          </div>

          {/* Red Bottom Banner */}
          <div className="mt-5 p-3.5 rounded-none bg-[#E11932] text-white text-center font-sans space-y-0.5">
            <p className="text-xs sm:text-sm font-normal">
              For any other assistance you can always contact Bank of Maldives customer care:
            </p>
            <p className="text-xs sm:text-sm font-bold tracking-wide">
              customerservice@bml.com.mv • +960 3330200
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              Transaction History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Recent account transfers, incoming credits, and wire settlements
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadPdf}
            leftIcon={<FileDown className="w-4 h-4 text-emerald-400" />}
          >
            Export Ledger PDF
          </Button>
        </div>

        <LedgerTable
          lines={entriesData?.items || []}
          isLoading={isLoading}
          onViewReceipt={handleOpenReceipt}
        />

        {/* Pagination controls */}
        {entriesData && entriesData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 font-mono text-xs text-slate-400">
            <span>
              Page {entriesData.pagination.page} of {entriesData.pagination.totalPages} ({entriesData.pagination.total} entries)
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={currentPage >= entriesData.pagination.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
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
