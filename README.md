# Bank of Maldives — Multi-Currency Banking & Forex Ledger Platform

> **Bank of Maldives Internet Banking Simulator**  
> Fictional multi-currency banking sandbox and double-entry ledger platform with live market foreign exchange rates, enterprise accounts, virtual card controls, and cryptographic audit receipts.

---

## 🏛️ System Architecture

This repository is organized into two completely self-contained subfolders for simple, turnkey deployment:

- **`client/`**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, React Router v6, with its own self-contained types and models.
- **`server/`**: Node.js, Express, TypeScript, Mongoose, Double-Entry General Ledger, in-memory MongoDB replica set, with its own self-contained types and models.

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

---

## 🚀 Easy Hosting & Deployment

Both `client` and `server` are completely self-contained with their own internal `shared` models and types:

### 1. Deploy Frontend on Vercel
1. In your **Vercel Dashboard**, click **Add New Project** and import the GitHub repo `CurrencyConverter-`.
2. Configure Project Settings:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://currencyconverter-vv8m.onrender.com` (already pre-configured in `client/.env.production`)
4. Click **Deploy**. SPA rewrites are already handled automatically by [`client/vercel.json`](file:///Users/shubhamkumarsingh/Desktop/currencyconverter/client/vercel.json).

### 2. Deploy Backend on Render
1. In your **Render Dashboard**, click **New +** -> **Web Service**.
2. Connect the GitHub repo `CurrencyConverter-`.
3. Configure Service:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5001`
   - `JWT_SECRET`: *(Any secret string)*
   - `JWT_REFRESH_SECRET`: *(Any secret string)*
   - `CLIENT_ORIGIN`: `https://your-vercel-app-url.vercel.app` (or `*` to allow all)
   - `MONGODB_URI`: *(Optional: Leave empty for automated in-memory MongoDB replica set or provide MongoDB Atlas URI)*
5. Click **Create Web Service**. *(A `render.yaml` blueprint is also included for 1-click blueprint deploy).*

