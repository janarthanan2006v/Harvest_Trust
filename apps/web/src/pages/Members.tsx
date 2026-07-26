import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  PlusCircle, 
  UserPlus, 
  MapPin, 
  Phone, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  AlertCircle, 
  Loader2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { api } from '../lib/api.js';

export default function Members() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Paging
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Add Member Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [memberCode, setMemberCode] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMember, setSuccessMember] = useState<any>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get(
        `/members?page=${page}&pageSize=${pageSize}&search=${debouncedSearch}&isActive=${isActive}`
      );
      setMembers(res);
      // Fallback total count using response meta
      setTotalRecords(res.length > 0 ? (res[0]._total || 30) : 0);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load members catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [debouncedSearch, isActive, page]);

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !memberCode) return;

    setSaving(true);
    setFieldErrors({});
    setServerError(null);

    try {
      const payload = {
        fullName,
        memberCode: memberCode.toUpperCase(),
        phone: phone || undefined,
        village: village || undefined
      };

      const result = await api.post('/members', payload);
      setSuccessMember(result);
      fetchMembers(); // refresh main list
    } catch (err: any) {
      console.error(err);
      if (err.statusCode === 400 && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        setServerError(err.message || 'An error occurred while creating member.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFullName('');
    setMemberCode('');
    setPhone('');
    setVillage('');
    setFieldErrors({});
    setServerError(null);
    setSuccessMember(null);
  };

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  return (
    <div className="space-y-6">
      {/* 1. Header with Filters & Record action */}
      <div className="bg-surface-white border border-border-custom rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search by code, name, village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-custom bg-warm-cream/30 focus:border-action-green focus:outline-none transition-colors text-xs"
            />
          </div>
          <div className="flex items-center gap-2 border border-border-custom bg-warm-cream/10 px-3 py-2 rounded-lg">
            <input
              type="checkbox"
              id="activeFilter"
              checked={isActive}
              onChange={(e) => { setIsActive(e.target.checked); setPage(1); }}
              className="w-4 h-4 rounded text-action-green accent-action-green"
            />
            <label htmlFor="activeFilter" className="text-xs font-bold text-text-dark select-none cursor-pointer">
              Active Members Only
            </label>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-action-green hover:bg-primary-green text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer w-full sm:w-auto justify-center"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          Add New Farmer
        </button>
      </div>

      {/* 2. Members Catalogue Table */}
      <div className="bg-surface-white border border-border-custom rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-24 space-y-4 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-green" />
              <span className="text-xs text-text-muted">Loading members list...</span>
            </div>
          ) : error ? (
            <div className="py-24 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-error-red mx-auto" />
              <p className="text-xs text-text-muted font-bold">{error}</p>
            </div>
          ) : members.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-custom bg-warm-cream/25 text-text-muted uppercase font-bold tracking-wider">
                  <th className="px-6 py-3.5">Member Code</th>
                  <th className="px-6 py-3.5">Full Name</th>
                  <th className="px-6 py-3.5">Village</th>
                  <th className="px-6 py-3.5">Phone Number</th>
                  <th className="px-6 py-3.5 text-right">Total Weight</th>
                  <th className="px-6 py-3.5 text-right">Total Value</th>
                  <th className="px-6 py-3.5 text-right">Paid Amount</th>
                  <th className="px-6 py-3.5 text-right">Outstanding</th>
                  <th className="px-6 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/50 text-text-dark font-medium">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-warm-cream/20 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold">{m.memberCode}</td>
                    <td className="px-6 py-3.5 font-bold">{m.fullName}</td>
                    <td className="px-6 py-3.5 flex items-center gap-1.5 pt-4">
                      <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span>{m.village || '--'}</span>
                    </td>
                    <td className="px-6 py-3.5 font-mono">{m.phone || '--'}</td>
                    <td className="px-6 py-3.5 text-right font-bold">{m.totalDelivered ? `${m.totalDelivered.toLocaleString('en-IN')} kg` : '0 kg'}</td>
                    <td className="px-6 py-3.5 text-right font-bold">₹{m.totalDelivered ? m.totalDelivered.toLocaleString('en-IN') : '0.00'}</td>
                    <td className="px-6 py-3.5 text-right text-action-green font-bold">₹{m.totalPaid ? m.totalPaid.toLocaleString('en-IN') : '0.00'}</td>
                    <td className="px-6 py-3.5 text-right text-error-red font-extrabold font-mono">₹{m.outstandingBalance ? m.outstandingBalance.toLocaleString('en-IN') : '0.00'}</td>
                    <td className="px-6 py-3.5 text-center">
                      <Link
                        to={`/members/${m.id}`}
                        className="px-3 py-1.5 bg-primary-green/10 text-primary-green hover:bg-primary-green hover:text-white rounded text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        Ledger Statement
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-24 text-center space-y-3">
              <span className="text-xl">📭</span>
              <p className="text-xs text-text-muted font-bold">No farmer members found matching filters.</p>
            </div>
          )}
        </div>

        {/* Pagination controls */}
        {!loading && members.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border-custom bg-warm-cream/10 text-xs">
            <span className="text-text-muted font-semibold">
              Showing Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-border-custom rounded-lg hover:bg-warm-cream/50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-border-custom rounded-lg hover:bg-warm-cream/50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Add Member Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal} />
          
          <div className="relative w-full max-w-md bg-surface-white border border-border-custom rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 success-pop">
            
            <div className="flex items-center justify-between border-b border-border-custom/50 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary-green" />
                <h4 className="font-bold text-primary-green text-sm font-display">Register Farmer Profile</h4>
              </div>
              <button onClick={handleCloseModal} className="p-1 hover:bg-warm-cream rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMember ? (
              <div className="space-y-6 text-center">
                <div className="w-12 h-12 bg-action-green/10 rounded-full flex items-center justify-center mx-auto text-action-green success-pop">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-wide bg-action-green/10 text-action-green px-2.5 py-0.5 rounded animate-pulse">
                    Registration Completed
                  </span>
                  <h5 className="font-bold text-primary-green mt-1 text-sm">{successMember.fullName}</h5>
                  <p className="text-xs text-text-muted">Farmer Code: <code className="font-mono bg-warm-cream px-1.5 py-0.5 rounded font-bold">{successMember.memberCode}</code></p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="w-full py-2.5 bg-primary-green hover:bg-action-green text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveMember} className="space-y-4">
                {serverError && (
                  <div className="p-3 bg-error-red/10 border border-error-red/20 text-error-red text-xs rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Farmer Code */}
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    Farmer Code (e.g. MEM031)
                  </label>
                  <input
                    type="text"
                    placeholder="MEMXXX"
                    value={memberCode}
                    onChange={(e) => setMemberCode(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border bg-warm-cream/20 text-xs focus:outline-none focus:border-action-green ${
                      fieldErrors.memberCode ? 'border-error-red' : 'border-border-custom'
                    }`}
                    required
                  />
                  {fieldErrors.memberCode && <p className="text-[9px] text-error-red mt-1">{fieldErrors.memberCode}</p>}
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Ramesh Pillai"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-custom bg-warm-cream/20 text-xs focus:outline-none focus:border-action-green"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    Phone Number (Indian 10-digit)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 w-4 h-4 text-text-muted" />
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full pl-8 pr-3 py-2 rounded-lg border bg-warm-cream/20 text-xs focus:outline-none focus:border-action-green ${
                        fieldErrors.phone ? 'border-error-red' : 'border-border-custom'
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && <p className="text-[9px] text-error-red mt-1">{fieldErrors.phone}</p>}
                </div>

                {/* Village */}
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    Village Name
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Melpuram"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-border-custom bg-warm-cream/20 text-xs focus:outline-none focus:border-action-green"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-border-custom/50">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 bg-primary-green hover:bg-action-green disabled:bg-primary-green/60 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving Profile...
                      </>
                    ) : (
                      'Save Farmer Profile'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-border-custom hover:bg-warm-cream text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
