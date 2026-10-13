import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ThemeSelector, ThemeToggle } from '../components/common/ThemeToggle';
import { Settings, ShieldCheck, Lock, User, CheckCircle2, SunMoon, Palette } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updatePin } = useAuth();
  const { success, error } = useToast();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      error('Invalid PIN', 'Transaction PIN must be exactly 4 digits.');
      return;
    }
    if (pin !== confirmPin) {
      error('PIN Mismatch', 'The PIN and confirmation do not match.');
      return;
    }

    setIsUpdatingPin(true);
    try {
      await updatePin(pin);
      success('PIN Updated! 🔒', 'Your simulated 4-digit transaction PIN is saved.');
      setPin('');
      setConfirmPin('');
    } catch (err: any) {
      error('PIN Update Failed', err.response?.data?.error?.message || err.message);
    } finally {
      setIsUpdatingPin(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-emerald-500" />
            Settings & Preferences
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            Manage your visual appearance, credentials, transaction PIN, and compliance verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Quick Toggle:</span>
          <ThemeToggle size="sm" showLabel={true} />
        </div>
      </div>

      {/* Theme & Appearance Section */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Palette className="w-4.5 h-4.5 text-emerald-500" />
              Interface Theme & Comfort
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select your preferred color scheme according to your eyes and environment comfortability.
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-semibold">
            Auto-Saved
          </span>
        </div>

        <ThemeSelector />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" />
            User Profile
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Full Name:</span>
              <span className="text-slate-900 dark:text-white font-semibold text-sm">{user?.fullName}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Email Address:</span>
              <span className="text-slate-900 dark:text-white font-semibold">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Role Permission:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{user?.role}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">User ID (Mongoose):</span>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] break-all">{user?.id}</span>
            </div>
          </div>
        </div>

        {/* KYC Verification Tier Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Enterprise Compliance & Verification
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
              UNLIMITED ENTERPRISE
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono space-y-2">
            <div className="flex justify-between">
              <span>Daily Transfer Limit:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Unlimited (Zero Volume Caps)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Outbound Wire Capacity:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Unrestricted Institutional Rail
              </span>
            </div>
            <div className="flex justify-between">
              <span>Virtual Debit Cards:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                Unlimited Active Cards
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 pt-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Full Institutional Clearance Enabled (Unlimited Volume)</span>
          </div>
        </div>

        {/* 4-Digit Step-Up PIN Setup */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 md:col-span-2">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              Simulated Transaction Security PIN
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Used for step-up verification on high-value transfers and full card PAN reveals.
            </p>
          </div>

          <form onSubmit={handleUpdatePin} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="New 4-Digit PIN"
              type="password"
              maxLength={4}
              placeholder="e.g. 5678"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />

            <Input
              label="Confirm 4-Digit PIN"
              type="password"
              maxLength={4}
              placeholder="e.g. 5678"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              required
            />

            <div className="sm:col-span-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                isLoading={isUpdatingPin}
                leftIcon={<Lock className="w-4 h-4" />}
              >
                Save Simulated PIN
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
