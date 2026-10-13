import React, { useState, useEffect } from 'react';
import { cardsApi } from '../api/cards.api';
import { accountsApi } from '../api/accounts.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { VirtualCardVisual } from '../components/cards/VirtualCardVisual';
import { CardControls } from '../components/cards/CardControls';
import { PosSimulatorModal } from '../components/cards/PosSimulatorModal';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { VirtualCardDTO, AccountDTO } from '@shared/types/account.types';
import { CreditCard, Plus, ShieldCheck, Sparkles } from 'lucide-react';

export const CardsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [cards, setCards] = useState<VirtualCardDTO[]>([]);
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Issue card modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [cardholderName, setCardholderName] = useState(user?.fullName || '');
  const [brand, setBrand] = useState<'VISA' | 'MASTERCARD'>('VISA');
  const [monthlyLimitDollars, setMonthlyLimitDollars] = useState('1000.00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // POS Terminal Modal
  const [activePosCard, setActivePosCard] = useState<VirtualCardDTO | null>(null);
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cardsRes, accountsRes] = await Promise.allSettled([
        cardsApi.listCards(),
        accountsApi.listAccounts()
      ]);
      if (cardsRes.status === 'fulfilled') {
        setCards(cardsRes.value?.cards || []);
      }
      if (accountsRes.status === 'fulfilled') {
        const accs = accountsRes.value?.accounts || [];
        setAccounts(accs);
        if (accs[0]) {
          setSelectedAccountId(accs[0].id);
        }
      }
    } catch (err: any) {
      error('Failed to load card details', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (user?.fullName && !cardholderName) {
      setCardholderName(user.fullName);
    }
  }, [user]);

  const handleIssueCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) {
      error('No Funding Account', 'Please select an account to back this virtual card.');
      return;
    }

    const minorUnits = Math.round(parseFloat(monthlyLimitDollars) * 100);
    if (isNaN(minorUnits) || minorUnits <= 0) {
      error('Invalid Limit', 'Please specify a monthly spend limit greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { card } = await cardsApi.issueCard({
        accountId: selectedAccountId,
        cardholderName,
        brand,
        spendingLimitMonthlyMinorUnits: minorUnits
      });

      success('Virtual Card Issued! 💳', `${brand} •••• ${card.lastFour} is active and ready.`);
      setIsIssueModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Card Issuance Failed', err.response?.data?.error?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardUpdated = (updated: VirtualCardDTO) => {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleOpenPosTerminal = (card: VirtualCardDTO) => {
    setActivePosCard(card);
    setIsPosModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-emerald-500" />
            Virtual Debit Cards & POS Terminal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            Generate virtual Visa/Mastercard debit cards with EMV chip simulation and merchant POS authorizations
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsIssueModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Issue Virtual Card
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Loading virtual cards...</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto text-emerald-500">
            <CreditCard className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Virtual Cards Issued Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Issue an instant virtual debit card linked to your simulated currency account. Test merchant authorizations and freeze toggles in real-time.
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsIssueModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Issue Your First Card
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {cards.map((card) => (
            <div
              key={card.id}
              className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 flex flex-col justify-between"
            >
              <div className="flex justify-center py-2">
                <VirtualCardVisual card={card} />
              </div>

              <CardControls
                card={card}
                onCardUpdated={handleCardUpdated}
                onOpenPosSimulator={() => handleOpenPosTerminal(card)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal: Issue Virtual Card */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue New Virtual Debit Card"
        subtitle="Generates an encrypted 16-digit PAN, CVV, and expiration date linked to your account."
      >
        <form onSubmit={handleIssueCard} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Funding Source Account
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full glass-input rounded-xl text-sm py-2.5 px-3 font-mono cursor-pointer"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
                  {acc.nickname || `${acc.currency} Checking`} ({acc.currency}) — {acc.balanceFormatted}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Card Network Brand
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBrand('VISA')}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                  brand === 'VISA'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                VISA Virtual
              </button>
              <button
                type="button"
                onClick={() => setBrand('MASTERCARD')}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                  brand === 'MASTERCARD'
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                MASTERCARD Virtual
              </button>
            </div>
          </div>

          <Input
            label="Cardholder Full Name"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            required
          />

          <Input
            label="Monthly Spending Limit (USD)"
            type="number"
            step="50"
            min="50"
            value={monthlyLimitDollars}
            onChange={(e) => setMonthlyLimitDollars(e.target.value)}
            required
            leftIcon={<span className="font-mono text-slate-400 font-bold">$</span>}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 mt-2"
            isLoading={isSubmitting}
          >
            Generate & Issue Virtual Card
          </Button>
        </form>
      </Modal>

      {/* POS Simulator Modal */}
      <PosSimulatorModal
        isOpen={isPosModalOpen}
        onClose={() => setIsPosModalOpen(false)}
        card={activePosCard}
        onChargeCompleted={() => {
          fetchData();
        }}
      />
    </div>
  );
};
