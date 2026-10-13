import React, { useState, useEffect } from 'react';
import { directoryApi, InstitutionItem } from '../api/directory.api';
import { CopyButton } from '../components/common/CopyButton';
import { Input } from '../components/common/Input';
import { Building2, Search, Globe, ShieldCheck } from 'lucide-react';

export const DirectoryPage: React.FC = () => {
  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRail, setSelectedRail] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    directoryApi.searchInstitutions().then((res) => {
      setInstitutions(res.institutions);
      setIsLoading(false);
    });
  }, []);

  const filtered = institutions.filter((inst) => {
    const matchesQuery =
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.routingNumber.includes(searchQuery) ||
      inst.bicSwift.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.country.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRail = selectedRail === 'ALL' || inst.supportedRail === selectedRail;

    return matchesQuery && matchesRail;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
            Global Financial Institutions & Clearing Network
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            Real-time Tier-1 correspondent banking network across SWIFT, FedWire, SEPA Instant, CHAPS & Faster Payments
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
          <Globe className="w-4 h-4" />
          <span>Active Clearing Nodes</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by bank name, routing number, BIC/SWIFT, or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'WIRE', 'ACH', 'SEPA', 'FASTER_PAYMENTS'].map((rail) => (
            <button
              key={rail}
              onClick={() => setSelectedRail(rail)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                selectedRail === rail
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {rail === 'ALL' ? 'All Rails' : rail}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Loading clearing directory...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono text-xs">
          No mock institutions match your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((inst) => (
            <div
              key={inst.routingNumber}
              className="glass-panel glass-panel-hover rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between group transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {inst.supportedRail}
                  </span>
                  <span className="text-xs font-mono text-slate-700 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-transparent">
                    {inst.country}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {inst.name}
                </h3>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mt-0.5">
                  Currencies: {inst.supportedCurrencies.join(', ')}
                </span>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Routing Number:</span>
                  <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold">
                    <span>{inst.routingNumber}</span>
                    <CopyButton textToCopy={inst.routingNumber} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>SWIFT / BIC:</span>
                  <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-300 font-bold">
                    <span>{inst.bicSwift}</span>
                    <CopyButton textToCopy={inst.bicSwift} />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                    Clearing: {inst.networkStatus}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400/90 font-semibold">Direct Participant</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
