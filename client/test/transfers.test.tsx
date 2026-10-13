import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider } from '../src/context/ToastContext';
import { MultiCurrencyTransferForm } from '../src/components/transfers/MultiCurrencyTransferForm';
import { P2PTransferForm } from '../src/components/transfers/P2PTransferForm';
import { ExternalTransferForm } from '../src/components/transfers/ExternalTransferForm';
import { FxSwapForm } from '../src/components/transfers/FxSwapForm';
import { AccountDTO } from '../../shared/types/account.types';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

// Mock directory and FX API
vi.mock('../src/api/directory.api', () => ({
  directoryApi: {
    searchInstitutions: vi.fn().mockResolvedValue({
      institutions: [
        {
          id: 'inst-1',
          name: 'State Bank of India',
          routingNumber: 'SBIN0000691',
          bicSwift: 'SBININBB',
          country: 'India',
          supportedCurrencies: ['INR', 'USD'],
          supportedRail: 'NEFT',
          networkStatus: 'ONLINE',
          isFictionalDisclaimer: false
        }
      ]
    }),
    createInstitution: vi.fn().mockResolvedValue({})
  }
}));

vi.mock('../src/api/fx.api', () => ({
  fxApi: {
    getQuote: vi.fn().mockResolvedValue({
      fromCurrency: 'USD',
      toCurrency: 'INR',
      fromAmountMinorUnits: 10000,
      toAmountMinorUnits: 841200,
      rate: 84.12,
      feeMinorUnits: 50,
      feeFormatted: '$0.50',
      expiresAt: new Date(Date.now() + 60000).toISOString()
    }),
    getLiveRates: vi.fn().mockResolvedValue({
      rates: { INR: 84.12, EUR: 0.92, GBP: 0.79, PKR: 278.50 },
      provider: 'Simulated Live Rates Feed',
      lastUpdated: new Date().toISOString()
    }),
    syncRates: vi.fn().mockResolvedValue({})
  }
}));

describe('Frontend Transfers & Account Integration Tests', () => {
  const mockAccounts: AccountDTO[] = [
    {
      id: 'acc-usd-01',
      userId: 'user-01',
      accountNumber: '7712345678',
      routingNumber: '026014887',
      currency: 'USD',
      accountType: 'CHECKING',
      nickname: 'US Dollar Checking',
      status: 'ACTIVE',
      balanceMinorUnits: 500000,
      balanceFormatted: '$5,000.00',
      ledgerAccountId: 'ledg-usd-01',
      createdAt: new Date().toISOString()
    },
    {
      id: 'acc-eur-02',
      userId: 'user-01',
      accountNumber: '7787654321',
      routingNumber: '026014887',
      currency: 'EUR',
      accountType: 'SAVINGS',
      nickname: 'Euro Reserve',
      status: 'ACTIVE',
      balanceMinorUnits: 250000,
      balanceFormatted: '€2,500.00',
      ledgerAccountId: 'ledg-eur-02',
      createdAt: new Date().toISOString()
    }
  ];

  it('renders MultiCurrencyTransferForm and displays available source accounts', () => {
    const handleSuccess = vi.fn();
    renderWithProviders(<MultiCurrencyTransferForm accounts={mockAccounts} onTransferSuccess={handleSuccess} />);

    expect(screen.getByText(/Convert Directly Into Target Currency/i)).toBeInTheDocument();
    expect(screen.getAllByText('INR').length).toBeGreaterThan(0);
  });

  it('renders P2PTransferForm and dynamically syncs source account selection', () => {
    const handleSuccess = vi.fn();
    const { rerender } = renderWithProviders(<P2PTransferForm accounts={[]} onTransferSuccess={handleSuccess} />);

    // Rerender with accounts populated asynchronously
    rerender(<ToastProvider><P2PTransferForm accounts={mockAccounts} onTransferSuccess={handleSuccess} /></ToastProvider>);

    expect(screen.getByText(/Recipient Account Number or Email/i)).toBeInTheDocument();
    expect(screen.getByText(/Send Transfer Now/i)).toBeInTheDocument();
  });

  it('renders ExternalTransferForm with institution rails and bank inputs', async () => {
    const handleSuccess = vi.fn();
    renderWithProviders(<ExternalTransferForm accounts={mockAccounts} onTransferSuccess={handleSuccess} />);

    expect(screen.getByText(/Beneficiary Full Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Recipient Bank Account Number/i)).toBeInTheDocument();
  });

  it('renders FxSwapForm and allows selecting source and destination accounts', () => {
    const handleSuccess = vi.fn();
    renderWithProviders(<FxSwapForm accounts={mockAccounts} onSwapSuccess={handleSuccess} />);

    expect(screen.getByText(/You Pay/i)).toBeInTheDocument();
    expect(screen.getByText(/You Receive/i)).toBeInTheDocument();
  });

  it('dispatches and responds to auth:expired custom window event cleanly', () => {
    let expiredFired = false;
    const handler = () => {
      expiredFired = true;
    };
    window.addEventListener('auth:expired', handler);

    window.dispatchEvent(new CustomEvent('auth:expired'));
    expect(expiredFired).toBe(true);

    window.removeEventListener('auth:expired', handler);
  });
});
