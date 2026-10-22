import React, { useRef, useState, useEffect } from 'react';
import { ReceiptData } from '../../api/transfers.api';
import { generateTransactionReceiptPDF } from '../../utils/pdfReport.util';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import {
  FileDown,
  Printer,
  X,
  Copy,
  Check,
  Download,
  Share2
} from 'lucide-react';

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
  const receiptCardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isCapturingImage, setIsCapturingImage] = useState(false);

  // Trigger celebration confetti when receipt successfully displays
  useEffect(() => {
    if (isOpen && receipt && !isLoading) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#ED1C24', '#7cb342', '#162544', '#ffffff']
        });
      } catch {
        // Ignore if confetti fails
      }
    }
  }, [isOpen, receipt, isLoading]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Extract receipt data values matching Bank of Maldives mobile app
  const meta = receipt?.metadata || {};

  // Date formatting: DD/MM/YYYY HH:mm (e.g. 26/09/2026 15:18)
  const rawDate = receipt?.postedAt ? new Date(receipt.postedAt) : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedDate = `${pad(rawDate.getDate())}/${pad(rawDate.getMonth() + 1)}/${rawDate.getFullYear()} ${pad(rawDate.getHours())}:${pad(rawDate.getMinutes())}`;

  // Reference number (BML standard: BLAZ followed by 12 digits, matching the screenshot)
  const reference = meta.referenceId || (
    receipt?.entryNumber?.startsWith('BLAZ')
      ? receipt.entryNumber
      : receipt?.entryNumber
        ? `BLAZ${receipt.entryNumber.replace(/\D/g, '').padEnd(12, '896331324224').substring(0, 12)}`
        : 'BLAZ896331324224'
  );

  // Sender name (All caps, e.g. ABDLA.SHAHEER)
  const senderName = (
    meta.senderName ||
    receipt?.lines?.find((l) => l.direction === 'DEBIT')?.accountName ||
    'ABDLA.SHAHEER'
  ).toUpperCase();

  // Recipient name and account number (e.g. ALI SHAVIN / 7730000852744)
  const recipientName = (
    meta.beneficiaryName ||
    meta.recipientName ||
    'ALI SHAVIN'
  ).toUpperCase();

  const recipientAccount = (
    meta.beneficiaryAccountNumber ||
    meta.recipientAccount ||
    '7730000852744'
  );

  // Amount & Currency
  const currency = (
    meta.targetCurrency ||
    meta.sourceCurrency ||
    receipt?.lines?.[0]?.currency ||
    'MVR'
  ).toUpperCase();

  const minorUnits =
    meta.targetAmountMinorUnits ??
    meta.sourceAmountMinorUnits ??
    receipt?.lines?.[0]?.amountMinorUnits ??
    50000;

  const majorAmount = (minorUnits / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const formattedAmountWithCurrency = `${currency} ${majorAmount}`;

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // PDF download handler
  const handleDownloadPdf = () => {
    if (receipt) {
      generateTransactionReceiptPDF(receipt);
    }
  };

  // Image download handler (retina capture matching screenshot)
  const handleDownloadImage = async () => {
    if (!receiptCardRef.current) return;
    setIsCapturingImage(true);
    try {
      const canvas = await html2canvas(receiptCardRef.current, {
        scale: 3, // Crisp high-res capture
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      link.download = `BML_Receipt_${reference}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to save receipt image:', err);
    } finally {
      setIsCapturingImage(false);
    }
  };

  // Copy reference code
  const handleCopyReference = () => {
    navigator.clipboard.writeText(reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Container */}
      <div className="relative w-full max-w-[420px] z-10 my-4 sm:my-6 flex flex-col items-center">
        {/* Top Control Bar with Actions */}
        <div className="w-full flex items-center justify-between gap-2 mb-3 px-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-200 tracking-wide font-mono">
              Bank of Maldives
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDownloadPdf}
              title="Download Official PDF Receipt"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all shadow-md active:scale-95 border border-slate-700/80"
            >
              <FileDown className="w-4 h-4 text-rose-400" />
            </button>
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isCapturingImage}
              title="Save Receipt Image (PNG)"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all shadow-md active:scale-95 border border-slate-700/80 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              type="button"
              onClick={handlePrint}
              title="Print Receipt"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all shadow-md active:scale-95 border border-slate-700/80"
            >
              <Printer className="w-4 h-4 text-sky-400" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Receipt"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 border border-slate-700/80 ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Exact Mobile Receipt Card */}
        {isLoading ? (
          <div className="w-full bg-white rounded-2xl p-12 flex flex-col items-center justify-center gap-3 shadow-2xl">
            <div className="w-10 h-10 border-3 border-[#ED1C24] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-mono">
              Loading official Bank of Maldives receipt...
            </p>
          </div>
        ) : (
          <div
            id="bml-official-receipt"
            ref={receiptCardRef}
            className="w-full bg-[#f4f5f8] rounded-2xl shadow-2xl overflow-hidden font-sans border border-gray-200/80"
          >
            {/* White Body of the Receipt */}
            <div className="bg-white pt-8 sm:pt-9 px-6 sm:px-8 pb-4">
              {/* Bank of Maldives Red Square Sailboat Logo */}
              <div className="flex justify-center">
                <div className="w-[52px] h-[52px] bg-[#ED1C24] rounded-[10px] flex items-center justify-center shadow-sm">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-9 h-9 text-white fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Main Sail (Tall triangular sail with slight right rake and curved back) */}
                    <path
                      d="M52 14 L52 64 C43 62 33 60 27 63 C34 47 43 28 52 14 Z"
                      fill="#ffffff"
                    />
                    {/* Boat Hull */}
                    <path
                      d="M23 70 C35 70 65 70 78 70 L72 76 C48 76 30 76 27 76 Z"
                      fill="#ffffff"
                    />
                    {/* 3 Wave Ripple Lines underneath the hull */}
                    <path
                      d="M24 80 C36 80 62 80 75 80 C73 82 71 83 69 83 C47 83 31 83 29 83 Z"
                      fill="#ffffff"
                    />
                    <path
                      d="M27 86 C38 86 60 86 67 86 C65 88 63 89 61 89 C45 89 33 89 31 89 Z"
                      fill="#ffffff"
                    />
                    <path
                      d="M32 92 C41 92 56 92 61 92 C59 94 57 95 55 95 C43 95 36 95 34 95 Z"
                      fill="#ffffff"
                    />
                  </svg>
                </div>
              </div>

              {/* Success Message Header */}
              <h2 className="mt-4 text-center font-medium text-[#1a1a1a] text-[15px] sm:text-base leading-snug">
                Thank you. Transfer transaction is successful.
              </h2>

              {/* Big Amount with Subtle Wave Background */}
              <div className="mt-6 relative flex flex-col items-center justify-center py-3 overflow-hidden">
                {/* Subtle horizontal wavy lines (Maldivian ocean current pattern) */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none opacity-45"
                  viewBox="0 0 320 80"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0 16 Q 40 6, 80 16 T 160 16 T 240 16 T 320 16"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M 0 30 Q 40 20, 80 30 T 160 30 T 240 30 T 320 30"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M 0 44 Q 40 34, 80 44 T 160 44 T 240 44 T 320 44"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M 0 58 Q 40 48, 80 58 T 160 58 T 240 58 T 320 58"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M 0 72 Q 40 62, 80 72 T 160 72 T 240 72 T 320 72"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.2"
                  />
                </svg>

                {/* Amount in deep bold navy */}
                <div className="relative z-10 text-center">
                  <span className="text-[40px] sm:text-[44px] font-bold text-[#15233e] tracking-tight leading-none block">
                    {majorAmount}
                  </span>
                  <span className="mt-1 text-[#718096] font-medium text-sm sm:text-base tracking-wider uppercase block">
                    {currency}
                  </span>
                </div>
              </div>

              {/* Key-Value Details Rows */}
              <div className="mt-4 border-t border-gray-100">
                {/* Row 1: Status */}
                <div className="py-3 flex items-center justify-between border-b border-gray-100/90 text-sm">
                  <span className="text-[#555a64] font-normal">Status</span>
                  <span className="font-bold text-[#7cb342] tracking-wider text-sm uppercase">
                    SUCCESS
                  </span>
                </div>

                {/* Row 2: Message */}
                <div className="py-3 flex items-center justify-between border-b border-gray-100/90 text-sm">
                  <span className="text-[#555a64] font-normal self-start pt-0.5">
                    Message
                  </span>
                  <span className="text-right text-[#555a64] font-normal leading-snug max-w-[210px] sm:max-w-[230px]">
                    Thank you. Transfer transaction is successful.
                  </span>
                </div>

                {/* Row 3: Reference */}
                <div className="py-3 flex items-center justify-between border-b border-gray-100/90 text-sm">
                  <span className="text-[#555a64] font-normal">Reference</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#2b3545] font-normal tracking-wide">
                      {reference}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyReference}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy Reference"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Row 4: Transaction date */}
                <div className="py-3 flex items-center justify-between border-b border-gray-100/90 text-sm">
                  <span className="text-[#555a64] font-normal">
                    Transaction date
                  </span>
                  <span className="text-[#2b3545] font-normal">
                    {formattedDate}
                  </span>
                </div>

                {/* Row 5: From */}
                <div className="py-3 flex items-center justify-between border-b border-gray-100/90 text-sm">
                  <span className="text-[#555a64] font-normal">From</span>
                  <span className="text-[#2b3545] font-normal uppercase tracking-wide">
                    {senderName}
                  </span>
                </div>

                {/* Row 6: To */}
                <div className="py-3 flex items-center justify-between border-b border-gray-100/90 text-sm">
                  <span className="text-[#555a64] font-normal self-start pt-0.5">
                    To
                  </span>
                  <div className="text-right">
                    <div className="text-[#2b3545] font-normal uppercase tracking-wide">
                      {recipientName}
                    </div>
                    <div className="text-[#64748b] text-[13px] sm:text-sm font-normal mt-0.5">
                      {recipientAccount}
                    </div>
                  </div>
                </div>

                {/* Row 7: Amount */}
                <div className="py-3 flex items-center justify-between border-b border-gray-100/90 text-sm">
                  <span className="text-[#555a64] font-normal">Amount</span>
                  <span className="text-[#7cb342] font-bold text-sm sm:text-base">
                    {formattedAmountWithCurrency}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Scalloped Cutout / Tear Border Effect */}
            <div className="relative w-full bg-[#f4f5f8] overflow-hidden leading-none select-none -mt-px">
              <svg
                viewBox="0 0 360 14"
                className="w-full h-3.5 text-white fill-current block"
                preserveAspectRatio="none"
              >
                <path
                  d="M 0 0 
                     L 0 3
                     L 9 12 L 18 3
                     L 27 12 L 36 3
                     L 45 12 L 54 3
                     L 63 12 L 72 3
                     L 81 12 L 90 3
                     L 99 12 L 108 3
                     L 117 12 L 126 3
                     L 135 12 L 144 3
                     L 153 12 L 162 3
                     L 171 12 L 180 3
                     L 189 12 L 198 3
                     L 207 12 L 216 3
                     L 225 12 L 234 3
                     L 243 12 L 252 3
                     L 261 12 L 270 3
                     L 279 12 L 288 3
                     L 297 12 L 306 3
                     L 315 12 L 324 3
                     L 333 12 L 342 3
                     L 351 12 L 360 3
                     L 360 0 Z"
                />
              </svg>

              {/* Bottom Brand Label */}
              <div className="py-5 text-center">
                <span className="text-xs sm:text-sm font-medium text-[#8f9cae] tracking-wide font-sans">
                  Bank of Maldives
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Floating Action Buttons */}
        <div className="w-full mt-4 flex items-center justify-between gap-3 px-1 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs sm:text-sm transition-all shadow-md active:scale-95 border border-slate-700/80 text-center"
          >
            Done
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#ED1C24] hover:bg-[#c8161d] text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-red-900/30 active:scale-95 flex items-center justify-center gap-1.5"
          >
            <FileDown className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
