import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  CreditCard,
  Building2,
  Droplets,
  Settings,
  ShieldCheck,
  Users,
  UserCircle,
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation: Array<{ name: string; href: string; icon: React.ElementType; highlight?: boolean }> = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Accounts', href: '/accounts', icon: Wallet },
    { name: 'Transfers & FX', href: '/transfers', icon: ArrowLeftRight },
    { name: 'Virtual Cards', href: '/cards', icon: CreditCard },
    { name: 'Beneficiaries', href: '/beneficiaries', icon: Users },
    { name: 'Global Institutions', href: '/directory', icon: Building2 },
    { name: 'Treasury Influx', href: '/faucet', icon: Droplets, highlight: true },
    { name: 'Settings & Compliance', href: '/settings', icon: Settings },
    { name: 'My Profile', href: '/profile', icon: UserCircle }
  ];

  if (isAdmin) {
    navigation.push({ name: 'Ledger Audit (Admin)', href: '/admin', icon: ShieldCheck, highlight: false });
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 glass-panel bg-white/95 dark:bg-slate-950/95 lg:bg-white/90 dark:lg:bg-slate-950/80 border-r border-slate-200 dark:border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800/80">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-[#E11932] to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-105 transition-transform flex-shrink-0">
              <span className="text-white font-black text-xs tracking-wider font-mono">BML</span>
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-[15px] leading-tight text-slate-900 dark:text-white tracking-tight block truncate">
                Bank of Maldives
              </span>
              <span className="block text-[9px] font-mono text-red-600 dark:text-red-400 font-bold tracking-wider uppercase">
                Internet Banking
              </span>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/80'
                } ${item.highlight ? 'relative' : ''}`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
              <span>{item.name}</span>
              {item.highlight && (
                <span className="ml-auto text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  TREASURY
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Mini Profile Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-sm text-emerald-600 dark:text-emerald-400 shadow-sm">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.fullName}</p>
              <span className="inline-block text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                Enterprise Tier (Unlimited)
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
