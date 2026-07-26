import React, { useState, useEffect, useRef } from 'react';
import { 
  IndianRupee, 
  Search, 
  PlusCircle, 
  Calendar, 
  Wallet, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  X,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { api } from '../lib/api.js';

export default function Payments() {
  // Master lists
  const [payments, setPayments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(10);

  // Recording modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  
  // Balance checking
  const [memberOutstanding, setMemberOutstanding] = useState<number>(0);
  const [outstandingLoading, setOutstandingLoading] = useState(false);

  // Form inputs
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'OTHER'>('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paidAt, setPaidAt] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Submit states
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch initial payment lists
  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get(`/payments?page=${page}&pageSize=${pageSize}&search=${debouncedSearch}`);
      setPayments(res);
      setTotalRecords(res.length > 0 ? (res[0]._total || 30) : 0); // fallback for seed count
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch payments history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [debouncedSearch, page]);

  // Fetch active member master list for modal select
  useEffect(() => {
    if (!modalOpen) return;
    const fetchMembers = async () => {
      try {
        const memList = await api.get<any[]>('/members?pageSize=100');
        setMembers(memList);
      } catch (err) {
        console.error('Failed to fetch members.', err);
      }
    };
    fetchMembers();
  }, [modalOpen]);

  // Fetch outstanding balance when member changes
  useEffect(() => {
    if (!selectedMember) {
      setMemberOutstanding(0);
      return;
    }
    const fetchOutstanding = async () => {
      setOutstandingLoading(true);
      try {
        const mem = await api.get<any>(`/members/${selectedMember.id}`);
        setMemberOutstanding(mem.outstandingBalance);
      } catch (err) {
        console.error('Error fetching member details.', err);
      } finally {
        setOutstandingLoading(false);
      }
    };
    fetchOutstanding();
  }, [selectedMember]);

  // Handle dropdown outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMemberDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !amount) return;

    const amtFloat = parseFloat(amount);
    if (amtFloat <= 0) {
      setFieldErrors({ amount: 'Payment amount must be greater than zero.' });
      return;
    }

    if (amtFloat > memberOutstanding) {
      setFieldErrors({ amount: `Payment exceeds farmer outstanding balance of ₹${memberOutstanding.toFixed(2)}.` });
      return;
    }

    setSaving(true);
    setFieldErrors({});
    setServerError(null);

    try {
      const result: any = await api.post('/payments', {
        memberId: selectedMember.id,
        amount: amtFloat,
        method: paymentMethod,
        referenceNumber: referenceNumber || null,
        paidAt: new Date(paidAt).toISOString(),
        notes
      });
      setSuccessReceipt(result);
      fetchPayments(); // refresh list
    } catch (err: any) {
      console.error(err);
      if (err.statusCode === 400 && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        setServerError(err.message || 'Failed to save payment.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedMember(null);
    setAmount('');
    setReferenceNumber('');
    setNotes('');
    setFieldErrors({});
    setServerError(null);
    setSuccessReceipt(null);
  };

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.memberCode.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Header with search and Record action */}
      <div className="bg-surface-white border border-border-custom rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search payments by receipt, reference, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-custom bg-warm-cream/30 focus:border-action-green focus:outline-none transition-colors text-xs"
          />
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-action-green hover:bg-primary-green text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer w-full sm:w-auto justify-center"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          Record Member Payment
        </button>
      </div>

      {/* 2. Payments Register Table */}
      <div className="bg-surface-white border border-border-custom rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-24 space-y-4 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-green" />
              <span className="text-xs text-text-muted">Loading payments history...</span>
            </div>
          ) : error ? (
            <div className="py-24 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-error-red mx-auto" />
              <p className="text-xs text-text-muted font-bold">{error}</p>
            </div>
          ) : payments.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-custom bg-warm-cream/25 text-text-muted uppercase font-bold tracking-wider">
                  <th className="px-6 py-3.5">Payment Ref</th>
                  <th className="px-6 py-3.5">Paid Date</th>
                  <th className="px-6 py-3.5">Farmer Name</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Transaction Ref</th>
                  <th className="px-6 py-3.5 text-right">Amount Paid</th>
                  <th className="px-6 py-3.5">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/50 text-text-dark font-medium">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-warm-cream/20">
                    <td className="px-6 py-3.5 font-mono font-bold">{p.paymentNumber}</td>
                    <td className="px-6 py-3.5 whitespace-nowrap">{new Date(p.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-3.5">
                      <div className="font-bold">{p.member.fullName}</div>
                      <span className="text-[10px] text-text-muted">{p.member.memberCode}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-[4px] text-[9px]">
                        {p.method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono">{p.referenceNumber || '--'}</td>
                    <td className="px-6 py-3.5 text-right text-action-green font-extrabold">₹{p.amount.toFixed(2)}</td>
                    <td className="px-6 py-3.5 text-text-muted">{p.recordedBy.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-24 text-center space-y-3">
              <span className="text-xl">📭</span>
              <p className="text-xs text-text-muted font-bold">No payments records found.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Record Payment Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal} />
          
          <div className="relative w-full max-w-md bg-surface-white border border-border-custom rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 success-pop">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border-custom/50 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary-green" />
                <h4 className="font-bold text-primary-green text-sm font-display">Record Member Payment</h4>
              </div>
              <button onClick={handleCloseModal} className="p-1 hover:bg-warm-cream rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {successReceipt ? (
              /* Success confirmation within modal */
              <div className="space-y-6 text-center">
                <div className="w-12 h-12 bg-action-green/10 rounded-full flex items-center justify-center mx-auto text-action-green success-pop">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-wide bg-action-green/10 text-action-green px-2 py-0.5 rounded">
                    Payment Saved Successfully
                  </span>
                  <p className="text-xs text-text-muted mt-1">Ref ID: <code className="font-mono bg-warm-cream px-1.5 py-0.5 rounded">{successReceipt.payment.paymentNumber}</code></p>
                </div>

                <div className="bg-warm-cream/50 rounded-lg p-4 border border-border-custom text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-muted font-bold">Farmer:</span>
                    <span className="font-bold text-text-dark">{successReceipt.payment.member.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted font-bold">Amount Paid:</span>
                    <span className="font-bold text-action-green">₹{successReceipt.payment.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border-custom/50 pt-2 font-bold text-primary-green">
                    <span>New Balance Due:</span>
                    <span>₹{successReceipt.outstandingAfter.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCloseModal}
                  className="w-full py-2.5 bg-primary-green hover:bg-action-green text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Close & Done
                </button>
              </div>
            ) : (
              /* Payment form */
              <form onSubmit={handleSavePayment} className="space-y-4">
                {serverError && (
                  <div className="p-3 bg-error-red/10 border border-error-red/20 text-error-red text-xs rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Farmer search dropdown selector */}
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    Select Farmer
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      placeholder={selectedMember ? `${selectedMember.fullName} (${selectedMember.memberCode})` : "Type name or code..."}
                      value={memberSearch}
                      onChange={(e) => {
                        setMemberSearch(e.target.value);
                        setMemberDropdownOpen(true);
                      }}
                      onFocus={() => setMemberDropdownOpen(true)}
                      className="w-full pl-8 pr-4 py-2 rounded-lg border border-border-custom bg-warm-cream/20 text-xs focus:outline-none focus:border-action-green"
                    />
                  </div>

                  {memberDropdownOpen && (
                    <div className="absolute z-30 w-full mt-1 bg-surface-white border border-border-custom rounded-lg shadow-lg max-h-40 overflow-y-auto divide-y divide-border-custom/40">
                      {filteredMembers.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedMember(m);
                            setMemberSearch('');
                            setMemberDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-warm-cream/50 transition-colors text-xs flex justify-between"
                        >
                          <span className="font-bold text-text-dark">{m.fullName} ({m.memberCode})</span>
                          <span className="text-[10px] text-text-muted">{m.village}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live Outstanding Due Balance Indicator */}
                {selectedMember && (
                  <div className="p-3 bg-warm-cream/50 border border-border-custom rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-text-muted font-bold">
                      <CreditCard className="w-4 h-4 text-primary-green" />
                      Outstanding Due:
                    </div>
                    {outstandingLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary-green" />
                    ) : (
                      <span className="font-bold text-error-red">₹{memberOutstanding.toFixed(2)}</span>
                    )}
                  </div>
                )}

                {/* Payment Amount */}
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    Payment Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border bg-warm-cream/20 text-xs focus:outline-none focus:border-action-green ${
                      fieldErrors.amount ? 'border-error-red' : 'border-border-custom'
                    }`}
                    disabled={!selectedMember}
                    required
                  />
                  {fieldErrors.amount && <p className="text-[9px] text-error-red mt-1">{fieldErrors.amount}</p>}
                </div>

                {/* Method */}
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-border-custom bg-warm-cream/20 text-xs focus:outline-none focus:border-action-green"
                    disabled={!selectedMember}
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Trans Reference Code */}
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    Reference / Transaction ID
                  </label>
                  <input
                    type="text"
                    placeholder="TXN123456"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-custom bg-warm-cream/20 text-xs focus:outline-none focus:border-action-green"
                    disabled={!selectedMember}
                  />
                </div>

                {/* Paid At */}
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    Payment Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-text-muted" />
                    <input
                      type="date"
                      value={paidAt}
                      onChange={(e) => setPaidAt(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-border-custom bg-warm-cream/20 text-xs focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    Internal Notes
                  </label>
                  <textarea
                    placeholder="Internal reference details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={1.5}
                    className="w-full p-2 border border-border-custom rounded bg-warm-cream/20 text-xs resize-none focus:outline-none"
                  />
                </div>

                {/* Final Estimator */}
                {selectedMember && amount && !fieldErrors.amount && (
                  <div className="text-[10px] text-text-muted font-bold text-right pt-2">
                    Remaining Balance after Payment: ₹{preciseDiff(memberOutstanding, parseFloat(amount))}
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-border-custom/50">
                  <button
                    type="submit"
                    disabled={saving || !selectedMember || !amount}
                    className="flex-1 py-2 bg-primary-green hover:bg-action-green disabled:bg-primary-green/60 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving Payment...
                      </>
                    ) : (
                      'Save Payment'
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

function preciseDiff(a: number, b: number): string {
  const diff = Math.max(0, a - b);
  return (Math.round(diff * 100) / 100).toFixed(2);
}
