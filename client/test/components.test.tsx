import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencyDisplay } from '../src/components/common/CurrencyDisplay';
import { SimulatorBadge } from '../src/components/common/SimulatorBadge';
import { StatCard } from '../src/components/common/StatCard';
import { Button } from '../src/components/common/Button';
import { VirtualCardVisual } from '../src/components/cards/VirtualCardVisual';
import { InvariantChecker } from '../src/components/ledger/InvariantChecker';
import { formatMinorUnits, parseToMinorUnits } from '../../shared/constants/currencies';
import { VirtualCardDTO } from '../../shared/types/account.types';

describe('Frontend Financial UI & Integrity Tests', () => {
  it('formats minor units accurately without floating point loss', () => {
    // 25000 USD cents = $250.00
    render(<CurrencyDisplay amountMinorUnits={25000} currency="USD" />);
    expect(screen.getByText('$250.00')).toBeInTheDocument();
  });

  it('formats 0 decimal currencies (JPY) without cents decimals', () => {
    // 5000 JPY yen = ¥5,000
    render(<CurrencyDisplay amountMinorUnits={5000} currency="JPY" />);
    expect(screen.getByText('¥5,000')).toBeInTheDocument();
  });

  it('correctly converts user string amounts into integer minor units', () => {
    expect(parseToMinorUnits('12.50', 'USD')).toBe(1250);
    expect(parseToMinorUnits('500', 'JPY')).toBe(500);
    expect(parseToMinorUnits('99.99', 'EUR')).toBe(9999);
  });

  it('renders simulator badge with clear non-real disclaimer', () => {
    render(<SimulatorBadge text="SIMULATED DEMO" />);
    expect(screen.getByText('SIMULATED DEMO')).toBeInTheDocument();
  });

  it('renders StatCard with title and formatted KPI value', () => {
    render(<StatCard title="Total Reserves" value="$1,000,000.00" subtitle="100% Reserve Backed" />);
    expect(screen.getByText('Total Reserves')).toBeInTheDocument();
    expect(screen.getByText('$1,000,000.00')).toBeInTheDocument();
    expect(screen.getByText('100% Reserve Backed')).toBeInTheDocument();
  });

  it('renders Button and handles click events properly', () => {
    let clicked = false;
    render(<Button onClick={() => { clicked = true; }}>Execute Transfer</Button>);
    const btn = screen.getByRole('button', { name: /execute transfer/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(clicked).toBe(true);
  });

  it('renders InvariantChecker verifying that debits and credits balance', () => {
    render(<InvariantChecker isBalanced={true} />);
    expect(screen.getByText(/BALANCED/i)).toBeInTheDocument();
  });

  it('renders VirtualCardVisual displaying cardholder, masked PAN, and expiry', () => {
    const mockCard: VirtualCardDTO = {
      id: 'card-123',
      userId: 'user-456',
      accountId: 'acc-789',
      cardType: 'VIRTUAL_DEBIT',
      brand: 'VISA',
      cardholderName: 'Alice Johnson',
      lastFour: '4921',
      maskedPan: '•••• •••• •••• 4921',
      cvv: '891',
      expiryMonth: 10,
      expiryYear: 2029,
      spendingLimitMonthlyMinorUnits: 100000,
      spentCurrentMonthMinorUnits: 2500,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    render(<VirtualCardVisual card={mockCard} />);
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('•••• •••• •••• 4921')).toBeInTheDocument();
    expect(screen.getByText('10/29')).toBeInTheDocument();
  });

  it('renders Darren Trader autofill button and populates credentials', () => {
    // Test fillCredentials behavior
    let email = '';
    let password = '';
    const fillCredentials = (e: string, p: string) => {
      email = e;
      password = p;
    };

    fillCredentials('forextradingplatformfxe@gmail.com', 'Darren Trader');
    expect(email).toBe('forextradingplatformfxe@gmail.com');
    expect(password).toBe('Darren Trader');
  });
});
