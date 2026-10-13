import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthAPI } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import { SimulatorBadge } from '../components/common/SimulatorBadge';
import { Shield, KeyRound, Award, CheckCircle2, User, Clock } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [pin, setPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);
  const [upgradingKyc, setUpgradingKyc] = useState(false);
  const { addToast } = useToast();

  const handlePinUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      addToast({ type: 'error', title: 'Invalid PIN', message: 'PIN must be exactly 4 digits' });
      return;
    }

    setSavingPin(true);
    try {
      await AuthAPI.updatePin(pin);
      addToast({ type: 'success', title: 'PIN Updated', message: 'Your simulated transfer PIN was saved.' });
      setPin('');
      refreshUser();
    } catch (err: any) {
      addToast({ type: 'error', title: 'PIN Update Failed', message: err.message });
    } finally {
      setSavingPin(false);
    }
  };

  const handleKycUpgrade = async () => {
    setUpgradingKyc(true);
    try {
      await AuthAPI.upgradeKyc();
      addToast({
        type: 'success',
        title: 'KYC Upgraded!',
        message: 'Your simulated account is now Tier 2 Verified with $50,000.00 daily limits.'
      });
      refreshUser();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Upgrade Failed', message: err.message });
    } finally {
      setUpgradingKyc(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Profile & Institutional Compliance</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Verified enterprise identity, step-up security PIN, and unlimited clearing parameters
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Identity Overview */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg">
              {user?.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{user?.fullName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>Account Role:</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {user?.role}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>Network Status:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ENTERPRISE LIVE CORE</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>Member Since:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}
              </span>
            </div>
          </div>
        </div>

        {/* KYC Tier Card */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400">Compliance Status</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                <Award className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span>Enterprise Verified (Unlimited)</span>
              </h3>
            </div>
            <SimulatorBadge text="INSTITUTIONAL TIER" />
          </div>

          <div className="p-3.5 bg-slate-100/80 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 space-y-2 font-mono">
            <div className="flex justify-between">
              <span>Daily Transfer Limit:</span>
              <strong className="text-emerald-600 dark:text-emerald-400">
                Unlimited (No Daily Caps)
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Outbound Clearing Capacity:</span>
              <strong className="text-emerald-600 dark:text-emerald-400">
                Unrestricted RTGS / FedWire
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Virtual Cards Allowed:</span>
              <strong className="text-slate-900 dark:text-white">
                Unlimited Cards
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 pt-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Full Clearinghouse Clearance Enabled</span>
          </div>
        </div>
      </div>

      {/* Simulated PIN Configuration */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Simulated Step-Up Authorization PIN</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Required for high-value simulated wire transfers. Default PIN is <strong className="text-slate-800 dark:text-slate-200">1234</strong>.
            </p>
          </div>
        </div>

        <form onSubmit={handlePinUpdate} className="flex flex-col sm:flex-row gap-3 max-w-md">
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter new 4-digit PIN"
            required
            className="flex-1 glass-input rounded-xl py-2.5 px-4 text-sm font-mono tracking-widest placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={savingPin}
            className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all shrink-0 disabled:opacity-50"
          >
            {savingPin ? 'Saving...' : 'Update PIN'}
          </button>
        </form>
      </div>
    </div>
  );
};
