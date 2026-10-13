import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { VirtualCardDTO } from '@shared/types/account.types';
import { cardsApi, SimulateChargeResult } from '../../api/cards.api';
import { useToast } from '../../context/ToastContext';
import { formatMinorUnits } from '@shared/constants/currencies';
import { CreditCard, ShoppingBag, CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react';

interface PosSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: VirtualCardDTO | null;
  onChargeCompleted: () => void;
}

const PRESET_MERCHANTS = [
  { name: 'Mock AWS Cloud Services', amount: 35.0 },
  { name: 'Simulated Starbucks Coffee', amount: 7.25 },
  { name: 'Mock GitHub Pro Subscription', amount: 20.0 },
  { name: 'Simulated Apple Store Online', amount: 149.0 },
  { name: 'Mock Uber Ride', amount: 18.5 }
];

export const PosSimulatorModal: React.FC<PosSimulatorModalProps> = ({
  isOpen,
  onClose,
  card,
  onChargeCompleted
}) => {
  const { success, error } = useToast();
  const [merchantName, setMerchantName] = useState('Mock AWS Cloud Services');
  const [amountDollars, setAmountDollars] = useState('35.00');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<SimulateChargeResult | null>(null);
  const [declineReason, setDeclineReason] = useState<string | null>(null);

  if (!card) return null;

  const handlePresetSelect = (preset: { name: string; amount: number }) => {
    setMerchantName(preset.name);
    setAmountDollars(preset.amount.toFixed(2));
    setLastResult(null);
    setDeclineReason(null);
  };

  const handleExecuteCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setLastResult(null);
    setDeclineReason(null);

    const amountMinorUnits = Math.round(parseFloat(amountDollars) * 100);
    if (isNaN(amountMinorUnits) || amountMinorUnits <= 0) {
      error('Invalid Amount', 'Please enter a valid dollar amount greater than 0.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await cardsApi.simulatePosCharge(card.id, {
        merchantName,
        amountMinorUnits
      });
      setLastResult(res);
      success('POS Authorization Approved! 💳', `${merchantName} charged ${formatMinorUnits(res.amountMinorUnits, 'USD')}`);
      onChargeCompleted();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Authorization declined';
      setDeclineReason(msg);
      error('POS Authorization Declined ❌', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title="Point of Sale (POS) Merchant Terminal Simulator"
      subtitle="Simulate real-time retail debit card authorizations against your virtual card."
    >
      <div className="space-y-6">
        {/* Terminal Header Info */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100/90 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-slate-900 dark:text-white font-bold">
              Target Card: {card.brand} •••• {card.lastFour}
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded font-bold ${
              card.status === 'FROZEN'
                ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {card.status}
          </span>
        </div>

        {/* Preset Merchant Chips */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Quick Merchant Presets:
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_MERCHANTS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handlePresetSelect(p)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-mono transition-all ${
                  merchantName === p.name
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300 font-bold'
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                {p.name} (${p.amount.toFixed(2)})
              </button>
            ))}
          </div>
        </div>

        {/* POS Charge Form */}
        <form onSubmit={handleExecuteCharge} className="space-y-4">
          <Input
            label="Merchant Name / Terminal ID"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
            required
            leftIcon={<ShoppingBag className="w-4 h-4" />}
          />

          <Input
            label="Charge Amount (USD)"
            type="number"
            step="0.01"
            min="0.01"
            value={amountDollars}
            onChange={(e) => setAmountDollars(e.target.value)}
            required
            leftIcon={<span className="font-mono text-slate-400 font-bold">$</span>}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3"
            isLoading={isProcessing}
            leftIcon={<CreditCard className="w-4 h-4" />}
          >
            Authorize Merchant Charge
          </Button>
        </form>

        {/* Result Terminal Display */}
        {lastResult && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2 animate-scale-up">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>TRANSACTION APPROVED (Code: 00)</span>
            </div>
            <div className="text-xs font-mono text-slate-300 space-y-1 pt-1">
              <p>Entry Ref: {lastResult.entryNumber}</p>
              <p>Merchant: {lastResult.merchantName}</p>
              <p>Amount Debited: {formatMinorUnits(lastResult.amountMinorUnits, 'USD')}</p>
              <p>Remaining Monthly Limit: {lastResult.remainingLimitFormatted}</p>
            </div>
          </div>
        )}

        {declineReason && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-1 animate-scale-up">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertOctagon className="w-5 h-5" />
              <span>TRANSACTION DECLINED (Code: 51)</span>
            </div>
            <p className="text-xs font-mono text-rose-200">{declineReason}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
