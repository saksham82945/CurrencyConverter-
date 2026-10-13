import { SupportedCurrency } from '../constants/currencies';

export type LedgerAccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type NormalBalance = 'DEBIT' | 'CREDIT';
export type EntryDirection = 'DEBIT' | 'CREDIT';

export type JournalReferenceType = 
  | 'P2P_TRANSFER' 
  | 'EXTERNAL_TRANSFER' 
  | 'FX_SWAP' 
  | 'CARD_CHARGE' 
  | 'FAUCET_INJECTION' 
  | 'FEE';

export type JournalStatus = 'POSTED' | 'PENDING' | 'REJECTED';

export interface LedgerAccountDTO {
  id: string;
  code: string;
  name: string;
  type: LedgerAccountType;
  currency: SupportedCurrency;
  isSystemAccount: boolean;
  normalBalance: NormalBalance;
  balanceMinorUnits: number;
  balanceFormatted: string;
  createdAt: string;
}

export interface LedgerLineDTO {
  id: string;
  journalEntryId: string;
  ledgerAccountId: string;
  ledgerAccountCode?: string;
  ledgerAccountName?: string;
  direction: EntryDirection;
  amountMinorUnits: number;
  amountFormatted: string;
  currency: SupportedCurrency;
  accountBalanceAfter: number;
  accountBalanceAfterFormatted: string;
  createdAt: string;
}

export interface JournalEntryDTO {
  id: string;
  entryNumber: string;
  idempotencyKey?: string;
  referenceType: JournalReferenceType;
  referenceId?: string;
  description: string;
  status: JournalStatus;
  lines: LedgerLineDTO[];
  metadata: {
    simulated?: boolean;
    senderUserId?: string;
    senderName?: string;
    recipientUserId?: string;
    recipientName?: string;
    exchangeRateUsed?: number;
    notes?: string;
    [key: string]: any;
  };
  postedAt: string;
  createdAt: string;
}

export interface TrialBalanceItem {
  code: string;
  name: string;
  type: LedgerAccountType;
  currency: SupportedCurrency;
  debitTotalMinorUnits: number;
  creditTotalMinorUnits: number;
  netBalanceMinorUnits: number;
  netBalanceFormatted: string;
}

export interface TrialBalanceDTO {
  asOf: string;
  accounts: TrialBalanceItem[];
  totalsByCurrency: Record<SupportedCurrency, {
    totalDebitsMinorUnits: number;
    totalCreditsMinorUnits: number;
    isBalanced: boolean;
  }>;
  overallBalanced: boolean;
}
