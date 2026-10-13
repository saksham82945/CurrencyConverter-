import React, { useState, useEffect } from 'react';
import { AccountDTO } from '@shared/types/account.types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { transfersApi, TransferResult } from '../../api/transfers.api';
import { directoryApi, InstitutionItem } from '../../api/directory.api';
import { useToast } from '../../context/ToastContext';
import { parseToMinorUnits, formatMinorUnits } from '@shared/constants/currencies';
import { Building2, Globe, Lock, ShieldAlert, ArrowUpRight } from 'lucide-react';

interface ExternalTransferFormProps {
  accounts: AccountDTO[];
  onTransferSuccess: (result: TransferResult) => void;
}

export const ExternalTransferForm: React.FC<ExternalTransferFormProps> = ({
  accounts,
  onTransferSuccess
}) => {
  const { success, error } = useToast();
  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id || '');
  const [selectedInstRouting, setSelectedInstRouting] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryAccountNumber, setBeneficiaryAccountNumber] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [rail, setRail] = useState<'ACH' | 'WIRE' | 'SEPA' | 'FASTER_PAYMENTS'>('WIRE');
  const [description, setDescription] = useState('');
  const [simulatedPin, setSimulatedPin] = useState('1234');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom New Bank State
  const [isAddingNewBank, setIsAddingNewBank] = useState(false);
  const [customBankName, setCustomBankName] = useState('');
  const [customRoutingNumber, setCustomRoutingNumber] = useState('');
  const [customRail, setCustomRail] = useState<'ACH' | 'WIRE' | 'SEPA' | 'FASTER_PAYMENTS'>('WIRE');

  useEffect(() => {
    directoryApi.searchInstitutions().then((res) => {
      setInstitutions(res.institutions);
      if (res.institutions[0]) {
        setSelectedInstRouting(res.institutions[0].routingNumber);
        setRail(res.institutions[0].supportedRail as any);
      }
    });
  }, []);

  useEffect(() => {
    if (accounts.length > 0 && (!sourceAccountId || !accounts.some((a) => a.id === sourceAccountId))) {
      setSourceAccountId(accounts[0].id);
    }
  }, [accounts, sourceAccountId]);

  const selectedAccount = accounts.find((a) => a.id === sourceAccountId) || accounts[0];
  const selectedInstitution = institutions.find((i) => i.routingNumber === selectedInstRouting);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
      error('No Account Selected', 'Please select a source account.');
      return;
    }

    const amountMinorUnits = parseToMinorUnits(amountInput, selectedAccount.currency);
    if (amountMinorUnits <= 0) {
      error('Invalid Amount', 'Transfer amount must be greater than zero.');
      return;
    }

    if (amountMinorUnits > selectedAccount.balanceMinorUnits) {
      error(
        'Insufficient Balance',
        `Available: ${selectedAccount.balanceFormatted}, requested: ${formatMinorUnits(
          amountMinorUnits,
          selectedAccount.currency
        )}.`
      );
      return;
    }

    const effectiveBankName = isAddingNewBank ? (customBankName.trim() || 'Custom Bank') : (selectedInstitution?.name || 'Bank');
    const effectiveRouting = isAddingNewBank ? (customRoutingNumber.trim() || '01004012494') : selectedInstRouting;
    const effectiveRail = isAddingNewBank ? customRail : rail;

    setIsSubmitting(true);
    try {
      const result = await transfersApi.transferExternal({
        sourceAccountId: selectedAccount.id,
        institutionRoutingOrBic: effectiveRouting,
        institutionName: effectiveBankName,
        beneficiaryName,
        beneficiaryAccountNumber,
        amountMinorUnits,
        rail: effectiveRail,
        description: description || `Wire to ${beneficiaryName}`,
        simulatedPin
      });

      // Auto-save custom bank in background
      if (isAddingNewBank && customBankName.trim()) {
        directoryApi.createInstitution({
          name: customBankName.trim(),
          routingNumber: effectiveRouting,
          supportedRail: effectiveRail
        }).catch(() => {});
      }

      success(
        'Wire Transfer Successful! 🏛️',
        `Transferred ${formatMinorUnits(amountMinorUnits, selectedAccount.currency)} to ${beneficiaryName} at ${
          effectiveBankName
        }`
      );
      setAmountInput('');
      setBeneficiaryAccountNumber('');
      setBeneficiaryName('');
      setDescription('');
      onTransferSuccess(result);
    } catch (err: any) {
      error(
        'Transfer Failed',
        err.response?.data?.error?.message || err.message || 'Unable to execute external transfer'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 space-y-5">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          Outbound Wire & Clearinghouse Transfer
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Route institutional outbound wires directly to verified global correspondent banks via FedWire, SEPA Instant, CHAPS or Faster Payments.
        </p>
      </div>

      {/* Source Account */}
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
              {acc.nickname || `${acc.currency} Checking`} ({acc.accountNumber}) — Balance: {acc.balanceFormatted}
            </option>
          ))}
        </select>
      </div>

      {/* Target Bank */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Bank Name
          </label>
          <button
            type="button"
            onClick={() => setIsAddingNewBank(!isAddingNewBank)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            {isAddingNewBank ? '← Select Existing Bank' : '+ Add New Bank'}
          </button>
        </div>

        {!isAddingNewBank ? (
          <>
            <select
              value={selectedInstRouting}
              onChange={(e) => {
                if (e.target.value === '__ADD_NEW__') {
                  setIsAddingNewBank(true);
                  return;
                }
                setSelectedInstRouting(e.target.value);
                const found = institutions.find((i) => i.routingNumber === e.target.value);
                if (found && ['ACH', 'WIRE', 'SEPA', 'FASTER_PAYMENTS'].includes(found.supportedRail)) {
                  setRail(found.supportedRail as any);
                }
              }}
              className="w-full glass-input rounded-xl text-sm py-2.5 px-3 font-mono cursor-pointer"
            >
              {institutions.map((inst) => (
                <option key={inst.routingNumber} value={inst.routingNumber} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                  {inst.name} ({inst.country}) — Routing: {inst.routingNumber} [{inst.supportedRail}]
                </option>
              ))}
              <option value="__ADD_NEW__" className="bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                + Add New Bank / Custom Bank...
              </option>
            </select>
            {selectedInstitution && (
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                SWIFT / BIC: <span className="text-indigo-600 dark:text-indigo-300 font-bold">{selectedInstitution.bicSwift}</span> • Country: {selectedInstitution.country}
              </p>
            )}
          </>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-100/90 dark:bg-slate-950/80 border border-indigo-500/40 space-y-3">
            <Input
              label="Bank Name"
              placeholder="e.g. Vodafone Cash, Chase, Barclays..."
              value={customBankName}
              onChange={(e) => setCustomBankName(e.target.value)}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Routing Number / SWIFT / Branch Code"
                placeholder="e.g. 01004012494 or VODAEG22"
                value={customRoutingNumber}
                onChange={(e) => setCustomRoutingNumber(e.target.value)}
                required
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Clearing Rail
                </label>
                <select
                  value={customRail}
                  onChange={(e) => setCustomRail(e.target.value as any)}
                  className="w-full glass-input rounded-xl text-sm py-2 px-3 font-mono cursor-pointer"
                >
                  <option value="WIRE" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">WIRE / SWIFT</option>
                  <option value="SEPA" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">SEPA (Europe)</option>
                  <option value="ACH" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">ACH (USA)</option>
                  <option value="FASTER_PAYMENTS" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Faster Payments (UK)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Beneficiary Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Beneficiary Full Name / Company"
          placeholder="e.g. Acme Corporation"
          value={beneficiaryName}
          onChange={(e) => setBeneficiaryName(e.target.value)}
          required
        />
        <Input
          label="Recipient Bank Account Number / IBAN"
          placeholder="e.g. 9876543210"
          value={beneficiaryAccountNumber}
          onChange={(e) => setBeneficiaryAccountNumber(e.target.value)}
          required
        />
      </div>

      {/* Amount and Rail */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Amount ({selectedAccount?.currency})
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            required
            className="w-full glass-input rounded-xl text-sm py-2.5 px-3.5 font-mono text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Clearing Rail
          </label>
          <select
            value={rail}
            onChange={(e) => setRail(e.target.value as any)}
            className="w-full glass-input rounded-xl text-sm py-2.5 px-3 font-mono cursor-pointer"
          >
            <option value="WIRE" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">WIRE (Fedwire / Lynx)</option>
            <option value="ACH" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">ACH (Direct Deposit)</option>
            <option value="SEPA" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">SEPA Credit (Europe)</option>
            <option value="FASTER_PAYMENTS" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Faster Payments (UK)</option>
          </select>
        </div>
      </div>

      {/* Description & PIN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Wire Reference / Memo"
          placeholder="Invoice reference or personal transfer"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          label="Simulated PIN"
          type="password"
          maxLength={4}
          value={simulatedPin}
          onChange={(e) => setSimulatedPin(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
        />
      </div>

      {/* Clearinghouse Notice */}
      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <span>
          Outbound transfers settle through Bank of Maldives deterministic mock clearinghouse in sandbox mode. An immutable double-entry journal entry is stamped.
        </span>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full py-3"
        isLoading={isSubmitting}
        leftIcon={<ArrowUpRight className="w-4 h-4" />}
      >
        Initiate Outbound Wire
      </Button>
    </form>
  );
};
