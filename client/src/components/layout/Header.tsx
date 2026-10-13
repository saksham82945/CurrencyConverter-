import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { ThemeToggle } from '../common/ThemeToggle';
import { Menu, LogOut, Droplets, ShieldCheck, User } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between gap-4 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">Portal: </span>
          <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded border border-red-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            BANK OF MALDIVES • INTERNET BANKING
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Faucet trigger button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/faucet')}
          leftIcon={<Droplets className="w-3.5 h-3.5" />}
          className="hidden sm:inline-flex text-xs"
        >
          Treasury Influx
        </Button>

        {/* Theme Toggle Button */}
        <ThemeToggle size="sm" />

        {/* KYC & Admin Badges */}
        <div className="hidden md:flex items-center gap-2">
          {isAdmin && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              ADMIN AUDITOR
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Enterprise Tier (Unlimited)
          </span>
        </div>

        {/* Profile / Logout */}
        <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2 sm:pl-3">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Account Settings"
            aria-label="Account Settings"
          >
            <User className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-600 dark:text-slate-400 hover:text-rose-500 transition-colors"
            title="Log out of demo"
            aria-label="Log out of demo"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
