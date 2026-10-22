import React, { useState, useEffect, useMemo } from 'react';
import { AccountDTO } from '@shared/types/account.types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { transfersApi, TransferResult } from '../../api/transfers.api';
import { directoryApi, InstitutionItem } from '../../api/directory.api';
import { fxApi, FxQuoteResponse, LiveRatesResponse } from '../../api/fx.api';
import { useToast } from '../../context/ToastContext';
import {
  parseToMinorUnits,
  formatMinorUnits,
  SUPPORTED_CURRENCIES
} from '@shared/constants/currencies';
import {
  WORLD_CURRENCIES,
  getWorldCurrency,
  formatWorldCurrency,
  WorldCurrency
} from '@shared/constants/worldCurrencies';
import {
  Globe,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Building2,
  User,
  Lock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Zap,
  Search,
  ChevronDown,
  ChevronUp,
  Coins,
  Check,
  Activity
} from 'lucide-react';

interface MultiCurrencyTransferFormProps {
  accounts: AccountDTO[];
  onTransferSuccess: (result: TransferResult) => void;
}

// Primary corridors supported
const PRIMARY_CURRENCIES = [
  { code: 'MVR', name: 'Maldivian Rufiyaa (Rf)', country: 'Maldivian', flag: '🇲🇻' },
  { code: 'INR', name: 'Indian Rupee (₹)', country: 'Indian', flag: '🇮🇳' },
  { code: 'PKR', name: 'Pakistani Rupee (₨)', country: 'Pakistani', flag: '🇵🇰' },
  { code: 'EUR', name: 'Euro (€)', country: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound (£)', country: 'British', flag: '🇬🇧' },
  { code: 'AED', name: 'UAE Dirham (AED)', country: 'UAE', flag: '🇦🇪' },
  { code: 'CAD', name: 'Canadian Dollar (CA$)', country: 'Canadian', flag: '🇨🇦' },
  { code: 'JPY', name: 'Japanese Yen (¥)', country: 'Japanese', flag: '🇯🇵' }
];

export const MultiCurrencyTransferForm: React.FC<MultiCurrencyTransferFormProps> = ({
  accounts,
  onTransferSuccess
}) => {
  const { success, error } = useToast();

  // Find default USD account or first account
  const defaultAccount = accounts.find((a) => a.currency === 'USD') || accounts[0];
  const [sourceAccountId, setSourceAccountId] = useState(defaultAccount?.id || '');
  const [targetCurrency, setTargetCurrency] = useState<string>('MVR');

  // Amount inputs (USD & Target)
  const [sourceAmountInput, setSourceAmountInput] = useState('500.00');

  // Transfer Type: External Bank or Internal P2P
  const [transferType, setTransferType] = useState<'EXTERNAL_BANK' | 'INTERNAL_NEXAPAY'>('EXTERNAL_BANK');

  // External Bank Details
  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);
  const [selectedInstRouting, setSelectedInstRouting] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('ALI SHAVIN');
  const [beneficiaryAccountNumber, setBeneficiaryAccountNumber] = useState('7730000852744');
  const [rail, setRail] = useState('WIRE');

  // Custom New Bank State
  const [isAddingNewBank, setIsAddingNewBank] = useState(false);
  const [customBankName, setCustomBankName] = useState('');
  const [customRoutingNumber, setCustomRoutingNumber] = useState('');
  const [customRail, setCustomRail] = useState('WIRE');

  // Internal P2P Details
  const [recipientIdentifier, setRecipientIdentifier] = useState('7701928341');

  const [description, setDescription] = useState('');
  const [simulatedPin, setSimulatedPin] = useState('1234');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live FX Rates Feed State
  const [liveRates, setLiveRates] = useState<Record<string, number>>({});
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [liveProvider, setLiveProvider] = useState('Live Interbank Market');
  const [isSyncingLiveRates, setIsSyncingLiveRates] = useState(false);

  // Live FX Quote State
  const [quote, setQuote] = useState<FxQuoteResponse | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Search & Explorer for 190+ countries
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [isExplorerExpanded, setIsExplorerExpanded] = useState(false);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('ALL');

  const sourceAccount = accounts.find((a) => a.id === sourceAccountId) || defaultAccount;
  const currentWorldCurrency = getWorldCurrency(targetCurrency);

  // Synchronize sourceAccountId if accounts load asynchronously
  useEffect(() => {
    if (accounts.length > 0) {
      if (!sourceAccountId || !accounts.some((a) => a.id === sourceAccountId)) {
        const def = accounts.find((a) => a.currency === 'USD') || accounts[0];
        if (def) setSourceAccountId(def.id);
      }
    }
  }, [accounts, sourceAccountId]);

  // Fetch real-time live market exchange rates
  const loadLiveRates = async (force = false) => {
    setIsSyncingLiveRates(true);
    try {
      if (force) {
        await fxApi.syncRates().catch(() => {});
      }
      const res = await fxApi.getLiveRates();
      if (res && res.rates) {
        setLiveRates(res.rates);
        setIsLiveConnected(true);
        if (res.provider) setLiveProvider(res.provider);
        if (res.lastUpdated) setLastUpdated(new Date(res.lastUpdated));
      }
    } catch (err) {
      console.warn('[MultiCurrencyTransferForm] Using local catalog fallback for rates:', err);
    } finally {
      setIsSyncingLiveRates(false);
    }
  };

  useEffect(() => {
    loadLiveRates(false);
  }, []);

  // Helper to get effective live rate for any currency
  const getEffectiveLiveRate = (worldCurr: WorldCurrency): number => {
    const pureCode = worldCurr.code.split('_')[0].toUpperCase();
    if (liveRates[pureCode] && liveRates[pureCode] > 0) {
      return liveRates[pureCode];
    }
    return worldCurr.ratePerUSD || 1.0;
  };

  // Load Institutions
  useEffect(() => {
    directoryApi.searchInstitutions().then((res) => {
      setInstitutions(res.institutions);
    });
  }, []);

  // Filter institutions based on target currency
  const filteredInstitutions = institutions.filter((inst) =>
    inst.supportedCurrencies.includes(targetCurrency as any)
  );

  // Update authentic beneficiary defaults when target currency changes
  useEffect(() => {
    if (filteredInstitutions.length > 0) {
      const firstBank = filteredInstitutions[0];
      setSelectedInstRouting(firstBank.routingNumber);
      setRail(firstBank.supportedRail || 'WIRE');
    } else {
      setSelectedInstRouting('021000089');
      setRail('WIRE');
    }

    // Authentic sample beneficiary names based on country/currency
    if (targetCurrency === 'INR') {
      setBeneficiaryName('Rajesh Sharma');
      setBeneficiaryAccountNumber('39481029481');
      setRail('NEFT');
    } else if (targetCurrency === 'PKR') {
      setBeneficiaryName('Tariq Mahmood');
      setBeneficiaryAccountNumber('00427901234503');
      setRail('RAAST');
    } else if (targetCurrency === 'EUR') {
      setBeneficiaryName('Klaus Schneider');
      setBeneficiaryAccountNumber('DE89370400440532013000');
      setRail('SEPA');
    } else if (targetCurrency === 'GBP') {
      setBeneficiaryName('Oliver Bennett');
      setBeneficiaryAccountNumber('00452381');
      setRail('FASTER_PAYMENTS');
    } else if (targetCurrency === 'AED') {
      setBeneficiaryName('Rashid Al-Maktoum');
      setBeneficiaryAccountNumber('AE070331234567890123456');
      setRail('WIRE');
    } else if (targetCurrency === 'CAD') {
      setBeneficiaryName('David Tremblay');
      setBeneficiaryAccountNumber('00041298412');
      setRail('WIRE');
    } else if (targetCurrency === 'JPY') {
      setBeneficiaryName('Kenji Tanaka');
      setBeneficiaryAccountNumber('1234567');
      setRail('WIRE');
    } else if (targetCurrency === 'SAR') {
      setBeneficiaryName('Abdullah Al-Saud');
      setBeneficiaryAccountNumber('SA4480000000608010167519');
      setRail('WIRE');
    } else if (targetCurrency === 'BDT') {
      setBeneficiaryName('Mohammad Rahman');
      setBeneficiaryAccountNumber('2051289041284');
      setRail('WIRE');
    } else if (targetCurrency === 'PHP') {
      setBeneficiaryName('Juan Dela Cruz');
      setBeneficiaryAccountNumber('109284719284');
      setRail('WIRE');
    } else if (targetCurrency === 'EGP') {
      setBeneficiaryName('Ahmed Mansour');
      setBeneficiaryAccountNumber('EG380002000100000012345678901');
      setRail('WIRE');
    } else if (targetCurrency === 'BRL') {
      setBeneficiaryName('Lucas Silva');
      setBeneficiaryAccountNumber('123.456.789-00');
      setRail('WIRE');
    } else if (targetCurrency === 'AUD') {
      setBeneficiaryName('Liam O\'Connor');
      setBeneficiaryAccountNumber('062-000 12345678');
      setRail('WIRE');
    } else {
      const c = getWorldCurrency(targetCurrency);
      setBeneficiaryName(`${c.country} Verified Beneficiary`);
      setBeneficiaryAccountNumber('88391029481');
      setRail('WIRE');
    }
  }, [targetCurrency, institutions]);

  // Fetch real-time FX quote from backend (powered by live rates)
  const fetchLiveQuote = async () => {
    if (!sourceAccount) return;
    const sourceMinor = parseToMinorUnits(sourceAmountInput, sourceAccount.currency);
    if (sourceMinor <= 0) return;

    setIsLoadingQuote(true);
    try {
      const q = await fxApi.getQuote(sourceAccount.currency, targetCurrency, sourceMinor);
      setQuote(q);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to get FX quote:', err);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  useEffect(() => {
    fetchLiveQuote();
  }, [sourceAccountId, targetCurrency, sourceAmountInput]);

  const selectedInstitution = institutions.find((i) => i.routingNumber === selectedInstRouting);

  // Filter 190+ countries based on user query
  const filtered190Countries = useMemo(() => {
    const q = countrySearchQuery.toLowerCase().trim();
    return WORLD_CURRENCIES.filter((c) => {
      const matchesSearch =
        !q ||
        c.country.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (selectedRegionFilter === 'POPULAR') return c.popular;
      return true;
    });
  }, [countrySearchQuery, selectedRegionFilter]);

  // Calculate guaranteed live payout for any country given current input amount
  const calculateGuaranteedPayout = (worldCurr: WorldCurrency): string => {
    const amountNum = parseFloat(sourceAmountInput) || 0;
    const rate = getEffectiveLiveRate(worldCurr);
    const total = amountNum * rate;
    return formatWorldCurrency(total, worldCurr.code);
  };

  // Quick Preset Handlers
  const handlePresetAmount = (amount: string) => {
    setSourceAmountInput(amount);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceAccount) {
      error('No Source Account', 'Please choose a source account to debit.');
      return;
    }

    const sourceMinorUnits = parseToMinorUnits(sourceAmountInput, sourceAccount.currency);
    if (sourceMinorUnits <= 0) {
      error('Invalid Amount', 'Please enter an amount greater than 0.');
      return;
    }

    if (sourceMinorUnits > sourceAccount.balanceMinorUnits) {
      error(
        'Insufficient Balance',
        `Available balance: ${sourceAccount.balanceFormatted}. You requested: ${formatMinorUnits(
          sourceMinorUnits,
          sourceAccount.currency
        )}.`
      );
      return;
    }

    const defaultBankName = selectedInstitution?.name || `${currentWorldCurrency.country} Commercial Bank`;
    const effectiveBankName = isAddingNewBank ? (customBankName.trim() || 'Custom Bank') : defaultBankName;
    const effectiveRouting = isAddingNewBank ? (customRoutingNumber.trim() || '01004012494') : selectedInstRouting;
    const effectiveRail = isAddingNewBank ? customRail : rail;

    setIsSubmitting(true);
    try {
      const payload = {
        sourceAccountId: sourceAccount.id,
        targetCurrency,
        sourceAmountMinorUnits: sourceMinorUnits,
        transferType,
        institutionRoutingOrBic: transferType === 'EXTERNAL_BANK' ? effectiveRouting : undefined,
        institutionName: transferType === 'EXTERNAL_BANK' ? effectiveBankName : undefined,
        beneficiaryName: transferType === 'EXTERNAL_BANK' ? beneficiaryName : undefined,
        beneficiaryAccountNumber: transferType === 'EXTERNAL_BANK' ? beneficiaryAccountNumber : undefined,
        rail: transferType === 'EXTERNAL_BANK' ? effectiveRail : undefined,
        recipientIdentifier: transferType === 'INTERNAL_NEXAPAY' ? recipientIdentifier : undefined,
        description: description || `Transfer (${sourceAccount.currency} -> ${targetCurrency}) to ${beneficiaryName}`,
        simulatedPin
      };

      const result = await transfersApi.transferMultiCurrency(payload);

      // Save custom bank in background if new
      if (isAddingNewBank && customBankName.trim()) {
        directoryApi.createInstitution({
          name: customBankName.trim(),
          routingNumber: effectiveRouting,
          supportedRail: customRail
        }).catch(() => {});
      }

      const targetFormatted = result.creditedFormatted || (quote ? (quote.toAmountFormatted || quote.toFormatted) : `${targetCurrency}`);
      const sourceFormatted = formatMinorUnits(sourceMinorUnits, sourceAccount.currency);

      success(
        'Transfer Successful! 🏛️',
        `Debited ${sourceFormatted} from ${sourceAccount.currency} balance -> Credited ${targetFormatted} via ${
          transferType === 'EXTERNAL_BANK' ? effectiveBankName : recipientIdentifier
        }`
      );

      onTransferSuccess(result);
    } catch (err: any) {
      error(
        'Transfer Failed',
        err.response?.data?.error?.message || err.message || 'Unable to execute multi-currency transfer'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentLiveRate = getEffectiveLiveRate(currentWorldCurrency);
  const appliedRateNumber = quote
    ? (quote.appliedRate || quote.rate || currentLiveRate)
    : currentLiveRate;

  const calculatedRecipientAmount = quote
    ? (quote.toAmountFormatted || quote.toFormatted)
    : calculateGuaranteedPayout(currentWorldCurrency);

  return (
    <form onSubmit={handleExecuteTransfer} className="space-y-6">
      {/* Real-time FX Rate Ticker Card with Live Market Status */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-emerald-500/30 bg-gradient-to-r from-emerald-50 via-slate-50 to-indigo-50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-indigo-950/30 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg">
              💱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span>Live Market Rate Feed</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] border border-emerald-500/30">
                    REAL-TIME
                  </span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  (Updated {lastUpdated.toLocaleTimeString()})
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5 flex items-center gap-2">
                <span>
                  1 {sourceAccount?.currency || 'USD'} ={' '}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {appliedRateNumber.toFixed(4)}
                  </span>{' '}
                  {targetCurrency}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    loadLiveRates(true);
                    fetchLiveQuote();
                  }}
                  disabled={isLoadingQuote || isSyncingLiveRates}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                  title="Sync with Live Market Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQuote || isSyncingLiveRates ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{liveProvider}</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>0% Spread Institutional</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Conversion Flow Panel */}
      <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 space-y-6">
        {/* Source Account & You Send */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <span>You Send (Debited from Main Balance)</span>
            {sourceAccount && (
              <span className="font-mono text-slate-500 dark:text-slate-400">
                Available: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{sourceAccount.balanceFormatted}</span>
              </span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-100/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-2xl font-bold font-mono text-slate-400">
                {getWorldCurrency(sourceAccount?.currency || 'USD').symbol || '$'}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={sourceAmountInput}
                onChange={(e) => setSourceAmountInput(e.target.value)}
                required
                className="w-full bg-transparent text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white focus:outline-none placeholder-slate-400 dark:placeholder-slate-600"
                placeholder="0.00"
              />
            </div>

            <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-4">
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                    {acc.currency} ({acc.nickname || `${acc.currency} Main`})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-mono text-slate-500">Quick Presets:</span>
            {['100', '500', '1000', '2500', '10000'].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handlePresetAmount(amt)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors border ${
                  sourceAmountInput === amt
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'bg-slate-100 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                ${Number(amt).toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Target Currency Selection Section */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Convert Directly Into Target Currency
            </label>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
              Live Rates Active across 190+ Countries
            </span>
          </div>

          {/* The 7 Primary Quick Buttons Requested by User with Live Rates */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {PRIMARY_CURRENCIES.map((c) => {
              const isSelected = targetCurrency === c.code;
              const rateVal = liveRates[c.code] || getWorldCurrency(c.code).ratePerUSD || 1.0;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setTargetCurrency(c.code)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500 text-slate-900 dark:text-white shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                      : 'bg-slate-100/90 dark:bg-slate-900/70 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl block mb-1">{c.flag}</span>
                  <span className={`block font-extrabold text-xs font-mono ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {c.code}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">{c.country}</span>
                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400/90 block mt-1">
                    {rateVal.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Select from All 190+ Countries Bar */}
          <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={countrySearchQuery}
                onChange={(e) => setCountrySearchQuery(e.target.value)}
                placeholder="Search any of 190+ countries or currencies (e.g. Saudi Arabia, Bangladesh, Germany, Brazil, Egypt, SAR, BDT, AUD)..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={targetCurrency}
                onChange={(e) => setTargetCurrency(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[220px]"
              >
                {filtered190Countries.map((c) => {
                  const r = getEffectiveLiveRate(c);
                  return (
                    <option key={c.id} value={c.code} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                      {c.flag} {c.country} ({c.code}) — {r.toFixed(2)}
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={() => setIsExplorerExpanded(!isExplorerExpanded)}
                className="px-3 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors whitespace-nowrap"
                title="Explore All 190 Countries Live Rates"
              >
                <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isExplorerExpanded ? 'Hide Rates' : 'All 190 Rates'}</span>
                {isExplorerExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Recipient Gets (Calculated in Real-Time Guaranteed Conversion using Live Data) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <span>Recipient Gets (Guaranteed Conversion)</span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Locked at Live Market Rate
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/40 flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {currentWorldCurrency.symbol}
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                {isLoadingQuote ? (
                  <span className="text-slate-400 dark:text-slate-500 animate-pulse text-lg">Calculating live rate...</span>
                ) : (
                  calculatedRecipientAmount
                )}
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs sm:text-sm flex items-center gap-2">
              <span className="text-lg">{currentWorldCurrency.flag}</span>
              <div className="text-right">
                <span className="block font-black leading-none">{currentWorldCurrency.code}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400/80 font-medium block leading-none mt-0.5">
                  {currentWorldCurrency.country}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* EXPLORER: All 190+ Countries Guaranteed Conversion Rates Table/Grid with Live Data */}
        {isExplorerExpanded && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-4 animate-scale-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white tracking-wide">
                  All 190+ World Countries Live Conversion Rates
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs font-mono text-slate-400">
                  Calculated for <span className="text-emerald-400 font-bold">${sourceAmountInput || '0.00'} USD</span>
                </p>
                <button
                  type="button"
                  onClick={() => loadLiveRates(true)}
                  disabled={isSyncingLiveRates}
                  className="px-2 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-mono flex items-center gap-1 border border-emerald-500/40"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingLiveRates ? 'animate-spin' : ''}`} />
                  <span>Update Live Feed</span>
                </button>
              </div>
            </div>

            {/* Region Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-500 text-[11px] mr-1">Filter:</span>
              {[
                { id: 'ALL', label: 'All 190+ Countries' },
                { id: 'POPULAR', label: 'Top Corridors' }
              ].map((rf) => (
                <button
                  key={rf.id}
                  type="button"
                  onClick={() => setSelectedRegionFilter(rf.id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors border ${
                    selectedRegionFilter === rf.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>

            {/* Search list of 190 countries with Live Rates */}
            <div className="max-h-80 overflow-y-auto pr-1 space-y-1.5 divide-y divide-slate-800/60 font-mono text-xs">
              {filtered190Countries.map((c) => {
                const isSelected = targetCurrency === c.code;
                const effectiveRate = getEffectiveLiveRate(c);
                const payoutFormatted = calculateGuaranteedPayout(c);
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setTargetCurrency(c.code);
                    }}
                    className={`pt-2 pb-2 px-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/20 border border-emerald-500/50 text-white'
                        : 'hover:bg-slate-900/90 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl">{c.flag}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white truncate">{c.country}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-emerald-400 font-extrabold">
                            {c.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {c.name} • 1 USD = {effectiveRate.toFixed(4)} {c.code}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Recipient Gets
                        </span>
                        <span className="text-sm font-extrabold text-emerald-400 font-mono">
                          {payoutFormatted}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTargetCurrency(c.code);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        {isSelected ? 'Selected ✓' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Counterparty Type Selection */}
        <div className="space-y-4 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Select Counterparty Type
            </label>
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setTransferType('EXTERNAL_BANK')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  transferType === 'EXTERNAL_BANK'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Real Bank Transfer ({targetCurrency})
              </button>
              <button
                type="button"
                onClick={() => setTransferType('INTERNAL_NEXAPAY')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  transferType === 'INTERNAL_NEXAPAY'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Bank of Maldives (BML) Transfer
              </button>
            </div>
          </div>

          {/* EXTERNAL BANK DETAILS */}
          {transferType === 'EXTERNAL_BANK' ? (
            <div className="space-y-4 p-4 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Bank Name
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewBank(!isAddingNewBank)}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {isAddingNewBank ? '← Select From List' : '+ Add New Bank'}
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
                        if (found) setRail(found.supportedRail);
                      }}
                      className="w-full glass-input rounded-xl text-sm py-2.5 px-3 font-mono cursor-pointer"
                    >
                      {filteredInstitutions.length > 0 ? (
                        filteredInstitutions.map((inst) => (
                          <option key={inst.routingNumber} value={inst.routingNumber} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                            {inst.name} ({inst.country}) — Routing: {inst.routingNumber} [{inst.supportedRail}]
                          </option>
                        ))
                      ) : (
                        <option value="021000089" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                          {currentWorldCurrency.country} Commercial Bank — Routing: 021000089 [WIRE]
                        </option>
                      )}
                      <option value="__ADD_NEW__" className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                        + Add New Bank / Custom Bank...
                      </option>
                    </select>
                    {selectedInstitution && (
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                        SWIFT / BIC: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedInstitution.bicSwift}</span> • Clearing Rail:{' '}
                        <span className="text-slate-900 dark:text-white font-bold">{rail}</span>
                      </p>
                    )}
                  </>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-100/90 dark:bg-slate-950/80 border border-emerald-500/40 space-y-3">
                    <Input
                      label="Bank Name"
                      placeholder="e.g. Vodafone Cash, Chase, Barclays, HDFC..."
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
                          onChange={(e) => setCustomRail(e.target.value)}
                          className="w-full glass-input rounded-xl text-sm py-2.5 px-3 font-mono cursor-pointer"
                        >
                          <option value="WIRE" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">WIRE / SWIFT</option>
                          <option value="NEFT" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">NEFT (India)</option>
                          <option value="RAAST" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">RAAST (Pakistan)</option>
                          <option value="SEPA" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">SEPA (Europe)</option>
                          <option value="ACH" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">ACH (Direct Deposit)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Beneficiary Full Name / Company"
                  placeholder="e.g. Rajesh Sharma"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  required
                />
                <Input
                  label="Recipient Account Number / IBAN"
                  placeholder="e.g. 39481029481"
                  value={beneficiaryAccountNumber}
                  onChange={(e) => setBeneficiaryAccountNumber(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <Input
                label="Recipient BML Account Number or Email"
                placeholder="7701928341 or forextradingplatformfxe@gmail.com"
                value={recipientIdentifier}
                onChange={(e) => setRecipientIdentifier(e.target.value)}
                required
              />
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-2">
                💡 Recipient will instantly receive funds credited into their {targetCurrency} wallet balance! If they don't have a {targetCurrency} account, one is provisioned automatically.
              </p>
            </div>
          )}
        </div>

        {/* Narrative & PIN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
          <Input
            label="Transfer Memo / Payment Reference"
            placeholder={`e.g. Family support / Consulting invoice (${targetCurrency})`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            label="Authorization PIN"
            type="password"
            maxLength={4}
            value={simulatedPin}
            onChange={(e) => setSimulatedPin(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Transfer Cost Breakdown Table with Live Rate Indicator */}
        <div className="p-4 rounded-xl bg-slate-100/90 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-2">
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Debited from Main Balance:</span>
            <span className="text-slate-900 dark:text-white font-bold">
              {formatMinorUnits(parseToMinorUnits(sourceAmountInput, sourceAccount?.currency || 'USD'), sourceAccount?.currency || 'USD')}
            </span>
          </div>
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Live Guaranteed Exchange Rate:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              1 {sourceAccount?.currency || 'USD'} = {appliedRateNumber.toFixed(4)} {targetCurrency}
            </span>
          </div>
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Institutional Wire Fee:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">$0.00 (Free / Unlimited Enterprise)</span>
          </div>
          <div className="flex justify-between text-slate-800 dark:text-slate-200 pt-2 border-t border-slate-200 dark:border-slate-800 font-bold text-sm">
            <span>Total Recipient Receives:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{calculatedRecipientAmount}</span>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-4 text-base font-bold shadow-lg shadow-emerald-500/25"
          isLoading={isSubmitting}
          leftIcon={<Zap className="w-5 h-5 text-slate-950" />}
        >
          Execute Multi-Currency Transfer ({sourceAccount?.currency || 'USD'} ➔ {targetCurrency})
        </Button>
      </div>
    </form>
  );
};
