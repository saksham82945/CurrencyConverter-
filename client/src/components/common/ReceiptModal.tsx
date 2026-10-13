import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { ReceiptData } from '../../api/transfers.api';
import { generateTransactionReceiptPDF } from '../../utils/pdfReport.util';
import { Landmark, Printer, FileDown, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
  isLoading?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
  isLoading = false
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (receipt) {
      generateTransactionReceiptPDF(receipt);
    }
  };

  // Extract receipt fields matching the official bank template
  const rawDate = receipt?.postedAt ? new Date(receipt.postedAt) : new Date();
  const formattedDate = rawDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }); // e.g. "09 May 2026"

  const meta = receipt?.metadata || {};
  const referenceId = meta.referenceId || receipt?.entryNumber?.replace(/\D/g, '').substring(0, 9) || '391879681';
  const creditedAccount = meta.beneficiaryAccountNumber || meta.recipientAccount || '01004012494';
  const beneficiaryName = meta.beneficiaryName || meta.recipientName || 'Nader Kamel';
  const beneficiaryBank = meta.beneficiaryBank || meta.institutionName || 'Vodafone Cash';
  const narration = (meta.narration || receipt?.description || 'PROFITS PAYMENT').toUpperCase();
  const senderName = meta.senderName || 'Berry Slibert';

  // Format amount string
  const sourceCurrency = meta.sourceCurrency || 'USD';
  const sourceAmountFormatted = meta.sourceAmountMinorUnits 
    ? `${(meta.sourceAmountMinorUnits / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${sourceCurrency}`
    : (receipt?.lines?.[0]?.amountFormatted || '1,000.00 USD');

  const hasFx = Boolean(meta.exchangeRateUsed && meta.targetCurrency && meta.targetCurrency !== sourceCurrency);
  const targetFormatted = meta.targetAmountFormatted || (meta.targetAmountMinorUnits ? `${(meta.targetAmountMinorUnits / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${meta.targetCurrency}` : '');

  const amountDisplay = hasFx
    ? `${sourceAmountFormatted} (Credited: ${targetFormatted} @ ${meta.exchangeRateUsed})`
    : sourceAmountFormatted;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg" title="Official Transaction Receipt">
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-mono">Retrieving official transaction record...</p>
        </div>
      ) : receipt ? (
        <div className="space-y-4">
          {/* Prominent Front Sticky/Top Action Bar with Clear Close Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                Official Commercial Certificate Ready
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 border border-slate-300 dark:border-slate-600 dark:hover:border-slate-500"
              >
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>Close Receipt</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-4 py-2 rounded-xl bg-[#c82333] hover:bg-[#a51c2a] text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <FileDown className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Printable White Receipt Paper matching official template */}
          <div className="bg-white text-gray-900 border border-gray-200 rounded-lg p-6 sm:p-8 relative overflow-hidden shadow-2xl font-sans print:shadow-none print:border-none print:p-0">
            {/* Diagonal Watermark Repeating Background */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-[0.06] flex flex-wrap items-center justify-around gap-12 rotate-[-25deg] scale-125 z-0">
              {Array.from({ length: 28 }).map((_, i) => (
                <span
                  key={i}
                  className="text-lg sm:text-xl font-black text-red-600 tracking-wider whitespace-nowrap"
                >
                  Bank of Maldives
                </span>
              ))}
            </div>

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between pb-3">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-black uppercase">
                  TRANSACTION RECEIPT
                </h2>
                <div className="flex items-center gap-3 text-right">
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
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-black transition-colors print:hidden border border-gray-300 ml-1"
                    title="Close Receipt"
                    aria-label="Close Receipt"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Horizontal Top Divider */}
              <div className="w-full h-[2px] bg-black mb-2"></div>

              {/* Transaction Key-Value Rows with Dividers */}
              <div className="divide-y divide-gray-200/90 text-xs sm:text-sm">
                {/* Reference ID */}
                <div className="grid grid-cols-12 py-2.5 px-1 items-center">
                  <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Reference ID:</span>
                  <span className="col-span-7 sm:col-span-8 text-gray-900 font-semibold">{referenceId}</span>
                </div>

                {/* Transaction Type */}
                <div className="grid grid-cols-12 py-2.5 px-1 items-center">
                  <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Transaction Type:</span>
                  <span className="col-span-7 sm:col-span-8 text-gray-900 font-semibold uppercase">DEBIT</span>
                </div>

                {/* Transaction Date */}
                <div className="grid grid-cols-12 py-2.5 px-1 items-center">
                  <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Transaction Date:</span>
                  <span className="col-span-7 sm:col-span-8 text-gray-900">{formattedDate}</span>
                </div>

                {/* Credited Account */}
                <div className="grid grid-cols-12 py-2.5 px-1 items-center">
                  <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Credited Account:</span>
                  <span className="col-span-7 sm:col-span-8 text-gray-900 font-mono font-medium">{creditedAccount}</span>
                </div>

                {/* Beneficiary Name */}
                <div className="grid grid-cols-12 py-2.5 px-1 items-center">
                  <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Beneficiary Name:</span>
                  <span className="col-span-7 sm:col-span-8 text-gray-900 font-semibold">{beneficiaryName}</span>
                </div>

                {/* Beneficiary Bank */}
                <div className="grid grid-cols-12 py-2.5 px-1 items-center">
                  <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Beneficiary Bank:</span>
                  <span className="col-span-7 sm:col-span-8 text-gray-900 font-semibold">{beneficiaryBank}</span>
                </div>

                {/* Narration */}
                <div className="grid grid-cols-12 py-2.5 px-1 items-center">
                  <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Narration:</span>
                  <span className="col-span-7 sm:col-span-8 text-gray-900 uppercase font-medium">{narration}</span>
                </div>

                {/* Transaction Status */}
                <div className="grid grid-cols-12 py-2.5 px-1 items-center">
                  <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Transaction Status:</span>
                  <div className="col-span-7 sm:col-span-8 flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                    <span>Transaction Successful</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="grid grid-cols-12 py-2.5 px-1 items-center">
                  <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Amount:</span>
                  <span className="col-span-7 sm:col-span-8 text-gray-900 font-bold text-sm sm:text-base">
                    {amountDisplay}
                  </span>
                </div>

                {/* Sender */}
                <div className="grid grid-cols-12 py-2.5 px-1 items-center border-b border-gray-200">
                  <span className="col-span-5 sm:col-span-4 font-bold text-gray-900">Sender:</span>
                  <span className="col-span-7 sm:col-span-8 text-gray-900 font-semibold">{senderName}</span>
                </div>
              </div>

              {/* Red Bottom Assistance Banner */}
              <div className="mt-5 p-4 rounded-none bg-[#E11932] text-white text-center font-sans space-y-1 shadow-sm">
                <p className="text-xs sm:text-sm font-normal leading-relaxed">
                  For any other assistance you can always contact Bank of Maldives customer care:
                </p>
                <p className="text-xs sm:text-sm font-bold tracking-wide">
                  customerservice@bml.com.mv • +960 3330200
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="secondary"
              onClick={onClose}
              leftIcon={<X className="w-4 h-4" />}
              size="sm"
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold"
            >
              Close Receipt
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                onClick={handleDownloadPdf}
                leftIcon={<FileDown className="w-4 h-4" />}
                size="sm"
                className="bg-[#c82333] hover:bg-[#a51c2a] text-white"
              >
                Download Official PDF Receipt
              </Button>
              <Button
                variant="secondary"
                onClick={handlePrint}
                leftIcon={<Printer className="w-4 h-4" />}
                size="sm"
              >
                Print Receipt
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-sm text-slate-400">
          No receipt details available.
        </div>
      )}
    </Modal>
  );
};
