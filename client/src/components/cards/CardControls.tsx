import React, { useState } from 'react';
import { VirtualCardDTO } from '@shared/types/account.types';
import { Button } from '../common/Button';
import { CopyButton } from '../common/CopyButton';
import { cardsApi } from '../../api/cards.api';
import { useToast } from '../../context/ToastContext';
import { Snowflake, Flame, Eye, EyeOff, Sliders, ShieldAlert } from 'lucide-react';
import { formatMinorUnits } from '@shared/constants/currencies';

interface CardControlsProps {
  card: VirtualCardDTO;
  onCardUpdated: (updated: VirtualCardDTO) => void;
  onOpenPosSimulator: () => void;
}

export const CardControls: React.FC<CardControlsProps> = ({
  card,
  onCardUpdated,
  onOpenPosSimulator
}) => {
  const { success, error } = useToast();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingLimit, setIsUpdatingLimit] = useState(false);
  const [isRevealingPan, setIsRevealingPan] = useState(false);
  const [revealedPan, setRevealedPan] = useState<string | null>(null);
  const [revealedCvv, setRevealedCvv] = useState<string | null>(null);
  const [limitMajorUnits, setLimitMajorUnits] = useState(card.spendingLimitMonthlyMinorUnits / 100);
  const [isEditingLimit, setIsEditingLimit] = useState(false);

  const isFrozen = card.status === 'FROZEN';

  const handleToggleFreeze = async () => {
    setIsUpdatingStatus(true);
    try {
      const nextStatus = isFrozen ? 'ACTIVE' : 'FROZEN';
      const { card: updated } = await cardsApi.updateCardStatus(card.id, nextStatus);
      onCardUpdated(updated);
      success(
        nextStatus === 'FROZEN' ? 'Card Frozen' : 'Card Unfrozen',
        nextStatus === 'FROZEN'
          ? 'Card is locked. Any POS charges will be declined.'
          : 'Card is active and ready for POS transactions.'
      );
    } catch (err: any) {
      error('Failed to change card status', err.response?.data?.error?.message || err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRevealToggle = async () => {
    if (revealedPan) {
      setRevealedPan(null);
      setRevealedCvv(null);
      return;
    }

    setIsRevealingPan(true);
    try {
      const data = await cardsApi.revealPan(card.id);
      setRevealedPan(data.fullPan);
      setRevealedCvv(data.cvv);
      success('Card Details Revealed', 'Masked fields are now visible for testing.');
    } catch (err: any) {
      error('Failed to reveal PAN', err.response?.data?.error?.message || err.message);
    } finally {
      setIsRevealingPan(false);
    }
  };

  const handleSaveLimit = async () => {
    setIsUpdatingLimit(true);
    try {
      const minorUnits = Math.round(Number(limitMajorUnits) * 100);
      const { card: updated } = await cardsApi.updateCardLimits(card.id, minorUnits);
      onCardUpdated(updated);
      setIsEditingLimit(false);
      success('Spending Limit Updated', `Monthly limit set to $${limitMajorUnits.toFixed(2)}`);
    } catch (err: any) {
      error('Failed to update limit', err.response?.data?.error?.message || err.message);
    } finally {
      setIsUpdatingLimit(false);
    }
  };

  const percentSpent = Math.min(
    100,
    Math.round((card.spentCurrentMonthMinorUnits / card.spendingLimitMonthlyMinorUnits) * 100)
  );

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-base">Virtual Card Controls</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {card.brand} •••• {card.lastFour}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenPosSimulator}
          className="text-xs font-mono font-bold"
        >
          Open POS Terminal 💳
        </Button>
      </div>

      {/* Primary Control Toggles */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant={isFrozen ? 'primary' : 'secondary'}
          size="sm"
          onClick={handleToggleFreeze}
          isLoading={isUpdatingStatus}
          leftIcon={isFrozen ? <Flame className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <Snowflake className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />}
        >
          {isFrozen ? 'Unfreeze Card' : 'Freeze Card'}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleRevealToggle}
          isLoading={isRevealingPan}
          leftIcon={revealedPan ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
        >
          {revealedPan ? 'Hide Details' : 'Reveal Full PAN'}
        </Button>
      </div>

      {revealedPan && (
        <div className="p-3 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 space-y-2 animate-scale-up">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Card Number:</span>
            <CopyButton textToCopy={revealedPan} label="Copy PAN" />
          </div>
          <p className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">{revealedPan}</p>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">CVV:</span>
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{revealedCvv}</span>
          </div>
        </div>
      )}

      {/* Monthly Spending Limit Progress & Slider */}
      <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            Monthly Spend Limit
          </span>
          <button
            onClick={() => setIsEditingLimit(!isEditingLimit)}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 text-xs font-mono underline cursor-pointer"
          >
            {isEditingLimit ? 'Cancel' : 'Edit Limit'}
          </button>
        </div>

        {isEditingLimit ? (
          <div className="space-y-3 p-3 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
              <span>Adjust Limit:</span>
              <span className="font-bold text-slate-900 dark:text-white">${limitMajorUnits.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="50"
              max="5000"
              step="50"
              value={limitMajorUnits}
              onChange={(e) => setLimitMajorUnits(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setIsEditingLimit(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleSaveLimit} isLoading={isUpdatingLimit}>
                Save Limit
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1.5 text-slate-500 dark:text-slate-400">
              <span>Spent: {formatMinorUnits(card.spentCurrentMonthMinorUnits, 'USD')}</span>
              <span>Limit: {formatMinorUnits(card.spendingLimitMonthlyMinorUnits, 'USD')}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  percentSpent > 90 ? 'bg-rose-500' : percentSpent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${percentSpent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
