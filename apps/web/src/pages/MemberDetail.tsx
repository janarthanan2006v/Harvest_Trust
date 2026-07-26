import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  TrendingUp, 
  ArrowLeft,
  Printer, 
  AlertCircle,
  Loader2,
  FileCheck,
  TrendingDown
} from 'lucide-react';
import { api } from '../lib/api.js';

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Master states
  const [member, setMember] = useState<any>(null);
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statementLoading, setStatementLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date range filters for statement
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchMemberData = async () => {
    setLoading(true);
    setError(null);
    try {
      const memRes = await api.get<any>(`/members/${id}`);
      setMember(memRes);
      
      // Load initial statement
      setStatementLoading(true);
      const statRes = await api.get<any>(`/members/${id}/statement`);
      setStatement(statRes);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load member profile.');
    } finally {
      setLoading(false);
      setStatementLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberData();
  }, [id]);

  const handleQueryStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatementLoading(true);
    try {
      let query = `/members/${id}/statement`;
      if (fromDate || toDate) {
        query += '?';
        if (fromDate) query += `fromDate=${fromDate}`;
        if (fromDate && toDate) query += '&';
        if (toDate) query += `toDate=${toDate}`;
      }
      const res = await api.get<any>(query);
      setStatement(res);
    } catch (err) {
      console.error('Error fetching statement.', err);
    } finally {
      setStatementLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-24 space-y-4 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-green" />
        <span className="text-xs text-text-muted font-medium">Loading farmer profile...</span>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-surface-white border border-border-custom rounded-2xl p-8 shadow-sm">
        <AlertCircle className="w-12 h-12 text-error-red mb-3" />
        <h3 className="text-lg font-bold text-primary-green mb-1">Failed to load profile</h3>
        <p className="text-sm text-text-muted mb-6">{error}</p>
        <button 
          onClick={fetchMemberData}
          className="px-4 py-2 bg-primary-green text-white text-xs font-bold rounded-lg hover:bg-action-green transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button 
        onClick={() => navigate('/members')}
        className="flex items-center gap-1.5 text-text-muted hover:text-primary-green text-xs font-bold transition-colors cursor-pointer print:hidden"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Members list
      </button>

      {/* Member Details Header Card */}
      <div className="bg-surface-white border border-border-custom rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-green/10 rounded-full flex items-center justify-center text-primary-green shrink-0">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-primary-green font-display">{member.fullName}</h3>
            <span className="bg-warm-cream px-2 py-0.5 border border-border-custom rounded text-[10px] font-mono font-bold text-text-dark">
              Code: {member.memberCode}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-xs font-medium text-text-dark border-y md:border-y-0 md:border-x border-border-custom/50 py-4 md:py-0 md:px-6">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-text-muted" />
            <span>{member.phone || 'No phone number'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-text-muted" />
            <span>{member.village || 'No village specified'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-muted" />
            <span>Joined: {new Date(member.joinedOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Aggregated totals */}
        <div className="grid grid-cols-3 md:grid-cols-1 gap-4 text-center md:text-right">
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Value</span>
            <p className="text-sm font-extrabold text-text-dark">₹{member.totalDelivered.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Paid</span>
            <p className="text-sm font-extrabold text-action-green">₹{member.totalPaid.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Outstanding</span>
            <p className={`text-sm font-extrabold ${member.outstandingBalance > 0 ? 'text-error-red' : 'text-primary-green'}`}>
              ₹{member.outstandingBalance.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Date filter bar for Ledger statement */}
      <div className="bg-surface-white border border-border-custom rounded-2xl p-6 shadow-sm space-y-4 print:hidden">
        <h4 className="text-xs font-bold text-primary-green uppercase tracking-wider">Query Statement Range</h4>
        <form onSubmit={handleQueryStatement} className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 rounded-lg border border-border-custom bg-warm-cream/20 text-xs"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 rounded-lg border border-border-custom bg-warm-cream/20 text-xs"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-primary-green hover:bg-action-green text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            Update Ledger
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 border border-border-custom hover:bg-warm-cream/50 text-text-dark text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Ledger
          </button>
        </form>
      </div>

      {/* Account Statement Ledger Table */}
      <div className="bg-surface-white border border-border-custom rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between print:border-none print:shadow-none">
        
        {/* Print Brand header */}
        <div className="hidden print:flex justify-between items-start p-6 border-b border-border-custom mb-6">
          <div>
            <h1 className="text-xl font-bold text-primary-green">HarvestTrust Account Statement</h1>
            <p className="text-xs text-text-muted">Farmer Producer Ledger</p>
          </div>
          <div className="text-right text-xs space-y-1">
            <h2 className="font-bold text-text-dark">{member.fullName}</h2>
            <p>Member Code: {member.memberCode}</p>
            <p>{member.village}</p>
          </div>
        </div>

        {statementLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-green" />
            <span className="text-xs text-text-muted">Generating statement transactions...</span>
          </div>
        ) : statement ? (
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold text-text-dark border-b border-border-custom/50 pb-2">
                <span className="text-text-muted uppercase tracking-wider">Statement Period:</span>
                <span>
                  {statement.fromDate ? new Date(statement.fromDate).toLocaleDateString('en-IN') : 'All time'} - {statement.toDate ? new Date(statement.toDate).toLocaleDateString('en-IN') : 'Today'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-custom bg-warm-cream/25 text-text-muted uppercase font-bold tracking-wider">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Reference Slip</th>
                      <th className="px-4 py-3">Details</th>
                      <th className="px-4 py-3 text-right">Added Due (+)</th>
                      <th className="px-4 py-3 text-right">Paid Out (-)</th>
                      <th className="px-4 py-3 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-custom/40 text-text-dark font-medium">
                    {/* Opening Balance Row */}
                    <tr className="bg-warm-cream/15 text-text-muted italic">
                      <td className="px-4 py-3" colSpan={4}>Opening Balance</td>
                      <td className="px-4 py-3 text-right">-</td>
                      <td className="px-4 py-3 text-right">-</td>
                      <td className="px-4 py-3 text-right font-bold text-text-dark font-mono">₹{statement.openingBalance.toFixed(2)}</td>
                    </tr>

                    {/* Transaction rows */}
                    {statement.transactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-warm-cream/10">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-[4px] text-[9px] uppercase font-bold ${
                            tx.type === 'DELIVERY' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono">{tx.reference}</td>
                        <td className="px-4 py-3 truncate max-w-[200px]">{tx.details}</td>
                        <td className="px-4 py-3 text-right text-primary-green font-bold">
                          {tx.increase > 0 ? `₹${tx.increase.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-action-green font-bold">
                          {tx.decrease > 0 ? `₹${tx.decrease.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold font-mono">
                          ₹{tx.balance.toFixed(2)}
                        </td>
                      </tr>
                    ))}

                    {/* Closing Balance Row */}
                    <tr className="bg-primary-green/5 font-extrabold text-primary-green">
                      <td className="px-4 py-3" colSpan={4}>Closing Balance Outstanding</td>
                      <td className="px-4 py-3 text-right">-</td>
                      <td className="px-4 py-3 text-right">-</td>
                      <td className="px-4 py-3 text-right font-mono text-sm">₹{statement.closingBalance.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center space-y-3">
            <span className="text-xl">📭</span>
            <p className="text-xs text-text-muted font-bold">No transactions found for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
}
