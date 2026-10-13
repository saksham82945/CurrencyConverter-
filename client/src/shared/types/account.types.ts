import { SupportedCurrency } from '../constants/currencies';

export type UserRole = 'USER' | 'ADMIN' | 'COMPLIANCE';
export type KycTier = 'TIER_1_SIMULATED' | 'TIER_2_SIMULATED';

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  kycTier: KycTier;
  hasSimulatedPin: boolean;
  isFrozen: boolean;
  createdAt: string;
}

export type AccountType = 'CHECKING' | 'SAVINGS';
export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';

export interface AccountDTO {
  id: string;
  userId: string;
  accountNumber: string;
  routingNumber: string;
  currency: SupportedCurrency | string;
  accountType: AccountType;
  nickname: string;
  status: AccountStatus;
  ledgerAccountId: string;
  balanceMinorUnits: number;
  balanceFormatted: string;
  availableMinorUnits: number;
  availableFormatted: string;
  createdAt: string;
}

export interface BeneficiaryDTO {
  id: string;
  userId: string;
  name: string;
  type: 'INTERNAL_NEXAPAY' | 'EXTERNAL_BANK';
  identifier: string; // email or account number
  routingOrBic?: string;
  institutionName?: string;
  currency: SupportedCurrency | string;
  createdAt: string;
}

export interface VirtualCardDTO {
  id: string;
  userId: string;
  accountId: string;
  cardType: 'VIRTUAL_DEBIT';
  brand: 'VISA' | 'MASTERCARD';
  cardholderName: string;
  lastFour: string;
  maskedPan: string;
  fullPan?: string; // only returned when user explicitly reveals
  cvv: string;
  expiryMonth: number;
  expiryYear: number;
  spendingLimitMonthlyMinorUnits: number;
  spentCurrentMonthMinorUnits: number;
  status: 'ACTIVE' | 'FROZEN' | 'TERMINATED';
  createdAt: string;
}

export interface ExchangeRateDTO {
  pair: string; // e.g. "USD/EUR"
  from: SupportedCurrency;
  to: SupportedCurrency;
  rate: number;
  feeBps: number;
  lastUpdated: string;
}
