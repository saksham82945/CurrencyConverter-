import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AccountController } from '../controllers/account.controller';
import { TransferController } from '../controllers/transfer.controller';
import { BeneficiaryController } from '../controllers/beneficiary.controller';
import { CardController } from '../controllers/card.controller';
import { DirectoryController } from '../controllers/directory.controller';
import { FxController } from '../controllers/fx.controller';
import { FaucetController } from '../controllers/faucet.controller';
import { AdminController } from '../controllers/admin.controller';
import { authenticateUser, requireRole } from '../middleware/auth.middleware';
import { requireIdempotency } from '../middleware/idempotency.middleware';
import { transferLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// --- Auth Routes ---
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/refresh', AuthController.refresh);
router.post('/auth/logout', AuthController.logout);
router.get('/auth/me', authenticateUser, AuthController.me);
router.patch('/auth/pin', authenticateUser, AuthController.updatePin);
router.post('/auth/upgrade-kyc', authenticateUser, AuthController.upgradeKyc);

// --- Accounts Routes ---
router.get('/accounts', authenticateUser, AccountController.listAccounts);
router.post('/accounts', authenticateUser, AccountController.createAccount);
router.get('/accounts/:id', authenticateUser, AccountController.getAccountById);
router.get('/accounts/:id/entries', authenticateUser, AccountController.getAccountEntries);

// --- Transfers & Swaps Routes ---
router.post('/transfers/internal', authenticateUser, transferLimiter, requireIdempotency, TransferController.transferInternal);
router.post('/transfers/external', authenticateUser, transferLimiter, requireIdempotency, TransferController.transferExternal);
router.post('/transfers/multi-currency', authenticateUser, transferLimiter, requireIdempotency, TransferController.transferMultiCurrency);
router.post('/transfers/fx-swap', authenticateUser, transferLimiter, requireIdempotency, TransferController.transferFxSwap);
router.get('/transfers/:entryNumber/receipt', authenticateUser, TransferController.getReceipt);

// --- Beneficiaries Routes ---
router.get('/beneficiaries', authenticateUser, BeneficiaryController.listBeneficiaries);
router.post('/beneficiaries', authenticateUser, BeneficiaryController.createBeneficiary);
router.delete('/beneficiaries/:id', authenticateUser, BeneficiaryController.deleteBeneficiary);

// --- Virtual Cards Routes ---
router.get('/cards', authenticateUser, CardController.listCards);
router.post('/cards', authenticateUser, CardController.issueCard);
router.patch('/cards/:id/status', authenticateUser, CardController.updateCardStatus);
router.patch('/cards/:id/limits', authenticateUser, CardController.updateCardLimits);
router.post('/cards/:id/reveal-pan', authenticateUser, CardController.revealPan);
router.post('/cards/:id/simulate-charge', authenticateUser, requireIdempotency, CardController.simulatePosCharge);

// --- Institution Directory & FX Rates ---
router.get('/directory/institutions', DirectoryController.searchInstitutions);
router.post('/directory/institutions', DirectoryController.createInstitution);
router.get('/fx/rates', FxController.getRates);
router.get('/fx/live-rates', FxController.getLiveRates);
router.post('/fx/sync-rates', FxController.syncRates);
router.get('/fx/quote', FxController.getQuote);

// --- Faucet Liquidity Injection ---
router.post('/faucet/inject', authenticateUser, requireIdempotency, FaucetController.injectLiquidity);

// --- Admin & Ledger Audits ---
router.get('/admin/ledger/trial-balance', authenticateUser, requireRole('ADMIN'), AdminController.getTrialBalance);
router.get('/admin/ledger/audit', authenticateUser, requireRole('ADMIN'), AdminController.auditInvariants);
router.get('/admin/audit-logs', authenticateUser, requireRole('ADMIN', 'COMPLIANCE'), AdminController.listAuditLogs);

export default router;
