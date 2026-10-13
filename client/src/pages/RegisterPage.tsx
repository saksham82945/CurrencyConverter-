import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2, Gift } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      error('Password Too Short', 'Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(fullName, email, password);
      success('Welcome to Bank of Maldives! 🎉', 'Your Internet Banking accounts are ready with $1,000.00 bonus!');
      navigate('/dashboard');
    } catch (err: any) {
      error('Registration Failed', err.response?.data?.error?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-fintech-dark flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden transition-colors duration-200">
      {/* Top right Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle size="sm" showLabel={true} />
      </div>

      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="mb-8 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-mono font-semibold mb-4">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          BANK OF MALDIVES • INTERNET BANKING
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 via-[#E11932] to-rose-600 flex items-center justify-center shadow-xl shadow-red-500/25">
            <span className="text-white font-black text-sm tracking-wider font-mono">BML</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bank of <span className="text-red-600">Maldives</span>
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
          Instant Account Provisioning & Double-Entry Ledger Onboarding
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md glass-panel bg-white/95 dark:bg-slate-900/90 rounded-2xl border-slate-200 dark:border-slate-800 p-8 shadow-2xl relative z-10 animate-scale-up">
        <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <Gift className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-red-600 dark:text-red-400 block">Instant Onboarding Benefits:</span>
            <span className="text-slate-600 dark:text-slate-300">
              Auto-created Multi-Currency Checking + Savings accounts and an instant $1,000.00 simulated welcome bonus!
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            required
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="forextradingplatformfxe@gmail.com"
            required
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Password (min 6 chars)"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            leftIcon={<Lock className="w-4 h-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-white p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 mt-2 bg-[#E11932] hover:bg-[#B31023] text-white font-bold"
            isLoading={isSubmitting}
          >
            Open Bank of Maldives Account
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-red-500 hover:underline font-semibold">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
