import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BeneficiariesAPI } from '../api/endpoints';
import { BeneficiaryDTO } from '@shared/types/account.types';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { Users, Plus, Trash2, Send, Building2, User } from 'lucide-react';

export const BeneficiariesPage: React.FC = () => {
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'INTERNAL_NEXAPAY' | 'EXTERNAL_BANK'>('INTERNAL_NEXAPAY');
  const [identifier, setIdentifier] = useState('');
  const [routingOrBic, setRoutingOrBic] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'INR'>('USD');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const loadBeneficiaries = async () => {
    setLoading(true);
    try {
      const data = await BeneficiariesAPI.list();
      setBeneficiaries(data);
    } catch (err) {
      console.error('Failed to load beneficiaries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await BeneficiariesAPI.create({
        name,
        type,
        identifier,
        routingOrBic: routingOrBic || undefined,
        institutionName: institutionName || undefined,
        currency
      });
      setBeneficiaries((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setName('');
      setIdentifier('');
      setRoutingOrBic('');
      setInstitutionName('');
      addToast({
        type: 'success',
        title: 'Beneficiary Saved',
        message: `${created.name} added to your address book.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error Saving Contact',
        message: err.response?.data?.error?.message || err.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await BeneficiariesAPI.delete(id);
      setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
      addToast({ type: 'info', title: 'Beneficiary Removed', message: `${name} was removed.` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to Remove', message: err.message });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Beneficiaries Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Saved counterparty accounts for 1-click P2P and global wire transfers
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Beneficiary</span>
        </button>
      </div>

      {beneficiaries.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <Users className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Saved Beneficiaries</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">Save internal Bank of Maldives accounts or mock external banks for faster transfers.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20"
          >
            Add First Contact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {beneficiaries.map((b) => (
            <div
              key={b.id}
              className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      {b.type === 'INTERNAL_NEXAPAY' ? <User className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> : <Building2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{b.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{b.identifier}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                    {b.currency}
                  </span>
                </div>

                {b.type === 'EXTERNAL_BANK' && (
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 text-xs font-mono text-slate-500 dark:text-slate-400 space-y-1">
                    <p>Bank: <strong className="text-slate-800 dark:text-slate-200">{b.institutionName || 'External Bank'}</strong></p>
                    {b.routingOrBic && <p>Routing: <strong className="text-slate-800 dark:text-slate-200">{b.routingOrBic}</strong></p>}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => navigate('/transfers')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span>Send Money</span>
                </button>
                <button
                  onClick={() => handleDelete(b.id, b.name)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  title="Remove beneficiary"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD BENEFICIARY MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Beneficiary">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('INTERNAL_NEXAPAY')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                type === 'INTERNAL_NEXAPAY'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'bg-slate-100 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Bank of Maldives Customer
            </button>
            <button
              type="button"
              onClick={() => setType('EXTERNAL_BANK')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                type === 'EXTERNAL_BANK'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'bg-slate-100 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              External Bank
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Recipient Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Darren Trader"
              required
              className="w-full glass-input rounded-xl py-2.5 px-3 text-xs placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {type === 'INTERNAL_NEXAPAY' ? 'Email or Account Number' : 'Account Number'}
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={type === 'INTERNAL_NEXAPAY' ? '7701928341 or forextradingplatformfxe@gmail.com' : '883910245'}
              required
              className="w-full glass-input rounded-xl py-2.5 px-3 text-xs font-mono placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {type === 'EXTERNAL_BANK' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Bank Name</label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. JPMorgan Chase Bank, N.A."
                  className="w-full glass-input rounded-xl py-2.5 px-3 text-xs placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Routing Number or BIC/SWIFT</label>
                <input
                  type="text"
                  value={routingOrBic}
                  onChange={(e) => setRoutingOrBic(e.target.value)}
                  placeholder="e.g. 021000021 or CHASUS33"
                  className="w-full glass-input rounded-xl py-2.5 px-3 text-xs font-mono placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="w-full glass-input rounded-xl py-2.5 px-3 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹ — Indian Rupee)</option>
              <option value="PKR">PKR (₨ — Pakistani Rupee)</option>
              <option value="AED">AED (AED — UAE Dirham)</option>
              <option value="CAD">CAD (CA$)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving Contact...' : 'Save Beneficiary'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
