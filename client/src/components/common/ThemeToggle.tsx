import React from 'react';
import { useTheme, Theme } from '../../context/ThemeContext';
import { Sun, Moon, Laptop } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  size = 'md',
  showLabel = false
}) => {
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-4.5 h-4.5';
  const padding = size === 'sm' ? 'p-1.5' : 'p-2';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${padding} ${
        isDark
          ? 'bg-slate-900/90 text-amber-300 hover:text-amber-200 hover:bg-slate-800 border border-slate-700/80 shadow-md shadow-black/20'
          : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-sm'
      } ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun
          className={`${iconSize} transition-all duration-500 transform ${
            isDark
              ? 'rotate-90 scale-0 opacity-0 absolute'
              : 'rotate-0 scale-100 opacity-100 text-amber-500'
          }`}
        />
        {/* Moon Icon */}
        <Moon
          className={`${iconSize} transition-all duration-500 transform ${
            isDark
              ? 'rotate-0 scale-100 opacity-100 text-indigo-300'
              : '-rotate-90 scale-0 opacity-0 absolute'
          }`}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono font-medium">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  );
};

export const ThemeSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();

  const options: Array<{ value: Theme; label: string; icon: React.ElementType; description: string }> = [
    {
      value: 'dark',
      label: 'Dark Mode',
      icon: Moon,
      description: 'Sleek neon cyber-banking with deep slate and glowing emerald'
    },
    {
      value: 'light',
      label: 'Light Mode',
      icon: Sun,
      description: 'Clean, high-contrast white & slate interface with crisp typography'
    },
    {
      value: 'system',
      label: 'System Preference',
      icon: Laptop,
      description: 'Automatically synchronizes with your device operating system'
    }
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between group ${
              isSelected
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/5'
                : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`p-2 rounded-xl ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`w-3 h-3 rounded-full border-2 transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-slate-300 dark:border-slate-600 bg-transparent'
                }`}
              />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                {opt.label}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                {opt.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
