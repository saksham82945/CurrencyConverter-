import React, { useState } from 'react';
import { AccountDTO } from '@shared/types/account.types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { transfersApi, TransferResult } from '../../api/transfers.api';
import { useToast } from '../../context/ToastContext';
import { formatMinorUnits, parseToMinorUnits } from '@shared/constants/currencies';
import { Send, UserCheck, ShieldCheck, Lock, User } from 'lucide-react';

interface P2PTransferFormProps {
  accounts: AccountDTO[];
  onTransferSuccess: (result: TransferResult) => void;
}

export const P2PTransferForm: React.FC<P2PTransferFormProps> = ({
  accounts,
  onTransferSuccess
}) => {
  const { success, error } = useToast();
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id || '');
  const [recipientIdentifier, setRecipientIdentifier] = useState('7730000852744');
  const [recipientName, setRecipientName] = useState('ALI SHAVIN');
  const [amountInput, setAmountInput] = useState('500.00');
  const [description, setDescription] = useState('Transfer to ALI SHAVIN');
  const [simulatedPin, setSimulatedPin] = useState('1234');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === sourceAccountId) || accounts[0];

  React.useEffect(() => {
    if (accounts.length > 0) {
      if (!sourceAccountId || !accounts.some((a) => a.id === sourceAccountId)) {
        setSourceAccountId(accounts[0].id);
      }
    }
  }, [accounts, sourceAccountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
      error('No Account Selected', 'Please select a funding account.');
      return;
    }

    const amountMinorUnits = parseToMinorUnits(amountInput, selectedAccount.currency);
    if (amountMinorUnits <= 0) {
      error('Invalid Amount', 'Transfer amount must be greater than zero.');
      return;
    }

    if (amountMinorUnits > selectedAccount.balanceMinorUnits) {
      error(
        'Insufficient Funds',
        `Available balance is ${selectedAccount.balanceFormatted}, requested ${formatMinorUnits(
          amountMinorUnits,
          selectedAccount.currency
        )}.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await transfersApi.transferInternal({
        sourceAccountId: selectedAccount.id,
        recipientIdentifier,
        recipientName: recipientName.trim() || undefined,
        amountMinorUnits,
        description: description || `Transfer to ${recipientName.trim() || recipientIdentifier}`,
        simulatedPin
      });

      success(
        'Transfer Complete! 💸',
        `Sent ${formatMinorUnits(amountMinorUnits, selectedAccount.currency)} to ${recipientName.trim() || recipientIdentifier}`
      );
      onTransferSuccess(result);
    } catch (err: any) {
      error(
        'Transfer Failed',
        err.response?.data?.error?.message || err.message || 'Unable to execute transfer'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 space-y-5">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Send className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          Internal Peer-to-Peer (BML) Transfer
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Send funds instantly to any Bank of Maldives account holder or normal receipt account number (10-13 digits) or email.
        </p>
      </div>

      {/* Source Account Selection */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
          From Account
        </label>
        <select
          value={sourceAccountId}
          onChange={(e) => setSourceAccountId(e.target.value)}
          className="w-full glass-input rounded-xl text-sm py-2.5 px-3 font-mono cursor-pointer"
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
              {acc.nickname || `${acc.currency} Checking`} ({acc.accountNumber}) — Available: {acc.balanceFormatted}
            </option>
          ))}
        </select>
      </div>

      {/* Recipient Account Number */}
      <div>
        <Input
          label="Recipient Account Number or Email"
          placeholder="e.g. 7730000852744 (any receipt account number or email)"
          value={recipientIdentifier}
          onChange={(e) => setRecipientIdentifier(e.target.value)}
          required
          leftIcon={<UserCheck className="w-4 h-4 text-emerald-500" />}
          helperText="Accepts any Bank of Maldives receipt account number (10-13 digits) or registered email"
        />

        {/* Quick Recipient Presets */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[11px] text-slate-400 font-mono">Quick Select:</span>
          <button
            type="button"
            onClick={() => {
              setRecipientIdentifier('7730000852744');
              setRecipientName('ALI SHAVIN');
              setDescription('Transfer to ALI SHAVIN');
              if (!amountInput) setAmountInput('500.00');
            }}
            className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all active:scale-95 flex items-center gap-1"
          >
            <span>🇲🇻 ALI SHAVIN (7730000852744)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRecipientIdentifier('bob@bankofmaldives.com.mv');
              setRecipientName('Bob Smith');
              setDescription('Transfer to Bob Smith');
            }}
            className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
          >
            Bob Smith
          </button>
          <button
            type="button"
            onClick={() => {
              setRecipientIdentifier('alice@bankofmaldives.com.mv');
              setRecipientName('Alice Johnson');
              setDescription('Transfer to Alice Johnson');
            }}
            className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
          >
            Alice Johnson
          </button>
        </div>
      </div>

      {/* Recipient Name */}
      <div>
        <Input
          label="Recipient / Account Holder Name (Optional)"
          placeholder="e.g. ALI SHAVIN"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          leftIcon={<User className="w-4 h-4 text-emerald-500" />}
          helperText="Name displayed on the official Bank of Maldives transaction receipt slip"
        />
      </div>

      {/* Amount Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Amount ({selectedAccount?.currency || 'MVR'})
          </label>
          <div className="flex items-center gap-1">
            {['50.00', '100.00', '500.00', '1000.00'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmountInput(preset)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all ${
                  amountInput === preset
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {preset === '500.00' ? '★ 500' : preset.replace('.00', '')}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-3 text-slate-400 font-mono font-bold text-sm">
            {selectedAccount?.currency === 'MVR' ? 'Rf' : selectedAccount?.currency === 'EUR' ? '€' : selectedAccount?.currency === 'GBP' ? '£' : '$'}
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="500.00"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            required
            className="w-full glass-input rounded-xl text-sm py-2.5 pl-9 pr-3.5 font-mono text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Description / Memo */}
      <Input
        label="Description / Memo (Optional)"
        placeholder="What is this transfer for?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* Simulated PIN */}
      <Input
        label="Simulated Transaction PIN"
        type="password"
        maxLength={4}
        placeholder="1234"
        value={simulatedPin}
        onChange={(e) => setSimulatedPin(e.target.value)}
        leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
        helperText="Default demo PIN is 1234"
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full py-3 mt-2"
        isLoading={isSubmitting}
        leftIcon={<Send className="w-4 h-4" />}
      >
        Send Transfer Now
      </Button>
    </form>
  );
};
