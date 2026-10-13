import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      success('Welcome back!', 'Authenticated into Bank of Maldives Internet Banking session.');
      navigate('/dashboard');
    } catch (err: any) {
      error(
        'Login Failed',
        err.response?.data?.error?.message || err.message || 'Invalid credentials'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
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

      {/* Top simulator disclaimer badge */}
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
          Internet Banking • Multi-Currency Ledger Platform
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md glass-panel bg-white/95 dark:bg-slate-900/90 rounded-2xl border-slate-200 dark:border-slate-800 p-8 shadow-2xl relative z-10 animate-scale-up">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">Internet Banking Sign In</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Log in with a seeded BML account or your registered credentials.
        </p>

        {/* Quick Fill Demo Presets */}
        <div className="mb-6 p-3 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            Quick Demo Auto-Fill:
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => fillCredentials('forextradingplatformfxe@gmail.com', 'Darren Trader')}
              className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700/60 text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all text-center shadow-sm"
              title="Auto-fill Darren Trader credentials"
            >
              <span className="block font-bold text-emerald-600 dark:text-emerald-400 text-sm">Darren Trader</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Forex VIP (forextradingplatformfxe@gmail.com)</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('admin@bankofmaldives.com.mv', 'AdminPassword123!')}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all text-center shadow-sm"
              title="Auto-fill Admin credentials"
            >
              <span className="block font-bold text-amber-600 dark:text-amber-400 text-sm">Admin</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Auditor</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address or Account ID"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="forextradingplatformfxe@gmail.com"
            required
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Password"
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
            Sign In to BML Internet Banking
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          Don't have a demo account?{' '}
          <Link to="/register" className="text-red-500 hover:underline font-semibold">
            Register New Account (Free $1,000 Bonus)
          </Link>
        </div>
      </div>
    </div>
  );
};
