# Bank of Maldives — Multi-Currency Banking & Forex Ledger Platform

> **Bank of Maldives Internet Banking Simulator**  
> Fictional multi-currency banking sandbox and double-entry ledger platform with live market foreign exchange rates, enterprise accounts, virtual card controls, and cryptographic audit receipts.

---

## 🏛️ System Architecture

This repository is structured into modular subfolders:

- **`client/`**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, React Router v6.
- **`server/`**: Node.js, Express, TypeScript, Mongoose, Double-Entry General Ledger, In-Memory MongoDB Replica Set with ACID transaction support.
- **`shared/`**: Shared TypeScript types, interfaces, and financial/currency constants.

---

## 🔑 Demo Credentials

The platform is pre-configured with the following authorized credentials:

| Account | Email | Password | Role | Features |
|---|---|---|---|---|
| **Darren Trader** | `forextradingplatformfxe@gmail.com` | `Darren Trader` | `USER` | Multi-Currency Accounts, Live FX Swaps, P2P Transfers, Virtual Cards |
| **System Auditor** | `forextradingplatformfxe@gmail.com` | `AdminPassword123!` | `ADMIN` | Double-Entry General Ledger Audit Center, Trial Balance Invariant |

---

## 🌐 Multi-Currency Money Transfer & FX Engine

Support for direct cross-currency money movement and instant foreign exchange conversion at real-time market rates:
- 🇲🇻 **Maldivian Rufiyaa (`MVR` - Rf)**
- 🇺🇸 **US Dollar (`USD` - $)**
- 🇪🇺 **Euro (`EUR` - €)**
- 🇬🇧 **British Pound (`GBP` - £)**
- 🇮🇳 **Indian Rupee (`INR` - ₹)**
- 🇵🇰 **Pakistani Rupee (`PKR` - ₨)**
- 🇦🇪 **UAE Dirham (`AED` - AED)**
- 🇨🇦 **Canadian Dollar (`CAD` - C$)**
- 🇯🇵 **Japanese Yen (`JPY` - ¥)**

### Capabilities:
- **Instant Live Rate Ticker:** Real-time FX exchange rate pegs.
- **Direct Multi-Currency Balances:** Dedicated accounts per currency with real-time conversion.
- **Strict Double-Entry Ledger:** Every transaction balances debits and credits ($\sum \text{Debits} \equiv \sum \text{Credits}$).
- **Integer Minor Units:** Prevents floating-point rounding errors (e.g. cents, paise, yen).

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
# Install root dependencies:
npm install

# Install server dependencies:
npm install --prefix server

# Install client dependencies:
npm install --prefix client
```

### 2. Run Both Server & Client
```bash
npm run dev
```
- **Frontend Web UI:** `http://localhost:5173`
- **Backend API:** `http://localhost:5001/api/v1`
- **Health Check:** `http://localhost:5001/api/health`

### 3. Run Test Suites
```bash
npm test
# Or run individually:
npm run test:server    # Server unit & integration tests
npm run test:client    # Client test suites
```

---

## 🛡️ Security & Idempotency Safeguards

- **Idempotency Headers:** Mutation endpoints enforce `Idempotency-Key` headers to prevent duplicate executions.
- **Cryptographic Receipts:** Every journal entry and transaction generates a deterministic SHA-256 fingerprint hex.
- **Audit Logging:** Append-only compliance log captures all actions, IP addresses, actors, and state diffs.
- **ACID Double-Entry Transactions:** Multi-leg journal entries commit atomically to guarantee financial integrity.
