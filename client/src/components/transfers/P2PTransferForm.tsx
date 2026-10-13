import React, { useState } from 'react';
import { AccountDTO } from '@shared/types/account.types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { transfersApi, TransferResult } from '../../api/transfers.api';
import { useToast } from '../../context/ToastContext';
import { formatMinorUnits, parseToMinorUnits } from '@shared/constants/currencies';
import { Send, UserCheck, ShieldCheck, Lock } from 'lucide-react';

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
  const [recipientIdentifier, setRecipientIdentifier] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
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
        amountMinorUnits,
        description: description || 'P2P Transfer',
        simulatedPin
      });

      success(
        'Transfer Complete! 💸',
        `Sent ${formatMinorUnits(amountMinorUnits, selectedAccount.currency)} to ${recipientIdentifier}`
      );
      setAmountInput('');
      setDescription('');
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
          Send funds instantly to any registered Bank of Maldives account holder via 10-digit account number or email.
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

      {/* Recipient Identifier */}
      <Input
        label="Recipient Account Number or Email"
        placeholder="e.g. 7701928341 or forextradingplatformfxe@gmail.com"
        value={recipientIdentifier}
        onChange={(e) => setRecipientIdentifier(e.target.value)}
        required
        leftIcon={<UserCheck className="w-4 h-4" />}
        helperText="Demo test recipient: 7701928341 or forextradingplatformfxe@gmail.com"
      />

      {/* Amount Input */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
          Amount ({selectedAccount?.currency})
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-3 text-slate-400 font-mono font-bold text-sm">
            {selectedAccount?.currency === 'EUR' ? '€' : selectedAccount?.currency === 'GBP' ? '£' : '$'}
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
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
