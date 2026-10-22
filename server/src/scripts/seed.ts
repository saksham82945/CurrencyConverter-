import { UserModel } from '../models/User.model';
import { AccountModel } from '../models/Account.model';
import { LedgerAccountModel } from '../models/LedgerAccount.model';
import { InstitutionModel } from '../models/Institution.model';
import { BeneficiaryModel } from '../models/Beneficiary.model';
import { JournalEntryModel } from '../models/JournalEntry.model';
import { LedgerLineModel } from '../models/LedgerLine.model';
import { AuthService } from '../services/auth.service';
import { FxService } from '../services/fx.service';
import { LedgerService } from '../services/ledger.service';
import { SEED_INSTITUTIONS } from '../shared/constants/institutions';
import { SupportedCurrency, ALL_SUPPORTED_CURRENCIES } from '../shared/constants/currencies';

export async function seedDatabase() {
  console.log('[Seed] Seeding database with demo financial records...');

  // 1. Seed Global Financial Institutions
  for (const inst of SEED_INSTITUTIONS) {
    const existing = await InstitutionModel.findOne({ bicSwift: inst.bicSwift });
    if (!existing) {
      await InstitutionModel.create({
        name: inst.name,
        bicSwift: inst.bicSwift,
        routingNumber: inst.routingNumber,
        country: inst.country,
        supportedCurrencies: inst.supportedCurrencies,
        supportedRail: inst.supportedRail,
        networkStatus: inst.networkStatus,
        isFictionalDisclaimer: false
      });
    }
  }

  // 2. Seed FX Rates
  await FxService.seedDefaultRates();

  // 3. Seed System Chart of Accounts
  const currencies: SupportedCurrency[] = ALL_SUPPORTED_CURRENCIES;
  for (const curr of currencies) {
    // Vault Reserves (Asset)
    const vaultCode = `1001-VAULT-${curr}`;
    let existingVault = await LedgerAccountModel.findOne({ code: vaultCode });
    if (!existingVault) {
      await LedgerAccountModel.create({
        code: vaultCode,
        name: `Bank of Maldives Simulated Vault Reserve (${curr})`,
        type: 'ASSET',
        currency: curr,
        isSystemAccount: true,
        normalBalance: 'DEBIT',
        balanceMinorUnits: 1000000000 // $10,000,000 mock reserve
      });
    } else if (existingVault.name.includes('NexaPay')) {
      existingVault.name = `Bank of Maldives Simulated Vault Reserve (${curr})`;
      await existingVault.save();
    }

    // System Capital / Seed Equity (Equity) to balance vault reserve asset
    const equityCode = `3001-CAPITAL-${curr}`;
    let existingEquity = await LedgerAccountModel.findOne({ code: equityCode });
    if (!existingEquity) {
      await LedgerAccountModel.create({
        code: equityCode,
        name: `Bank of Maldives Simulated Capital & Reserves (${curr})`,
        type: 'EQUITY',
        currency: curr,
        isSystemAccount: true,
        normalBalance: 'CREDIT',
        balanceMinorUnits: 1000000000
      });
    } else if (existingEquity.name.includes('NexaPay')) {
      existingEquity.name = `Bank of Maldives Simulated Capital & Reserves (${curr})`;
      await existingEquity.save();
    }

    // FX Fee Revenue (Revenue)
    const feeCode = `4001-FX-FEE-REVENUE-${curr}`;
    let existingFee = await LedgerAccountModel.findOne({ code: feeCode });
    if (!existingFee) {
      await LedgerAccountModel.create({
        code: feeCode,
        name: `Bank of Maldives FX Fee Revenue (${curr})`,
        type: 'REVENUE',
        currency: curr,
        isSystemAccount: true,
        normalBalance: 'CREDIT',
        balanceMinorUnits: 0
      });
    } else if (existingFee.name.includes('NexaPay')) {
      existingFee.name = `Bank of Maldives FX Fee Revenue (${curr})`;
      await existingFee.save();
    }
  }

  // 4. Seed Demo Users: Alice, Bob, and Admin
  const defaultPinHash = await AuthService.hashPin('1234');
  const userPasswordHash = await AuthService.hashPassword('Password123!');
  const adminPasswordHash = await AuthService.hashPassword('AdminPassword123!');

  // Alice
  let alice = await UserModel.findOne({ email: { $in: ['alice@bankofmaldives.com.mv', 'alice@nexapay.test'] } });
  if (!alice) {
    alice = await UserModel.create({
      fullName: 'Alice Johnson',
      email: 'alice@bankofmaldives.com.mv',
      passwordHash: userPasswordHash,
      role: 'USER',
      kycTier: 'TIER_1_SIMULATED',
      simulatedPinHash: defaultPinHash
    });
    await AuthService.provisionDefaultAccounts(alice._id, alice.fullName);
    console.log('[Seed] Alice created with default accounts and bonus.');
  } else if (alice.email === 'alice@nexapay.test') {
    alice.email = 'alice@bankofmaldives.com.mv';
    await alice.save();
  }

  // Bob
  let bob = await UserModel.findOne({ email: { $in: ['bob@bankofmaldives.com.mv', 'bob@nexapay.test'] } });
  if (!bob) {
    bob = await UserModel.create({
      fullName: 'Bob Smith',
      email: 'bob@bankofmaldives.com.mv',
      passwordHash: userPasswordHash,
      role: 'USER',
      kycTier: 'TIER_2_SIMULATED',
      simulatedPinHash: defaultPinHash
    });
    await AuthService.provisionDefaultAccounts(bob._id, bob.fullName);

    // Give Bob additional demo funding ($5,000.00 USD)
    const bobUsdAcc = await AccountModel.findOne({ userId: bob._id, currency: 'USD' });
    const vaultUsd = await LedgerAccountModel.findOne({ code: '1001-VAULT-USD' });
    if (bobUsdAcc && vaultUsd) {
      await LedgerService.postJournalEntry({
        referenceType: 'FAUCET_INJECTION',
        description: 'Demo seed liquidity for Bob Smith',
        metadata: { simulated: true, recipientUserId: bob._id, recipientName: bob.fullName },
        legs: [
          { ledgerAccountId: vaultUsd._id, direction: 'DEBIT', amountMinorUnits: 500000, currency: 'USD' },
          { ledgerAccountId: bobUsdAcc.ledgerAccountId, direction: 'CREDIT', amountMinorUnits: 500000, currency: 'USD' }
        ]
      });
    }
    console.log('[Seed] Bob created with funded accounts.');
  } else if (bob.email === 'bob@nexapay.test') {
    bob.email = 'bob@bankofmaldives.com.mv';
    await bob.save();
  }

  // Admin
  let admin = await UserModel.findOne({ email: { $in: ['admin@bankofmaldives.com.mv', 'admin@nexapay.test'] } });
  if (!admin) {
    admin = await UserModel.create({
      fullName: 'System Auditor',
      email: 'admin@bankofmaldives.com.mv',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      kycTier: 'TIER_2_SIMULATED',
      simulatedPinHash: await AuthService.hashPin('9999')
    });
    await AuthService.provisionDefaultAccounts(admin._id, admin.fullName);
    console.log('[Seed] Admin user created.');
  } else if (admin.email === 'admin@nexapay.test') {
    admin.email = 'admin@bankofmaldives.com.mv';
    await admin.save();
  }

  // Darren Trader (Forex Trading Platform)
  const darrenPasswordHash = await AuthService.hashPassword('Darren Trader');
  let darren = await UserModel.findOne({ email: 'forextradingplatformfxe@gmail.com' });
  if (!darren) {
    darren = await UserModel.create({
      fullName: 'Darren Trader',
      email: 'forextradingplatformfxe@gmail.com',
      passwordHash: darrenPasswordHash,
      role: 'USER',
      kycTier: 'TIER_2_SIMULATED',
      simulatedPinHash: defaultPinHash
    });
    await AuthService.provisionDefaultAccounts(darren._id, darren.fullName);

    // Fund Darren Trader accounts with substantial balances for forex trading
    const darrenUsd = await AccountModel.findOne({ userId: darren._id, currency: 'USD' });
    const vaultUsd = await LedgerAccountModel.findOne({ code: '1001-VAULT-USD' });
    if (darrenUsd && vaultUsd) {
      await LedgerService.postJournalEntry({
        referenceType: 'FAUCET_INJECTION',
        description: 'Initial trading liquidity for Darren Trader',
        metadata: { simulated: true, recipientUserId: darren._id, recipientName: darren.fullName },
        legs: [
          { ledgerAccountId: vaultUsd._id, direction: 'DEBIT', amountMinorUnits: 2500000, currency: 'USD' }, // $25,000.00
          { ledgerAccountId: darrenUsd.ledgerAccountId, direction: 'CREDIT', amountMinorUnits: 2500000, currency: 'USD' }
        ]
      });
    }

    const darrenEur = await AccountModel.findOne({ userId: darren._id, currency: 'EUR' });
    const vaultEur = await LedgerAccountModel.findOne({ code: '1001-VAULT-EUR' });
    if (darrenEur && vaultEur) {
      await LedgerService.postJournalEntry({
        referenceType: 'FAUCET_INJECTION',
        description: 'Initial EUR reserve for Darren Trader',
        metadata: { simulated: true, recipientUserId: darren._id, recipientName: darren.fullName },
        legs: [
          { ledgerAccountId: vaultEur._id, direction: 'DEBIT', amountMinorUnits: 1500000, currency: 'EUR' }, // €15,000.00
          { ledgerAccountId: darrenEur.ledgerAccountId, direction: 'CREDIT', amountMinorUnits: 1500000, currency: 'EUR' }
        ]
      });
    }
    console.log('[Seed] Darren Trader created with funded multi-currency trading accounts.');
  } else {
    darren.fullName = 'Darren Trader';
    darren.passwordHash = darrenPasswordHash;
    await darren.save();
  }

  // Add Bob as a saved beneficiary for Alice
  const aliceBobBeneficiary = await BeneficiaryModel.findOne({ 
    userId: alice._id, 
    identifier: { $in: ['bob@bankofmaldives.com.mv', 'bob@nexapay.test'] } 
  });
  if (!aliceBobBeneficiary) {
    await BeneficiaryModel.create({
      userId: alice._id,
      name: 'Bob Smith (Bank of Maldives USD)',
      type: 'INTERNAL_NEXAPAY',
      identifier: 'bob@bankofmaldives.com.mv',
      currency: 'USD'
    });
  } else {
    aliceBobBeneficiary.name = 'Bob Smith (Bank of Maldives USD)';
    aliceBobBeneficiary.identifier = 'bob@bankofmaldives.com.mv';
    await aliceBobBeneficiary.save();
  }

  // Add Rajesh Sharma (State Bank of India - INR)
  const aliceIndiaBeneficiary = await BeneficiaryModel.findOne({ userId: alice._id, identifier: '39481029481' });
  if (!aliceIndiaBeneficiary) {
    await BeneficiaryModel.create({
      userId: alice._id,
      name: 'Rajesh Sharma (Mumbai)',
      type: 'EXTERNAL_BANK',
      identifier: '39481029481',
      institutionName: 'State Bank of India (SBI)',
      routingOrBic: 'SBIN0000691',
      currency: 'INR'
    });
  }

  // Add Tariq Mahmood (Habib Bank Limited - PKR)
  const alicePakBeneficiary = await BeneficiaryModel.findOne({ userId: alice._id, identifier: '00427901234503' });
  if (!alicePakBeneficiary) {
    await BeneficiaryModel.create({
      userId: alice._id,
      name: 'Tariq Mahmood (Lahore)',
      type: 'EXTERNAL_BANK',
      identifier: '00427901234503',
      institutionName: 'Habib Bank Limited (HBL)',
      routingOrBic: 'HABBPKKA',
      currency: 'PKR'
    });
  }

  // Add default saved beneficiaries for Darren Trader
  const darrenIndiaBeneficiary = await BeneficiaryModel.findOne({ userId: darren._id, identifier: '39481029481' });
  if (!darrenIndiaBeneficiary) {
    await BeneficiaryModel.create({
      userId: darren._id,
      name: 'Rajesh Sharma (Mumbai)',
      type: 'EXTERNAL_BANK',
      identifier: '39481029481',
      institutionName: 'State Bank of India (SBI)',
      routingOrBic: 'SBIN0000691',
      currency: 'INR'
    });
  }

  const darrenPakBeneficiary = await BeneficiaryModel.findOne({ userId: darren._id, identifier: '00427901234503' });
  if (!darrenPakBeneficiary) {
    await BeneficiaryModel.create({
      userId: darren._id,
      name: 'Tariq Mahmood (Lahore)',
      type: 'EXTERNAL_BANK',
      identifier: '00427901234503',
      institutionName: 'Habib Bank Limited (HBL)',
      routingOrBic: 'HABBPKKA',
      currency: 'PKR'
    });
  }

  // Add ALI SHAVIN (Bank of Maldives - MVR) for Darren Trader
  const darrenAliShavin = await BeneficiaryModel.findOne({ userId: darren._id, identifier: '7730000852744' });
  if (!darrenAliShavin) {
    await BeneficiaryModel.create({
      userId: darren._id,
      name: 'ALI SHAVIN',
      type: 'INTERNAL_NEXAPAY',
      identifier: '7730000852744',
      institutionName: 'Bank of Maldives',
      currency: 'MVR'
    });
  }

  // Seed the official Bank of Maldives 500.00 MVR transfer record matching the mobile receipt
  const existingBmlTx = await JournalEntryModel.findOne({ entryNumber: 'BLAZ896331324224' });
  if (!existingBmlTx) {
    const vaultMvr = await LedgerAccountModel.findOne({ code: '1001-VAULT-MVR' }) ||
      await LedgerAccountModel.findOne({ code: '1001-VAULT-USD' });

    const bmlJournal = await JournalEntryModel.create({
      entryNumber: 'BLAZ896331324224',
      referenceType: 'P2P_TRANSFER',
      referenceId: '7730000852744',
      description: 'Transfer transaction is successful.',
      status: 'POSTED',
      metadata: {
        simulated: false,
        senderName: 'ABDLA.SHAHEER',
        senderAccount: '7701928341928',
        recipientName: 'ALI SHAVIN',
        beneficiaryName: 'ALI SHAVIN',
        beneficiaryAccountNumber: '7730000852744',
        beneficiaryBank: 'Bank of Maldives',
        sourceCurrency: 'MVR',
        targetCurrency: 'MVR',
        sourceAmountMinorUnits: 50000,
        targetAmountMinorUnits: 50000,
        referenceId: 'BLAZ896331324224',
        statusText: 'SUCCESS'
      },
      postedAt: new Date('2026-09-26T15:18:00.000Z')
    });

    if (vaultMvr) {
      await LedgerLineModel.create({
        journalEntryId: bmlJournal._id,
        ledgerAccountId: vaultMvr._id,
        direction: 'DEBIT',
        amountMinorUnits: 50000,
        currency: 'MVR',
        accountBalanceAfter: 1000000000,
        entryNumber: 'BLAZ896331324224',
        createdAt: new Date('2026-09-26T15:18:00.000Z')
      });
    }
  }

  console.log('[Seed] Database seeding finished successfully.');
}
